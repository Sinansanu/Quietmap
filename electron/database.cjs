const fs = require('node:fs');
const path = require('node:path');
const {
  calculateFocusScore,
  calculateStability,
  clamp,
  shouldStartInterruption,
} = require('./core.cjs');

const DEFAULT_SETTINGS = {
  ambientMonitoring: true,
  samplingInterval: 10,
  interruptionThreshold: 18,
};

function isoDay(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function hourLabel(hour) {
  const start = hour % 12 || 12;
  const end = (hour + 2) % 12 || 12;
  return `${start} ${hour < 12 ? 'AM' : 'PM'}-${end} ${hour + 2 < 12 || hour + 2 === 24 ? 'AM' : 'PM'}`;
}

class QuitMapDatabase {
  constructor(filePath, { debug = false } = {}) {
    this.filePath = filePath;
    this.db = null;
    this.SQL = null;
    this.liveSessions = new Map();
    this.debug = debug;
  }

  log(message) {
    if (this.debug) console.log(`[QuitMap] ${message}`);
  }

  async initialize() {
    const initSqlJs = (await import('sql.js')).default;
    this.SQL = await initSqlJs({
      locateFile: (file) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
    });
    this.db = fs.existsSync(this.filePath)
      ? new this.SQL.Database(fs.readFileSync(this.filePath))
      : new this.SQL.Database();
    this.db.run('PRAGMA foreign_keys = ON');
    this.db.run(`
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS noise_samples (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        noise_level REAL NOT NULL,
        location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
        focus_session_id INTEGER REFERENCES focus_sessions(id) ON DELETE SET NULL
      );
      CREATE TABLE IF NOT EXISTS focus_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
        activity TEXT,
        focus_score INTEGER
      );
      CREATE TABLE IF NOT EXISTS interruptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        focus_session_id INTEGER NOT NULL REFERENCES focus_sessions(id) ON DELETE CASCADE,
        timestamp INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        intensity REAL NOT NULL
      );
      CREATE TABLE IF NOT EXISTS daily_statistics (
        date TEXT PRIMARY KEY,
        average_noise REAL,
        quietest_period TEXT,
        interruption_count INTEGER,
        focus_score REAL
      );
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      this.db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
    }
    this.persist();
    this.log(`Database ready: ${this.filePath}`);
  }

  persist() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, Buffer.from(this.db.export()));
  }

  rows(sql, params = []) {
    const statement = this.db.prepare(sql);
    statement.bind(params);
    const rows = [];
    while (statement.step()) rows.push(statement.getAsObject());
    statement.free();
    return rows;
  }

  one(sql, params = []) {
    return this.rows(sql, params)[0] || null;
  }

  scalar(sql, params = [], key = 'value') {
    return this.one(sql, params)?.[key] ?? 0;
  }

  getSettings() {
    const values = Object.fromEntries(this.rows('SELECT key, value FROM settings').map((row) => [row.key, row.value]));
    return {
      ambientMonitoring: values.ambientMonitoring !== 'false',
      samplingInterval: Number(values.samplingInterval || DEFAULT_SETTINGS.samplingInterval),
      interruptionThreshold: Number(values.interruptionThreshold || DEFAULT_SETTINGS.interruptionThreshold),
    };
  }

  updateSettings(patch) {
    const accepted = ['ambientMonitoring', 'samplingInterval', 'interruptionThreshold'];
    for (const key of accepted) {
      if (patch[key] === undefined) continue;
      this.db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, String(patch[key])]);
    }
    this.persist();
    return this.getSettings();
  }

  getLocations() {
    return this.rows('SELECT id, name, created_at AS createdAt FROM locations ORDER BY created_at ASC');
  }

  createLocation(name) {
    const cleanName = String(name || '').trim().slice(0, 36);
    if (!cleanName) throw new Error('A location name is required.');
    this.db.run('INSERT INTO locations (name, created_at) VALUES (?, ?)', [cleanName, Date.now()]);
    const id = this.scalar('SELECT last_insert_rowid() AS value');
    this.persist();
    const location = this.one('SELECT id, name, created_at AS createdAt FROM locations WHERE id = ?', [id]);
    this.log(`Created location: ${location.name} (id=${location.id})`);
    return location;
  }

  startFocusSession({ locationId, activity }) {
    const active = this.one('SELECT id FROM focus_sessions WHERE ended_at IS NULL');
    if (active) throw new Error('A focus session is already active.');
    if (!Number.isInteger(locationId)) throw new Error('Choose a location before starting a focus session.');
    if (!this.one('SELECT id FROM locations WHERE id = ?', [locationId])) throw new Error('Choose a saved location before starting a focus session.');
    const timestamp = Date.now();
    this.db.run('INSERT INTO focus_sessions (started_at, location_id, activity) VALUES (?, ?, ?)', [timestamp, locationId, String(activity || '').slice(0, 48)]);
    const id = this.scalar('SELECT last_insert_rowid() AS value');
    this.liveSessions.set(id, { baseline: null, observed: 0, spikeStartedAt: null, interruptionLogged: false });
    this.persist();
    const session = this.one('SELECT id, started_at AS startedAt, location_id AS locationId, activity FROM focus_sessions WHERE id = ?', [id]);
    this.log(`Started focus session: id=${session.id}`);
    return session;
  }

  recordNoise({ timestamp, noiseLevel, locationId, focusSessionId }) {
    const level = clamp(Number(noiseLevel), 0, 100);
    const at = Number.isFinite(timestamp) ? timestamp : Date.now();
    const safeLocationId = Number.isInteger(locationId) ? locationId : null;
    const safeSessionId = Number.isInteger(focusSessionId) ? focusSessionId : null;
    this.db.run(
      'INSERT INTO noise_samples (timestamp, noise_level, location_id, focus_session_id) VALUES (?, ?, ?, ?)',
      [at, level, safeLocationId, safeSessionId],
    );
    const sampleId = this.scalar('SELECT last_insert_rowid() AS value');

    if (safeSessionId) this.detectInterruption({ sessionId: safeSessionId, timestamp: at, level });
    this.persist();
    this.log(`Noise sample inserted: id=${sampleId}`);
    return { timestamp: at, noiseLevel: level };
  }

  detectInterruption({ sessionId, timestamp, level }) {
    const session = this.liveSessions.get(sessionId) || { baseline: null, observed: 0, spikeStartedAt: null, interruptionLogged: false };
    const threshold = this.getSettings().interruptionThreshold;
    if (session.baseline === null) {
      session.baseline = level;
      this.liveSessions.set(sessionId, session);
      return;
    }
    session.observed += 1;
    const isSpike = shouldStartInterruption({ level, baseline: session.baseline, threshold });
    if (isSpike) {
      if (!session.spikeStartedAt) session.spikeStartedAt = timestamp;
      const duration = timestamp - session.spikeStartedAt;
      if (duration >= 10000 && !session.interruptionLogged) {
        this.db.run(
          'INSERT INTO interruptions (focus_session_id, timestamp, duration, intensity) VALUES (?, ?, ?, ?)',
          [sessionId, session.spikeStartedAt, duration, level - session.baseline],
        );
        session.interruptionLogged = true;
      }
    } else {
      session.baseline = session.baseline * 0.82 + level * 0.18;
      session.spikeStartedAt = null;
      session.interruptionLogged = false;
    }
    this.liveSessions.set(sessionId, session);
  }

  endFocusSession(id) {
    const session = this.one('SELECT * FROM focus_sessions WHERE id = ? AND ended_at IS NULL', [id]);
    if (!session) throw new Error('That focus session is no longer active.');
    const endedAt = Date.now();
    const samples = this.rows('SELECT noise_level AS noiseLevel FROM noise_samples WHERE focus_session_id = ?', [id]);
    const levels = samples.map((sample) => sample.noiseLevel);
    const averageNoise = levels.length ? levels.reduce((sum, value) => sum + value, 0) / levels.length : 50;
    const interruptions = this.scalar('SELECT COUNT(*) AS value FROM interruptions WHERE focus_session_id = ?', [id]);
    const durationMinutes = Math.max(1, (endedAt - session.started_at) / 60000);
    const score = calculateFocusScore({
      averageNoise,
      stability: calculateStability(levels),
      interruptions,
      durationMinutes,
    });
    this.db.run('UPDATE focus_sessions SET ended_at = ?, focus_score = ? WHERE id = ?', [endedAt, score, id]);
    this.liveSessions.delete(id);
    this.refreshDailyStatistics(isoDay(session.started_at));
    this.persist();
    this.log(`Ended focus session: id=${id}`);
    return { id, endedAt, focusScore: score, interruptions, averageNoise: Math.round(averageNoise) };
  }

  getDiagnostics() {
    return {
      databasePath: this.filePath,
      locations: this.scalar('SELECT COUNT(*) AS value FROM locations'),
      noiseSamples: this.scalar('SELECT COUNT(*) AS value FROM noise_samples'),
      activeSessions: this.scalar('SELECT COUNT(*) AS value FROM focus_sessions WHERE ended_at IS NULL'),
      completedSessions: this.scalar('SELECT COUNT(*) AS value FROM focus_sessions WHERE ended_at IS NOT NULL'),
    };
  }

  refreshDailyStatistics(day) {
    const start = new Date(`${day}T00:00:00.000Z`).getTime();
    const end = start + 86400000;
    const average = this.scalar('SELECT AVG(noise_level) AS value FROM noise_samples WHERE timestamp >= ? AND timestamp < ?', [start, end]);
    const focusScore = this.scalar('SELECT AVG(focus_score) AS value FROM focus_sessions WHERE started_at >= ? AND started_at < ? AND focus_score IS NOT NULL', [start, end]);
    const interruptionCount = this.scalar('SELECT COUNT(*) AS value FROM interruptions WHERE timestamp >= ? AND timestamp < ?', [start, end]);
    const quietest = this.one(
      "SELECT CAST(strftime('%H', timestamp / 1000, 'unixepoch', 'localtime') AS INTEGER) AS hour, AVG(noise_level) AS average FROM noise_samples WHERE timestamp >= ? AND timestamp < ? GROUP BY hour ORDER BY average ASC LIMIT 1",
      [start, end],
    );
    this.db.run(
      'INSERT OR REPLACE INTO daily_statistics (date, average_noise, quietest_period, interruption_count, focus_score) VALUES (?, ?, ?, ?, ?)',
      [day, average || null, quietest ? hourLabel(quietest.hour) : null, interruptionCount, focusScore || null],
    );
  }

  getDashboard() {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const today = dayStart.getTime();
    const lastSample = this.one('SELECT noise_level AS noiseLevel, timestamp FROM noise_samples ORDER BY timestamp DESC LIMIT 1');
    const active = this.one('SELECT id, started_at AS startedAt, location_id AS locationId, activity FROM focus_sessions WHERE ended_at IS NULL');
    const completedToday = this.scalar('SELECT COUNT(*) AS value FROM focus_sessions WHERE started_at >= ? AND ended_at IS NOT NULL', [today]);
    const interruptionsToday = this.scalar('SELECT COUNT(*) AS value FROM interruptions WHERE timestamp >= ?', [today]);
    const averageScore = this.scalar('SELECT AVG(focus_score) AS value FROM focus_sessions WHERE started_at >= ? AND focus_score IS NOT NULL', [today]);
    return {
      lastSample,
      activeSession: active,
      completedToday,
      interruptionsToday,
      averageScore: averageScore ? Math.round(averageScore) : null,
      locations: this.getLocations(),
      settings: this.getSettings(),
    };
  }

  getFocusMap() {
    return this.rows(`
      SELECT l.id, l.name,
        COUNT(DISTINCT f.id) AS sessions,
        ROUND(AVG(f.focus_score)) AS focusScore,
        ROUND(AVG(n.noise_level)) AS averageNoise,
        COUNT(DISTINCT i.id) AS interruptions,
        MIN(CAST(strftime('%H', n.timestamp / 1000, 'unixepoch', 'localtime') AS INTEGER)) AS earliestHour
      FROM locations l
      LEFT JOIN focus_sessions f ON f.location_id = l.id AND f.ended_at IS NOT NULL
      LEFT JOIN noise_samples n ON n.location_id = l.id
      LEFT JOIN interruptions i ON i.focus_session_id = f.id
      GROUP BY l.id
      ORDER BY focusScore DESC NULLS LAST, sessions DESC
    `).map((row) => ({
      ...row,
      sessions: Number(row.sessions),
      focusScore: row.focusScore === null ? null : Number(row.focusScore),
      averageNoise: row.averageNoise === null ? null : Number(row.averageNoise),
      interruptions: Number(row.interruptions),
      bestTime: row.earliestHour === null ? null : hourLabel(Number(row.earliestHour)),
    }));
  }

  getTimeline(range) {
    const now = Date.now();
    const duration = range === 'week' ? 7 * 86400000 : range === 'day' ? 86400000 : 12 * 3600000;
    const samples = this.rows(
      'SELECT timestamp, noise_level AS noiseLevel, location_id AS locationId, focus_session_id AS focusSessionId FROM noise_samples WHERE timestamp >= ? ORDER BY timestamp ASC',
      [now - duration],
    );
    return { range, samples, locations: this.getLocations() };
  }

  getInsights() {
    const sampleCount = this.scalar('SELECT COUNT(*) AS value FROM noise_samples');
    const sessionCount = this.scalar('SELECT COUNT(*) AS value FROM focus_sessions WHERE ended_at IS NOT NULL');
    if (sampleCount < 15 || sessionCount < 3) return { ready: false, sampleCount, sessionCount };
    const quietest = this.one(`
      SELECT CAST(strftime('%H', timestamp / 1000, 'unixepoch', 'localtime') AS INTEGER) AS hour, AVG(noise_level) AS average
      FROM noise_samples GROUP BY hour HAVING COUNT(*) >= 3 ORDER BY average ASC LIMIT 1
    `);
    const bestLocation = this.one(`
      SELECT l.name, ROUND(AVG(f.focus_score)) AS focusScore, COUNT(f.id) AS sessions
      FROM locations l JOIN focus_sessions f ON f.location_id = l.id
      WHERE f.focus_score IS NOT NULL GROUP BY l.id ORDER BY focusScore DESC, sessions DESC LIMIT 1
    `);
    const variable = this.one(`
      SELECT CAST(strftime('%H', timestamp / 1000, 'unixepoch', 'localtime') AS INTEGER) AS hour,
        AVG(noise_level * noise_level) - AVG(noise_level) * AVG(noise_level) AS variance
      FROM noise_samples GROUP BY hour HAVING COUNT(*) >= 3 ORDER BY variance DESC LIMIT 1
    `);
    return {
      ready: true,
      sampleCount,
      sessionCount,
      quietest: { hour: quietest.hour, label: hourLabel(Number(quietest.hour)), average: Math.round(quietest.average) },
      bestLocation: { name: bestLocation.name, focusScore: Number(bestLocation.focusScore), sessions: Number(bestLocation.sessions) },
      variable: { hour: variable.hour, label: hourLabel(Number(variable.hour)) },
    };
  }

  getWeekly() {
    const since = Date.now() - 7 * 86400000;
    const days = this.rows('SELECT date, average_noise AS averageNoise, focus_score AS focusScore, interruption_count AS interruptions FROM daily_statistics WHERE date >= ? ORDER BY date ASC', [isoDay(since)]);
    const bestDay = this.one('SELECT date, focus_score AS focusScore FROM daily_statistics WHERE date >= ? AND focus_score IS NOT NULL ORDER BY focus_score DESC LIMIT 1', [isoDay(since)]);
    const interruptions = this.scalar('SELECT COUNT(*) AS value FROM interruptions WHERE timestamp >= ?', [since]);
    const longest = this.scalar('SELECT MAX(ended_at - started_at) AS value FROM focus_sessions WHERE ended_at IS NOT NULL AND ended_at >= ?', [since]);
    return { days, bestDay, interruptions, longestMinutes: Math.round((longest || 0) / 60000) };
  }

  seedDemoData(days) {
    const dayCount = [7, 14, 30].includes(Number(days)) ? Number(days) : 7;
    this.clearData(false);
    const locationNames = ['Desk', 'Library', 'Home'];
    locationNames.forEach((name) => this.db.run('INSERT INTO locations (name, created_at) VALUES (?, ?)', [name, Date.now()]));
    const locations = this.getLocations();
    const now = new Date();
    for (let dayOffset = dayCount - 1; dayOffset >= 0; dayOffset -= 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - dayOffset);
      date.setHours(0, 0, 0, 0);
      const location = locations[dayOffset % locations.length];
      for (let hour = 7; hour <= 21; hour += 1) {
        const minutes = 12 + ((dayOffset * 7 + hour * 3) % 38);
        const at = date.getTime() + hour * 3600000 + minutes * 60000;
        const morning = hour >= 8 && hour <= 11;
        const afternoon = hour >= 14 && hour <= 17;
        const variation = ((dayOffset * 11 + hour * 5) % 13) - 6;
        const base = morning ? 22 : afternoon ? 62 : 38;
        this.db.run('INSERT INTO noise_samples (timestamp, noise_level, location_id, focus_session_id) VALUES (?, ?, ?, NULL)', [at, clamp(base + variation, 8, 92), location.id]);
      }
      const startedAt = date.getTime() + (8 + (dayOffset % 3)) * 3600000 + 12 * 60000;
      const duration = (45 + (dayOffset * 13) % 75) * 60000;
      const focusScore = clamp(Math.round(88 - (dayOffset % 5) * 4 + (location.name === 'Desk' ? 4 : 0)), 55, 96);
      this.db.run('INSERT INTO focus_sessions (started_at, ended_at, location_id, activity, focus_score) VALUES (?, ?, ?, ?, ?)', [startedAt, startedAt + duration, location.id, ['Coding', 'Writing', 'Reading'][dayOffset % 3], focusScore]);
      const sessionId = this.scalar('SELECT last_insert_rowid() AS value');
      const interruptionCount = dayOffset % 4 === 0 ? 3 : dayOffset % 3;
      for (let i = 0; i < interruptionCount; i += 1) {
        this.db.run('INSERT INTO interruptions (focus_session_id, timestamp, duration, intensity) VALUES (?, ?, ?, ?)', [sessionId, startedAt + (18 + i * 14) * 60000, (25 + i * 17) * 1000, 18 + i * 6]);
      }
      this.refreshDailyStatistics(isoDay(date.getTime()));
    }
    this.persist();
    return { seededDays: dayCount };
  }

  clearData(includeSettings = true) {
    this.db.run('DELETE FROM interruptions; DELETE FROM noise_samples; DELETE FROM focus_sessions; DELETE FROM daily_statistics; DELETE FROM locations;');
    if (includeSettings) {
      this.db.run('DELETE FROM settings');
      for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) this.db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
    }
    this.liveSessions.clear();
    this.persist();
    this.log('Cleared local data');
  }
}

module.exports = { QuitMapDatabase, DEFAULT_SETTINGS };
