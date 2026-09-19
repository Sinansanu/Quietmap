import React from 'react';
import { CalendarClock, Compass, Lightbulb, MapPin, Sparkles, TrendingUp } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import type { InsightsData, WeeklyData } from '../types';

interface InsightsPageProps {
  insights: InsightsData | null;
  weekly: WeeklyData | null;
  onSeedDemo: (days: number) => Promise<void>;
}

export const InsightsPage: React.FC<InsightsPageProps> = ({
  insights,
  weekly,
  onSeedDemo,
}) => {
  const isReady = insights?.ready;

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full pb-12">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-forest-600 uppercase tracking-widest block">
            Patterns, Not Prescriptions
          </span>
          <h1 className="text-3xl font-extrabold text-forest-950 tracking-tight mt-1">
            Insights
          </h1>
          <p className="text-sm text-sage-500 mt-0.5">
            Observations emerge once there is sufficient local telemetry to support them.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-50 border border-forest-200 text-xs font-semibold text-forest-800 self-start sm:self-auto">
          <Sparkles size={14} className="text-forest-600" />
          <span>{insights?.sample_count || 0} measurements logged</span>
        </div>
      </header>

      {/* When Ready: Analytics Cards */}
      {isReady ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quietest Period */}
            <Card className="bg-surface-accent border-forest-200 relative overflow-hidden flex flex-col justify-between">
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-forest-600 text-white flex items-center justify-center mb-4">
                  <CalendarClock size={20} />
                </div>
                <span className="text-xs font-bold text-forest-700 uppercase tracking-widest block">
                  Your Quietest Window
                </span>
                <h2 className="text-2xl font-extrabold text-forest-950 mt-1">
                  {insights?.quietest?.label}
                </h2>
                <p className="text-xs text-sage-600 mt-2 leading-relaxed">
                  Consistently lowest ambient sound levels averaging{' '}
                  <strong className="text-forest-900">{insights?.quietest?.average_noise} dBFS</strong>. Ideal for uninterrupted, high-cognitive work.
                </p>
              </div>

              {/* Aesthetic contour rings */}
              <div className="absolute -bottom-10 -right-10 w-36 h-36 border border-forest-300/40 contour-orbit pointer-events-none" />
            </Card>

            {/* Best Workspace */}
            <Card className="flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-coral-100 text-coral-600 flex items-center justify-center mb-4">
                  <MapPin size={20} />
                </div>
                <span className="text-xs font-bold text-coral-600 uppercase tracking-widest block">
                  Optimal Workspace
                </span>
                <h2 className="text-2xl font-extrabold text-forest-950 mt-1">
                  {insights?.best_location?.name}
                </h2>
                <p className="text-xs text-sage-600 mt-2 leading-relaxed">
                  Earned an average focus score of{' '}
                  <strong className="text-coral-600">{insights?.best_location?.focus_score}</strong> across{' '}
                  {insights?.best_location?.session_count} completed focus sessions.
                </p>
              </div>

              {/* Progress score bar */}
              <div className="mt-4 pt-3 border-t border-sage-100">
                <div className="w-full h-2 rounded-full bg-sage-100 overflow-hidden">
                  <div
                    className="h-full bg-coral-500 rounded-full"
                    style={{ width: `${insights?.best_location?.focus_score || 0}%` }}
                  />
                </div>
              </div>
            </Card>

            {/* Variability Emergence */}
            <Card className="flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
                  <Lightbulb size={20} />
                </div>
                <span className="text-xs font-bold text-sky-700 uppercase tracking-widest block">
                  Emerging Shift
                </span>
                <h2 className="text-2xl font-extrabold text-forest-950 mt-1">
                  {insights?.variable_period?.label || 'Afternoon Window'}
                </h2>
                <p className="text-xs text-sage-600 mt-2 leading-relaxed">
                  Acoustic volatility increases around this period. You may prefer administrative tasks or collaborative sessions during this window.
                </p>
              </div>

              <div className="text-[11px] text-sage-400 mt-4 pt-3 border-t border-sage-100 font-medium">
                High ambient fluctuation index
              </div>
            </Card>
          </div>

          {/* 7-Day Weekly Summary */}
          {weekly && weekly.days.length > 0 && (
            <Card className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-forest-600 uppercase tracking-widest block">
                    Your Week in Focus
                  </span>
                  <h2 className="text-xl font-bold text-forest-950 mt-0.5">
                    7-Day Retrospective
                  </h2>
                </div>
                <TrendingUp size={20} className="text-forest-600" />
              </div>

              {/* Summary Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-sage-50 border border-sage-200">
                <div>
                  <span className="text-[11px] text-sage-500 uppercase tracking-wider block">Best Day</span>
                  <span className="text-lg font-bold text-forest-950 mt-0.5 block">
                    {weekly.best_day ? `${weekly.best_day.day_name} (${weekly.best_day.focus_score} score)` : '--'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-sage-500 uppercase tracking-wider block">Total Interruption Spikes</span>
                  <span className="text-lg font-bold text-forest-950 mt-0.5 block">
                    {weekly.total_interruptions}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-sage-500 uppercase tracking-wider block">Total Focus Time</span>
                  <span className="text-lg font-bold text-forest-950 mt-0.5 block">
                    {Math.round(weekly.total_focus_minutes)} minutes
                  </span>
                </div>
              </div>

              {/* Daily Bar Indicators */}
              <div className="grid grid-cols-7 gap-2 text-center pt-2">
                {weekly.days.map((d) => (
                  <div key={d.date} className="flex flex-col items-center gap-2">
                    <div className="w-full h-24 bg-sage-100 rounded-lg flex flex-col justify-end p-1 overflow-hidden">
                      <div
                        className="w-full bg-forest-500 rounded-md transition-all duration-300"
                        style={{ height: `${Math.min(100, Math.max(10, d.focus_score || 0))}%` }}
                        title={`Score: ${d.focus_score || 'N/A'}`}
                      />
                    </div>
                    <span className="text-xs font-bold text-forest-900">{d.day_name}</span>
                    <span className="text-[10px] text-sage-400">
                      {d.focus_score !== null ? `${d.focus_score}` : '--'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : (
        /* Empty State with Seed Options */
        <div className="h-96 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-sage-300 p-8 text-center shadow-xs">
          <div className="w-14 h-14 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center mb-4">
            <Compass size={28} />
          </div>
          <h2 className="text-2xl font-bold text-forest-950">Still Learning Your Routine</h2>
          <p className="text-sm text-sage-500 max-w-md mt-2 mb-6 leading-relaxed">
            {insights?.reason || 'QuietMap requires more focus sessions across multiple hours to establish statistically sound insights.'}
          </p>

          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-semibold text-sage-400 uppercase tracking-wider">
              Quickstart with Simulated Demo Data
            </span>
            <div className="flex flex-wrap gap-2.5">
              <Button variant="light" size="sm" onClick={() => onSeedDemo(7)}>
                Load 7 Days Demo
              </Button>
              <Button variant="light" size="sm" onClick={() => onSeedDemo(14)}>
                Load 14 Days Demo
              </Button>
              <Button variant="light" size="sm" onClick={() => onSeedDemo(30)}>
                Load 30 Days Demo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
