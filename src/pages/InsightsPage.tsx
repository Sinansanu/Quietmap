import { BarChart3, CalendarClock, Compass, Lightbulb, MapPin, Sparkles } from 'lucide-react';
import { SignalChart } from '../components/SignalChart';
import type { InsightData, TimelineSample, WeeklyData } from '../types';

interface InsightsPageProps {
  insights: InsightData | null;
  weekly: WeeklyData | null;
  onSeedDemo(days: number): void;
}

function minutesLabel(minutes: number) {
  if (!minutes) return '--';
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

function weeklySamples(weekly: WeeklyData | null): TimelineSample[] {
  return (weekly?.days ?? []).map((day, index) => ({ timestamp: Date.now() - (6 - index) * 86400000, noiseLevel: day.averageNoise ?? 0, locationId: null, focusSessionId: null }));
}

export function InsightsPage({ insights, weekly, onSeedDemo }: InsightsPageProps) {
  const ready = Boolean(insights?.ready);
  return (
    <div className="page insights-page">
      <header className="page-header"><div><p className="eyebrow">PATTERNS, NOT PRESCRIPTIONS</p><h1>Insights</h1><p className="subtle">Observations only appear after there is enough local data to support them.</p></div><div className="data-caption"><Sparkles size={16} />{insights?.sampleCount ?? 0} local measurements</div></header>
      {!ready ? (
        <section className="empty-state insights-empty"><div className="empty-orbit"><Compass size={28} /></div><h2>Still learning your environment.</h2><p>{insights?.sessionCount ?? 0} completed sessions and {insights?.sampleCount ?? 0} measurements so far. A few more sessions will reveal meaningful patterns.</p><div className="demo-actions"><span>Development demo data</span><button type="button" className="button light" onClick={() => onSeedDemo(7)}>Load 7 days</button><button type="button" className="button light" onClick={() => onSeedDemo(14)}>Load 14 days</button><button type="button" className="button light" onClick={() => onSeedDemo(30)}>Load 30 days</button></div></section>
      ) : <>
        <section className="insights-grid">
          <article className="insight-card highlight"><div className="insight-card__icon"><CalendarClock size={19} /></div><span className="eyebrow">YOUR QUIETEST HOURS</span><h2>{insights?.quietest?.label}</h2><p>Average environment: <strong>quiet</strong>. This appears to be your most consistently calm period.</p><div className="mini-contours"><i /><i /><i /></div></article>
          <article className="insight-card"><div className="insight-card__icon coral"><MapPin size={19} /></div><span className="eyebrow">BEST FOCUS LOCATION</span><h2>{insights?.bestLocation?.name}</h2><p><strong>{insights?.bestLocation?.focusScore} Focus Score</strong> across {insights?.bestLocation?.sessions} completed sessions.</p><div className="score-line"><span style={{ width: `${insights?.bestLocation?.focusScore ?? 0}%` }} /></div></article>
          <article className="insight-card"><div className="insight-card__icon blue"><Lightbulb size={19} /></div><span className="eyebrow">A PATTERN IS EMERGING</span><h2>{insights?.variable?.label}</h2><p>Your environment becomes noticeably more variable around this period. You may prefer lower-focus tasks then.</p></article>
        </section>
        <section className="weekly-report"><div className="weekly-report__heading"><div><span className="eyebrow">YOUR WEEK IN FOCUS</span><h2>One local view of the past seven days</h2></div><BarChart3 size={22} /></div><div className="weekly-report__body"><div className="weekly-metrics"><div><span>Best day</span><strong>{weekly?.bestDay?.date ?? '--'}</strong></div><div><span>Interruptions</span><strong>{weekly?.interruptions ?? 0}</strong></div><div><span>Longest session</span><strong>{minutesLabel(weekly?.longestMinutes ?? 0)}</strong></div></div><div className="weekly-chart"><SignalChart samples={weeklySamples(weekly)} accent="coral" /><div>{(weekly?.days ?? []).map((day) => <span key={day.date}>{day.date.slice(0, 3)}</span>)}</div></div></div></section>
      </>}
    </div>
  );
}
