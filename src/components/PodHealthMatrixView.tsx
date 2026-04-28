import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Activity, AlertTriangle, CheckCircle, Clock, Filter, RefreshCw, Skull, Heart, ThumbsUp, ThumbsDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PodHealth {
  name: string;
  namespace: string;
  status: string;
  restarts: number;
  age: string;
  healthScore: number;
  issues: string[];
  containers: string[];
}

export const PodHealthMatrixView: React.FC = () => {
  const [pods, setPods] = useState<PodHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'HEALTHY'>('ALL');
  const [nsFilter, setNsFilter] = useState('all');
  const [namespaces, setNamespaces] = useState<string[]>([]);

  useEffect(() => {
    fetchHealth();
    K8sService.getNamespaces().then(setNamespaces).catch(() => {});
  }, []);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await K8sService.getPodHealthMatrix();
      setPods(data);
    } catch (e) {
      console.error('Health matrix failed:', e);
    }
    setLoading(false);
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    if (score >= 30) return '#f97316';
    return 'var(--error)';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 90) return 'Healthy';
    if (score >= 60) return 'Warning';
    if (score >= 30) return 'Degraded';
    return 'Critical';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 90) return <Heart size={16} color="var(--success)" />;
    if (score >= 60) return <AlertTriangle size={16} color="var(--warning)" />;
    return <Skull size={16} color="var(--error)" />;
  };

  const filtered = pods.filter(p => {
    const matchesNS = nsFilter === 'all' || p.namespace === nsFilter;
    if (!matchesNS) return false;
    switch (filter) {
      case 'CRITICAL': return p.healthScore < 30;
      case 'WARNING': return p.healthScore >= 30 && p.healthScore < 90;
      case 'HEALTHY': return p.healthScore >= 90;
      default: return true;
    }
  });

  const criticalCount = pods.filter(p => p.healthScore < 30).length;
  const warningCount = pods.filter(p => p.healthScore >= 30 && p.healthScore < 90).length;
  const healthyCount = pods.filter(p => p.healthScore >= 90).length;
  const avgScore = pods.length > 0 ? Math.round(pods.reduce((s, p) => s + p.healthScore, 0) / pods.length) : 0;

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '12px' }}>
              <Activity size={24} color="white" />
            </div>
            Pod Health Matrix
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Heuristic health scoring for every pod in your cluster</p>
        </div>
        <button onClick={fetchHealth} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      {/* Stats */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Cluster Score', value: `${avgScore}%`, color: getHealthColor(avgScore), icon: <Activity size={20} /> },
            { label: 'Total Pods', value: pods.length, color: 'var(--accent-blue)', icon: <CheckCircle size={20} /> },
            { label: 'Healthy', value: healthyCount, color: 'var(--success)', icon: <ThumbsUp size={20} /> },
            { label: 'Warning', value: warningCount, color: 'var(--warning)', icon: <AlertTriangle size={20} /> },
            { label: 'Critical', value: criticalCount, color: 'var(--error)', icon: <ThumbsDown size={20} /> },
          ].map((s, i) => (
            <motion.div key={i} className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ color: s.color, marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
        <select value={nsFilter} onChange={e => setNsFilter(e.target.value)}
          style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: 'var(--border-glass)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'var(--font-main)', outline: 'none', cursor: 'pointer' }}>
          <option value="all">All Namespaces</option>
          {namespaces.map(ns => <option key={ns} value={ns}>{ns}</option>)}
        </select>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '12px', gap: '4px' }}>
          {(['ALL', 'CRITICAL', 'WARNING', 'HEALTHY'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: filter === f ? 'rgba(59,130,246,0.12)' : 'transparent', color: filter === f ? 'var(--accent-blue)' : 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
              {f}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          {filtered.length} pods shown
        </div>
      </div>

      {/* Pod Grid */}
      {loading ? <div className="skeleton" style={{ height: '500px' }} /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          <AnimatePresence>
            {filtered.sort((a, b) => a.healthScore - b.healthScore).map((pod, i) => (
              <motion.div key={`${pod.namespace}/${pod.name}`} className="glass-card"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(i * 0.02, 0.5) }}
                style={{ padding: '20px', borderTop: `3px solid ${getHealthColor(pod.healthScore)}` }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '2px' }}>{pod.name.length > 32 ? pod.name.slice(0, 30) + '...' : pod.name}</div>
                    <span className="ns-badge">{pod.namespace}</span>
                  </div>
                  {getHealthIcon(pod.healthScore)}
                </div>

                {/* Mini health bar */}
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '12px', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pod.healthScore}%` }} transition={{ duration: 0.8, delay: i * 0.02 }}
                    style={{ height: '100%', background: getHealthColor(pod.healthScore), borderRadius: '2px' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 900, color: getHealthColor(pod.healthScore) }}>{pod.healthScore}%</span>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, background: `${getHealthColor(pod.healthScore)}15`, color: getHealthColor(pod.healthScore) }}>
                    {getHealthLabel(pod.healthScore)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <span>Status: <span style={{ color: pod.status === 'Running' ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>{pod.status}</span></span>
                  <span>Restarts: <span style={{ color: pod.restarts > 5 ? 'var(--error)' : 'var(--text-primary)', fontWeight: 600 }}>{pod.restarts}</span></span>
                </div>

                {pod.issues.length > 0 && (
                  <div style={{ marginTop: '8px', padding: '8px 10px', background: 'rgba(239,68,68,0.04)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.08)' }}>
                    {pod.issues.slice(0, 2).map((issue, j) => (
                      <div key={j} style={{ fontSize: '0.72rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: j < pod.issues.length - 1 ? '4px' : 0 }}>
                        <AlertTriangle size={10} /> {issue}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
