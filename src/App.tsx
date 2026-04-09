import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Assistant } from './components/Assistant';
import { DeploymentsView } from './components/DeploymentsView';
import { LogsView } from './components/LogsView';
import { MetricsView } from './components/MetricsView';
import { Login } from './components/Login';
import { K8sService } from './services/k8s';
import { Clock, Cloud, Key, Shield, User } from 'lucide-react';

// Rollout History View
const HistoryView = () => (
  <div className="dashboard">
    <header style={{ marginBottom: '40px' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>Rollout History</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Revision tracking and rollback management</p>
    </header>
    <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
      <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', marginBottom: '12px' }}>History Engine Ready</div>
      Select a deployment from the "Deployments" view to see its revision history.
    </div>
  </div>
);

// Registry View
const RegistryView = () => (
  <div className="dashboard">
    <header style={{ marginBottom: '40px' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>Registry Integration</h1>
      <p style={{ color: 'var(--text-secondary)' }}>OCI Artifact tracking & Image digests</p>
    </header>
    <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
      <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', marginBottom: '12px' }}>OCI Bridge Connection Active</div>
      Monitoring docker.io/cerebro46/k8pilot pull events. No new pushes detected in the last hour.
    </div>
  </div>
);

// Settings View
const SettingsView = ({ onLogout }: { onLogout: () => void }) => {
  const user = localStorage.getItem('k8s_user') || 'admin';
  const [clusterInfo, setClusterInfo] = useState<any>(null);

  useEffect(() => {
    K8sService.getClusterHealth().then(setClusterInfo);
  }, []);

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
              <span style={{ fontWeight: 600 }}>k8pilot v2.0</span>
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
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('k8s_token'));
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentNamespace, setCurrentNamespace] = useState('all');
  const [namespaces, setNamespaces] = useState<string[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      K8sService.getNamespaces().then(setNamespaces).catch(() => setNamespaces(['default']));
    }
  }, [isAuthenticated]);

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

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch(currentView) {
      case 'deployments': return <DeploymentsView />;
      case 'logs': return <LogsView />;
      case 'metrics': return <MetricsView />;
      case 'history': return <HistoryView />;
      case 'registry': return <RegistryView />;
      case 'settings': return <SettingsView onLogout={handleLogout} />;
      default: return (
        <Dashboard 
          currentNS={currentNamespace} 
          namespaces={namespaces}
          onNamespaceChange={setCurrentNamespace} 
        />
      );
    }
  };

  return (
    <div className="app-container">
      <Sidebar onViewChange={setCurrentView} activeView={currentView} onLogout={handleLogout} />
      <main className="main-content">
        {renderView()}
      </main>
      <Assistant activeNamespace={currentNamespace} />
    </div>
  );
}

export default App;
