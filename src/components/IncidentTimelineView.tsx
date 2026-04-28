import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Clock, AlertTriangle, CheckCircle, XCircle, Info, Filter, RefreshCw, Flame, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Incident {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  namespace: string;
  affectedResources: string[];
  eventCount: number;
  firstSeen: string;
  lastSeen: string;
  message: string;
  status: 'active' | 'resolved';
}

export const IncidentTimelineView: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'critical' | 'warning' | 'info'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchIncidents = async () => {
    try {
      const data = await K8sService.getIncidents();
      setIncidents(data);
    } catch (e) {
      console.error('Incidents failed:', e);
    }
    setLoading(false);
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'var(--error)';
      case 'warning': return 'var(--warning)';
      default: return 'var(--accent-blue)';
    }
  };

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case 'critical': return <XCircle size={18} />;
      case 'warning': return <AlertTriangle size={18} />;
      default: return <Info size={18} />;
    }
  };

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      const now = Date.now();
      const diff = now - d.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return `${Math.floor(hrs / 24)}d ago`;
    } catch { return ts; }
  };

  const filtered = incidents.filter(i => filter === 'ALL' || i.severity === filter);

  const criticalCount = incidents.filter(i => i.severity === 'critical').length;
  const warningCount = incidents.filter(i => i.severity === 'warning').length;
  const activeCount = incidents.filter(i => i.status === 'active').length;

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '12px' }}>
              <Flame size={24} color="white" />
            </div>
            Incident Timeline
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Correlated cluster events grouped into actionable incidents</p>
        </div>
        <button onClick={fetchIncidents} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      {/* Stats */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Incidents', value: incidents.length, color: 'var(--accent-blue)', icon: <Flame size={20} /> },
            { label: 'Active', value: activeCount, color: 'var(--accent-cyan)', icon: <Clock size={20} /> },
            { label: 'Critical', value: criticalCount, color: 'var(--error)', icon: <XCircle size={20} /> },
            { label: 'Warnings', value: warningCount, color: 'var(--warning)', icon: <AlertTriangle size={20} /> },
          ].map((s, i) => (
            <motion.div key={i} className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{s.value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '12px', gap: '4px' }}>
          {(['ALL', 'critical', 'warning', 'info'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: filter === f ? 'rgba(59,130,246,0.12)' : 'transparent', color: filter === f ? 'var(--accent-blue)' : 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>
              {f === 'ALL' ? 'All' : f}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Auto-refreshing every 15s
        </div>
      </div>

      {/* Timeline */}
      {loading ? <div className="skeleton" style={{ height: '500px' }} /> : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ maxHeight: 'calc(100vh - 420px)', overflowY: 'auto', padding: '24px' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>
                <CheckCircle size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>No incidents detected</div>
                <div style={{ fontSize: '0.85rem', marginTop: '8px' }}>Your cluster is running smoothly!</div>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                {/* Timeline line */}
                <div style={{ position: 'absolute', left: '23px', top: '30px', bottom: '30px', width: '2px', background: 'rgba(255,255,255,0.06)' }} />

                <AnimatePresence>
                  {filtered.map((incident, i) => (
                    <motion.div key={incident.id}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ display: 'flex', gap: '20px', marginBottom: '20px', position: 'relative', cursor: 'pointer' }}
                      onClick={() => setExpandedId(expandedId === incident.id ? null : incident.id)}>
                      
                      {/* Timeline node */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                        <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: `${getSeverityColor(incident.severity)}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: getSeverityColor(incident.severity), border: `1px solid ${getSeverityColor(incident.severity)}30`, flexShrink: 0 }}>
                          {getSeverityIcon(incident.severity)}
                        </div>
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, padding: '16px 20px', background: expandedId === incident.id ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)', borderRadius: '14px', border: 'var(--border-glass)', transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: 800, fontSize: '1rem' }}>{incident.title}</span>
                            <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800, background: `${getSeverityColor(incident.severity)}15`, color: getSeverityColor(incident.severity), textTransform: 'uppercase' }}>
                              {incident.severity}
                            </span>
                            {incident.status === 'active' && (
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--error)', animation: 'pulse 1.5s infinite' }} />
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <Clock size={12} /> {formatTime(incident.lastSeen)}
                          </div>
                        </div>

                        <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                          {incident.message}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span className="ns-badge">{incident.namespace}</span>
                          <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(255,255,255,0.04)' }}>
                            {incident.eventCount} events
                          </span>
                          <ChevronRight size={14} color="var(--text-secondary)" style={{ marginLeft: 'auto', transform: expandedId === incident.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                        </div>

                        {/* Expanded detail */}
                        <AnimatePresence>
                          {expandedId === incident.id && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px' }}>Affected Resources</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {incident.affectedResources.map((r, j) => (
                                    <span key={j} style={{ padding: '4px 10px', background: 'rgba(59,130,246,0.08)', color: 'var(--accent-blue)', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{r}</span>
                                  ))}
                                </div>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>First Seen</div>
                                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{formatTime(incident.firstSeen)}</div>
                                </div>
                                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Last Seen</div>
                                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{formatTime(incident.lastSeen)}</div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
