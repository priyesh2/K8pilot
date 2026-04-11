import { useState, useEffect } from 'react';
import {
  BarChart3, Terminal, Layers, Settings, Shield,
  ChevronRight, Cloud, LogOut, Gauge, Palette,
  Activity, Globe, FileText, Server, Clock,
  Network, TrendingUp, HardDrive, Share2, ShieldAlert, Key, Database, PieChart, History
} from 'lucide-react';

interface SidebarProps {
  onViewChange: (view: string) => void;
  activeView: string;
  onLogout: () => void;
}

const THEMES = [
  { id: 'midnight', label: 'Midnight', color: '#6366f1' },
  { id: 'cyberpunk', label: 'Cyberpunk', color: '#39ff14' },
  { id: 'arctic', label: 'Arctic', color: '#0ea5e9' },
  { id: 'ember', label: 'Ember', color: '#f97316' },
  { id: 'aurora', label: 'Aurora', color: '#14b8a6' },
  { id: 'rose', label: 'Rosé', color: '#ec4899' },
];

export const Sidebar: React.FC<SidebarProps> = ({ onViewChange, activeView, onLogout }) => {
  const [theme, setTheme] = useState(localStorage.getItem('k8pilot_theme') || 'midnight');
  const [showThemes, setShowThemes] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('k8pilot_theme', theme);
  }, [theme]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'deployments', label: 'Deployments', icon: Layers },
    { id: 'pod-metrics', label: 'Pod Metrics', icon: Activity },
    { id: 'nodes', label: 'Nodes', icon: Server },
    { id: 'services', label: 'Services', icon: Globe },
    { id: 'ingresses', label: 'Ingresses', icon: Network },
    { id: 'configmaps', label: 'Config', icon: FileText },
    { id: 'pvcs', label: 'Storage', icon: HardDrive },
    { id: 'hpa', label: 'Autoscaling', icon: TrendingUp },
    { id: 'events', label: 'Events', icon: Clock },
    { id: 'logs', label: 'Log Stream', icon: Terminal },
    { id: 'metrics', label: 'Metrics', icon: Gauge },
    { id: 'registry', label: 'Registry', icon: Cloud },
    { id: 'topology', label: 'Topology Map', icon: Share2 },
    { id: 'workloads', label: 'Adv. Workloads', icon: Database },
    { id: 'history', label: 'Rollback Engine', icon: History },
    { id: 'rbac', label: 'RBAC Security', icon: Key },
    { id: 'netpols', label: 'Network Policies', icon: ShieldAlert },
    { id: 'crds', label: 'CRDs', icon: Layers },
    { id: 'profiler', label: 'Cost Profiler', icon: PieChart },
  ];

  return (
    <aside className="sidebar">
      <div className="brand" style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '10px' }}>
          <Shield size={20} color="white" />
        </div>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px' }}>k8pilot</span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' }}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', width: '100%', borderRadius: '10px', border: 'none',
              background: activeView === item.id ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              color: activeView === item.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <item.icon size={18} />
              <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.label}</span>
            </div>
            {activeView === item.id && <ChevronRight size={14} />}
          </button>
        ))}
      </nav>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* Theme Switcher */}
        <button onClick={() => setShowThemes(!showThemes)}
          style={{ width: '100%', border: 'none', background: showThemes ? 'rgba(255,255,255,0.05)' : 'transparent', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: '10px' }}>
          <Palette size={18} />
          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Theme</span>
        </button>
        {showThemes && (
          <div style={{ padding: '6px 14px', display: 'flex', gap: '8px' }}>
            {THEMES.map(t => (
              <button key={t.id} title={t.label} onClick={() => setTheme(t.id)}
                className={`theme-dot ${theme === t.id ? 'active' : ''}`}
                style={{ background: t.color, width: '22px', height: '22px', borderRadius: '50%', border: theme === t.id ? '2px solid white' : '2px solid transparent', cursor: 'pointer', boxShadow: theme === t.id ? `0 0 12px ${t.color}` : 'none', transition: 'all 0.2s' }}
              />
            ))}
          </div>
        )}

        {/* Settings */}
        <button onClick={() => onViewChange('settings')}
          style={{ width: '100%', border: 'none', background: activeView === 'settings' ? 'rgba(255,255,255,0.05)' : 'transparent', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', color: activeView === 'settings' ? 'var(--accent-blue)' : 'var(--text-secondary)', cursor: 'pointer', borderRadius: '10px' }}>
          <Settings size={18} />
          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Settings</span>
        </button>

        {/* Logout */}
        <button onClick={onLogout}
          style={{ width: '100%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', color: 'var(--error)', cursor: 'pointer', borderRadius: '10px' }}>
          <LogOut size={18} />
          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Log Out</span>
        </button>

        {/* Developer Info */}
        <div style={{ marginTop: 'auto', paddingTop: '16px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Built by <a href="https://github.com/priyesh2" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>Priyesh</a>
        </div>
      </div>
    </aside>
  );
};
