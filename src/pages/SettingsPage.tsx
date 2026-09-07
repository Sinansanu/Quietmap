import { ChevronDown, Database, Mic, ShieldCheck, Trash2 } from 'lucide-react';
import type { Settings } from '../types';

interface SettingsPageProps {
  settings: Settings;
  monitoring: boolean;
  onUpdate(patch: Partial<Settings>): void;
  onToggleMonitoring(): void;
  onDelete(): void;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange(): void; label: string }) {
  return <button type="button" className={checked ? 'toggle checked' : 'toggle'} aria-label={label} aria-pressed={checked} onClick={onChange}><span /></button>;
}

export function SettingsPage({ settings, monitoring, onUpdate, onToggleMonitoring, onDelete }: SettingsPageProps) {
  return (
    <div className="page settings-page">
      <header className="page-header"><div><p className="eyebrow">LOCAL CONTROLS</p><h1>Settings</h1><p className="subtle">Choose how QuitMap observes the environment around you.</p></div></header>
      <section className="settings-section"><div className="settings-section__heading"><Mic size={19} /><div><h2>Monitoring</h2><p>Sound level is sampled locally and immediately reduced to a number.</p></div></div><div className="setting-rows"><div className="setting-row"><div><strong>Ambient monitoring</strong><span>{monitoring ? 'Currently sampling relative level' : 'Paused until you turn it on'}</span></div><Toggle checked={monitoring} label="Toggle ambient monitoring" onChange={onToggleMonitoring} /></div><label className="setting-row"><div><strong>Sampling interval</strong><span>How often a momentary level is stored</span></div><span className="select-wrap"><select value={settings.samplingInterval} onChange={(event) => onUpdate({ samplingInterval: Number(event.target.value) })}>{[5, 10, 30, 60].map((seconds) => <option key={seconds} value={seconds}>{seconds} sec</option>)}</select><ChevronDown size={16} /></span></label><label className="setting-row"><div><strong>Interruption threshold</strong><span>Significant rise above the recent baseline</span></div><span className="select-wrap"><select value={settings.interruptionThreshold} onChange={(event) => onUpdate({ interruptionThreshold: Number(event.target.value) })}><option value={12}>Low</option><option value={18}>Medium</option><option value={26}>High</option></select><ChevronDown size={16} /></span></label></div></section>
      <section className="settings-section privacy-section"><div className="settings-section__heading"><ShieldCheck size={19} /><div><h2>Privacy & Data</h2><p>QuitMap is designed to keep these controls deliberately simple.</p></div></div><div className="setting-rows"><div className="setting-row static"><div><strong>Local processing</strong><span>Always on</span></div><span className="state-badge"><i />On device</span></div><div className="setting-row static"><div><strong>Audio recording</strong><span>No microphone audio is written to disk</span></div><span className="state-badge muted">Never</span></div><div className="setting-row static"><div><strong>Cloud synchronization</strong><span>No account or network dependency</span></div><span className="state-badge muted">Off</span></div></div><div className="delete-zone"><div><Database size={19} /><div><strong>Delete all QuitMap data</strong><p>Permanently remove environment history and focus statistics from this device.</p></div></div></div><button type="button" className="button danger" onClick={onDelete}><Trash2 size={16} />Delete all data</button></section>
    </div>
  );
}
