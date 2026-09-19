import React, { useMemo, useState } from 'react';
import type { TimelineBucket } from '../../types';
import { relativeNoiseLabel } from '../dashboard/NoiseGauge';

interface TimelineChartProps {
  samples: TimelineBucket[];
  range: string;
  onHoverSample?: (sample: TimelineBucket | null) => void;
}

export const TimelineChart: React.FC<TimelineChartProps> = ({
  samples,
  range,
  onHoverSample,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { points, areaPoints, minTime, maxTime } = useMemo(() => {
    if (!samples.length) {
      return { points: '', areaPoints: '', minTime: 0, maxTime: 0 };
    }

    const times = samples.map((s) => new Date(s.timestamp).getTime());
    const minT = Math.min(...times);
    const maxT = Math.max(...times);
    const timeSpan = maxT - minT || 1;

    const coords = samples.map((sample) => {
      const t = new Date(sample.timestamp).getTime();
      // True temporal positioning along X axis:
      const x = samples.length === 1 ? 50 : ((t - minT) / timeSpan) * 100;
      // Invert Y so 0 is bottom (88%) and 100 is top (12%):
      const y = 88 - (sample.noise_level / 100) * 76;
      return { x: Math.max(0, Math.min(100, x)), y: Math.max(8, Math.min(92, y)) };
    });

    const pts = coords.map((c) => `${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(' ');
    const firstX = coords[0]?.x.toFixed(2) || '0';
    const lastX = coords[coords.length - 1]?.x.toFixed(2) || '100';
    const area = `${firstX},100 ${pts} ${lastX},100`;

    return { points: pts, areaPoints: area, minTime: minT, maxTime: maxT };
  }, [samples]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!samples.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

    // Find sample closest in time or position
    const targetTime = minTime + ratio * (maxTime - minTime);
    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < samples.length; i++) {
      const diff = Math.abs(new Date(samples[i].timestamp).getTime() - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    setHoveredIndex(closestIdx);
    onHoverSample?.(samples[closestIdx]);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    onHoverSample?.(null);
  };

  if (!samples.length) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-sage-50/50 rounded-xl border border-dashed border-sage-200 text-sm text-sage-500">
        <p className="font-medium">No noise telemetry recorded in this period.</p>
        <p className="text-xs text-sage-400 mt-1">Measurements will automatically chart as you focus.</p>
      </div>
    );
  }

  const activeSample = hoveredIndex !== null ? samples[hoveredIndex] : null;

  return (
    <div className="relative flex flex-col gap-2">
      {/* SVG Canvas */}
      <div className="relative h-64 w-full bg-white rounded-xl border border-sage-200/80 p-4 shadow-xs overflow-hidden">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full cursor-crosshair overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          role="img"
          aria-label={`Acoustic telemetry timeline over ${range}`}
        >
          <defs>
            <linearGradient id="timelineAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#36a57b" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#36a57b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1="25" x2="100" y2="25" stroke="#e9f0ec" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#e9f0ec" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="#e9f0ec" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />

          {/* Filled Area */}
          <polygon points={areaPoints} fill="url(#timelineAreaGradient)" />

          {/* Polyline Signal */}
          <polyline
            points={points}
            fill="none"
            stroke="#1e5e51"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Hover tracker cursor */}
          {activeSample && (
            <>
              {(() => {
                const t = new Date(activeSample.timestamp).getTime();
                const x = samples.length === 1 ? 50 : ((t - minTime) / (maxTime - minTime || 1)) * 100;
                const y = 88 - (activeSample.noise_level / 100) * 76;
                return (
                  <g>
                    <line x1={x} y1="0" x2={x} y2="100" stroke="#1e5e51" strokeWidth="1" strokeDasharray="2,2" vectorEffect="non-scaling-stroke" />
                    <circle cx={x} cy={y} r="3.5" fill="#1e5e51" stroke="#ffffff" strokeWidth="2" />
                  </g>
                );
              })()}
            </>
          )}
        </svg>

        {/* Hover inspection pill */}
        {activeSample && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-xs border border-sage-200 rounded-lg px-3 py-2 shadow-md text-xs pointer-events-none">
            <div className="font-bold text-forest-900">
              {new Date(activeSample.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </div>
            <div className="text-sage-600 mt-0.5">
              Level: <strong className="text-forest-800">{activeSample.noise_level}</strong> ({relativeNoiseLabel(activeSample.noise_level)})
            </div>
          </div>
        )}
      </div>

      {/* Axis labels */}
      <div className="flex items-center justify-between text-[11px] font-medium text-sage-400 px-1">
        <span>{range === 'week' ? '7 Days Ago' : range === '12h' ? '12 Hours Ago' : 'Earlier Today'}</span>
        <span>Now</span>
      </div>
    </div>
  );
};
