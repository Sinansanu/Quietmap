import { Volume2 } from 'lucide-react';
import type { CSSProperties } from 'react';
import { relativeNoiseLabel } from '../services/api';

interface NoiseDialProps {
  level: number | null;
  compact?: boolean;
}

export function NoiseDial({ level, compact = false }: NoiseDialProps) {
  const shown = level ?? 0;
  const rotation = -122 + (shown / 100) * 244;
  return (
    <div className={`noise-dial ${compact ? 'compact' : ''}`}>
      <div className="noise-dial__halo" style={{ '--dial-level': `${shown}%` } as CSSProperties}>
        <span className="noise-dial__needle" style={{ transform: `rotate(${rotation}deg)` }} />
        <div className="noise-dial__inner">
          <Volume2 size={compact ? 18 : 22} strokeWidth={1.6} />
          <strong>{level === null ? '--' : level}</strong>
          <span>relative level</span>
        </div>
      </div>
      {!compact && <p className="noise-dial__status"><i />{relativeNoiseLabel(level)}</p>}
    </div>
  );
}
