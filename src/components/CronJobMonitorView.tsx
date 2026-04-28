import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Clock, CheckCircle, XCircle, Play, Pause, AlertTriangle, RefreshCw, Calendar, Timer, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CronJobInfo {
  name: string;
  namespace: string;
  schedule: string;
  suspended: boolean;
  active: number;
  lastSchedule: string | null;
  lastSuccessful: string | null;
  lastFailed: string | null;
  concurrencyPolicy: string;
  successfulJobs: number;
  failedJobs: number;
  recentJobs: { name: string; status: string; startTime: string; completionTime: string | null; duration: string }[];
}

export const CronJobMonitorView: React.FC = () => {
  const [cronJobs, setCronJobs] = useState<CronJobInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'FAILING'>('ALL');

  useEffect(() => {
    fetchCronJobs();
    const interval = setInterval(fetchCronJobs, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchCronJobs = async () => {
    try {
      const data = await K8sService.getCronJobsMonitor();
      setCronJobs(data);
    } catch (e) {
      console.error('CronJob fetch failed:', e);
    }
    setLoading(false);
  };

  const getStatusColor = (cj: CronJobInfo) => {
    if (cj.suspended) return 'var(--text-secondary)';
    if (cj.failedJobs > 0) return 'var(--error)';
    if (cj.active > 0) return 'var(--accent-cyan)';
    return 'var(--success)';
  };

  const getStatusLabel = (cj: CronJobInfo) => {
    if (cj.suspended) return 'Suspended';
    if (cj.failedJobs > 0 && cj.successfulJobs === 0) return 'Failing';
    if (cj.active > 0) return 'Running';
    return 'Healthy';
  };

  const formatTime = (ts: string | null) => {
    if (!ts) return 'Never';
    try {
      const d = new Date(ts);
      const diff = Date.now() - d.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return `${Math.floor(hrs / 24)}d ago`;
    } catch { return ts || 'N/A'; }
  };

  const filtered = cronJobs.filter(cj => {
    switch (filter) {
      case 'ACTIVE': return !cj.suspended && cj.active > 0;
      case 'SUSPENDED': return cj.suspended;
      case 'FAILING': return cj.failedJobs > 0;
      default: return true;
    }
  });

  const activeCount = cronJobs.filter(c => c.active > 0).length;
  const suspendedCount = cronJobs.filter(c => c.suspended).length;
  const failingCount = cronJobs.filter(c => c.failedJobs > 0).length;

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '12px' }}>
              <Calendar size={24} color="white" />
            </div>
            CronJob Monitor
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Scheduled workload monitoring with execution history and health tracking</p>
        </div>
        <button onClick={fetchCronJobs} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      {/* Stats */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total CronJobs', value: cronJobs.length, color: 'var(--accent-blue)', icon: <Calendar size={20} /> },
            { label: 'Currently Running', value: activeCount, color: 'var(--accent-cyan)', icon: <Play size={20} /> },
            { label: 'Suspended', value: suspendedCount, color: 'var(--text-secondary)', icon: <Pause size={20} /> },
            { label: 'Failing', value: failingCount, color: 'var(--error)', icon: <XCircle size={20} /> },
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

      {/* Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '12px', gap: '4px' }}>
          {(['ALL', 'ACTIVE', 'SUSPENDED', 'FAILING'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: filter === f ? 'rgba(59,130,246,0.12)' : 'transparent', color: filter === f ? 'var(--accent-blue)' : 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
              {f}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          {filtered.length} job(s) shown
        </div>
      </div>

      {/* CronJob List */}
      {loading ? <div className="skeleton" style={{ height: '500px' }} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>
              <Calendar size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>No CronJobs found</div>
            </div>
          ) : (
            <AnimatePresence>
              {filtered.map((cj, i) => {
                const key = `${cj.namespace}/${cj.name}`;
                const isExpanded = expandedRow === key;
                return (
                  <motion.div key={key} className="glass-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ padding: 0, overflow: 'hidden', borderLeft: `3px solid ${getStatusColor(cj)}`, cursor: 'pointer' }}
                    onClick={() => setExpandedRow(isExpanded ? null : key)}>
                    <div style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${getStatusColor(cj)}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: getStatusColor(cj) }}>
                            {cj.suspended ? <Pause size={18} /> : cj.active > 0 ? <Play size={18} /> : <Clock size={18} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{cj.name}</div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
                              <span className="ns-badge">{cj.namespace}</span>
                              <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{cj.schedule}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Last run</div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{formatTime(cj.lastSchedule)}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(16,185,129,0.1)', color: 'var(--success)' }}>✓ {cj.successfulJobs}</span>
                            {cj.failedJobs > 0 && <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(239,68,68,0.1)', color: 'var(--error)' }}>✗ {cj.failedJobs}</span>}
                          </div>
                          <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, background: `${getStatusColor(cj)}15`, color: getStatusColor(cj) }}>
                            {getStatusLabel(cj)}
                          </span>
                          {isExpanded ? <ChevronUp size={16} color="var(--text-secondary)" /> : <ChevronDown size={16} color="var(--text-secondary)" />}
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                          style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '20px 24px', background: 'rgba(255,255,255,0.01)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                            <InfoCell label="Concurrency" value={cj.concurrencyPolicy} />
                            <InfoCell label="Last Success" value={formatTime(cj.lastSuccessful)} />
                            <InfoCell label="Last Failure" value={formatTime(cj.lastFailed)} />
                            <InfoCell label="Active Jobs" value={String(cj.active)} />
                          </div>
                          {cj.recentJobs.length > 0 && (
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px' }}>Recent Executions</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {cj.recentJobs.slice(0, 5).map((job, j) => (
                                  <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', fontSize: '0.82rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      {job.status === 'Succeeded' ? <CheckCircle size={14} color="var(--success)" /> : job.status === 'Failed' ? <XCircle size={14} color="var(--error)" /> : <Timer size={14} color="var(--accent-cyan)" className="spin" />}
                                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{job.name.length > 40 ? job.name.slice(-35) : job.name}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                                      <span>{formatTime(job.startTime)}</span>
                                      {job.duration && <span style={{ fontWeight: 600 }}>{job.duration}</span>}
                                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700, background: job.status === 'Succeeded' ? 'rgba(16,185,129,0.1)' : job.status === 'Failed' ? 'rgba(239,68,68,0.1)' : 'rgba(34,211,238,0.1)', color: job.status === 'Succeeded' ? 'var(--success)' : job.status === 'Failed' ? 'var(--error)' : 'var(--accent-cyan)' }}>
                                        {job.status}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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

const InfoCell = ({ label, value }: { label: string; value: string }) => (
  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{value}</div>
  </div>
);
