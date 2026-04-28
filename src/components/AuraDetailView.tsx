import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { 
  X, Activity, Box, Clock, FileCode, RefreshCw, 
  Terminal, ShieldCheck, Zap, AlertTriangle, CheckCircle2,
  Trash2, ArrowLeft, Layers, ExternalLink, Search, List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pod, K8sEvent } from '../types';

interface AuraAppDetailProps {
  appName: string;
  namespace: string;
  onClose: () => void;
  onTerminal: (pod: string, container?: string) => void;
  onLogs: (pod: string) => void;
}

export const AuraDetailView: React.FC<AuraAppDetailProps> = ({ 
  appName, namespace, onClose, onTerminal, onLogs 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'pods' | 'events' | 'manifest' | 'diff'>('overview');
  const [app, setApp] = useState<any>(null);
  const [pods, setPods] = useState<Pod[]>([]);
  const [events, setEvents] = useState<K8sEvent[]>([]);
  const [manifest, setManifest] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deploy, allPods, allEvents] = await Promise.all([
        K8sService.getDeployments(namespace).then(deps => (deps as any[]).find(d => d.name === appName)),
        K8sService.getPods(namespace),
        K8sService.getEvents(namespace)
      ]);

      setApp(deploy);
      setPods((allPods as any[]).filter(p => p.name.startsWith(appName)));
      setEvents((allEvents as any[]).filter(e => e.object?.includes(appName)));
      setManifest(JSON.stringify(deploy, null, 2));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [appName, namespace]);

  const handleSync = async () => {
    await K8sService.restartDeployment(namespace, appName);
    fetchData();
  };

  if (!app && !loading) return <div>App not found</div>;

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      style={{ 
        position: 'fixed', top: 0, right: 0, width: '85%', height: '100%', 
        background: 'var(--bg-card)', borderLeft: '1px solid rgba(255,255,255,0.1)',
        zIndex: 1000, display: 'flex', flexDirection: 'column',
        boxShadow: '-40px 0 100px rgba(0,0,0,0.8)',
        backdropFilter: 'blur(20px)'
      }}
    >
      {/* Header */}
      <header style={{ padding: '32px 48px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.03)', border: 'none', color: 'white', cursor: 'pointer', padding: '12px', borderRadius: '12px' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{appName}</h1>
               <div style={{ padding: '4px 12px', background: 'rgba(56,189,248,0.1)', borderRadius: '20px', color: 'var(--accent-blue)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                  Application
               </div>
            </div>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Project: default • {namespace} • k8s.cluster.local</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={handleSync} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', fontSize: '0.95rem' }}>
            <RefreshCw size={18} /> Sync Application
          </button>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '12px', borderRadius: '12px', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '48px', padding: '0 48px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {['overview', 'pods', 'events', 'manifest', 'diff'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab as any)}
            style={{ 
              padding: '20px 0', background: 'transparent', border: 'none', 
              borderBottom: activeTab === tab ? '3px solid var(--accent-blue)' : '3px solid transparent',
              color: activeTab === tab ? 'white' : 'var(--text-secondary)',
              fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s',
              textTransform: 'uppercase', letterSpacing: '1px'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '48px' }}>
        {loading ? <div className="skeleton" style={{ height: '500px' }} /> : (
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                   <StatusCard label="Health Status" value={app?.status} icon={Activity} color={app?.status === 'Healthy' ? 'var(--success)' : 'var(--error)'} />
                   <StatusCard label="Total Replicas" value={app?.replicas} icon={Layers} color="var(--accent-blue)" />
                   <StatusCard label="Ready Replicas" value={app?.readyReplicas} icon={Box} color="var(--accent-cyan)" />
                   <StatusCard label="Sync Policy" value="Automated" icon={Zap} color="var(--accent-purple)" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
                   <div className="glass-card" style={{ padding: '32px' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                         <Clock size={22} color="var(--accent-cyan)" /> Resource Summary
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                         <KVRow label="API Version" value="apps/v1" />
                         <KVRow label="Kind" value="Deployment" />
                         <KVRow label="Created" value={app?.age} />
                         <KVRow label="Image" value={app?.images?.[0] || 'unknown'} />
                         <KVRow label="Strategy" value="RollingUpdate" />
                         <KVRow label="Selectors" value={`app=${appName}`} />
                      </div>
                   </div>

                   <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                      <div className="glass-card" style={{ padding: '32px' }}>
                         <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <RefreshCw size={22} color="var(--accent-blue)" /> Sync Policy
                         </h3>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <PolicyToggle label="Automated Pruning" active={false} />
                            <PolicyToggle label="Self Healing" active={true} />
                            <PolicyToggle label="Allow Empty" active={false} />
                         </div>
                      </div>
                      
                      <div className="glass-card" style={{ padding: '32px', background: 'var(--gradient-primary)', border: 'none' }}>
                         <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px', color: 'white' }}>Quick Diagnostic</h3>
                         <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginBottom: '20px' }}>Jump directly into a shell or log stream for this application.</p>
                         <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => pods[0] && onTerminal(pods[0].name)} className="btn-primary" style={{ background: 'white', color: 'black', flex: 1, padding: '10px' }}>Terminal</button>
                            <button onClick={() => pods[0] && onLogs(pods[0].name)} className="btn-secondary" style={{ flex: 1, padding: '10px' }}>Logs</button>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'pods' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                   <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Pods ({pods.length})</h3>
                   <div style={{ display: 'flex', gap: '12px' }}>
                      <div className="glass-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <Search size={16} color="var(--text-secondary)" />
                         <input placeholder="Filter pods..." style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '0.85rem' }} />
                      </div>
                   </div>
                </div>
                {pods.map(p => (
                  <motion.div key={p.name} layout className="glass-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: p.status === 'Running' ? 'var(--success)' : 'var(--error)', boxShadow: p.status === 'Running' ? '0 0 10px var(--success)' : '0 0 10px var(--error)' }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                           <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{p.name}</div>
                           <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              Node: <span style={{ color: 'var(--text-primary)' }}>{p.node}</span> • Restarts: <span style={{ color: 'var(--text-primary)' }}>{p.restarts}</span>
                           </div>
                        </div>
                     </div>
                     <div style={{ display: 'flex', gap: '16px' }}>
                        <button onClick={() => onLogs(p.name)} className="btn-secondary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                           <List size={14} /> Logs
                        </button>
                        <button onClick={() => onTerminal(p.name)} className="btn-primary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                           <Terminal size={14} /> Terminal
                        </button>
                     </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'events' && (
              <div className="glass-card" style={{ padding: '0' }}>
                 <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 800 }}>Resource Events</div>
                 <div style={{ display: 'flex', flexDirection: 'column' }}>
                   {events.map((e, i) => (
                     <div key={i} style={{ padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'grid', gridTemplateColumns: '120px 150px 1fr 100px', alignItems: 'center', gap: '24px' }}>
                        <div style={{ 
                           padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, textAlign: 'center',
                           background: e.type === 'Warning' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                           color: e.type === 'Warning' ? 'var(--error)' : 'var(--success)'
                        }}>{e.type}</div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{e.reason}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{e.message}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'right' }}>{e.age}</div>
                     </div>
                   ))}
                 </div>
              </div>
            )}

            {activeTab === 'manifest' && (
              <div style={{ background: '#0d1117', padding: '32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}>
                 <pre style={{ margin: 0, fontSize: '0.9rem', color: '#c9d1d9', fontFamily: 'var(--font-mono)', lineHeight: 1.7, overflowX: 'auto' }}>
                    {manifest}
                 </pre>
              </div>
            )}

            {activeTab === 'diff' && (
              <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 800 }}>Target State Drift</div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '16px 32px', background: 'rgba(239,68,68,0.05)', color: 'var(--error)', fontSize: '0.95rem', fontFamily: 'var(--font-mono)', borderBottom: '1px solid rgba(239,68,68,0.1)' }}>
                    - replicas: 2
                  </div>
                  <div style={{ padding: '16px 32px', background: 'rgba(16,185,129,0.05)', color: 'var(--success)', fontSize: '0.95rem', fontFamily: 'var(--font-mono)', borderBottom: '1px solid rgba(16,185,129,0.1)' }}>
                    + replicas: {app?.replicas}
                  </div>
                  <div style={{ padding: '48px', color: 'var(--text-secondary)', fontSize: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <AlertTriangle size={48} color="var(--warning)" style={{ opacity: 0.5 }} />
                    <div style={{ maxWidth: '600px' }}>
                       Configuration drift detected in "spec.replicas". The cluster was horizontally autoscaled but the Git source specifies 2 replicas. 
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const PolicyToggle = ({ label, active }: any) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
    <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{label}</span>
    <div style={{ 
      width: '48px', height: '24px', borderRadius: '24px', 
      background: active ? 'var(--accent-blue)' : 'rgba(255,255,255,0.1)',
      position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
    }}>
      <div style={{ 
        width: '18px', height: '18px', borderRadius: '50%', background: 'white',
        position: 'absolute', top: '3px', left: active ? '27px' : '3px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }} />
    </div>
  </div>
);

const StatusCard = ({ label, value, icon: Icon, color }: any) => (
  <div className="glass-card" style={{ padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
       <Icon size={24} color={color} />
    </div>
    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>{label}</div>
    <div style={{ fontSize: '1.6rem', fontWeight: 900, marginTop: '6px', color: 'white' }}>{value}</div>
  </div>
);

const KVRow = ({ label, value }: any) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{label}</span>
    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'white', wordBreak: 'break-all', textAlign: 'right', marginLeft: '24px' }}>{value}</span>
  </div>
);
