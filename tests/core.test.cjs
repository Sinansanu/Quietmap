const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { QuitMapDatabase } = require('../electron/database.cjs');
const {
  calculateFocusScore,
  calculateStability,
  findQuietestHour,
  normalizeRelativeNoise,
  shouldStartInterruption,
} = require('../electron/core.cjs');

test('normalizes instantaneous RMS to a bounded relative level', () => {
  assert.equal(normalizeRelativeNoise(0), 0);
  assert.equal(normalizeRelativeNoise(1), 100);
  assert.ok(normalizeRelativeNoise(0.01) > 0 && normalizeRelativeNoise(0.01) < 100);
});

test('interruption model ignores small changes and flags significant rises', () => {
  assert.equal(shouldStartInterruption({ level: 35, baseline: 28, threshold: 18 }), false);
  assert.equal(shouldStartInterruption({ level: 46, baseline: 28, threshold: 18 }), true);
});

test('stable, quiet environment scores above unstable noisy environment', () => {
  const calm = calculateFocusScore({ averageNoise: 20, stability: calculateStability([20, 21, 20, 22]), interruptions: 1, durationMinutes: 60 });
  const variable = calculateFocusScore({ averageNoise: 65, stability: calculateStability([20, 80, 35, 90]), interruptions: 5, durationMinutes: 15 });
  assert.ok(calm > variable);
  assert.ok(calm <= 100 && variable >= 0);
});

test('finds the quietest populated hour without inventing data', () => {
  assert.equal(findQuietestHour([]), null);
  const result = findQuietestHour([
    { timestamp: new Date('2026-01-01T09:00:00').getTime(), noiseLevel: 22 },
    { timestamp: new Date('2026-01-01T09:30:00').getTime(), noiseLevel: 24 },
    { timestamp: new Date('2026-01-01T14:00:00').getTime(), noiseLevel: 62 },
  ]);
  assert.equal(result.hour, 9);
  assert.equal(Math.round(result.average), 23);
});

test('SQLite stores only derived environment records and supports deletion', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quitmap-test-'));
  const database = new QuitMapDatabase(path.join(directory, 'quitmap.sqlite'));
  try {
    await database.initialize();
    assert.equal(database.getInsights().ready, false);
    const desk = database.createLocation('Desk');
    const session = database.startFocusSession({ locationId: desk.id, activity: 'Coding' });
    const started = Date.now();
    database.recordNoise({ timestamp: started, noiseLevel: 22, locationId: desk.id, focusSessionId: session.id });
    database.recordNoise({ timestamp: started + 5000, noiseLevel: 23, locationId: desk.id, focusSessionId: session.id });
    database.recordNoise({ timestamp: started + 15000, noiseLevel: 47, locationId: desk.id, focusSessionId: session.id });
    const completed = database.endFocusSession(session.id);
    assert.ok(completed.focusScore >= 0 && completed.focusScore <= 100);
    assert.equal(database.getDashboard().completedToday, 1);
    assert.ok(fs.statSync(path.join(directory, 'quitmap.sqlite')).size > 0);
    database.seedDemoData(7);
    assert.equal(database.getInsights().ready, true);
    database.clearData();
    assert.equal(database.getLocations().length, 0);
    assert.equal(database.getInsights().ready, false);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('SQLite reload preserves locations, sessions, samples, and settings', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quitmap-reload-test-'));
  const databasePath = path.join(directory, 'quitmap.sqlite');
  try {
    const firstRun = new QuitMapDatabase(databasePath);
    await firstRun.initialize();
    const testRoom = firstRun.createLocation('Test Room');
    const activeSession = firstRun.startFocusSession({ locationId: testRoom.id, activity: 'Writing' });
    const timestamp = Date.now();
    firstRun.recordNoise({ timestamp, noiseLevel: 18, locationId: testRoom.id, focusSessionId: activeSession.id });
    firstRun.recordNoise({ timestamp: timestamp + 5000, noiseLevel: 20, locationId: testRoom.id, focusSessionId: activeSession.id });
    firstRun.recordNoise({ timestamp: timestamp + 15000, noiseLevel: 45, locationId: testRoom.id, focusSessionId: activeSession.id });
    firstRun.updateSettings({ samplingInterval: 30 });
    assert.equal(firstRun.getDashboard().activeSession.id, activeSession.id);
    firstRun.endFocusSession(activeSession.id);

    const afterRestart = new QuitMapDatabase(databasePath);
    await afterRestart.initialize();
    assert.deepEqual(afterRestart.getLocations().map((location) => location.name), ['Test Room']);
    assert.equal(afterRestart.getDashboard().activeSession, null);
    assert.equal(afterRestart.getDashboard().completedToday, 1);
    assert.equal(afterRestart.getFocusMap()[0].sessions, 1);
    assert.equal(afterRestart.getTimeline('day').samples.length, 3);
    assert.equal(afterRestart.getSettings().samplingInterval, 30);
    assert.deepEqual(afterRestart.getDiagnostics(), {
      databasePath,
      locations: 1,
      noiseSamples: 3,
      activeSessions: 0,
      completedSessions: 1,
    });

    afterRestart.clearData();
    const afterDeletionRestart = new QuitMapDatabase(databasePath);
    await afterDeletionRestart.initialize();
    assert.deepEqual(afterDeletionRestart.getDiagnostics(), {
      databasePath,
      locations: 0,
      noiseSamples: 0,
      activeSessions: 0,
      completedSessions: 0,
    });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
