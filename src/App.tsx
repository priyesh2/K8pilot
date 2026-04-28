import React, { useState, useEffect, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';

// === Core components (always loaded — visible on every page) ===
import { Sidebar } from './components/Sidebar';
import { Assistant } from './components/Assistant';
import { OmniSearch } from './components/OmniSearch';
import { Login } from './components/Login';
import { PodDetailModal } from './components/PodDetailModal';
import { TerminalModal } from './components/TerminalModal';
import { LogsModal } from './components/LogsModal';
import { K8sService } from './services/k8s';
import { Clock, Cloud, Key, Shield, User, Bell, Plus, Trash2 } from 'lucide-react';

// === Lazy-loaded views (loaded on demand when navigated to) ===
// This reduces the initial bundle from ~965kB to ~200kB.
const lazy = (importFn: () => Promise<any>, name: string): React.LazyExoticComponent<React.ComponentType<any>> =>
  React.lazy(() => importFn().then(m => ({ default: m[name] })));

const DeploymentsView = lazy(() => import('./components/DeploymentsView'), 'DeploymentsView');
const LogsView = lazy(() => import('./components/LogsView'), 'LogsView');
const MetricsView = lazy(() => import('./components/MetricsView'), 'MetricsView');
const PodMetricsView = lazy(() => import('./components/PodMetricsView'), 'PodMetricsView');
const NodesView = lazy(() => import('./components/NodesView'), 'NodesView');
const ServicesView = lazy(() => import('./components/ServicesView'), 'ServicesView');
const ConfigMapsView = lazy(() => import('./components/ConfigMapsView'), 'ConfigMapsView');
const EventsView = lazy(() => import('./components/EventsView'), 'EventsView');
const IngressesView = lazy(() => import('./components/IngressesView'), 'IngressesView');
const HPAsView = lazy(() => import('./components/HPAsView'), 'HPAsView');
const PVCsView = lazy(() => import('./components/PVCsView'), 'PVCsView');
const NetworkListenView = lazy(() => import('./components/NetworkListenView'), 'NetworkListenView');
const CleanupView = lazy(() => import('./components/CleanupView'), 'CleanupView');
const RegistryStreamView = lazy(() => import('./components/RegistryStreamView'), 'RegistryStreamView');
const WorkloadsView = lazy(() => import('./components/WorkloadsView'), 'WorkloadsView');
const HistoryView = lazy(() => import('./components/HistoryView'), 'HistoryView');
const RbacView = lazy(() => import('./components/RbacView'), 'RbacView');
const NetworkPoliciesView = lazy(() => import('./components/NetworkPoliciesView'), 'NetworkPoliciesView');
const CrdsView = lazy(() => import('./components/CrdsView'), 'CrdsView');
const NamespacesView = lazy(() => import('./components/NamespacesView'), 'NamespacesView');
const PulseView = lazy(() => import('./components/PulseView'), 'PulseView');
const QuotaView = lazy(() => import('./components/QuotaView'), 'QuotaView');
const OptimizerView = lazy(() => import('./components/OptimizerView'), 'OptimizerView');
const ComplianceView = lazy(() => import('./components/ComplianceView'), 'ComplianceView');
const TlsAuditorView = lazy(() => import('./components/TlsAuditorView'), 'TlsAuditorView');
const IntelView = lazy(() => import('./components/IntelView'), 'IntelView');
const TopologyView = lazy(() => import('./components/TopologyView'), 'TopologyView');
const NamespaceIntelligenceView = lazy(() => import('./components/NamespaceIntelligenceView'), 'NamespaceIntelligenceView');
const NodeSpreadView = lazy(() => import('./components/NodeSpreadView'), 'NodeSpreadView');
const ClusterEventsView = lazy(() => import('./components/ClusterEventsView'), 'ClusterEventsView');
const AuraHubView = lazy(() => import('./components/AuraHubView'), 'AuraHubView');
const AuraDetailView = lazy(() => import('./components/AuraDetailView'), 'AuraDetailView');
const AuraTreeView = lazy(() => import('./components/AuraTreeView'), 'AuraTreeView');
const ClusterHeatmapView = lazy(() => import('./components/ClusterHeatmapView'), 'ClusterHeatmapView');
const RbacAuditorView = lazy(() => import('./components/RbacAuditorView'), 'RbacAuditorView');
const CostProfilerView = lazy(() => import('./components/CostProfilerView'), 'CostProfilerView');
const ImageScannerView = lazy(() => import('./components/ImageScannerView'), 'ImageScannerView');
const RolloutTrackerView = lazy(() => import('./components/RolloutTrackerView'), 'RolloutTrackerView');
const CapacityPlannerView = lazy(() => import('./components/CapacityPlannerView'), 'CapacityPlannerView');
const PodHealthMatrixView = lazy(() => import('./components/PodHealthMatrixView'), 'PodHealthMatrixView');
const IncidentTimelineView = lazy(() => import('./components/IncidentTimelineView'), 'IncidentTimelineView');
const CronJobMonitorView = lazy(() => import('./components/CronJobMonitorView'), 'CronJobMonitorView');
const ConfigDriftView = lazy(() => import('./components/ConfigDriftView'), 'ConfigDriftView');
const ResourceRecommenderView = lazy(() => import('./components/ResourceRecommenderView'), 'ResourceRecommenderView');
const NetworkDiagnosticsView = lazy(() => import('./components/NetworkDiagnosticsView'), 'NetworkDiagnosticsView');
const ClusterBenchmarkView = lazy(() => import('./components/ClusterBenchmarkView'), 'ClusterBenchmarkView');

// === Suspense Fallback ===
const ViewLoader = () => (
  <div className="dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
    <div style={{ textAlign: 'center' }}>
      <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '14px', margin: '0 auto 16px' }} />
      <div className="skeleton" style={{ width: '200px', height: '14px', borderRadius: '8px', margin: '0 auto 8px' }} />
      <div className="skeleton" style={{ width: '140px', height: '10px', borderRadius: '6px', margin: '0 auto' }} />
    </div>
  </div>
);


