import { BarChart3, Compass, Gauge, LineChart, Settings, ShieldCheck } from 'lucide-react';
import type { Page } from '../types';

const items: Array<{ id: Page; label: string; icon: typeof Gauge }> = [
  { id: 'dashboard', label: 'Overview', icon: Gauge },
  { id: 'map', label: 'Focus Map', icon: Compass },
  { id: 'timeline', label: 'Timeline', icon: LineChart },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  page: Page;
  monitoring: boolean;
  onChange(page: Page): void;
}

export function Sidebar({ page, monitoring, onChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand__mark"><Compass size={20} strokeWidth={1.7} /></span>
        <span>QuitMap</span>
      </div>
      <nav aria-label="Main navigation">
        {items.map(({ id, label, icon: Icon }) => (
          <button type="button" key={id} className={page === id ? 'nav-item active' : 'nav-item'} onClick={() => onChange(id)}>
            <Icon size={18} strokeWidth={1.7} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar__bottom">
        <div className="monitor-status">
          <span className={monitoring ? 'status-dot live' : 'status-dot'} />
          <span>{monitoring ? 'Monitoring ambient sound' : 'Monitoring paused'}</span>
        </div>
        <div className="privacy-note"><ShieldCheck size={15} />Local-only measurements</div>
      </div>
    </aside>
  );
}
