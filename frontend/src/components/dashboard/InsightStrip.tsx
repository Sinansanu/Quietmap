import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { Page } from '../../types';

interface InsightStripProps {
  completedToday: number;
  currentLocationName?: string;
  relativeLevelLabel: string;
  onNavigate: (page: Page) => void;
}

export const InsightStrip: React.FC<InsightStripProps> = ({
  completedToday,
  currentLocationName,
  relativeLevelLabel,
  onNavigate,
}) => {
  return (
    <div className="bg-coral-50 border border-coral-200/80 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
      <div className="flex items-center gap-4">
        {/* Signal Bars Icon Aesthetic */}
        <div className="flex items-end gap-1 h-8 px-2.5 py-1 bg-coral-100/70 rounded-lg shrink-0" aria-hidden="true">
          <span className="w-1 h-3 bg-coral-400 rounded-full" />
          <span className="w-1 h-6 bg-coral-500 rounded-full" />
          <span className="w-1 h-4 bg-coral-400 rounded-full" />
          <span className="w-1 h-5 bg-coral-500 rounded-full" />
        </div>

        <div>
          <span className="text-[11px] font-bold text-coral-600 uppercase tracking-wider block">
            A Note From Your Map
          </span>
          <p className="text-sm font-semibold text-sage-900 mt-0.5">
            {completedToday > 0
              ? `Your ${currentLocationName || 'current'} workspace has remained ${relativeLevelLabel.toLowerCase()} today.`
              : 'Your focus map is ready to chart and correlate your work atmosphere.'}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onNavigate('map')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-coral-600 hover:text-coral-800 transition-colors shrink-0"
      >
        <span>Explore Focus Map</span>
        <ArrowUpRight size={15} />
      </button>
    </div>
  );
};
