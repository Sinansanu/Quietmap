import React, { useState } from 'react';
import { Clock, MapPin, Play, Square, Tag } from 'lucide-react';
import { Button } from '../ui/Button';
import type { FocusSession, Location } from '../../types';

interface SessionCardProps {
  activeSession: FocusSession | null;
  locations: Location[];
  selectedLocationId: string | null;
  activeSeconds: number;
  onLocationChange: (id: string) => void;
  onStartSession: (locationId: string | null, activity: string) => void;
  onEndSession: () => void;
  onRequestCreateLocation: () => void;
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}

const COMMON_ACTIVITIES = ['Deep Work', 'Coding', 'Writing', 'Reading', 'Study', 'Design', 'Meeting'];

export const SessionCard: React.FC<SessionCardProps> = ({
  activeSession,
  locations,
  selectedLocationId,
  activeSeconds,
  onLocationChange,
  onStartSession,
  onEndSession,
  onRequestCreateLocation,
}) => {
  const [activity, setActivity] = useState('Deep Work');

  return (
    <div className="bg-surface-dark text-white rounded-2xl p-6 flex flex-col justify-between shadow-md border border-forest-800">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-forest-200 uppercase tracking-widest opacity-80">
            Focus Session
          </span>
          <Clock size={18} className="text-forest-300" />
        </div>

        <h2 className="text-xl font-bold mt-1 text-forest-50">
          {activeSession ? 'Session in Progress' : 'Make Space to Focus'}
        </h2>

        {activeSession ? (
          <div className="my-6">
            <div className="text-4xl font-extrabold tabular-nums tracking-tight text-white">
              {formatDuration(activeSeconds)}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-forest-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Activity: <strong className="text-white">{activeSession.activity || 'Work'}</strong></span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-forest-200/90 mt-2 mb-6 leading-relaxed">
            Record the ambient stability around a block of work, without intrusive recording or judging your output.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {!activeSession && (
          <>
            {/* Dynamic Activity Selector */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="activity-input" className="text-xs font-semibold text-forest-200 flex items-center gap-1.5">
                <Tag size={13} />
                <span>Working On</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="activity-input"
                  type="text"
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  placeholder="e.g. System Design, Writing"
                  className="flex-1 bg-forest-900/80 border border-forest-700/80 rounded-lg px-3 py-2 text-sm text-white placeholder:text-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-400"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {COMMON_ACTIVITIES.slice(0, 4).map((act) => (
                  <button
                    key={act}
                    type="button"
                    onClick={() => setActivity(act)}
                    className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors ${
                      activity === act
                        ? 'bg-forest-600 border-forest-500 text-white'
                        : 'bg-forest-900/40 border-forest-700 text-forest-300 hover:text-white'
                    }`}
                  >
                    {act}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Selector */}
            <div className="flex flex-col gap-1.5 mt-1">
              <label htmlFor="location-select" className="text-xs font-semibold text-forest-200 flex items-center gap-1.5">
                <MapPin size={13} />
                <span>Workspace Location</span>
              </label>
              {locations.length > 0 ? (
                <select
                  id="location-select"
                  value={selectedLocationId || ''}
                  onChange={(e) => onLocationChange(e.target.value)}
                  className="w-full bg-forest-900/80 border border-forest-700/80 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-forest-400"
                >
                  <option value="">Select a location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id} className="text-sage-900 bg-white">
                      {loc.name}
                    </option>
                  ))}
                </select>
              ) : (
                <button
                  type="button"
                  onClick={onRequestCreateLocation}
                  className="text-xs text-forest-300 hover:text-white underline text-left"
                >
                  + Add your first workspace in Focus Map to begin
                </button>
              )}
            </div>
          </>
        )}

        {/* Action button */}
        {activeSession ? (
          <Button
            variant="danger"
            size="lg"
            fullWidth
            onClick={onEndSession}
            icon={<Square size={16} fill="currentColor" />}
            className="mt-2 bg-red-600 text-white hover:bg-red-700 border-none"
          >
            End Focus Session
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!selectedLocationId && locations.length > 0}
            onClick={() => onStartSession(selectedLocationId, activity)}
            icon={<Play size={16} fill="currentColor" />}
            className="mt-2 bg-forest-100 text-forest-900 hover:bg-white border-none shadow-md font-bold"
          >
            Start Focus Session
          </Button>
        )}
      </div>
    </div>
  );
};
