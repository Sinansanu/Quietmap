export type Page = 'dashboard' | 'map' | 'timeline' | 'insights' | 'settings';
export type TimelineRange = '12h' | 'day' | 'week';

export interface Location {
  id: string;
  name: string;
  created_at: string;
}

export interface LocationCreate {
  name: string;
}

export interface LocationUpdate {
  name: string;
}

export interface LocationMapMetrics {
  id: string;
  name: string;
  sessions: number;
  focus_score: number | null;
  average_noise: number | null;
  interruptions: number;
  best_time: string | null;
  created_at: string;
}

export interface FocusSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  location_id: string | null;
  activity: string | null;
  focus_score: number | null;
  average_noise: number | null;
  stability_score: number | null;
  interruption_count: number;
  created_at: string;
}

export interface FocusSessionStart {
  location_id?: string | null;
  activity?: string;
}

export interface FocusSessionEndResponse {
  id: string;
  started_at: string;
  ended_at: string;
  duration_minutes: number;
  focus_score: number;
  average_noise: number;
  stability_score: number;
  interruptions: number;
}

export interface LiveLevel {
  recorded_at: string;
  noise_level: number;
  label: string;
}

export interface Settings {
  ambient_monitoring: boolean;
  sampling_interval: number;
  interruption_threshold: number;
  default_activity: string;
}

export interface SettingsUpdate {
  ambient_monitoring?: boolean;
  sampling_interval?: number;
  interruption_threshold?: number;
  default_activity?: string;
}

export interface DashboardData {
  last_sample: LiveLevel | null;
  active_session: FocusSession | null;
  completed_today: number;
  interruptions_today: number;
  average_score: number | null;
  locations: Location[];
  settings: Settings;
}

export interface TimelineBucket {
  timestamp: string;
  noise_level: number;
  noise_min: number;
  noise_max: number;
  sample_count: number;
  location_id: string | null;
  focus_session_id: string | null;
}

export interface TimelineResponse {
  range: string;
  samples: TimelineBucket[];
  locations: Location[];
}

export interface QuietestHourInfo {
  hour: number;
  label: string;
  average_noise: number;
}

export interface BestLocationInfo {
  id: string;
  name: string;
  focus_score: number;
  session_count: number;
}

export interface VariablePeriodInfo {
  hour: number;
  label: string;
  variance: number;
}

export interface InsightsData {
  ready: boolean;
  sample_count: number;
  session_count: number;
  reason?: string | null;
  quietest?: QuietestHourInfo | null;
  best_location?: BestLocationInfo | null;
  variable_period?: VariablePeriodInfo | null;
}

export interface WeeklyDay {
  date: string;
  day_name: string;
  average_noise: number | null;
  focus_score: number | null;
  interruptions: number;
  focus_minutes: number;
}

export interface BestDayInfo {
  date: string;
  day_name: string;
  focus_score: number;
}

export interface WeeklyData {
  days: WeeklyDay[];
  best_day: BestDayInfo | null;
  total_interruptions: number;
  longest_session_minutes: number;
  total_focus_minutes: number;
}
