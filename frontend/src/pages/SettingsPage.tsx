import React, { useState } from 'react';
import { Database, Globe, Lock, Mic, ShieldCheck, Trash2, User as UserIcon } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Toggle } from '../components/ui/Toggle';
import { Modal } from '../components/ui/Modal';
import type { Settings, SettingsUpdate, User } from '../types';

interface SettingsPageProps {
  settings: Settings;
  monitoring: boolean;
  user: User;
  onUpdateSettings: (patch: SettingsUpdate) => Promise<void>;
  onToggleMonitoring: () => void;
  onDeleteAllData: () => Promise<void>;
  onOpenProfile: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  monitoring,
  user,
  onUpdateSettings,
  onToggleMonitoring,
  onDeleteAllData,
  onOpenProfile,
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await onDeleteAllData();
      setIsDeleteModalOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full pb-12">
      {/* Header */}
      <header>
        <span className="text-xs font-bold text-forest-600 uppercase tracking-widest block">
          Local Controls & Preferences
        </span>
        <h1 className="text-3xl font-extrabold text-forest-950 tracking-tight mt-1">
          Settings
        </h1>
        <p className="text-sm text-sage-500 mt-0.5">
          Tune how QuietMap measures ambient sound and manages your telemetry.
        </p>
      </header>

      {/* User Profile & Preferences Section */}
      <Card className="flex flex-col gap-6">
        <div className="flex items-center justify-between pb-4 border-b border-sage-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-forest-50 text-forest-700 flex items-center justify-center">
              <UserIcon size={17} />
            </div>
            <div>
              <h2 className="text-base font-bold text-forest-950">Profile & Preferences</h2>
              <p className="text-xs text-sage-500">Your display identity, timezone sync, and visual theme.</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={onOpenProfile}>
            Edit Profile
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-sage-50 border border-sage-200">
            <span className="text-[11px] font-semibold text-sage-400 uppercase tracking-wider block">Display Name</span>
            <span className="text-sm font-bold text-forest-950 block mt-0.5 truncate">{user.full_name}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-sage-50 border border-sage-200">
            <span className="text-[11px] font-semibold text-sage-400 uppercase tracking-wider block flex items-center gap-1">
              Account Email <Lock size={10} />
            </span>
            <span className="text-sm font-semibold text-sage-700 block mt-0.5 truncate">{user.email}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-sage-50 border border-sage-200">
            <span className="text-[11px] font-semibold text-sage-400 uppercase tracking-wider block flex items-center gap-1">
              Timezone <Globe size={11} />
            </span>
            <span className="text-sm font-semibold text-forest-950 block mt-0.5 truncate">
              {user.timezone || 'Auto'} ({user.timezone_mode})
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-sage-50 border border-sage-200">
            <span className="text-[11px] font-semibold text-sage-400 uppercase tracking-wider block">Visual Theme</span>
            <span className="text-sm font-semibold text-forest-950 block mt-0.5 capitalize">
              {user.theme_preference || 'system'}
            </span>
          </div>
        </div>
      </Card>

      {/* Monitoring Section */}
      <Card className="flex flex-col gap-6">
        <div className="flex items-center gap-3 pb-4 border-b border-sage-100">
          <div className="w-8 h-8 rounded-lg bg-forest-50 text-forest-700 flex items-center justify-center">
            <Mic size={17} />
          </div>
          <div>
            <h2 className="text-base font-bold text-forest-950">Ambient Monitoring</h2>
            <p className="text-xs text-sage-500">Audio is integrated locally and immediately discarded.</p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* Active monitoring toggle */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-forest-950 block">Live Monitoring Active</span>
              <span className="text-xs text-sage-500 block mt-0.5">
                {monitoring ? 'Sampling and integrating relative levels' : 'Paused until enabled'}
              </span>
            </div>
            <Toggle
              checked={monitoring}
              onChange={onToggleMonitoring}
              label="Toggle active ambient monitoring"
            />
          </div>

