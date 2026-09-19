import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Radio } from 'lucide-react';
import { TimelineChart } from '../components/timeline/TimelineChart';
import { Card } from '../components/ui/Card';
import type { Location, TimelineBucket, TimelineRange, TimelineResponse } from '../types';
import { relativeNoiseLabel } from '../components/dashboard/NoiseGauge';

interface TimelinePageProps {
  timelineData: TimelineResponse | null;
  range: TimelineRange;
  locations: Location[];
  onRangeChange: (range: TimelineRange) => void;
}

const RANGE_LABELS: Record<TimelineRange, string> = {
  '12h': '12 Hours',
  day: 'Past 24 Hours',
  week: 'Past 7 Days',
};

export const TimelinePage: React.FC<TimelinePageProps> = ({
  timelineData,
  range,
  locations,
  onRangeChange,
}) => {
  const [hoveredSample, setHoveredSample] = useState<TimelineBucket | null>(null);

  const matchedLocation = locations.find((l) => l.id === hoveredSample?.location_id);

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full pb-12">
      {/* Header with Segmented Range Switcher */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-forest-600 uppercase tracking-widest block">
            Acoustic Signal Over Time
          </span>
          <h1 className="text-3xl font-extrabold text-forest-950 tracking-tight mt-1">
            Timeline
          </h1>
          <p className="text-sm text-sage-500 mt-0.5">
            A continuous graph of the ambient sound levels recorded across your sessions.
          </p>
        </div>

        {/* Accessible Segmented Control */}
        <div
          className="inline-flex bg-sage-100 p-1 rounded-xl border border-sage-200 self-start sm:self-auto"
          role="group"
          aria-label="Timeline duration"
        >
          {(['12h', 'day', 'week'] as TimelineRange[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRangeChange(r)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                range === r
                  ? 'bg-white text-forest-900 shadow-xs'
                  : 'text-sage-600 hover:text-forest-900'
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </header>

      {/* Main Chart Card */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-sage-500 uppercase tracking-wider block">
              Relative Noise Graph
            </span>
            <h2 className="text-xl font-bold text-forest-950 mt-0.5">
              {hoveredSample
                ? `${hoveredSample.noise_level} — ${relativeNoiseLabel(hoveredSample.noise_level)}`
                : 'Adaptive Ambient Curve'}
            </h2>
          </div>
          <span className="text-xs font-medium text-sage-500 flex items-center gap-1.5 bg-sage-50 px-3 py-1 rounded-full border border-sage-200">
            <Calendar size={13} />
            {RANGE_LABELS[range]}
          </span>
        </div>

        <TimelineChart
          samples={timelineData?.samples || []}
          range={range}
          onHoverSample={setHoveredSample}
        />
      </Card>

      {/* Detailed Telemetry Callouts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex flex-col justify-between">
          <span className="text-xs font-semibold text-sage-500 uppercase tracking-wider">
            Point Inspection
          </span>
          <div className="my-2">
            <span className="text-2xl font-extrabold text-forest-950 tabular-nums">
              {hoveredSample
                ? new Date(hoveredSample.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                : 'Hover Point'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-sage-500">
            <Radio size={14} className="text-forest-600" />
            <span>
              {hoveredSample
                ? `Noise: ${hoveredSample.noise_level} (min: ${hoveredSample.noise_min}, max: ${hoveredSample.noise_max})`
                : 'Scrub over timeline to inspect historical levels'}
            </span>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <span className="text-xs font-semibold text-sage-500 uppercase tracking-wider">
            Workspace
          </span>
          <div className="my-2">
            <span className="text-2xl font-extrabold text-forest-950">
              {matchedLocation ? matchedLocation.name : hoveredSample ? 'Unlabeled' : '--'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-sage-500">
            <MapPin size={14} className="text-forest-600" />
            <span>Local workspace tag</span>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <span className="text-xs font-semibold text-sage-500 uppercase tracking-wider">
            Focus Session
          </span>
          <div className="my-2">
            <span className="text-2xl font-extrabold text-forest-950">
              {hoveredSample?.focus_session_id ? 'In Session' : 'Ambient Monitoring'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-sage-500">
            <Clock size={14} className="text-forest-600" />
            <span>Session association</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
