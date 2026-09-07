import { ArrowUpRight, Clock3, MapPin, Play, Sparkles, VolumeX } from 'lucide-react';
import { NoiseDial } from '../components/NoiseDial';
import { formatDuration, relativeNoiseLabel } from '../services/api';
import type { DashboardData, LiveLevel, Location } from '../types';

interface DashboardPageProps {
  data: DashboardData;
  liveLevel: LiveLevel | null;
  monitoring: boolean;
  selectedLocationId: number | null;
  activeSeconds: number;
  onLocationChange(id: number): void;
  onToggleMonitoring(): void;
  onStartSession(): void;
  onEndSession(): void;
  onNavigateMap(): void;
}

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning.' : hour < 18 ? 'Good afternoon.' : 'Good evening.';
}

function LocationSelect({ locations, value, onChange }: { locations: Location[]; value: number | null; onChange(id: number): void }) {
  return (
    <label className="select-field">
      <MapPin size={16} />
      <select aria-label="Current location" value={value ?? ''} onChange={(event) => onChange(Number(event.target.value))}>
        <option value="">Choose a location</option>
        {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
      </select>
    </label>
  );
}

export function DashboardPage({ data, liveLevel, monitoring, selectedLocationId, activeSeconds, onLocationChange, onToggleMonitoring, onStartSession, onEndSession, onNavigateMap }: DashboardPageProps) {
  const level = liveLevel?.noiseLevel ?? data.lastSample?.noiseLevel ?? null;
  const active = data.activeSession;
  const locationName = data.locations.find((location) => location.id === selectedLocationId)?.name;
  return (
    <div className="page dashboard-page">
      <header className="page-header dashboard-header">
        <div><p className="eyebrow">YOUR ENVIRONMENT TODAY</p><h1>{greeting()}</h1><p className="subtle">A quiet reading of the space around you.</p></div>
        <button type="button" className={monitoring ? 'monitor-toggle on' : 'monitor-toggle'} onClick={onToggleMonitoring}><span /><span>{monitoring ? 'Monitoring' : 'Monitoring paused'}</span></button>
      </header>

      <section className="dashboard-hero">
        <div className="environment-card">
          <div className="card-heading"><div><span className="eyebrow">CURRENT ENVIRONMENT</span><h2>{relativeNoiseLabel(level)}</h2></div><button type="button" className="icon-button" aria-label="Toggle ambient monitoring" onClick={onToggleMonitoring}>{monitoring ? <VolumeX size={18} /> : <Play size={18} />}</button></div>
          <div className="environment-card__body"><NoiseDial level={level} /><div className="environment-copy"><p>Relative noise level</p><strong>{level === null ? 'Waiting for a measurement' : `${level} / 100`}</strong><span>{monitoring ? 'Measured locally. No audio is saved.' : 'Turn monitoring on when you are ready.'}</span></div></div>
          <div className="contour-lines" aria-hidden="true"><i /><i /><i /></div>
        </div>
        <div className="session-card">
          <div className="card-heading"><div><span className="eyebrow">FOCUS SESSION</span><h2>{active ? 'In progress' : 'Make space to begin'}</h2></div><Clock3 size={20} strokeWidth={1.5} /></div>
          {active ? (
            <>
              <div className="session-time">{formatDuration(activeSeconds)}</div>
              <p className="session-environment"><i />Environment: {relativeNoiseLabel(level)}</p>
              <LocationSelect locations={data.locations} value={selectedLocationId} onChange={onLocationChange} />
              <button type="button" className="button dark full" onClick={onEndSession}>End session</button>
            </>
          ) : (
            <>
              <p className="session-copy">Track the atmosphere around a block of work, without making any claim about the work itself.</p>
              <LocationSelect locations={data.locations} value={selectedLocationId} onChange={onLocationChange} />
              <button type="button" className="button dark full" disabled={!selectedLocationId} onClick={onStartSession}><Play size={16} fill="currentColor" />Start focus session</button>
              {!data.locations.length && <p className="inline-notice">Choose a location in Focus Map to begin.</p>}
            </>
          )}
        </div>
      </section>

      <section className="metric-grid">
        <article className="metric-card"><span>Sessions today</span><strong>{data.completedToday}</strong><p><Sparkles size={14} />Recorded on this device</p></article>
        <article className="metric-card"><span>Interruptions</span><strong>{data.interruptionsToday}</strong><p>Significant environment shifts</p></article>
        <article className="metric-card"><span>Average map score</span><strong>{data.averageScore ?? '--'}</strong><p>From completed sessions</p></article>
      </section>

      <section className="insight-strip">
        <div className="insight-strip__signal"><span /><span /><span /><span /><span /><span /><span /><span /></div>
        <div><span className="eyebrow">A NOTE FROM YOUR MAP</span><h3>{data.completedToday ? `Your ${locationName ?? 'current'} environment has stayed ${relativeNoiseLabel(level).toLowerCase()}.` : 'Your map is ready to learn your routine.'}</h3></div>
        <button type="button" className="link-button" onClick={onNavigateMap}>View Focus Map <ArrowUpRight size={16} /></button>
      </section>
    </div>
  );
}
