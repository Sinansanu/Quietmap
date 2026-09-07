import { Check, LockKeyhole, Mic, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface OnboardingProps {
  onRequestPermission(): Promise<void>;
  onComplete(activity: string): void;
}

const activities = ['Study', 'Coding', 'Writing', 'Reading', 'Design', 'Work', 'Other'];

export function Onboarding({ onRequestPermission, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [activity, setActivity] = useState('');
  const [permission, setPermission] = useState<'idle' | 'asking' | 'granted' | 'denied'>('idle');

  const requestPermission = async () => {
    setPermission('asking');
    try {
      await onRequestPermission();
      setPermission('granted');
    } catch {
      setPermission('denied');
    }
  };

  return (
    <main className="onboarding-shell">
      <section className="onboarding-panel">
        <div className="onboarding-orbit orbit-one" />
        <div className="onboarding-orbit orbit-two" />
        <div className="onboarding-content">
          <div className="brand onboarding-brand"><span className="brand__mark"><Sparkles size={19} /></span><span>QuitMap</span></div>
          <div className="stepper" aria-label={`Step ${step + 1} of 3`}>
            {[0, 1, 2].map((index) => <span key={index} className={index <= step ? 'current' : ''} />)}
          </div>
          {step === 0 && (
            <div className="onboarding-copy">
              <span className="eyebrow">PERSONAL FOCUS CARTOGRAPHER</span>
              <h1>Meet QuitMap.</h1>
              <p>QuitMap learns how your environment affects your focus, then reveals the places and periods where calm tends to find you.</p>
              <div className="onboarding-signal" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /></div>
              <button type="button" className="button primary" onClick={() => setStep(1)}>Continue</button>
            </div>
          )}
          {step === 1 && (
            <div className="onboarding-copy">
              <span className="eyebrow">PRIVACY BY DESIGN</span>
              <h1>Your sound stays yours.</h1>
              <p>QuitMap measures a momentary sound level on this device. It never saves recordings, recognizes speech, or sends audio anywhere.</p>
              <ul className="privacy-list">
                <li><Check size={16} />Local processing only</li>
                <li><Check size={16} />No conversations analyzed</li>
                <li><Check size={16} />Delete everything at any time</li>
              </ul>
              <div className={permission === 'denied' ? 'permission-callout error' : 'permission-callout'}>
                <Mic size={18} />
                <span>{permission === 'granted' ? 'Microphone access granted' : permission === 'denied' ? 'Permission was not granted. You can enable it later in your system settings.' : 'Microphone access is required only to monitor ambient level.'}</span>
              </div>
              {permission !== 'granted' && <button type="button" className="button primary" disabled={permission === 'asking'} onClick={requestPermission}>{permission === 'asking' ? 'Requesting access...' : 'Allow microphone access'}</button>}
              <button type="button" className="button text-button" onClick={() => setStep(2)}>{permission === 'granted' ? 'Continue' : 'Continue without monitoring'}</button>
            </div>
          )}
          {step === 2 && (
            <div className="onboarding-copy">
              <span className="eyebrow">A LITTLE CONTEXT, OPTIONAL</span>
              <h1>What are you working on?</h1>
              <p>This helps label your sessions. It stays on your device and you can skip it whenever you like.</p>
              <div className="activity-grid">
                {activities.map((item) => <button key={item} type="button" className={activity === item ? 'activity-chip selected' : 'activity-chip'} onClick={() => setActivity(item)}>{item}</button>)}
              </div>
              <button type="button" className="button primary" onClick={() => onComplete(activity)}>Open your map</button>
              <p className="onboarding-footnote"><LockKeyhole size={14} />No account. No cloud. Just your local map.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
