import React from 'react';
import { Pause, Play, Sparkles } from 'lucide-react';
import { NoiseGauge } from '../components/dashboard/NoiseGauge';
import { SessionCard } from '../components/dashboard/SessionCard';
import { MetricGrid } from '../components/dashboard/MetricGrid';
import { InsightStrip } from '../components/dashboard/InsightStrip';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import type { DashboardData, FocusSession, Location, Page } from '../types';
import { relativeNoiseLabel } from '../components/dashboard/NoiseGauge';

interface DashboardPageProps {
  data: DashboardData;
  liveLevel: number | null;
  monitoring: boolean;
  activeSession: FocusSession | null;
  locations: Location[];
  selectedLocationId: string | null;
  activeSeconds: number;
  onLocationChange: (id: string) => void;
  onToggleMonitoring: () => void;
  onStartSession: (locationId: string | null, activity: string) => void;
  onEndSession: () => void;
  onNavigate: (page: Page) => void;
  onRequestCreateLocation: () => void;
}

function getGreeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning.' : h < 18 ? 'Good afternoon.' : 'Good evening.';
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  data,
  liveLevel,
  monitoring,
  activeSession,
  locations,
  selectedLocationId,
  activeSeconds,
  onLocationChange,
  onToggleMonitoring,
  onStartSession,
  onEndSession,
  onNavigate,
  onRequestCreateLocation,
}) => {
  const currentLevel = liveLevel !== null ? liveLevel : data.last_sample?.noise_level ?? null;
  const activeLocation = locations.find((l) => l.id === selectedLocationId);

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full pb-12">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-forest-600 uppercase tracking-widest block">
            Your Environment Today
          </span>
          <h1 className="text-3xl font-extrabold text-forest-950 tracking-tight mt-1">
            {getGreeting()}
          </h1>
          <p className="text-sm text-sage-500 mt-0.5">
            A continuous, quiet reading of the physical space around you.
          </p>
        </div>

        <Button
          variant={monitoring ? 'secondary' : 'light'}
          size="md"
          onClick={onToggleMonitoring}
          icon={monitoring ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
          className={monitoring ? 'border-emerald-300 text-emerald-800 bg-emerald-50/80' : ''}
        >
          {monitoring ? 'Monitoring Ambient' : 'Turn Monitoring On'}
        </Button>
      </header>

      {/* Hero: Environment Dial & Session Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Environment Card */}
        <Card className="lg:col-span-7 flex flex-col justify-between relative overflow-hidden bg-surface-accent border-forest-200">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <span className="text-xs font-bold text-forest-700 uppercase tracking-widest block">
                Current Atmosphere
              </span>
              <h2 className="text-2xl font-bold text-forest-950 mt-1">
                {relativeNoiseLabel(currentLevel)}
              </h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-forest-200 text-forest-800 shadow-2xs">
              {monitoring ? 'Live Stream' : 'Idle'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 my-6 relative z-10">
            <NoiseGauge level={currentLevel} />
            <div className="flex flex-col gap-2 max-w-xs text-center sm:text-left">
              <span className="text-xs font-semibold text-sage-400 uppercase tracking-wider">
                Momentary Relative Level
              </span>
              <div className="text-3xl font-extrabold text-forest-950 tabular-nums">
                {currentLevel !== null ? `${Math.round(currentLevel)} / 100` : '--'}
              </div>
              <p className="text-xs text-sage-600 leading-relaxed">
                {monitoring
                  ? 'Continuous on-device RMS integration. Audio buffers are immediately discarded.'
                  : 'Start monitoring when you are ready to map your workspace atmosphere.'}
              </p>
            </div>
          </div>

          {/* Contour line graphic aesthetic */}
          <div className="absolute -bottom-16 -right-16 w-64 h-64 border border-forest-200/60 contour-orbit pointer-events-none" />
          <div className="flex items-center gap-2 text-[11px] text-sage-400 relative z-10">
            <Sparkles size={13} className="text-forest-600" />
            <span>Workspace: {activeLocation?.name || 'Unassigned'}</span>
          </div>
        </Card>

        {/* Focus Session Card */}
        <div className="lg:col-span-5 flex">
          <SessionCard
            activeSession={activeSession}
            locations={locations}
            selectedLocationId={selectedLocationId}
            activeSeconds={activeSeconds}
            onLocationChange={onLocationChange}
            onStartSession={onStartSession}
            onEndSession={onEndSession}
            onRequestCreateLocation={onRequestCreateLocation}
          />
        </div>
      </div>

      {/* Metrics Row */}
      <MetricGrid
        completedToday={data.completed_today}
        interruptionsToday={data.interruptions_today}
        averageScore={data.average_score}
      />

      {/* Insight Strip */}
      <InsightStrip
        completedToday={data.completed_today}
        currentLocationName={activeLocation?.name}
        relativeLevelLabel={relativeNoiseLabel(currentLevel)}
        onNavigate={onNavigate}
      />
    </div>
  );
};
