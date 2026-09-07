import type { DashboardData, FocusSession, InsightData, LiveLevel, Location, MapLocation, QuitMapBridge, Settings, TimelineData, TimelineSample, WeeklyData } from '../types';

const initialLocations: Location[] = [
  { id: 1, name: 'Desk' },
  { id: 2, name: 'Library' },
  { id: 3, name: 'Home' },
];

const initialMap = new Map<number, MapLocation>([
  [1, { id: 1, name: 'Desk', sessions: 24, focusScore: 87, averageNoise: 22, interruptions: 3, bestTime: '9 AM-11 AM' }],
  [2, { id: 2, name: 'Library', sessions: 11, focusScore: 79, averageNoise: 30, interruptions: 5, bestTime: '10 AM-12 PM' }],
  [3, { id: 3, name: 'Home', sessions: 8, focusScore: 70, averageNoise: 41, interruptions: 9, bestTime: '8 AM-10 AM' }],
]);

function makePreviewSamples(): TimelineSample[] {
  const now = Date.now();
  return Array.from({ length: 48 }, (_, index) => {
    const timestamp = now - (47 - index) * 30 * 60000;
    const hour = new Date(timestamp).getHours();
    const morning = hour >= 8 && hour <= 11;
    const afternoon = hour >= 14 && hour <= 17;
    const noiseLevel = morning ? 21 + (index * 7) % 9 : afternoon ? 57 + (index * 11) % 20 : 34 + (index * 5) % 14;
    return { timestamp, noiseLevel, locationId: 1, focusSessionId: null };
  });
}

let previewLocations = initialLocations.map((location) => ({ ...location }));
let previewMap = new Map(initialMap);
let previewSettings: Settings = { ambientMonitoring: true, samplingInterval: 10, interruptionThreshold: 18 };
let previewSession: FocusSession | null = null;
let previewCompletedToday = 2;
let previewNoiseSamples = makePreviewSamples();
let previewListeners: Array<(level: LiveLevel) => void> = [];
let previewTimer: number | null = null;
let previewNextLocationId = 4;
let previewMonitorContext = { locationId: null as number | null, focusSessionId: null as number | null, samplingInterval: 10 };

function resetPreviewStore() {
  previewLocations = initialLocations.map((location) => ({ ...location }));
  previewMap = new Map(initialMap);
  previewSettings = { ambientMonitoring: true, samplingInterval: 10, interruptionThreshold: 18 };
  previewSession = null;
  previewCompletedToday = 2;
  previewNoiseSamples = makePreviewSamples();
  previewNextLocationId = 4;
  previewMonitorContext = { locationId: null, focusSessionId: null, samplingInterval: 10 };
}

function previewFocusMap() {
  return previewLocations.map((location) => previewMap.get(location.id) ?? {
    id: location.id,
    name: location.name,
    sessions: 0,
    focusScore: null,
    averageNoise: null,
    interruptions: 0,
    bestTime: null,
  });
}

function recordPreviewSample(noiseLevel: number) {
  const sample: TimelineSample = {
    timestamp: Date.now(),
    noiseLevel,
    locationId: previewMonitorContext.locationId,
    focusSessionId: previewMonitorContext.focusSessionId,
  };
  previewNoiseSamples = [...previewNoiseSamples.slice(-255), sample];
  previewListeners.forEach((listener) => listener({ timestamp: sample.timestamp, noiseLevel: sample.noiseLevel }));
}

