import React from 'react';
import { Clock, Edit2, MapPin, Play, Sparkles, Trash2, Volume2 } from 'lucide-react';
import type { LocationMapMetrics } from '../../types';
import { relativeNoiseLabel } from '../dashboard/NoiseGauge';

interface LocationCardProps {
  location: LocationMapMetrics;
  onEdit: (location: LocationMapMetrics) => void;
  onDelete: (location: LocationMapMetrics) => void;
  onSelectForSession: (locationId: string) => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  onEdit,
  onDelete,
  onSelectForSession,
}) => {
  return (
    <article className="bg-white rounded-2xl border border-sage-200 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
      <div>
        {/* Header with actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-forest-50 text-forest-700 flex items-center justify-center">
              <MapPin size={17} />
            </div>
            <h3 className="text-lg font-bold text-forest-950">{location.name}</h3>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(location)}
              className="p-1.5 text-sage-400 hover:text-forest-700 rounded-md hover:bg-sage-100 transition-colors"
              aria-label={`Edit ${location.name}`}
            >
              <Edit2 size={15} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(location)}
              className="p-1.5 text-sage-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
              aria-label={`Delete ${location.name}`}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Focus Score */}
        {location.focus_score !== null ? (
          <div className="my-5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-sage-500 uppercase tracking-wider">
                Focus Score
              </span>
              <span className="text-3xl font-extrabold text-forest-900 tabular-nums">
                {location.focus_score}
              </span>
            </div>
            {/* Wave aesthetic */}
            <div className="flex items-center gap-1 my-3 h-5" aria-hidden="true">
              {[8, 14, 20, 16, 10, 18, 12, 16].map((h, idx) => (
                <span
                  key={idx}
                  className="w-1 bg-forest-400/80 rounded-full"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>

            {/* Metrics List */}
            <dl className="grid grid-cols-2 gap-3 mt-4 text-xs border-t border-sage-100 pt-3">
              <div>
                <dt className="text-sage-400 font-medium flex items-center gap-1">
                  <Volume2 size={12} /> Avg Noise
                </dt>
                <dd className="font-semibold text-forest-900 mt-0.5">
                  {relativeNoiseLabel(location.average_noise)}
                </dd>
              </div>
              <div>
                <dt className="text-sage-400 font-medium flex items-center gap-1">
                  <Clock size={12} /> Best Time
                </dt>
                <dd className="font-semibold text-forest-900 mt-0.5">
                  {location.best_time || 'Learning...'}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="my-8 py-4 px-3 bg-sage-50 rounded-xl border border-dashed border-sage-200 text-center text-xs text-sage-500 leading-relaxed">
            Start a few focus sessions here to map noise trends and unlock your workspace score.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-sage-100 text-xs text-sage-500 mt-2">
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles size={13} className="text-forest-600" />
          {location.sessions} {location.sessions === 1 ? 'session' : 'sessions'}
        </span>

        <button
          type="button"
          onClick={() => onSelectForSession(location.id)}
          className="inline-flex items-center gap-1 font-semibold text-forest-700 hover:text-forest-900 bg-forest-50 px-2.5 py-1 rounded-md hover:bg-forest-100 transition-colors"
        >
          <Play size={12} fill="currentColor" />
          <span>Focus Here</span>
        </button>
      </div>
    </article>
  );
};