// Settings View
const SettingsView = ({ onLogout }: { onLogout: () => void }) => {
  const user = localStorage.getItem('k8s_user') || 'admin';
  const [clusterInfo, setClusterInfo] = useState<any>(null);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [hookName, setHookName] = useState('');
  const [hookUrl, setHookUrl] = useState('');

  const fetchWebhooks = () => {
    K8sService.getWebhooks().then(setWebhooks);
  };

  useEffect(() => {
    K8sService.getClusterHealth().then(setClusterInfo);
    fetchWebhooks();
  }, []);

  const handleAddWebhook = async () => {
    if (!hookName.trim() || !hookUrl.trim()) return;
    const ok = await K8sService.addWebhook(hookName, hookUrl);
    if (ok) {
      setHookName('');
      setHookUrl('');
      fetchWebhooks();
    }
  };

  const handleRemoveWebhook = async (id: string) => {
    const ok = await K8sService.removeWebhook(id);
    if (ok) fetchWebhooks();
  };

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Platform configuration & account management</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Profile Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={28} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{user}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>● Authenticated</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Role</span>
              <span style={{ fontWeight: 600 }}>Cluster Admin</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Session</span>
              <span style={{ fontWeight: 600, color: 'var(--success)' }}>Active (24h JWT)</span>
            </div>
          </div>
          <button onClick={onLogout} style={{ marginTop: '24px', width: '100%', padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', color: 'var(--error)', fontWeight: 600, cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>

        {/* Cluster Info Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ padding: '10px', background: 'rgba(34,211,238,0.1)', borderRadius: '12px' }}>
              <Shield size={22} color="var(--accent-cyan)" />
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Cluster Connection</div>
          </div>
          {clusterInfo ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Namespaces</span>
                <span style={{ fontWeight: 600 }}>{clusterInfo.namespaces}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Pods</span>
                <span style={{ fontWeight: 600 }}>{clusterInfo.totalPods}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Deployments</span>
                <span style={{ fontWeight: 600 }}>{clusterInfo.totalDeployments}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                <span style={{ fontWeight: 600, color: clusterInfo.failing > 0 ? 'var(--error)' : 'var(--success)' }}>
                  {clusterInfo.failing > 0 ? `${clusterInfo.failing} Failing` : '✅ Healthy'}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>Loading cluster info...</div>
          )}
        </div>

        {/* Security Config */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ padding: '10px', background: 'rgba(139,92,246,0.1)', borderRadius: '12px' }}>
              <Key size={22} color="var(--accent-purple)" />
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Security</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Auth Method</span>
              <span style={{ fontWeight: 600 }}>JWT Bearer Token</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Token Expiry</span>
              <span style={{ fontWeight: 600 }}>24 hours</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>API Protection</span>
              <span style={{ fontWeight: 600, color: 'var(--success)' }}>Enforced</span>
            </div>
          </div>
        </div>

        {/* Platform Info */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ padding: '10px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px' }}>
              <Cloud size={22} color="var(--accent-blue)" />
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Platform</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Version</span>
              <span style={{ fontWeight: 600 }}>K8pilot v4.1 Nova</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>AI Features</span>
              <span style={{ fontWeight: 600 }}>14 Commands</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Image</span>
              <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>docker.io/cerebro46/k8pilot</span>
            </div>
          </div>
        </div>
      </div>

      {/* Webhook Integrations */}
      <div className="glass-card" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ padding: '10px', background: 'rgba(234,88,12,0.1)', borderRadius: '12px' }}>
            <Bell size={22} color="var(--accent-blue)" />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>Event Webhooks</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Proactively push K8s warnings to Slack or Google Chat</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <input 
            type="text" 
            placeholder="Name (e.g. Prod Slack)"
            value={hookName}
            onChange={(e) => setHookName(e.target.value)}
            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: 'var(--border-glass)', borderRadius: '10px', padding: '12px', color: 'white' }}
          />
          <input 
            type="text" 
            placeholder="Webhook URL (https://hooks.slack.com/...)"
            value={hookUrl}
            onChange={(e) => setHookUrl(e.target.value)}
            style={{ flex: 2, background: 'rgba(255,255,255,0.05)', border: 'var(--border-glass)', borderRadius: '10px', padding: '12px', color: 'white' }}
          />
          <button 
            onClick={handleAddWebhook}
            disabled={!hookName || !hookUrl}
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: (!hookName || !hookUrl) ? 0.5 : 1 }}
          >
            <Plus size={16} /> Add
          </button>
        </div>

        {webhooks.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {webhooks.map(w => (
              <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{w.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{w.url.substring(0, 50)}...</div>
                </div>
                <button 
                  onClick={() => handleRemoveWebhook(w.id)}
                  style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: 'var(--error)', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            No webhooks configured. Add one to receive cluster alert notifications.
          </div>
        )}
      </div>

    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('k8s_token'));
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentNamespace, setCurrentNamespace] = useState('all');
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [podDetail, setPodDetail] = useState<{ name: string; namespace: string } | null>(null);
  const [terminalPod, setTerminalPod] = useState<{ name: string; namespace: string; container?: string } | null>(null);
  const [logPod, setLogPod] = useState<{ name: string; namespace: string; container?: string } | null>(null);
  const [selectedAuraApp, setSelectedAuraApp] = useState<{ name: string; namespace: string } | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      K8sService.getNamespaces().then(setNamespaces).catch(() => setNamespaces(['default']));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogin = (token: string, user: string) => {
    localStorage.setItem('k8s_token', token);
    localStorage.setItem('k8s_user', user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('k8s_token');
    localStorage.removeItem('k8s_user');
    setIsAuthenticated(false);
    setCurrentView('dashboard');
  };

  const handlePodClick = (podName: string, namespace: string) => {
    setPodDetail({ name: podName, namespace });
  };

  const handleTerminalOpen = (podName: string, namespace: string, container?: string) => {
    setPodDetail(null);
    setTerminalPod({ name: podName, namespace, container });
  };

  const handleViewLogsFromModal = (podName: string, namespace: string, container?: string) => {
    setPodDetail(null);
    setLogPod({ name: podName, namespace, container });
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch(currentView) {
      case 'deployments': return <DeploymentsView />;
      case 'logs': return <LogsView />;
      case 'metrics': return <MetricsView />;
      case 'pod-metrics': return <PodMetricsView />;
      case 'nodes': return <NodesView />;
      case 'services': return <ServicesView />;
      case 'configmaps': return <ConfigMapsView />;
      case 'ingresses': return <IngressesView />;
      case 'hpa': return <HPAsView />;
      case 'pvcs': return <PVCsView />;
      case 'events': return <EventsView />;
      case 'registry': return <RegistryStreamView />;
      case 'network-listen': return <NetworkListenView />;
      case 'cleanup': return <CleanupView />;
      case 'workloads': return <WorkloadsView />;
      case 'history': return <HistoryView />;
      case 'rbac': return <RbacView />;
      case 'netpols': return <NetworkPoliciesView />;
      case 'crds': return <CrdsView />;
      case 'profiler': return <CostProfilerView />;
      case 'namespaces': return <NamespacesView />;
      case 'pulse': return <PulseView />;
      case 'quotas': return <QuotaView />;
      case 'optimizer': return <OptimizerView />;
      case 'compliance': return <ComplianceView />;
      case 'tls-audit': return <TlsAuditorView onNavigate={setCurrentView} />;
      case 'namespace-intel': return <NamespaceIntelligenceView namespace={currentNamespace} />;
      case 'node-spread': return <NodeSpreadView />;
      case 'intel': return <IntelView />;
      case 'topology': return <TopologyView />;
      case 'aura-tree': return (
        <AuraTreeView 
          onAppClick={(name: any, ns: any) => setSelectedAuraApp({ name, namespace: ns })} 
          onTerminal={(pod: any, ns: any) => handleTerminalOpen(pod, ns)}
          onLogs={(pod: any, ns: any) => setLogPod({ name: pod, namespace: ns })}
        />
      );
      case 'rbac-audit': return <RbacAuditorView />;
      case 'costs': return <CostProfilerView />;
      case 'heatmap': return <ClusterHeatmapView />;
      case 'cluster-events': return <ClusterEventsView />;
      case 'image-scanner': return <ImageScannerView />;
      case 'rollouts': return <RolloutTrackerView />;
      case 'capacity': return <CapacityPlannerView />;
      case 'pod-health': return <PodHealthMatrixView />;
      case 'incidents': return <IncidentTimelineView />;
      case 'cronjobs': return <CronJobMonitorView />;
      case 'config-drift': return <ConfigDriftView />;
      case 'resource-recommender': return <ResourceRecommenderView />;
      case 'network-diagnostics': return <NetworkDiagnosticsView />;
      case 'cluster-benchmark': return <ClusterBenchmarkView />;
      case 'settings': return <SettingsView onLogout={handleLogout} />;
      case 'aura-hub':
      default: return (
        <AuraHubView 
          currentNS={currentNamespace} 
          onAppClick={(name: any, ns: any) => {
            setSelectedAuraApp({ name, namespace: ns });
          }}
          onTerminal={(pod: any, ns: any) => handleTerminalOpen(pod, ns)}
          onLogs={(pod: any, ns: any) => setLogPod({ name: pod, namespace: ns })}
        />
      );
    }
  };

  return (
    <div className="app-container">
      <Sidebar onViewChange={setCurrentView} activeView={currentView} onLogout={handleLogout} />
      <main className="main-content">
        <Suspense fallback={<ViewLoader />}>
          {renderView()}
        </Suspense>
      </main>
      <Assistant activeNamespace={currentNamespace} />
      {showSearch && (
        <OmniSearch 
          onClose={() => setShowSearch(false)} 
          onNavigate={(view, ns) => { 
            setCurrentView(view); 
            if (ns) setCurrentNamespace(ns); 
          }}
          onPodClick={handlePodClick}
        />
      )}
      <AnimatePresence>
        {selectedAuraApp && (
          <AuraDetailView 
            appName={selectedAuraApp.name} 
            namespace={selectedAuraApp.namespace} 
            onClose={() => setSelectedAuraApp(null)}
            onTerminal={(pod: any, container: any) => handleTerminalOpen(pod, selectedAuraApp.namespace, container)}
            onLogs={(pod: any) => setLogPod({ name: pod, namespace: selectedAuraApp.namespace })}
          />
        )}
      </AnimatePresence>
      {podDetail && (
        <PodDetailModal
          podName={podDetail.name}
          namespace={podDetail.namespace}
          onClose={() => setPodDetail(null)}
          onViewLogs={handleViewLogsFromModal}
          onOpenTerminal={(container) => handleTerminalOpen(podDetail.name, podDetail.namespace, container)}
        />
      )}
      {terminalPod && (
        <TerminalModal
          podName={terminalPod.name}
          namespace={terminalPod.namespace}
          container={terminalPod.container}
          onClose={() => setTerminalPod(null)}
        />
      )}
      {logPod && (
        <LogsModal 
          podName={logPod.name}
          namespace={logPod.namespace}
          container={logPod.container}
          onClose={() => setLogPod(null)}
        />
      )}
    </div>
  );
}

export default App;
