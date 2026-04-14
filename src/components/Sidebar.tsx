import { useState, useEffect } from 'react';
import {
  BarChart3, Terminal, Layers, Settings, Shield,
  ChevronRight, Cloud, LogOut, Gauge, Palette,
  Activity, Globe, FileText, Server, Clock,
  Network, TrendingUp, HardDrive, ShieldAlert, Key, Database, PieChart, History, Plus, Zap, ShieldCheck, TrendingDown, Lock, Trash2
} from 'lucide-react';

interface SidebarProps {
  onViewChange: (view: string) => void;
  activeView: string;
  onLogout: () => void;
}

const THEMES = [
  { id: 'midnight', label: 'Midnight', color: '#6366f1' },
  { id: 'arctic', label: 'Arctic', color: '#0ea5e9' },
  { id: 'catppuccin', label: 'Catppuccin', color: '#cba6f7' },
  { id: 'tokyonight', label: 'Tokyo Night', color: '#7aa2f7' },
  { id: 'everforest', label: 'Everforest', color: '#a7c080' },
  { id: 'rosepine', label: 'Rosé Pine', color: '#c4a7e7' },
  { id: 'ayu', label: 'Ayu Mirage', color: '#73d0ff' },
  { id: 'deepsea', label: 'Deep Sea', color: '#2f81f7' },
  { id: 'onedark', label: 'One Dark', color: '#61afef' },
  { id: 'palenight', label: 'Palenight', color: '#82aaff' },
  { id: 'vesper', label: 'Vesper', color: '#505050' },
  { id: 'gruvbox', label: 'Gruvbox', color: '#b16286' },
  { id: 'dracula', label: 'Dracula', color: '#bd93f9' },
  { id: 'nord', label: 'Nord', color: '#88c0d0' },
  { id: 'obsidian', label: 'Obsidian', color: '#71717a' },
  { id: 'cobalt', label: 'Cobalt', color: '#3b82f6' },
  { id: 'graphite', label: 'Graphite', color: '#9ca3af' },
  { id: 'forest', label: 'Forest', color: '#10b981' },
  { id: 'abyss', label: 'Abyss', color: '#0ea5e9' },
  { id: 'monochrome', label: 'Monochrome', color: '#ffffff' },
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
    { id: 'pulse', label: 'Cluster Pulse', icon: Zap },
    { id: 'quotas', label: 'Resource Auditor', icon: ShieldCheck },
    { id: 'deployments', label: 'Deployments', icon: Layers },
    { id: 'pod-metrics', label: 'Pod Metrics', icon: Activity },
    { id: 'intel', label: 'Intelligence Feed', icon: Zap },
    { id: 'nodes', label: 'Nodes & Clusters', icon: Server },
    { id: 'services', label: 'Services', icon: Globe },
    { id: 'ingresses', label: 'Ingresses', icon: Network },
    { id: 'configmaps', label: 'Config', icon: FileText },
    { id: 'pvcs', label: 'Storage', icon: HardDrive },
    { id: 'hpa', label: 'Autoscaling', icon: TrendingUp },
    { id: 'events', label: 'Events', icon: Clock },
    { id: 'logs', label: 'Log Stream', icon: Terminal },
    { id: 'metrics', label: 'Metrics', icon: Gauge },
    { id: 'registry', label: 'Registry', icon: Cloud },
    { id: 'network-listen', label: 'Network Listen', icon: Activity },
    { id: 'ghost-inspector', label: 'Ghost Inspector', icon: Trash2 },
    { id: 'workloads', label: 'Adv. Workloads', icon: Database },
    { id: 'history', label: 'Rollback Engine', icon: History },
    { id: 'optimizer', label: 'Cost Optimizer', icon: TrendingDown },
    { id: 'compliance', label: 'Security Scorecard', icon: ShieldCheck },
    { id: 'tls-audit', label: 'TLS Auditor', icon: Lock },
    { id: 'rbac', label: 'RBAC Security', icon: Key },
    { id: 'netpols', label: 'Network Policies', icon: ShieldAlert },
    { id: 'crds', label: 'CRDs', icon: Layers },
    { id: 'namespaces', label: 'Namespaces', icon: Layers }, // Using Layers for NS
    { id: 'profiler', label: 'Cost Profiler', icon: PieChart },
    { id: 'deploy-app', label: 'Quick Deploy', icon: Plus },
  ];

  return (
    <aside className="sidebar">
      <div className="brand" style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '10px' }}>
          <Zap size={20} color="white" />
        </div>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px' }}>K8pilot Orion</span>
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
          <div style={{ padding: '6px 14px', display: 'flex', gap: '8px', flexWrap: 'wrap', maxHeight: '200px', overflowY: 'auto' }}>
            {THEMES.map(t => (
              <button key={t.id} title={t.label} onClick={() => setTheme(t.id)}
                className={`theme-dot ${theme === t.id ? 'active' : ''}`}
                style={{ background: t.color, width: '22px', height: '22px', borderRadius: '50%', border: theme === t.id ? '2px solid white' : '2px solid transparent', cursor: 'pointer', boxShadow: theme === t.id ? `0 0 12px ${t.color}` : 'none', transition: 'all 0.2s', flexShrink: 0 }}
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
