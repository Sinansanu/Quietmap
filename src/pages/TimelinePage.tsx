import { CalendarDays, Clock3, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SignalChart } from '../components/SignalChart';
import { relativeNoiseLabel } from '../services/api';
import type { TimelineData, TimelineRange, TimelineSample } from '../types';

interface TimelinePageProps {
  data: TimelineData | null;
  range: TimelineRange;
  onRangeChange(range: TimelineRange): void;
}

const labels: Record<TimelineRange, string> = { hourly: '12 hours', day: 'Today', week: 'This week' };

export function TimelinePage({ data, range, onRangeChange }: TimelinePageProps) {
  const [hovered, setHovered] = useState<TimelineSample | null>(null);
  const location = useMemo(() => data?.locations.find((item) => item.id === hovered?.locationId), [data, hovered]);
  return (
    <div className="page timeline-page">
      <header className="page-header"><div><p className="eyebrow">SIGNAL OVER TIME</p><h1>Timeline</h1><p className="subtle">A changing sketch of the ambient level around you.</p></div><div className="segmented-control" aria-label="Timeline range">{(['hourly', 'day', 'week'] as TimelineRange[]).map((item) => <button type="button" key={item} className={range === item ? 'selected' : ''} onClick={() => onRangeChange(item)}>{labels[item]}</button>)}</div></header>
      <section className="timeline-chart-card">
        <div className="timeline-chart-card__top"><div><span className="eyebrow">RELATIVE NOISE LEVEL</span><h2>{hovered ? relativeNoiseLabel(hovered.noiseLevel) : 'A changing environment'}</h2></div><span className="chart-range"><CalendarDays size={16} />{labels[range]}</span></div>
        <SignalChart samples={data?.samples ?? []} onHover={setHovered} />
        <div className="timeline-axis"><span>{range === 'week' ? '7 days ago' : 'Earlier'}</span><span>Now</span></div>
      </section>
      <section className="timeline-detail-grid">
        <article className="detail-card current"><span className="eyebrow">MEASUREMENT</span>{hovered ? <><strong>{new Date(hovered.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</strong><p><i />Relative noise: {relativeNoiseLabel(hovered.noiseLevel)}</p></> : <><strong>Hover the signal</strong><p>Inspect a point on your local timeline.</p></>}</article>
        <article className="detail-card"><span className="eyebrow">LOCATION</span><strong><MapPin size={18} />{location?.name ?? 'Not specified'}</strong><p>Manual location labels protect your privacy.</p></article>
        <article className="detail-card"><span className="eyebrow">FOCUS SESSION</span><strong><Clock3 size={18} />{hovered?.focusSessionId ? 'Active' : 'Not active'}</strong><p>Session context is only stored as an ID.</p></article>
      </section>
    </div>
  );
}
