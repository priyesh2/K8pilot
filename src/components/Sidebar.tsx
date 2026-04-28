import { useState, useEffect } from 'react';
import {
  BarChart3, Terminal, Layers, Settings, Shield,
  ChevronRight, ChevronDown, Cloud, LogOut, Gauge, Palette,
  Activity, Globe, FileText, Server, Clock, Bell, Ghost, Book, Grid, DollarSign,
  Network, TrendingUp, HardDrive, ShieldAlert, Key, Database, PieChart, History, Plus, Zap, ShieldCheck, TrendingDown, Lock, Trash2, Layout,
  Package, Flame, Heart, ScanLine, Calendar, GitCompare, Award, Wifi
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
  { id: 'nightowl', label: 'Night Owl', color: '#82aaff' },
  { id: 'everforest', label: 'Everforest', color: '#a7c080' },
  { id: 'rosepine', label: 'Rosé Pine', color: '#c4a7e7' },
  { id: 'ayu', label: 'Ayu Mirage', color: '#73d0ff' },
  { id: 'deepsea', label: 'Deep Sea', color: '#2f81f7' },
  { id: 'onedark', label: 'One Dark', color: '#61afef' },
  { id: 'palenight', label: 'Palenight', color: '#82aaff' },
  { id: 'carbon', label: 'IBM Carbon', color: '#0f62fe' },
  { id: 'monokai', label: 'Monokai Pro', color: '#ff6188' },
  { id: 'ghdark', label: 'GitHub Dark', color: '#1f6feb' },
  { id: 'purple', label: 'Shades of Purple', color: '#b362ff' },
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

// Icon map for menu items
const iconMap: Record<string, any> = {
  BarChart3, Zap, ShieldCheck, Layers, Activity, Server, Layout, Network,
  Shield, DollarSign, Grid, Heart, Flame, Package, Bell, Globe, FileText,
  HardDrive, TrendingUp, Terminal, Gauge, Cloud, Ghost, Database, History,
  TrendingDown, Lock, Key, ShieldAlert, PieChart, Calendar, GitCompare,
  Award, Wifi
};

// Categorized menu structure — collapsible groups
const menuCategories = [
  {
    label: 'Overview',
    items: [
      { id: 'aura-hub', label: 'Aura Hub', icon: 'BarChart3' },
      { id: 'pulse', label: 'Cluster Pulse', icon: 'Zap' },
      { id: 'cluster-benchmark', label: 'Cluster Benchmark', icon: 'Award' },
      { id: 'aura-tree', label: 'Aura Tree', icon: 'Layers' },
      { id: 'topology', label: 'Topology Map', icon: 'Network' },
    ]
  },
  {
    label: 'Workloads',
    items: [
      { id: 'deployments', label: 'Deployments', icon: 'Layers' },
      { id: 'pod-metrics', label: 'Pod Metrics', icon: 'Activity' },
      { id: 'rollouts', label: 'Rollout Tracker', icon: 'Layers' },
      { id: 'cronjobs', label: 'CronJob Monitor', icon: 'Calendar' },
      { id: 'workloads', label: 'Adv. Workloads', icon: 'Database' },
      { id: 'hpa', label: 'Autoscaling', icon: 'TrendingUp' },
    ]
  },
  {
    label: 'Observability',
    items: [
      { id: 'pod-health', label: 'Pod Health Matrix', icon: 'Heart' },
      { id: 'incidents', label: 'Incident Timeline', icon: 'Flame' },
      { id: 'events', label: 'Cluster Activity', icon: 'Bell' },
      { id: 'logs', label: 'Log Stream', icon: 'Terminal' },
      { id: 'metrics', label: 'Metrics', icon: 'Gauge' },
      { id: 'heatmap', label: 'Resource Heatmap', icon: 'Grid' },
      { id: 'intel', label: 'Intelligence Feed', icon: 'Zap' },
    ]
  },
  {
    label: 'Security',
    items: [
      { id: 'rbac-audit', label: 'RBAC Auditor', icon: 'Shield' },
      { id: 'compliance', label: 'Security Scorecard', icon: 'ShieldCheck' },
      { id: 'image-scanner', label: 'Image Scanner', icon: 'Package' },
      { id: 'tls-audit', label: 'TLS Auditor', icon: 'Lock' },
      { id: 'rbac', label: 'RBAC Security', icon: 'Key' },
      { id: 'netpols', label: 'Network Policies', icon: 'ShieldAlert' },
    ]
  },
  {
    label: 'Networking',
    items: [
      { id: 'services', label: 'Services', icon: 'Globe' },
      { id: 'ingresses', label: 'Ingresses', icon: 'Network' },
      { id: 'network-diagnostics', label: 'Network Diagnostics', icon: 'Wifi' },
      { id: 'network-listen', label: 'Network Listen', icon: 'Activity' },
    ]
  },
  {
    label: 'Cost & Resources',
    items: [
      { id: 'capacity', label: 'Capacity Planner', icon: 'BarChart3' },
      { id: 'resource-recommender', label: 'Resource Recommender', icon: 'TrendingDown' },
      { id: 'costs', label: 'Cloud Cost Profiler', icon: 'DollarSign' },
      { id: 'optimizer', label: 'Cost Optimizer', icon: 'TrendingDown' },
      { id: 'profiler', label: 'Cost Profiler', icon: 'PieChart' },
      { id: 'quotas', label: 'Resource Auditor', icon: 'ShieldCheck' },
    ]
  },
  {
    label: 'Infrastructure',
    items: [
      { id: 'nodes', label: 'Nodes & Clusters', icon: 'Server' },
      { id: 'node-spread', label: 'Node HA Spread', icon: 'Layout' },
      { id: 'namespaces', label: 'Namespaces', icon: 'Layers' },
      { id: 'namespace-intel', label: 'Namespace 360', icon: 'Zap' },
      { id: 'crds', label: 'CRDs', icon: 'Layers' },
    ]
  },
  {
    label: 'Config & Storage',
    items: [
      { id: 'configmaps', label: 'Config', icon: 'FileText' },
      { id: 'config-drift', label: 'Config Drift', icon: 'GitCompare' },
      { id: 'pvcs', label: 'Storage', icon: 'HardDrive' },
      { id: 'registry', label: 'Registry', icon: 'Cloud' },
    ]
  },
  {
    label: 'Operations',
    items: [
      { id: 'history', label: 'Rollback Engine', icon: 'History' },
      { id: 'cleanup', label: 'Ghost Inspector', icon: 'Ghost' },
    ]
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ onViewChange, activeView, onLogout }) => {
  const [theme, setTheme] = useState(localStorage.getItem('k8pilot_theme') || 'midnight');
  const [showThemes, setShowThemes] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    // Default: expand the category containing the active view, collapse rest
    const saved = localStorage.getItem('k8pilot_sidebar_collapsed');
    if (saved) try { return JSON.parse(saved); } catch {}
    return {};
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('k8pilot_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('k8pilot_sidebar_collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  const toggleCategory = (label: string) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
  };

  // Determine which category the active view belongs to
  const activeCat = menuCategories.find(cat => cat.items.some(item => item.id === activeView))?.label;

  return (
    <aside className="sidebar">
      <div className="brand" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '10px' }}>
          <Zap size={20} color="white" />
        </div>
        <div>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.5px', display: 'block' }}>K8pilot</span>
          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--accent-cyan)', letterSpacing: '1px', textTransform: 'uppercase' }}>Nova v4.1</span>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, overflowY: 'auto', paddingBottom: '12px' }}>
        {menuCategories.map((cat) => {
          const isCollapsed = collapsed[cat.label] && cat.label !== activeCat;
          const hasActive = cat.items.some(item => item.id === activeView);

          return (
            <div key={cat.label} style={{ marginBottom: '4px' }}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(cat.label)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '6px 14px', border: 'none', borderRadius: '8px',
                  background: 'transparent', cursor: 'pointer', marginBottom: '2px',
                  color: hasActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                }}
              >
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  {cat.label}
                </span>
                <ChevronDown
                  size={12}
                  style={{
                    transition: 'transform 0.2s',
                    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    opacity: 0.5,
                  }}
                />
              </button>

              {/* Category Items */}
              <div style={{
                overflow: 'hidden',
                maxHeight: isCollapsed ? '0px' : `${cat.items.length * 40}px`,
                transition: 'max-height 0.25s ease-in-out',
              }}>
                {cat.items.map((item) => {
                  const IconComponent = iconMap[item.icon] || Layers;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onViewChange(item.id)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 14px', width: '100%', borderRadius: '8px', border: 'none',
                        background: activeView === item.id ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                        color: activeView === item.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                        cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <IconComponent size={16} />
                        <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{item.label}</span>
                      </div>
                      {activeView === item.id && <ChevronRight size={12} />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {/* Theme Switcher */}
        <button onClick={() => setShowThemes(!showThemes)}
          style={{ width: '100%', border: 'none', background: showThemes ? 'rgba(255,255,255,0.05)' : 'transparent', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: '8px' }}>
          <Palette size={16} />
          <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>Theme</span>
        </button>
        {showThemes && (
          <div style={{ padding: '6px 14px', display: 'flex', gap: '6px', flexWrap: 'wrap', maxHeight: '160px', overflowY: 'auto' }}>
            {THEMES.map(t => (
              <button key={t.id} title={t.label} onClick={() => setTheme(t.id)}
                className={`theme-dot ${theme === t.id ? 'active' : ''}`}
                style={{ background: t.color, width: '20px', height: '20px', borderRadius: '50%', border: theme === t.id ? '2px solid white' : '2px solid transparent', cursor: 'pointer', boxShadow: theme === t.id ? `0 0 12px ${t.color}` : 'none', transition: 'all 0.2s', flexShrink: 0 }}
              />
            ))}
          </div>
        )}

        {/* Settings */}
        <button onClick={() => onViewChange('settings')}
          style={{ width: '100%', border: 'none', background: activeView === 'settings' ? 'rgba(255,255,255,0.05)' : 'transparent', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', color: activeView === 'settings' ? 'var(--accent-blue)' : 'var(--text-secondary)', cursor: 'pointer', borderRadius: '8px' }}>
          <Settings size={16} />
          <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>Settings</span>
        </button>

        {/* Logout */}
        <button onClick={onLogout}
          style={{ width: '100%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', color: 'var(--error)', cursor: 'pointer', borderRadius: '8px' }}>
          <LogOut size={16} />
          <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>Log Out</span>
        </button>

        {/* Developer Info */}
        <div style={{ marginTop: 'auto', paddingTop: '12px', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          Built by <a href="https://github.com/priyesh2" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>Priyesh</a>
        </div>
      </div>
    </aside>
  );
};
