import React from 'react';
import { Volume2 } from 'lucide-react';

interface NoiseGaugeProps {
  level: number | null;
  compact?: boolean;
}

export function relativeNoiseLabel(level: number | null | undefined): string {
  if (level === null || level === undefined) return 'Waiting';
  if (level <= 15) return 'Very quiet';
  if (level <= 35) return 'Quiet';
  if (level <= 55) return 'Moderate';
  if (level <= 75) return 'Noisy';
  return 'Very noisy';
}

export const NoiseGauge: React.FC<NoiseGaugeProps> = ({ level, compact = false }) => {
  const safeLevel = level !== null ? Math.max(0, Math.min(100, level)) : 0;
  // Dial needle rotation across a calibrated 240-degree arc (-120deg to +120deg)
  const rotation = -120 + (safeLevel / 100) * 240;

  // Arc path constants
  const size = compact ? 150 : 200;
  const center = size / 2;
  const radius = center - 16;
  const circumference = 2 * Math.PI * radius;
  // 240 degrees represents 240/360 = 0.6667 of full circumference
  const arcLength = circumference * (240 / 360);
  const strokeDashoffset = arcLength - (safeLevel / 100) * arcLength;

  return (
    <div className={`flex flex-col items-center ${compact ? 'gap-2' : 'gap-3'}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* SVG Background Arc and Active Value Arc */}
        <svg
          width={size}
          height={size}
          className="transform rotate-[150deg] overflow-visible"
          aria-hidden="true"
        >
          {/* Track background */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#e2ebe5"
            strokeWidth={12}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Progress stroke with gradient */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={safeLevel <= 35 ? '#36a57b' : safeLevel <= 65 ? '#e9bf8f' : '#cf8066'}
            strokeWidth={12}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-150 ease-out"
          />
        </svg>

        {/* Needle Indicator */}
        <div
          className="absolute inset-0 flex items-center justify-center needle-transition pointer-events-none"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div className="w-1 h-14 bg-forest-700 rounded-full -translate-y-7 shadow-xs relative">
            <div className="w-3 h-3 bg-forest-700 rounded-full absolute -bottom-1 -left-1 ring-2 ring-white" />
          </div>
        </div>

        {/* Center Display Badge */}
        <div className="absolute flex flex-col items-center justify-center text-center p-4 bg-white/90 backdrop-blur-xs rounded-full shadow-inner border border-sage-200/60 w-28 h-28">
          <Volume2 size={compact ? 16 : 20} className="text-forest-600 mb-0.5" strokeWidth={1.8} />
          <span className="text-3xl font-extrabold tracking-tight text-forest-950 tabular-nums leading-none">
            {level === null ? '--' : Math.round(level)}
          </span>
          <span className="text-[10px] font-medium text-sage-400 mt-1 uppercase tracking-wider">0-100 dBFS</span>
        </div>
      </div>

      {!compact && (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-sage-200 shadow-2xs text-xs font-semibold text-forest-800">
          <span
            className={`w-2 h-2 rounded-full ${
              safeLevel <= 35 ? 'bg-emerald-500' : safeLevel <= 65 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
          />
          <span>{relativeNoiseLabel(level)}</span>
        </div>
      )}
    </div>
  );
};
