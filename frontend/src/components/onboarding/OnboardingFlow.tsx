import React, { useState } from 'react';
import { Check, Compass, Lock, Mic, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

interface OnboardingFlowProps {
  onComplete: (activity: string) => void;
  onRequestMicPermission: () => Promise<boolean>;
}

const ACTIVITIES = ['Deep Work', 'Coding', 'Writing', 'Reading', 'Study', 'Design', 'Meeting', 'Other'];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  onRequestMicPermission,
}) => {
  const [step, setStep] = useState(0);
  const [activity, setActivity] = useState('Deep Work');
  const [micState, setMicState] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');

  const handleRequestMic = async () => {
    setMicState('requesting');
    try {
      const ok = await onRequestMicPermission();
      setMicState(ok ? 'granted' : 'denied');
    } catch {
      setMicState('denied');
    }
  };

  return (
    <main className="min-h-screen bg-sage-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-white rounded-3xl border border-sage-200 shadow-xl overflow-hidden p-8 sm:p-12">
        {/* Background contour rings */}
        <div className="absolute -right-20 -top-20 w-64 h-64 border border-forest-100/70 contour-orbit pointer-events-none" />
        <div className="absolute -right-10 -top-10 w-44 h-44 border border-coral-100/60 contour-orbit pointer-events-none" />

        {/* Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-forest-600 text-white flex items-center justify-center">
            <Compass size={18} />
          </div>
          <span className="font-bold text-lg text-forest-900 tracking-tight">QuietMap</span>
        </div>

        {/* Progress Stepper */}
        <div className="flex gap-2 mb-8" aria-label={`Step ${step + 1} of 3`}>
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx <= step ? 'w-8 bg-forest-600' : 'w-4 bg-sage-200'
              }`}
            />
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold text-forest-600 uppercase tracking-widest">
              Personal Focus Cartographer
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-forest-950 tracking-tight leading-tight">
              Map your ambient focus.
            </h1>
            <p className="text-sage-600 text-base leading-relaxed mt-1">
              QuietMap observes only relative ambient noise to help uncover your most serene periods and consistent workspaces.
            </p>

            <div className="flex items-end gap-1.5 h-12 my-4 px-3 py-2 bg-sage-50 rounded-xl w-fit" aria-hidden="true">
              {[12, 28, 44, 20, 36, 18, 28].map((h, i) => (
                <span key={i} className="w-1.5 bg-forest-400 rounded-full" style={{ height: `${h}px` }} />
              ))}
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => setStep(1)}
              className="w-full sm:w-auto mt-4 self-start"
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 1: Privacy by Design */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold text-forest-600 uppercase tracking-widest">
              Privacy by Design
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-forest-950 tracking-tight leading-tight">
              Your sound stays yours.
            </h1>
            <p className="text-sage-600 text-sm leading-relaxed">
              QuietMap calculates a relative 0–100 decibel scalar locally on your machine. No voice recordings, raw clips, or conversations are ever recorded, saved to disk, or sent over a network.
            </p>

            <ul className="flex flex-col gap-2.5 my-3 text-xs text-forest-900 font-medium">
              <li className="flex items-center gap-2">
                <Check size={16} className="text-emerald-600 shrink-0" />
                <span>Local browser-side RMS calculation</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-emerald-600 shrink-0" />
                <span>Zero audio storage or speech recognition</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-emerald-600 shrink-0" />
                <span>Complete data deletion control at any time</span>
              </li>
            </ul>

            <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs my-2 ${
              micState === 'granted'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : micState === 'denied'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-forest-50 border-forest-200 text-forest-800'
            }`}>
              <Mic size={18} className="shrink-0" />
              <span>
                {micState === 'granted'
                  ? 'Microphone permission active. Ready for live ambient metering.'
                  : micState === 'denied'
                  ? 'Microphone permission was not granted. You can still use QuietMap without live monitoring.'
                  : 'Microphone access is needed only to measure relative room sound level.'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              {micState !== 'granted' && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleRequestMic}
                  disabled={micState === 'requesting'}
                  icon={<Mic size={16} />}
                >
                  {micState === 'requesting' ? 'Requesting Access...' : 'Allow Microphone'}
                </Button>
              )}
              <Button
                variant={micState === 'granted' ? 'primary' : 'light'}
                size="md"
                onClick={() => setStep(2)}
              >
                {micState === 'granted' ? 'Continue' : 'Continue without Monitoring'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Activity Preference */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold text-forest-600 uppercase tracking-widest">
              Context, Not Pressure
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-forest-950 tracking-tight leading-tight">
              What do you focus on?
            </h1>
            <p className="text-sage-600 text-sm leading-relaxed">
              This provides a default label for your focus blocks. You can change it anytime on your dashboard.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4">
              {ACTIVITIES.map((act) => (
                <button
                  key={act}
                  type="button"
                  onClick={() => setActivity(act)}
                  className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                    activity === act
                      ? 'bg-forest-100 border-forest-400 text-forest-900 shadow-xs'
                      : 'bg-white border-sage-200 text-sage-600 hover:border-forest-200 hover:bg-sage-50'
                  }`}
                >
                  {act}
                </button>
              ))}
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => onComplete(activity)}
              icon={<Sparkles size={16} />}
              className="mt-2 self-start"
            >
              Open Your Map
            </Button>

            <div className="flex items-center gap-1.5 text-[11px] text-sage-400 mt-3">
              <Lock size={12} />
              <span>No user account. No cloud sync. Self-hosted and local.</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
