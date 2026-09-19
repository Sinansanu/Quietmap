import { useCallback, useEffect, useMemo, useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { FocusMapPage } from './pages/FocusMapPage';
import { TimelinePage } from './pages/TimelinePage';
import { InsightsPage } from './pages/InsightsPage';
import { SettingsPage } from './pages/SettingsPage';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { ToastContainer, type ToastMessage } from './components/ui/Toast';
import { useAudioMonitor } from './hooks/useAudioMonitor';
import { api } from './api/client';
import type {
  DashboardData,
  FocusSession,
  InsightsData,
  Location,
  LocationMapMetrics,
  Page,
  Settings,
  SettingsUpdate,
  TimelineRange,
  TimelineResponse,
  WeeklyData,
} from './types';

export default function App() {
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('quietmap.onboarded') === 'true');
  const [activePage, setActivePage] = useState<Page>('dashboard');

  // Domain Data States
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [focusMap, setFocusMap] = useState<LocationMapMetrics[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineResponse | null>(null);
  const [timelineRange, setTimelineRange] = useState<TimelineRange>('day');
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [weekly, setWeekly] = useState<WeeklyData | null>(null);
  const [settings, setSettings] = useState<Settings>({
    ambient_monitoring: true,
    sampling_interval: 10,
    interruption_threshold: 18,
    default_activity: 'Work',
  });

  // Session & Monitoring State
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [now, setNow] = useState(Date.now());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const { monitoring, liveLevel, start: startAudio, stop: stopAudio, updateContext } = useAudioMonitor();

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Compute active session elapsed time
  const activeSeconds = useMemo(() => {
    if (!activeSession) return 0;
    const startMs = new Date(activeSession.started_at).getTime();
    return Math.max(0, Math.floor((now - startMs) / 1000));
  }, [activeSession, now]);

  // 1-second ticker for active timer
  useEffect(() => {
    if (!activeSession) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [activeSession]);

  // Selective Data Fetching based on Active Tab
  const loadDashboard = useCallback(async () => {
    try {
      const data = await api.dashboard.get();
      setDashboard(data);
      setLocations(data.locations);
      setActiveSession(data.active_session);
      setSettings(data.settings);
      setSelectedLocationId((prev) => prev || (data.locations[0]?.id ?? null));
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Could not load dashboard.', 'error');
    }
  }, [addToast]);

  const loadFocusMap = useCallback(async () => {
    try {
      const data = await api.focusMap.get();
      setFocusMap(data);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Could not load Focus Map.', 'error');
    }
  }, [addToast]);

  const loadTimeline = useCallback(async () => {
    try {
      const data = await api.timeline.get(timelineRange);
      setTimelineData(data);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Could not load timeline.', 'error');
    }
  }, [timelineRange, addToast]);

  const loadInsights = useCallback(async () => {
    try {
      const [ins, wk] = await Promise.all([api.insights.get(), api.weekly.get()]);
      setInsights(ins);
      setWeekly(wk);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Could not load insights.', 'error');
    }
  }, [addToast]);

  const loadSettings = useCallback(async () => {
    try {
      const s = await api.settings.get();
      setSettings(s);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Could not load settings.', 'error');
    }
  }, [addToast]);

  // Fetch initial dashboard and settings
  useEffect(() => {
    if (onboarded) {
      void loadDashboard();
    }
  }, [onboarded, loadDashboard]);

  // Selective page transitions
  useEffect(() => {
    if (!onboarded) return;
    if (activePage === 'dashboard') void loadDashboard();
    else if (activePage === 'map') void loadFocusMap();
    else if (activePage === 'timeline') void loadTimeline();
    else if (activePage === 'insights') void loadInsights();
    else if (activePage === 'settings') void loadSettings();
  }, [activePage, onboarded, loadDashboard, loadFocusMap, loadTimeline, loadInsights, loadSettings]);

  // Sync context with monitoring
  useEffect(() => {
    updateContext({
      locationId: selectedLocationId,
      focusSessionId: activeSession?.id ?? null,
      samplingInterval: settings.sampling_interval,
    });
  }, [selectedLocationId, activeSession, settings.sampling_interval, updateContext]);

  // Actions
  const handleToggleMonitoring = async () => {
    if (monitoring) {
      stopAudio();
      addToast('Ambient monitoring paused.', 'info');
    } else {
      try {
        await startAudio({
          locationId: selectedLocationId,
          focusSessionId: activeSession?.id ?? null,
          samplingInterval: settings.sampling_interval,
        });
        addToast('Ambient monitoring active.', 'success');
      } catch {
        addToast('Microphone access was denied or is unavailable.', 'error');
      }
    }
  };

  const handleStartSession = async (locId: string | null, activity: string) => {
    try {
      const sess = await api.sessions.start({ location_id: locId, activity });
      setActiveSession(sess);
      addToast(`Focus session started: ${sess.activity}`, 'success');
      if (!monitoring) {
        await startAudio({
          locationId: locId,
          focusSessionId: sess.id,
          samplingInterval: settings.sampling_interval,
        });
      }
      void loadDashboard();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to start session.', 'error');
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    try {
      const result = await api.sessions.end(activeSession.id);
      setActiveSession(null);
      addToast(`Session completed. Focus Score: ${result.focus_score}/100`, 'success');
      void loadDashboard();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to end session.', 'error');
    }
  };

  const handleCreateLocation = async (name: string) => {
    try {
      const newLoc = await api.locations.create({ name });
      setSelectedLocationId(newLoc.id);
      addToast(`Workspace "${newLoc.name}" added.`, 'success');
      void loadDashboard();
      if (activePage === 'map') void loadFocusMap();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Could not add workspace.', 'error');
      throw err;
    }
  };

  const handleUpdateLocation = async (id: string, name: string) => {
    try {
      const updated = await api.locations.update(id, { name });
      addToast(`Workspace renamed to "${updated.name}".`, 'success');
      void loadDashboard();
      if (activePage === 'map') void loadFocusMap();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Could not rename workspace.', 'error');
      throw err;
    }
  };

  const handleDeleteLocation = async (id: string) => {
    try {
      await api.locations.delete(id);
      if (selectedLocationId === id) setSelectedLocationId(null);
      addToast('Workspace removed.', 'info');
      void loadDashboard();
      if (activePage === 'map') void loadFocusMap();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Could not delete workspace.', 'error');
    }
  };

  const handleUpdateSettings = async (patch: SettingsUpdate) => {
    try {
      const updated = await api.settings.update(patch);
      setSettings(updated);
      addToast('Settings updated.', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Could not update settings.', 'error');
    }
  };

  const handleDeleteAllData = async () => {
    try {
      await api.settings.deleteAll();
      stopAudio();
      setActiveSession(null);
      setSelectedLocationId(null);
      addToast('All historical data purged from database.', 'info');
      void loadDashboard();
      if (activePage === 'map') void loadFocusMap();
      if (activePage === 'timeline') void loadTimeline();
      if (activePage === 'insights') void loadInsights();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to purge data.', 'error');
    }
  };

  const handleSeedDemo = async (days: number) => {
    try {
      await api.seed.generate(days);
      addToast(`Generated ${days} days of realistic demo records.`, 'success');
      void loadDashboard();
      if (activePage === 'insights') void loadInsights();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to seed demo data.', 'error');
    }
  };

  const completeOnboarding = (activity: string) => {
    localStorage.setItem('quietmap.onboarded', 'true');
    localStorage.setItem('quietmap.default_activity', activity);
    setOnboarded(true);
    void loadDashboard();
  };

  if (!onboarded) {
    return (
      <OnboardingFlow
        onComplete={completeOnboarding}
        onRequestMicPermission={async () => {
          try {
            await startAudio();
            return true;
          } catch {
            return false;
          }
        }}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-base font-sans text-sage-800">
      <Sidebar
        activePage={activePage}
        monitoring={monitoring}
        onPageChange={setActivePage}
      />

      <main className="flex-1 p-6 sm:p-10 max-h-screen overflow-y-auto">
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />

        {activePage === 'dashboard' && dashboard && (
          <DashboardPage
            data={dashboard}
            liveLevel={liveLevel}
            monitoring={monitoring}
            activeSession={activeSession}
            locations={locations}
            selectedLocationId={selectedLocationId}
            activeSeconds={activeSeconds}
            onLocationChange={setSelectedLocationId}
            onToggleMonitoring={handleToggleMonitoring}
            onStartSession={handleStartSession}
            onEndSession={handleEndSession}
            onNavigate={setActivePage}
            onRequestCreateLocation={() => setActivePage('map')}
          />
        )}

        {activePage === 'map' && (
          <FocusMapPage
            locations={focusMap}
            onCreateLocation={handleCreateLocation}
            onUpdateLocation={handleUpdateLocation}
            onDeleteLocation={handleDeleteLocation}
            onSelectForSession={(id) => {
              setSelectedLocationId(id);
              setActivePage('dashboard');
            }}
          />
        )}

        {activePage === 'timeline' && (
          <TimelinePage
            timelineData={timelineData}
            range={timelineRange}
            locations={locations}
            onRangeChange={setTimelineRange}
          />
        )}

        {activePage === 'insights' && (
          <InsightsPage
            insights={insights}
            weekly={weekly}
            onSeedDemo={handleSeedDemo}
          />
        )}

        {activePage === 'settings' && (
          <SettingsPage
            settings={settings}
            monitoring={monitoring}
            onUpdateSettings={handleUpdateSettings}
            onToggleMonitoring={handleToggleMonitoring}
            onDeleteAllData={handleDeleteAllData}
          />
        )}
      </main>
    </div>
  );
}