          {/* Sampling interval */}
          <div className="flex items-center justify-between pt-4 border-t border-sage-100">
            <div>
              <label htmlFor="sampling-interval-select" className="text-sm font-semibold text-forest-950 block">
                Sampling Interval
              </label>
              <span className="text-xs text-sage-500 block mt-0.5">
                Frequency at which aggregated decibel readings are logged
              </span>
            </div>
            <select
              id="sampling-interval-select"
              value={settings.sampling_interval}
              onChange={(e) => onUpdateSettings({ sampling_interval: Number(e.target.value) })}
              className="bg-sage-50 border border-sage-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-500"
            >
              <option value={5}>Every 5 seconds</option>
              <option value={10}>Every 10 seconds (Recommended)</option>
              <option value={30}>Every 30 seconds</option>
              <option value={60}>Every 60 seconds</option>
            </select>
          </div>

          {/* Interruption threshold */}
          <div className="flex items-center justify-between pt-4 border-t border-sage-100">
            <div>
              <label htmlFor="interruption-threshold-select" className="text-sm font-semibold text-forest-950 block">
                Interruption Rise Threshold
              </label>
              <span className="text-xs text-sage-500 block mt-0.5">
                Decibel jump above moving baseline required to log an acoustic shift
              </span>
            </div>
            <select
              id="interruption-threshold-select"
              value={settings.interruption_threshold}
              onChange={(e) => onUpdateSettings({ interruption_threshold: Number(e.target.value) })}
              className="bg-sage-50 border border-sage-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-500"
            >
              <option value={12}>Sensitive (12 dB jump)</option>
              <option value={18}>Balanced (18 dB jump)</option>
              <option value={26}>High (26 dB jump)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Privacy Architecture Guarantee Card */}
      <Card className="flex flex-col gap-6">
        <div className="flex items-center gap-3 pb-4 border-b border-sage-100">
          <div className="w-8 h-8 rounded-lg bg-forest-50 text-forest-700 flex items-center justify-center">
            <ShieldCheck size={17} />
          </div>
          <div>
            <h2 className="text-base font-bold text-forest-950">Privacy Architecture</h2>
            <p className="text-xs text-sage-500">Explicit commitments designed directly into the codebase.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-sage-50 border border-sage-200">
            <span className="text-xs font-bold text-forest-900 block">Local Audio RMS</span>
            <p className="text-xs text-sage-500 mt-1">Processed in browser memory. Raw audio is never transmitted.</p>
          </div>
          <div className="p-4 rounded-xl bg-sage-50 border border-sage-200">
            <span className="text-xs font-bold text-forest-900 block">No Cloud Sync</span>
            <p className="text-xs text-sage-500 mt-1">Telemetry stays on your private PostgreSQL instance.</p>
          </div>
          <div className="p-4 rounded-xl bg-sage-50 border border-sage-200">
            <span className="text-xs font-bold text-forest-900 block">Complete Purge</span>
            <p className="text-xs text-sage-500 mt-1">Clear your entire database with a single confirmed action.</p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-4 pt-6 border-t border-sage-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-sm font-bold text-red-800 flex items-center gap-1.5">
              <Database size={15} />
              <span>Purge All QuietMap Data</span>
            </span>
            <p className="text-xs text-sage-500 mt-0.5">
              Permanently removes all focus sessions, recorded noise samples, and workspace labels.
            </p>
          </div>

          <Button
            variant="danger"
            size="md"
            onClick={() => setIsDeleteModalOpen(true)}
            icon={<Trash2 size={15} />}
          >
            Delete All Data
          </Button>
        </div>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete All QuietMap Data?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-sage-600 leading-relaxed">
            This permanently purges every recorded noise sample, focus session, interruption, and workspace from your PostgreSQL database. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2.5 mt-2">
            <Button variant="light" size="md" onClick={() => setIsDeleteModalOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" size="md" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Purging Data...' : 'Yes, Delete Everything'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
