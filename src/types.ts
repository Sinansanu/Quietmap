export type Page = 'dashboard' | 'map' | 'timeline' | 'insights' | 'settings';
export type TimelineRange = 'hourly' | 'day' | 'week';

export interface Location {
  id: number;
  name: string;
  createdAt?: number;
}

export interface Settings {
  ambientMonitoring: boolean;
  samplingInterval: number;
  interruptionThreshold: number;
}

export interface LiveLevel {
  timestamp: number;
  noiseLevel: number;
}

export interface FocusSession {
  id: number;
  startedAt: number;
  locationId: number;
  activity?: string;
}

export interface DashboardData {
  lastSample: LiveLevel | null;
  activeSession: FocusSession | null;
  completedToday: number;
  interruptionsToday: number;
  averageScore: number | null;
  locations: Location[];
  settings: Settings;
}

export interface MapLocation {
  id: number;
  name: string;
  sessions: number;
  focusScore: number | null;
  averageNoise: number | null;
  interruptions: number;
  bestTime: string | null;
}

export interface TimelineSample extends LiveLevel {
  locationId: number | null;
  focusSessionId: number | null;
}

export interface TimelineData {
  range: string;
  samples: TimelineSample[];
  locations: Location[];
}

export interface InsightData {
  ready: boolean;
  sampleCount: number;
  sessionCount: number;
  quietest?: { hour: number; label: string; average: number };
  bestLocation?: { name: string; focusScore: number; sessions: number };
  variable?: { hour: number; label: string };
}

export interface WeeklyData {
  days: Array<{ date: string; averageNoise: number | null; focusScore: number | null; interruptions: number | null }>;
  bestDay: { date: string; focusScore: number } | null;
  interruptions: number;
  longestMinutes: number;
}

export interface DatabaseDiagnostics {
  databasePath: string;
  locations: number;
  noiseSamples: number;
  activeSessions: number;
  completedSessions: number;
}

export interface QuitMapBridge {
  monitor: {
    requestPermission(): Promise<boolean>;
    start(context: { locationId: number | null; focusSessionId?: number | null; samplingInterval: number }): Promise<{ monitoring: boolean }>;
    stop(): { monitoring: boolean };
    updateContext(context: Partial<{ locationId: number | null; focusSessionId: number | null; samplingInterval: number }>): void;
    onLevel(callback: (level: LiveLevel) => void): () => void;
  };
  data: {
    dashboard(): Promise<DashboardData>;
    focusMap(): Promise<MapLocation[]>;
    timeline(range: string): Promise<TimelineData>;
    insights(): Promise<InsightData>;
    weekly(): Promise<WeeklyData>;
    diagnostics(): Promise<DatabaseDiagnostics>;
    locations(): Promise<Location[]>;
    createLocation(name: string): Promise<Location>;
    deleteAll(): Promise<{ deleted: boolean }>;
    seedDemo(days: number): Promise<{ seededDays: number }>;
  };
  focus: {
    start(payload: { locationId: number; activity?: string }): Promise<FocusSession>;
    end(id: number): Promise<{ id: number; endedAt: number; focusScore: number; interruptions: number; averageNoise: number }>;
  };
  settings: {
    get(): Promise<Settings>;
    update(patch: Partial<Settings>): Promise<Settings>;
  };
}

declare global {
  interface Window {
    quitmap?: QuitMapBridge;
  }
}
