import type { TimelineSample } from '../types';
import type { CSSProperties } from 'react';

interface SignalChartProps {
  samples: TimelineSample[];
  accent?: 'mint' | 'coral';
  onHover?(sample: TimelineSample | null): void;
}

export function SignalChart({ samples, accent = 'mint', onHover }: SignalChartProps) {
  if (!samples.length) return <div className="signal-empty">No measurements in this view yet.</div>;
  const points = samples.map((sample, index) => {
    const x = samples.length === 1 ? 50 : (index / (samples.length - 1)) * 100;
    const y = 88 - sample.noiseLevel * 0.72;
    return `${x},${y}`;
  }).join(' ');
  const area = `0,100 ${points} 100,100`;
  return (
    <div className={`signal-chart ${accent}`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Relative ambient noise over time">
        <defs>
          <linearGradient id={`area-${accent}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="signal-chart__grid" d="M0 25 H100 M0 50 H100 M0 75 H100" />
        <polygon points={area} fill={`url(#area-${accent})`} />
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="signal-chart__touchpoints" style={{ '--point-count': samples.length } as CSSProperties}>
        {samples.map((sample, index) => <button key={`${sample.timestamp}-${index}`} type="button" aria-label={`View measurement at ${new Date(sample.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`} onMouseEnter={() => onHover?.(sample)} onFocus={() => onHover?.(sample)} onMouseLeave={() => onHover?.(null)} />)}
      </div>
    </div>
  );
}