const previewBridge: QuitMapBridge = {
  monitor: {
    async requestPermission() { return true; },
    async start(context) {
      previewMonitorContext = { ...previewMonitorContext, ...context };
      if (previewTimer) window.clearInterval(previewTimer);
      recordPreviewSample(28);
      previewTimer = window.setInterval(() => recordPreviewSample(20 + Math.round(Math.random() * 14)), 2500);
      return { monitoring: true };
    },
    stop() {
      if (previewTimer) window.clearInterval(previewTimer);
      previewTimer = null;
      return { monitoring: false };
    },
    updateContext(context) { previewMonitorContext = { ...previewMonitorContext, ...context }; },
    onLevel(callback) {
      previewListeners = [...previewListeners, callback];
      return () => { previewListeners = previewListeners.filter((listener) => listener !== callback); };
    },
  },
  data: {
    async dashboard(): Promise<DashboardData> {
      const lastSample = previewNoiseSamples.at(-1) ?? null;
      const completedMetrics = [...previewMap.values()].filter((location) => location.focusScore !== null);
      const averageScore = completedMetrics.length
        ? Math.round(completedMetrics.reduce((total, location) => total + (location.focusScore ?? 0), 0) / completedMetrics.length)
        : null;
      return {
        lastSample: lastSample ? { timestamp: lastSample.timestamp, noiseLevel: lastSample.noiseLevel } : null,
        activeSession: previewSession,
        completedToday: previewCompletedToday,
        interruptionsToday: previewFocusMap().reduce((total, location) => total + location.interruptions, 0),
        averageScore,
        locations: previewLocations.map((location) => ({ ...location })),
        settings: { ...previewSettings },
      };
    },
    async focusMap() { return previewFocusMap().map((location) => ({ ...location })); },
    async timeline(range): Promise<TimelineData> {
      const duration = range === 'week' ? 7 * 86400000 : range === 'day' ? 86400000 : 12 * 3600000;
      return { range, samples: previewNoiseSamples.filter((sample) => sample.timestamp >= Date.now() - duration), locations: previewLocations.map((location) => ({ ...location })) };
    },
    async insights(): Promise<InsightData> {
      const sessionCount = previewFocusMap().reduce((total, location) => total + location.sessions, 0);
      if (!previewLocations.length || previewNoiseSamples.length < 15 || !sessionCount) return { ready: false, sampleCount: previewNoiseSamples.length, sessionCount: 0 };
      return { ready: true, sampleCount: previewNoiseSamples.length, sessionCount, quietest: { hour: 9, label: '9 AM-11 AM', average: 21 }, bestLocation: { name: 'Desk', focusScore: 87, sessions: 24 }, variable: { hour: 14, label: '2 PM-4 PM' } };
    },
    async weekly(): Promise<WeeklyData> {
      if (!previewLocations.length) return { days: [], bestDay: null, interruptions: 0, longestMinutes: 0 };
      return { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => ({ date: day, averageNoise: 24 + index * 3, focusScore: 90 - index * 3, interruptions: index + 1 })), bestDay: { date: 'Tuesday', focusScore: 91 }, interruptions: 18, longestMinutes: 107 };
    },
    async diagnostics() { return { databasePath: 'preview-memory-store', locations: previewLocations.length, noiseSamples: previewNoiseSamples.length, activeSessions: previewSession ? 1 : 0, completedSessions: previewFocusMap().reduce((total, location) => total + location.sessions, 0) }; },
    async locations() { return previewLocations.map((location) => ({ ...location })); },
    async createLocation(name) {
      const cleanName = name.trim();
      if (!cleanName) throw new Error('A location name is required.');
      if (previewLocations.some((location) => location.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase())) throw new Error('A location with that name already exists.');
      const location = { id: previewNextLocationId++, name: cleanName };
      previewLocations = [...previewLocations, location];
      return { ...location };
    },
    async deleteAll() {
      previewLocations = [];
      previewMap = new Map();
      previewSession = null;
      previewCompletedToday = 0;
      previewNoiseSamples = [];
      previewMonitorContext = { locationId: null, focusSessionId: null, samplingInterval: previewSettings.samplingInterval };
      return { deleted: true };
    },
    async seedDemo(days) { resetPreviewStore(); return { seededDays: days }; },
  },
  focus: {
    async start({ locationId, activity }) {
      if (!previewLocations.some((location) => location.id === locationId)) throw new Error('Choose a saved location before starting a focus session.');
      if (previewSession) throw new Error('A focus session is already active.');
      previewSession = { id: Date.now(), startedAt: Date.now(), locationId, activity };
      return { ...previewSession };
    },
    async end(id) {
      if (!previewSession || previewSession.id !== id) throw new Error('That focus session is no longer active.');
      const session = previewSession;
      const existing = previewMap.get(session.locationId) ?? { id: session.locationId, name: previewLocations.find((location) => location.id === session.locationId)?.name ?? 'Location', sessions: 0, focusScore: null, averageNoise: null, interruptions: 0, bestTime: null };
      previewMap = new Map(previewMap).set(session.locationId, { ...existing, sessions: existing.sessions + 1, focusScore: 86, averageNoise: 24, interruptions: existing.interruptions + 1, bestTime: existing.bestTime ?? '9 AM-11 AM' });
      previewSession = null;
      previewCompletedToday += 1;
      return { id, endedAt: Date.now(), focusScore: 86, interruptions: 1, averageNoise: 24 };
    },
  },
  settings: {
    async get() { return { ...previewSettings }; },
    async update(patch) { previewSettings = { ...previewSettings, ...patch }; return { ...previewSettings }; },
  },
};

export const api: QuitMapBridge = window.quitmap ?? previewBridge;

export function relativeNoiseLabel(level: number | null | undefined) {
  if (level === null || level === undefined) return 'Waiting';
  if (level <= 15) return 'Very quiet';
  if (level <= 35) return 'Quiet';
  if (level <= 55) return 'Moderate';
  if (level <= 75) return 'Noisy';
  return 'Very noisy';
}

export function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}` : `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}
