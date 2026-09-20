import type {
  AuthSuccessResponse,
  DashboardData,
  FocusSession,
  FocusSessionEndResponse,
  FocusSessionStart,
  InsightsData,
  LiveLevel,
  Location,
  LocationCreate,
  LocationMapMetrics,
  LocationUpdate,
  Settings,
  SettingsUpdate,
  TimelineRange,
  TimelineResponse,
  User,
  UserProfileUpdate,
  WeeklyData,
} from '../types';

const rawApiUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
const API_BASE = rawApiUrl
  ? (rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`)
  : '/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: options.credentials || 'same-origin',
    });

    if (res.status === 204) {
      return {} as T;
    }

    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // Fallback to status text
      }
      throw new ApiError(res.status, errorMessage);
    }
    return await res.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new Error('Unable to connect to QuietMap backend server. Please verify the service is running.');
  }
}

export const api = {
  auth: {
    register: (payload: { email: string; password: string; full_name: string }) =>
      request<AuthSuccessResponse>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    login: (payload: { email: string; password: string }) =>
      request<AuthSuccessResponse>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
    me: () =>
      request<User>('/auth/me'),
    logout: () =>
      request<{ status: string; message: string }>('/auth/logout', { method: 'POST' }),
  },
  profile: {
    get: () => request<User>('/profile'),
    update: (payload: UserProfileUpdate) =>
      request<User>('/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  },
  locations: {
    list: () => request<Location[]>('/locations'),
    create: (payload: LocationCreate) => request<Location>('/locations', { method: 'POST', body: JSON.stringify(payload) }),
    get: (id: string) => request<Location>(`/locations/${id}`),
    update: (id: string, payload: LocationUpdate) => request<Location>(`/locations/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    delete: (id: string) => request<void>(`/locations/${id}`, { method: 'DELETE' }),
  },
  sessions: {
    getActive: () => request<FocusSession | null>('/sessions/active'),
    start: (payload: FocusSessionStart) => request<FocusSession>('/sessions/start', { method: 'POST', body: JSON.stringify(payload) }),
    end: (id: string) => request<FocusSessionEndResponse>(`/sessions/${id}/end`, { method: 'POST' }),
    listHistory: (limit = 50) => request<FocusSession[]>(`/sessions/history?limit=${limit}`),
  },
  noise: {
    sample: (payload: { noise_level: number; location_id?: string | null; focus_session_id?: string | null }) =>
      request<LiveLevel>('/noise/sample', { method: 'POST', body: JSON.stringify(payload) }),
    latest: () => request<LiveLevel | null>('/noise/latest'),
  },
  dashboard: {
    get: () => request<DashboardData>('/dashboard'),
  },
  focusMap: {
    get: () => request<LocationMapMetrics[]>('/focus-map'),
  },
  timeline: {
    get: (range: TimelineRange) => request<TimelineResponse>(`/timeline?range=${range}`),
  },
  insights: {
    get: () => request<InsightsData>('/insights'),
  },
  weekly: {
    get: () => request<WeeklyData>('/weekly'),
  },
  settings: {
    get: () => request<Settings>('/settings'),
    update: (patch: SettingsUpdate) => request<Settings>('/settings', { method: 'PUT', body: JSON.stringify(patch) }),
    deleteAll: () => request<{ deleted: boolean }>('/settings/delete-all', { method: 'POST' }),
  },
  seed: {
    generate: (days = 7) => request<{ seeded_days: number; status: string }>(`/seed?days=${days}`, { method: 'POST' }),
  },
  health: {
    check: () => request<{ status: string; database: string }>('/health'),
  },
};
