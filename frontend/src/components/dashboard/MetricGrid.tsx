import React from 'react';
import { Award, BellRing, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';

interface MetricGridProps {
  completedToday: number;
  interruptionsToday: number;
  averageScore: number | null;
}

export const MetricGrid: React.FC<MetricGridProps> = ({
  completedToday,
  interruptionsToday,
  averageScore,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="flex flex-col justify-between">
        <span className="text-xs font-semibold text-sage-500 uppercase tracking-wider">Sessions Today</span>
        <div className="my-2">
          <span className="text-3xl font-extrabold text-forest-950 tabular-nums">{completedToday}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-sage-500">
          <Sparkles size={14} className="text-forest-600 shrink-0" />
          <span>Completed focus blocks</span>
        </div>
      </Card>

      <Card className="flex flex-col justify-between">
        <span className="text-xs font-semibold text-sage-500 uppercase tracking-wider">Acoustic Shifts</span>
        <div className="my-2">
          <span className="text-3xl font-extrabold text-forest-950 tabular-nums">{interruptionsToday}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-sage-500">
          <BellRing size={14} className="text-amber-600 shrink-0" />
          <span>Elevated noise spikes detected</span>
        </div>
      </Card>

      <Card className="flex flex-col justify-between">
        <span className="text-xs font-semibold text-sage-500 uppercase tracking-wider">Average Focus Score</span>
        <div className="my-2">
          <span className="text-3xl font-extrabold text-forest-950 tabular-nums">
            {averageScore !== null ? averageScore : '--'}
          </span>
          {averageScore !== null && <span className="text-sm font-medium text-sage-400 ml-1">/ 100</span>}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-sage-500">
          <Award size={14} className="text-emerald-600 shrink-0" />
          <span>Environmental calm rating</span>
        </div>
      </Card>
    </div>
  );
};
