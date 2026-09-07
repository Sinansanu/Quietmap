import { ArrowUpRight, MapPin, Plus, Signal, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { relativeNoiseLabel } from '../services/api';
import type { MapLocation } from '../types';

interface FocusMapPageProps {
  locations: MapLocation[];
  onCreateLocation(name: string): void;
}

export function FocusMapPage({ locations, onCreateLocation }: FocusMapPageProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const addLocation = () => {
    if (!name.trim()) return;
    onCreateLocation(name.trim());
    setName('');
    setAdding(false);
  };
  return (
    <div className="page map-page">
      <header className="page-header"><div><p className="eyebrow">PLACES YOU RETURN TO</p><h1>Focus Map</h1><p className="subtle">A local picture of how each place tends to feel over time.</p></div><button type="button" className="button light" onClick={() => setAdding(true)}><Plus size={17} />Add location</button></header>
      {adding && <div className="add-location"><MapPin size={18} /><input autoFocus value={name} maxLength={36} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addLocation(); }} placeholder="Name this place" /><button type="button" className="button dark" onClick={addLocation}>Add</button><button type="button" className="icon-button" aria-label="Cancel adding location" onClick={() => setAdding(false)}><X size={17} /></button></div>}
      {!locations.length ? (
        <section className="empty-state map-empty"><div className="empty-orbit"><MapPin size={28} /></div><h2>Where are you focusing?</h2><p>Choose a location to start mapping your environment. GPS is never required.</p><button type="button" className="button dark" onClick={() => setAdding(true)}><Plus size={16} />Add your first location</button></section>
      ) : (
        <section className="location-grid">
          {locations.map((location, index) => (
            <article className={`location-card location-card--${index % 3}`} key={location.id}>
              <div className="location-card__top"><div className="location-icon"><MapPin size={18} /></div><button type="button" className="icon-button small" aria-label={`Open ${location.name}`}><ArrowUpRight size={16} /></button></div>
              <h2>{location.name}</h2>
              {location.focusScore === null ? <p className="location-card__empty">Start a few sessions here to reveal a local pattern.</p> : <>
                <div className="location-score"><span>QuitMap Focus Score</span><strong>{location.focusScore}</strong></div>
                <div className="location-wave"><i /><i /><i /><i /><i /><i /><i /><i /></div>
                <dl className="location-stats"><div><dt>Avg noise</dt><dd>{relativeNoiseLabel(location.averageNoise)}</dd></div><div><dt>Interruptions</dt><dd>{location.interruptions}/map</dd></div><div><dt>Best time</dt><dd>{location.bestTime}</dd></div></dl>
                <p className="location-sessions"><Sparkles size={14} />{location.sessions} focus sessions</p>
              </>}
            </article>
          ))}
        </section>
      )}
      <aside className="map-note"><Signal size={18} /><span>Focus Scores describe environmental conditions from your completed sessions. They are not a measure of you.</span></aside>
    </div>
  );
}
