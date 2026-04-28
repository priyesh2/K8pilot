import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Cpu, HardDrive, TrendingDown, TrendingUp, DollarSign, RefreshCw, ArrowDown, ArrowUp, Minus, Filter, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Recommendation {
  pod: string;
  namespace: string;
  container: string;
  currentCpu: string;
  currentMem: string;
  suggestedCpu: string;
  suggestedMem: string;
  cpuAction: 'increase' | 'decrease' | 'ok';
  memAction: 'increase' | 'decrease' | 'ok';
  cpuSavings: number;
  memSavings: number;
  reason: string;
}

export const ResourceRecommenderView: React.FC = () => {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'OVERSIZED' | 'UNDERSIZED' | 'RIGHT'>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRecs();
  }, []);

  const fetchRecs = async () => {
    setLoading(true);
    try {
      const data = await K8sService.getResourceRecommendations();
      setRecs(data);
    } catch (e) {
      console.error('Recommendations failed:', e);
    }
    setLoading(false);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'decrease': return <ArrowDown size={14} color="var(--success)" />;
      case 'increase': return <ArrowUp size={14} color="var(--warning)" />;
      default: return <Minus size={14} color="var(--text-secondary)" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'decrease': return 'var(--success)';
      case 'increase': return 'var(--warning)';
      default: return 'var(--text-secondary)';
    }
  };

  const filtered = recs.filter(r => {
    const matchesSearch = !search || r.pod.toLowerCase().includes(search.toLowerCase()) || r.namespace.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    switch (filter) {
      case 'OVERSIZED': return r.cpuAction === 'decrease' || r.memAction === 'decrease';
      case 'UNDERSIZED': return r.cpuAction === 'increase' || r.memAction === 'increase';
      case 'RIGHT': return r.cpuAction === 'ok' && r.memAction === 'ok';
      default: return true;
    }
  });

  const totalCpuSavings = recs.reduce((s, r) => s + r.cpuSavings, 0);
  const totalMemSavings = recs.reduce((s, r) => s + r.memSavings, 0);
  const oversizedCount = recs.filter(r => r.cpuAction === 'decrease' || r.memAction === 'decrease').length;
  const undersizedCount = recs.filter(r => r.cpuAction === 'increase' || r.memAction === 'increase').length;
  const estimatedMonthlySavings = Math.round(totalCpuSavings * 15 + totalMemSavings * 3);

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '12px' }}>
              <TrendingDown size={24} color="white" />
            </div>
            Resource Recommender
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Right-size your workloads — heuristic analysis of resource requests vs actual needs</p>
        </div>
        <button onClick={fetchRecs} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} /> Re-Analyze
        </button>
      </header>

      {/* Stats */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Analyzed', value: recs.length, color: 'var(--accent-blue)', icon: <Cpu size={20} /> },
            { label: 'Oversized', value: oversizedCount, color: 'var(--success)', icon: <TrendingDown size={20} /> },
            { label: 'Undersized', value: undersizedCount, color: 'var(--warning)', icon: <TrendingUp size={20} /> },
            { label: 'Right-Sized', value: recs.length - oversizedCount - undersizedCount, color: 'var(--accent-cyan)', icon: <Minus size={20} /> },
            { label: 'Est. Savings/mo', value: `$${estimatedMonthlySavings}`, color: 'var(--success)', icon: <DollarSign size={20} /> },
          ].map((s, i) => (
            <motion.div key={i} className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ color: s.color, marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input placeholder="Search pods or namespaces..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 16px 12px 40px', background: 'rgba(255,255,255,0.04)', border: 'var(--border-glass)', borderRadius: '12px', color: 'var(--text-primary)', fontFamily: 'var(--font-main)', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '12px', gap: '4px' }}>
          {(['ALL', 'OVERSIZED', 'UNDERSIZED', 'RIGHT'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: filter === f ? 'rgba(59,130,246,0.12)' : 'transparent', color: filter === f ? 'var(--accent-blue)' : 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
              {f === 'RIGHT' ? 'RIGHT-SIZED' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? <div className="skeleton" style={{ height: '500px' }} /> : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ maxHeight: 'calc(100vh - 420px)', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontSize: '0.82rem', position: 'sticky', top: 0, background: 'var(--bg-deep)', zIndex: 1 }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600 }}>Pod / Container</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600 }}>Current CPU</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600 }}>→ Suggested</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600 }}>Current Mem</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600 }}>→ Suggested</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600 }}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <motion.tr key={i} className="table-row-hover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.5) }}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.88rem' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.pod.length > 35 ? r.pod.slice(0, 33) + '...' : r.pod}</div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center' }}>
                        <span className="ns-badge">{r.namespace}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{r.container}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{r.currentCpu || '—'}</span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        {getActionIcon(r.cpuAction)}
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: getActionColor(r.cpuAction) }}>{r.suggestedCpu || '—'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{r.currentMem || '—'}</span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        {getActionIcon(r.memAction)}
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: getActionColor(r.memAction) }}>{r.suggestedMem || '—'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '250px' }}>{r.reason}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
