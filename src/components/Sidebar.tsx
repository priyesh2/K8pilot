import { useState, useEffect } from 'react';
import {
  BarChart3, Terminal, History, Layers, Settings, Shield,
  ChevronRight, Cloud, LogOut, Gauge, Palette
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
    { id: 'logs', label: 'Log Stream', icon: Terminal },
    { id: 'metrics', label: 'Metrics', icon: Gauge },
    { id: 'history', label: 'History', icon: History },
    { id: 'registry', label: 'Registry', icon: Cloud },
  ];

  return (
    <aside className="sidebar">
      <div className="brand" style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '10px' }}>
          <Shield size={20} color="white" />
        </div>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px' }}>k8pilot</span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', width: '100%', borderRadius: '12px', border: 'none',
              background: activeView === item.id ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              color: activeView === item.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <item.icon size={20} />
              <span style={{ fontWeight: 600 }}>{item.label}</span>
            </div>
            {activeView === item.id && <ChevronRight size={16} />}
          </button>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Theme Switcher */}
        <button onClick={() => setShowThemes(!showThemes)}
          style={{ width: '100%', border: 'none', background: showThemes ? 'rgba(255,255,255,0.05)' : 'transparent', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: '12px' }}>
          <Palette size={20} />
          <span style={{ fontWeight: 600 }}>Theme</span>
        </button>
        {showThemes && (
          <div style={{ padding: '8px 16px', display: 'flex', gap: '8px' }}>
            {THEMES.map(t => (
              <button key={t.id} title={t.label} onClick={() => setTheme(t.id)}
                className={`theme-dot ${theme === t.id ? 'active' : ''}`}
                style={{ background: t.color, width: '24px', height: '24px', borderRadius: '50%', border: theme === t.id ? '2px solid white' : '2px solid transparent', cursor: 'pointer', boxShadow: theme === t.id ? `0 0 12px ${t.color}` : 'none', transition: 'all 0.2s' }}
              />
            ))}
          </div>
        )}

        {/* Settings */}
        <button onClick={() => onViewChange('settings')}
          style={{ width: '100%', border: 'none', background: activeView === 'settings' ? 'rgba(255,255,255,0.05)' : 'transparent', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: activeView === 'settings' ? 'var(--accent-blue)' : 'var(--text-secondary)', cursor: 'pointer', borderRadius: '12px' }}>
          <Settings size={20} />
          <span style={{ fontWeight: 600 }}>Settings</span>
        </button>

        {/* Logout */}
        <button onClick={onLogout}
          style={{ width: '100%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: 'var(--error)', cursor: 'pointer', borderRadius: '12px' }}>
          <LogOut size={20} />
          <span style={{ fontWeight: 600 }}>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
