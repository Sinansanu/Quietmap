import React, { useState, useEffect } from 'react';
import { User as UserIcon, Mail, Globe, Sun, Moon, Monitor, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api, ApiError } from '../../api/client';
import type { User, UserProfileUpdate } from '../../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUserUpdated: (updatedUser: User) => void;
}

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Amsterdam',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
}) => {
  const [fullName, setFullName] = useState(user.full_name || '');
  const [timezoneMode, setTimezoneMode] = useState<'auto' | 'manual'>(user.timezone_mode || 'auto');
  const [timezone, setTimezone] = useState(
    user.timezone || (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC')
  );
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>(
    user.theme_preference || 'system'
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync state when modal opens or user prop changes
  useEffect(() => {
    if (isOpen) {
      setFullName(user.full_name || '');
      setTimezoneMode(user.timezone_mode || 'auto');
      const detected = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
      setTimezone(user.timezone || detected);
      setThemePreference(user.theme_preference || 'system');
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, user]);

  const detectedTimezone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanFullName = fullName.trim();
    if (!cleanFullName || cleanFullName.length < 2) {
      setErrorMessage('Full name must be at least 2 characters.');
      return;
    }
    if (cleanFullName.length > 100) {
      setErrorMessage('Full name cannot exceed 100 characters.');
      return;
    }

    const payload: UserProfileUpdate = {
      full_name: cleanFullName,
      timezone_mode: timezoneMode,
      timezone: timezoneMode === 'auto' ? detectedTimezone : (timezone.trim() || detectedTimezone),
      theme_preference: themePreference,
    };

    setLoading(true);
    try {
      const updated = await api.profile.update(payload);
      onUserUpdated(updated);
      setSuccessMessage('Profile preferences saved successfully.');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to save profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Profile & Preferences" maxWidth="md">
      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="profile-fullname" className="text-xs font-semibold text-forest-950 flex items-center justify-between">
            <span>Full Name / Display Name</span>
            <span className="text-[10px] text-sage-400 font-normal">Required (2-100 chars)</span>
          </label>
          <div className="relative">
            <input
              id="profile-fullname"
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Mercer"
              className="w-full bg-sage-50 border border-sage-300 rounded-xl px-3.5 py-2 pl-9 text-xs text-forest-950 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
            <UserIcon size={14} className="absolute left-3 top-2.5 text-sage-400" />
          </div>
        </div>

        {/* Email - Read-only */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="profile-email" className="text-xs font-semibold text-forest-950 flex items-center justify-between">
            <span>Account Email</span>
            <span className="text-[10px] text-sage-400 font-medium flex items-center gap-1">
              <Lock size={10} /> Read-only account identifier
            </span>
          </label>
          <div className="relative">
            <input
              id="profile-email"
              type="email"
              readOnly
              disabled
              value={user.email}
              className="w-full bg-sage-100/70 border border-sage-200 rounded-xl px-3.5 py-2 pl-9 text-xs text-sage-600 cursor-not-allowed select-none"
            />
            <Mail size={14} className="absolute left-3 top-2.5 text-sage-400" />
          </div>
        </div>

        {/* Timezone Configuration */}
        <div className="flex flex-col gap-2 pt-2 border-t border-sage-100">
          <label className="text-xs font-semibold text-forest-950 flex items-center justify-between">
            <span>Timezone Settings</span>
            <span className="text-[10px] text-forest-700 font-medium">{timezoneMode === 'auto' ? 'Auto-synchronized' : 'Custom'}</span>
          </label>

          <div className="flex bg-sage-100 p-1 rounded-xl border border-sage-200">
            <button
              type="button"
              onClick={() => {
                setTimezoneMode('auto');
                setTimezone(detectedTimezone);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                timezoneMode === 'auto'
                  ? 'bg-white text-forest-900 shadow-xs'
                  : 'text-sage-500 hover:text-forest-900'
              }`}
            >
              Automatic (Browser)
            </button>
            <button
              type="button"
              onClick={() => setTimezoneMode('manual')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                timezoneMode === 'manual'
                  ? 'bg-white text-forest-900 shadow-xs'
                  : 'text-sage-500 hover:text-forest-900'
              }`}
            >
              Manual Selection
            </button>
          </div>

          {timezoneMode === 'auto' ? (
            <div className="flex items-center gap-2 p-2.5 bg-sage-50 rounded-xl border border-sage-200 text-xs text-sage-600">
              <Globe size={14} className="text-forest-600 shrink-0" />
              <span>
                Detected device timezone: <strong className="text-forest-950 font-semibold">{detectedTimezone}</strong>
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-sage-50 border border-sage-300 rounded-xl px-3 py-2 text-xs text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-500"
              >
                {!COMMON_TIMEZONES.includes(timezone) && (
                  <option value={timezone}>{timezone} (Current)</option>
                )}
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Theme Preference */}
        <div className="flex flex-col gap-2 pt-2 border-t border-sage-100">
          <label className="text-xs font-semibold text-forest-950">Theme Preference</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setThemePreference('light')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                themePreference === 'light'
                  ? 'bg-forest-50 border-forest-500 text-forest-900 ring-2 ring-forest-200'
                  : 'bg-white border-sage-200 text-sage-600 hover:bg-sage-50'
              }`}
            >
              <Sun size={14} className={themePreference === 'light' ? 'text-amber-500' : 'text-sage-400'} />
              <span>Light</span>
            </button>

            <button
              type="button"
              onClick={() => setThemePreference('dark')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                themePreference === 'dark'
                  ? 'bg-forest-50 border-forest-500 text-forest-900 ring-2 ring-forest-200'
                  : 'bg-white border-sage-200 text-sage-600 hover:bg-sage-50'
              }`}
            >
              <Moon size={14} className={themePreference === 'dark' ? 'text-indigo-500' : 'text-sage-400'} />
              <span>Dark</span>
            </button>

            <button
              type="button"
              onClick={() => setThemePreference('system')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                themePreference === 'system'
                  ? 'bg-forest-50 border-forest-500 text-forest-900 ring-2 ring-forest-200'
                  : 'bg-white border-sage-200 text-sage-600 hover:bg-sage-50'
              }`}
            >
              <Monitor size={14} className={themePreference === 'system' ? 'text-forest-600' : 'text-sage-400'} />
              <span>System</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-sage-100">
          <Button type="button" variant="light" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={loading}>
            {loading ? 'Saving Changes...' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
