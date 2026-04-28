import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Loader, CheckCircle, AlertTriangle, ArrowRight, Clock, Layers, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RolloutInfo {
  name: string;
  namespace: string;
  replicas: number;
  readyReplicas: number;
  updatedReplicas: number;
  availableReplicas: number;
  status: 'Progressing' | 'Available' | 'Degraded' | 'Stalled';
  progress: number;
  strategy: string;
  images: string[];
  age: string;
  conditions: any[];
  revisions: any[];
}

export const RolloutTrackerView: React.FC = () => {
  const [rollouts, setRollouts] = useState<RolloutInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchRollouts = async () => {
    try {
      const data = await K8sService.getRollouts();
      setRollouts(data);
    } catch (e) {
      console.error('Rollout fetch failed:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRollouts();
    let interval: any;
    if (autoRefresh) {
      interval = setInterval(fetchRollouts, 5000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Available': return <CheckCircle size={18} color="var(--success)" />;
      case 'Progressing': return <Loader size={18} color="var(--accent-cyan)" className="spin" />;
      case 'Degraded': return <AlertTriangle size={18} color="var(--error)" />;
      default: return <Clock size={18} color="var(--warning)" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'var(--success)';
      case 'Progressing': return 'var(--accent-cyan)';
      case 'Degraded': return 'var(--error)';
      default: return 'var(--warning)';
    }
  };

  const getProgressColor = (progress: number, status: string) => {
    if (status === 'Degraded') return 'var(--error)';
    if (progress >= 100) return 'var(--success)';
    if (progress >= 50) return 'var(--accent-cyan)';
    return 'var(--warning)';
  };

  const progressing = rollouts.filter(r => r.status === 'Progressing').length;
  const available = rollouts.filter(r => r.status === 'Available').length;
  const degraded = rollouts.filter(r => r.status === 'Degraded').length;

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '12px' }}>
              <Layers size={24} color="white" />
            </div>
            Rollout Tracker
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Live deployment rollout status across all namespaces</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => setAutoRefresh(!autoRefresh)} style={{ padding: '8px 14px', borderRadius: '10px', border: 'var(--border-glass)', background: autoRefresh ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', color: autoRefresh ? 'var(--success)' : 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: autoRefresh ? 'var(--success)' : 'var(--text-secondary)' }} />
            {autoRefresh ? 'Live' : 'Paused'}
          </button>
          <button onClick={fetchRollouts} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </header>

      {/* Status Cards */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total', value: rollouts.length, color: 'var(--accent-blue)' },
            { label: 'Available', value: available, color: 'var(--success)' },
            { label: 'Progressing', value: progressing, color: 'var(--accent-cyan)' },
            { label: 'Degraded', value: degraded, color: 'var(--error)' },
          ].map((s, i) => (
            <motion.div key={i} className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{s.value}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7 }}>deployments</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Rollout List */}
      {loading ? <div className="skeleton" style={{ height: '500px' }} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <AnimatePresence>
            {rollouts.map((r, i) => (
              <motion.div key={`${r.namespace}/${r.name}`} className="glass-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                style={{ padding: '0', overflow: 'hidden', cursor: 'pointer', borderLeft: `3px solid ${getStatusColor(r.status)}` }}
                onClick={() => setExpandedRow(expandedRow === `${r.namespace}/${r.name}` ? null : `${r.namespace}/${r.name}`)}>
                
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {getStatusIcon(r.status)}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{r.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{r.namespace}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{r.readyReplicas}/{r.replicas}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>ready</div>
                      </div>
                      <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, background: `${getStatusColor(r.status)}15`, color: getStatusColor(r.status) }}>
                        {r.status}
                      </span>
                      {expandedRow === `${r.namespace}/${r.name}` ? <ChevronUp size={16} color="var(--text-secondary)" /> : <ChevronDown size={16} color="var(--text-secondary)" />}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${r.progress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      style={{ height: '100%', background: `linear-gradient(90deg, ${getProgressColor(r.progress, r.status)}, ${getProgressColor(r.progress, r.status)}88)`, borderRadius: '3px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    <span>{r.strategy}</span>
                    <span>{Math.round(r.progress)}% complete</span>
                  </div>
                </div>

                {/* Expanded Detail */}
                <AnimatePresence>
                  {expandedRow === `${r.namespace}/${r.name}` && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '20px 24px', background: 'rgba(255,255,255,0.01)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Updated Replicas</div>
                          <div style={{ fontWeight: 700 }}>{r.updatedReplicas}/{r.replicas}</div>
                        </div>
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Available</div>
                          <div style={{ fontWeight: 700 }}>{r.availableReplicas}/{r.replicas}</div>
                        </div>
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Age</div>
                          <div style={{ fontWeight: 700 }}>{r.age}</div>
                        </div>
                      </div>
                      
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px' }}>Images</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {r.images.map((img, j) => (
                            <span key={j} style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{img}</span>
                          ))}
                        </div>
                      </div>

                      {r.revisions.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px' }}>Revision History</div>
                          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                            {r.revisions.slice(0, 5).map((rev: any, j: number) => (
                              <div key={j} style={{ padding: '10px 14px', background: j === 0 ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)', borderRadius: '10px', minWidth: '120px', border: j === 0 ? '1px solid rgba(59,130,246,0.15)' : 'var(--border-glass)' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Rev {rev.revision}</div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, marginTop: '2px' }}>{rev.replicas} replicas</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>{rev.images?.[0]?.split(':').pop() || '?'}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
