import React, { useState, useEffect, useMemo } from 'react';
import { K8sService } from '../services/k8s';
import { Layers, CheckCircle2, AlertCircle, RefreshCw, Box, ChevronRight, Filter, List, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuraApp } from '../types';

export const AuraHubView: React.FC<{ 
  currentNS: string; 
  onAppClick: (name: string, ns: string) => void;
  onTerminal?: (pod: string, ns: string) => void;
  onLogs?: (pod: string, ns: string) => void;
}> = ({ currentNS, onAppClick, onTerminal, onLogs }) => {
  const [apps, setApps] = useState<AuraApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const [deployments, pods] = await Promise.all([
        K8sService.getDeployments(currentNS),
        K8sService.getPods(currentNS)
      ]);

      const appData = deployments.map(d => {
        const appPods = pods.filter(p => (p as any).name.startsWith(d.name));
        const healthy = d.status === 'Healthy';
        const synced = appPods.length === d.replicas && appPods.every(p => p.status === 'Running');
        
        return {
          name: d.name,
          namespace: d.namespace,
          status: (healthy ? 'Healthy' : 'Degraded') as 'Healthy' | 'Degraded',
          syncStatus: (synced ? 'Synced' : 'Out of Sync') as 'Synced' | 'Out of Sync',
          replicas: d.replicas,
          readyReplicas: appPods.filter(p => p.status === 'Running').length,
          image: d.images[0] || 'unknown',
          age: d.age,
          firstPod: appPods[0]?.name
        };
      });

      setApps(appData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
    const interval = setInterval(fetchApps, 10000);
    return () => clearInterval(interval);
  }, [currentNS]);

  const groupedApps = useMemo(() => {
    const groups: { [ns: string]: any[] } = {};
    apps.forEach(app => {
      if (!groups[app.namespace]) groups[app.namespace] = [];
      groups[app.namespace].push(app);
    });
    return groups;
  }, [apps]);

  const handleSync = async (name: string, ns: string) => {
    setSyncing(`${ns}/${name}`);
    await K8sService.restartDeployment(ns, name);
    setTimeout(() => {
      setSyncing(null);
      fetchApps();
    }, 2000);
  };

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '12px' }}>
              <Layers size={28} color="white" />
            </div>
            Applications
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>GitOps state management and real-time health synchronization</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
           <button onClick={fetchApps} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={18} className={loading ? 'spin' : ''} /> Refresh All
           </button>
        </div>
      </header>

      {loading && apps.length === 0 ? (
        <div className="skeleton" style={{ height: '400px' }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {Object.entries(groupedApps).map(([ns, nsApps]) => (
            <section key={ns}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                 <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Filter size={14} /> {ns}
                 </div>
                 <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                 <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{nsApps.length} Apps</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                {nsApps.map(app => (
                  <motion.div 
                    layout key={app.name} 
                    className="glass-card" 
                    style={{ 
                      padding: '0', overflow: 'hidden', cursor: 'pointer',
                      borderLeft: `4px solid ${app.status === 'Healthy' ? 'var(--success)' : 'var(--error)'}`
                    }}
                    onClick={() => onAppClick(app.name, app.namespace)}
                  >
                    <div style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>{app.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{app.namespace}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div style={{ 
                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800,
                            background: app.status === 'Healthy' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            color: app.status === 'Healthy' ? 'var(--success)' : 'var(--error)',
                            display: 'flex', alignItems: 'center', gap: '4px'
                          }}>
                            {app.status === 'Healthy' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                            {app.status}
                          </div>
                          {app.firstPod && (
                            <>
                              <button 
                                onClick={(e) => { e.stopPropagation(); onLogs && onLogs(app.firstPod!, app.namespace); }}
                                style={{ background: 'rgba(59,130,246,0.1)', border: 'none', color: 'var(--accent-blue)', padding: '4px 8px', borderRadius: '8px', cursor: 'pointer' }}
                                title="Stream Logs"
                              >
                                <List size={14} />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); onTerminal && onTerminal(app.firstPod!, app.namespace); }}
                                style={{ background: 'rgba(168,85,247,0.1)', border: 'none', color: 'var(--accent-purple)', padding: '4px 8px', borderRadius: '8px', cursor: 'pointer' }}
                                title="Interactive Terminal"
                              >
                                <Terminal size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: app.syncStatus === 'Synced' ? 'var(--accent-blue)' : 'var(--warning)', fontSize: '0.85rem', fontWeight: 600 }}>
                            <RefreshCw size={14} className={syncing === `${app.namespace}/${app.name}` ? 'spin' : ''} />
                            {app.syncStatus}
                         </div>
                         <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Image</span>
                            <span style={{ fontWeight: 600, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.image}</span>
                         </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Availability</span>
                            <span style={{ fontWeight: 600 }}>{app.readyReplicas} / {app.replicas} Replicas</span>
                         </div>
                      </div>
                    </div>

                    <div style={{ 
                      padding: '12px 24px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                       <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Created {app.age}</span>
                       <button 
                         onClick={(e) => { e.stopPropagation(); handleSync(app.name, app.namespace); }}
                         disabled={syncing === `${app.namespace}/${app.name}`}
                         style={{ 
                           background: app.syncStatus === 'Synced' ? 'rgba(255,255,255,0.05)' : 'var(--accent-blue)',
                           border: 'none', padding: '6px 14px', borderRadius: '8px', color: 'white',
                           fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                         }}
                       >
                         {syncing === `${app.namespace}/${app.name}` ? 'Syncing...' : app.syncStatus === 'Synced' ? 'Refresh' : 'Sync Now'}
                       </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {apps.length === 0 && !loading && (
        <div className="glass-card" style={{ padding: '80px', textAlign: 'center' }}>
           <Layers size={48} color="var(--text-secondary)" style={{ opacity: 0.2, marginBottom: '24px' }} />
           <h3>No Applications Detected</h3>
           <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Make sure your deployments have valid health probes and configurations.</p>
        </div>
      )}
    </div>
  );
};
