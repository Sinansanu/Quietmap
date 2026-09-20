import React from 'react';
import { BarChart3, Compass, Gauge, LineChart, LogOut, Settings as SettingsIcon, ShieldCheck } from 'lucide-react';
import type { Page, User } from '../../types';

interface SidebarProps {
  activePage: Page;
  monitoring: boolean;
  onPageChange: (page: Page) => void;
  user: User | null;
  onLogout: () => void;
  onOpenProfile?: () => void;
}

const navItems: Array<{ id: Page; label: string; icon: typeof Gauge }> = [
  { id: 'dashboard', label: 'Overview', icon: Gauge },
  { id: 'map', label: 'Focus Map', icon: Compass },
  { id: 'timeline', label: 'Timeline', icon: LineChart },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  monitoring,
  onPageChange,
  user,
  onLogout,
  onOpenProfile,
}) => {
  return (
    <aside className="w-60 bg-sage-50 border-r border-sage-200 min-h-screen flex flex-col p-6 shrink-0">
      {/* Brand logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-forest-600 flex items-center justify-center text-white shadow-sm">
          <Compass size={18} strokeWidth={2} />
        </div>
        <div>
          <span className="font-bold text-base tracking-tight text-forest-900 block leading-tight">QuietMap</span>
          <span className="text-[10px] font-semibold text-sage-400 uppercase tracking-wider block">Cartographer</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-10 flex flex-col gap-1.5 flex-1" aria-label="Main navigation">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activePage === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onPageChange(id)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-forest-100 text-forest-800 shadow-xs'
                  : 'text-sage-600 hover:text-forest-900 hover:bg-sage-100'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.7} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer status card & User info */}
      <div className="pt-6 border-t border-sage-200/80 flex flex-col gap-3">
        {user && (
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white border border-sage-200 text-xs shadow-xs">
            <button
              type="button"
              onClick={onOpenProfile}
              title="Edit Profile & Preferences"
              className="flex items-center gap-2 min-w-0 text-left hover:opacity-80 transition-opacity flex-1"
            >
              <div className="w-7 h-7 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center shrink-0 font-medium text-xs">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 truncate">
                <p className="font-semibold text-sage-800 truncate text-xs hover:text-forest-800">
                  {user.full_name || user.email.split('@')[0]}
                </p>
                <p className="text-[10px] text-sage-400 truncate">{user.email}</p>
              </div>
            </button>
            <button
              type="button"
              onClick={onLogout}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 text-sage-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors shrink-0"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-white border border-sage-200 text-xs text-sage-600 shadow-xs">
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors ${
              monitoring ? 'bg-emerald-500 ring-4 ring-emerald-100 animate-pulse' : 'bg-sage-300'
            }`}
          />
          <span className="font-medium">
            {monitoring ? 'Monitoring ambient' : 'Monitoring paused'}
          </span>
        </div>

        <div className="flex items-center gap-2 px-1 text-[11px] text-sage-500">
          <ShieldCheck size={14} className="text-forest-600 shrink-0" />
          <span>Local processing only</span>
        </div>
      </div>
    </aside>
  );
};
