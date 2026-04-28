import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { GitCompare, AlertTriangle, CheckCircle, FileText, Search, RefreshCw, ChevronDown, ChevronUp, Copy, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DriftResult {
  resourceType: string;
  name: string;
  namespaces: string[];
  driftCount: number;
  totalKeys: number;
  matchingKeys: number;
  diffs: { key: string; values: { namespace: string; value: string }[] }[];
}

export const ConfigDriftView: React.FC = () => {
  const [drifts, setDrifts] = useState<DriftResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDrift();
  }, []);

  const fetchDrift = async () => {
    setLoading(true);
    try {
      const data = await K8sService.getConfigDrift();
      setDrifts(data);
    } catch (e) {
      console.error('Drift fetch failed:', e);
    }
    setLoading(false);
  };

  const getDriftSeverity = (d: DriftResult) => {
    const pct = d.totalKeys > 0 ? (d.matchingKeys / d.totalKeys) * 100 : 100;
    if (pct >= 90) return { label: 'Minor', color: 'var(--warning)' };
    if (pct >= 50) return { label: 'Significant', color: '#f97316' };
    return { label: 'Major', color: 'var(--error)' };
  };

  const filtered = drifts.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.namespaces.some(ns => ns.toLowerCase().includes(q));
  });

  const totalDrifts = drifts.reduce((s, d) => s + d.driftCount, 0);
  const majorDrifts = drifts.filter(d => getDriftSeverity(d).label === 'Major').length;

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '12px' }}>
              <GitCompare size={24} color="white" />
            </div>
            Config Drift Detector
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Cross-namespace ConfigMap and Secret comparison — identify configuration inconsistencies</p>
        </div>
        <button onClick={fetchDrift} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} /> Re-Scan
        </button>
      </header>

      {/* Stats */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Resources Compared', value: drifts.length, color: 'var(--accent-blue)', icon: <FileText size={20} /> },
            { label: 'Total Drifts', value: totalDrifts, color: 'var(--warning)', icon: <GitCompare size={20} /> },
            { label: 'Major Drifts', value: majorDrifts, color: 'var(--error)', icon: <AlertTriangle size={20} /> },
            { label: 'Consistent', value: drifts.filter(d => d.driftCount === 0).length, color: 'var(--success)', icon: <CheckCircle size={20} /> },
          ].map((s, i) => (
            <motion.div key={i} className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{s.value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '24px', position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input placeholder="Search resources or namespaces..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 16px 12px 40px', background: 'rgba(255,255,255,0.04)', border: 'var(--border-glass)', borderRadius: '12px', color: 'var(--text-primary)', fontFamily: 'var(--font-main)', outline: 'none' }} />
      </div>

      {/* Drift List */}
      {loading ? <div className="skeleton" style={{ height: '500px' }} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>
              <CheckCircle size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>No drifts detected</div>
              <div style={{ fontSize: '0.85rem', marginTop: '8px' }}>All shared configurations are consistent across namespaces</div>
            </div>
          ) : (
            <AnimatePresence>
              {filtered.map((d, i) => {
                const sev = getDriftSeverity(d);
                const isExpanded = expandedRow === d.name;
                return (
                  <motion.div key={d.name} className="glass-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ padding: 0, overflow: 'hidden', borderLeft: d.driftCount > 0 ? `3px solid ${sev.color}` : '3px solid var(--success)', cursor: 'pointer' }}
                    onClick={() => setExpandedRow(isExpanded ? null : d.name)}>
                    <div style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ padding: '10px', borderRadius: '12px', background: d.driftCount > 0 ? `${sev.color}12` : 'rgba(16,185,129,0.08)', color: d.driftCount > 0 ? sev.color : 'var(--success)' }}>
                            {d.driftCount > 0 ? <GitCompare size={20} /> : <CheckCircle size={20} />}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 700, fontSize: '1rem' }}>{d.name}</span>
                              <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700, background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)' }}>{d.resourceType}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                              {d.namespaces.map(ns => <span key={ns} className="ns-badge">{ns}</span>)}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{d.matchingKeys}/{d.totalKeys} keys match</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{d.driftCount} diff(s)</div>
                          </div>
                          {d.driftCount > 0 && (
                            <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, background: `${sev.color}15`, color: sev.color }}>{sev.label}</span>
                          )}
                          {isExpanded ? <ChevronUp size={16} color="var(--text-secondary)" /> : <ChevronDown size={16} color="var(--text-secondary)" />}
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && d.diffs.length > 0 && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                          style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '20px 24px', background: 'rgba(255,255,255,0.01)' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '14px' }}>Key Differences</div>
                          {d.diffs.slice(0, 10).map((diff, j) => (
                            <div key={j} style={{ marginBottom: '12px', padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                              <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '8px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{diff.key}</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {diff.values.map((v, k) => (
                                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem' }}>
                                    <span className="ns-badge" style={{ minWidth: '80px' }}>{v.namespace}</span>
                                    <ArrowRight size={12} color="var(--text-secondary)" />
                                    <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-primary)', background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: '6px', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {v.value.length > 80 ? v.value.slice(0, 77) + '...' : v.value}
                                    </code>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
};
