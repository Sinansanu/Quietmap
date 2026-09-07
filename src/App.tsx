import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { FocusMapPage } from './pages/FocusMapPage';
import { InsightsPage } from './pages/InsightsPage';
import { Onboarding } from './pages/Onboarding';
import { SettingsPage } from './pages/SettingsPage';
import { TimelinePage } from './pages/TimelinePage';
import { api } from './services/api';
import type { DashboardData, InsightData, LiveLevel, MapLocation, Page, Settings, TimelineData, TimelineRange, WeeklyData } from './types';

const previewMode = new URLSearchParams(window.location.search).has('preview');

export default function App() {
  const [onboarded, setOnboarded] = useState(() => previewMode || localStorage.getItem('quitmap.onboarded') === 'true');
  const [activity, setActivity] = useState(() => localStorage.getItem('quitmap.activity') || '');
  const [page, setPage] = useState<Page>('dashboard');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [map, setMap] = useState<MapLocation[]>([]);
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [weekly, setWeekly] = useState<WeeklyData | null>(null);
  const [settings, setSettings] = useState<Settings>({ ambientMonitoring: true, samplingInterval: 10, interruptionThreshold: 18 });
  const [monitoring, setMonitoring] = useState(false);
  const [liveLevel, setLiveLevel] = useState<LiveLevel | null>(null);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [range, setRange] = useState<TimelineRange>('day');
  const [now, setNow] = useState(Date.now());
  const [notice, setNotice] = useState<string | null>(null);
  const refreshVersion = useRef(0);

  const activeSeconds = useMemo(() => dashboard?.activeSession ? Math.max(0, (now - dashboard.activeSession.startedAt) / 1000) : 0, [dashboard?.activeSession, now]);

  const refresh = useCallback(async ({ preferredLocationId }: { preferredLocationId?: number | null } = {}) => {
    const requestVersion = ++refreshVersion.current;
    try {
      const [nextDashboard, nextMap, nextTimeline, nextInsights, nextWeekly, nextSettings] = await Promise.all([api.data.dashboard(), api.data.focusMap(), api.data.timeline(range), api.data.insights(), api.data.weekly(), api.settings.get()]);
      if (requestVersion !== refreshVersion.current) return;
      setDashboard(nextDashboard);
      setMap(nextMap);
      setTimeline(nextTimeline);
      setInsights(nextInsights);
      setWeekly(nextWeekly);
      setSettings(nextSettings);
      setLocationId((current) => {
        if (preferredLocationId !== undefined) return preferredLocationId;
        return current && nextDashboard.locations.some((location) => location.id === current)
          ? current
          : nextDashboard.locations[0]?.id ?? null;
      });
    } catch (error) {
      if (requestVersion === refreshVersion.current) setNotice(error instanceof Error ? error.message : 'QuitMap could not load your local data.');
    }
  }, [range]);

  useEffect(() => { if (onboarded) void refresh(); }, [onboarded, refresh]);
  useEffect(() => api.monitor.onLevel((level) => { setLiveLevel(level); void refresh(); }), [refresh]);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { if (notice) { const timer = window.setTimeout(() => setNotice(null), 4500); return () => window.clearTimeout(timer); } }, [notice]);

  const startMonitoring = async (focusSessionId?: number | null) => {
    if (!locationId) { setNotice('Choose a location in Focus Map before monitoring.'); return; }
    try {
      await api.monitor.start({ locationId, focusSessionId: focusSessionId ?? dashboard?.activeSession?.id ?? null, samplingInterval: settings.samplingInterval });
      setMonitoring(true);
      await api.settings.update({ ambientMonitoring: true });
      await refresh();
    } catch {
      setNotice('Microphone access was not available. You can allow it in your system privacy settings.');
    }
  };

  const toggleMonitoring = async () => {
    if (!monitoring) return startMonitoring();
    try {
      api.monitor.stop();
      setMonitoring(false);
      await api.settings.update({ ambientMonitoring: false });
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not pause ambient monitoring.');
    }
  };
  const updateLocation = (id: number) => { setLocationId(id || null); api.monitor.updateContext({ locationId: id || null }); };
  const startSession = async () => {
    if (!locationId) return;
    try {
      const session = await api.focus.start({ locationId, activity });
      api.monitor.updateContext({ locationId, focusSessionId: session.id });
      await refresh();
      if (!monitoring) await startMonitoring(session.id);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not start this focus session.'); }
  };
  const endSession = async () => {
    const session = dashboard?.activeSession;
    if (!session) return;
    try {
      const result = await api.focus.end(session.id);
      api.monitor.updateContext({ focusSessionId: null });
      setNotice(`Session complete. Your environment score was ${result.focusScore}.`);
      await refresh();
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not end this focus session.'); }
  };
  const updateSettings = async (patch: Partial<Settings>) => {
    try {
      await api.settings.update(patch);
      if (patch.samplingInterval) api.monitor.updateContext({ samplingInterval: patch.samplingInterval });
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not update settings.');
    }
  };
  const createLocation = async (name: string) => {
    try {
      const location = await api.data.createLocation(name);
      setLocationId(location.id);
      api.monitor.updateContext({ locationId: location.id });
      await refresh({ preferredLocationId: location.id });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not add this location.');
    }
  };
  const seedDemo = async (days: number) => { try { await api.data.seedDemo(days); setNotice(`${days} days of clearly labeled demo data are ready.`); await refresh(); } catch (error) { setNotice(error instanceof Error ? error.message : 'Demo data is only available in development builds.'); } };
  const deleteAll = async () => {
    try {
      const result = await api.data.deleteAll();
      if (!result.deleted) return;
      api.monitor.stop();
      api.monitor.updateContext({ locationId: null, focusSessionId: null });
      setMonitoring(false);
      setLocationId(null);
      setNotice('All local QuitMap data was deleted.');
      await refresh({ preferredLocationId: null });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not delete local data.');
    }
  };
  const completeOnboarding = (selectedActivity: string) => { localStorage.setItem('quitmap.onboarded', 'true'); localStorage.setItem('quitmap.activity', selectedActivity); setActivity(selectedActivity); setOnboarded(true); };

  if (!onboarded) return <Onboarding onRequestPermission={() => api.monitor.requestPermission().then(() => undefined)} onComplete={completeOnboarding} />;
  if (!dashboard) return <main className="app-loading"><div className="brand"><span className="brand__mark">Q</span>QuitMap</div><p>Opening your local map...</p></main>;

  return <main className="app-shell"><Sidebar page={page} monitoring={monitoring} onChange={setPage} /><div className="main-stage">{notice && <div className="toast" role="status">{notice}</div>}{page === 'dashboard' && <DashboardPage data={dashboard} liveLevel={liveLevel} monitoring={monitoring} selectedLocationId={locationId} activeSeconds={activeSeconds} onLocationChange={updateLocation} onToggleMonitoring={() => void toggleMonitoring()} onStartSession={startSession} onEndSession={endSession} onNavigateMap={() => setPage('map')} />}{page === 'map' && <FocusMapPage locations={map} onCreateLocation={(name) => void createLocation(name)} />}{page === 'timeline' && <TimelinePage data={timeline} range={range} onRangeChange={setRange} />}{page === 'insights' && <InsightsPage insights={insights} weekly={weekly} onSeedDemo={(days) => void seedDemo(days)} />}{page === 'settings' && <SettingsPage settings={settings} monitoring={monitoring} onUpdate={(patch) => void updateSettings(patch)} onToggleMonitoring={() => void toggleMonitoring()} onDelete={() => void deleteAll()} />}</div></main>;
}
