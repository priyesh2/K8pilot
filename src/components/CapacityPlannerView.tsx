import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Server, Cpu, HardDrive, TrendingUp, AlertTriangle, CheckCircle, BarChart3, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export const CapacityPlannerView: React.FC = () => {
  const [capacity, setCapacity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCapacity();
  }, []);

  const fetchCapacity = async () => {
    setLoading(true);
    try {
      const data = await K8sService.getCapacityPlan();
      setCapacity(data);
    } catch (e) {
      console.error('Capacity fetch failed:', e);
    }
    setLoading(false);
  };

  const formatMemory = (mi: number) => {
    if (mi >= 1024) return `${(mi / 1024).toFixed(1)} Gi`;
    return `${Math.round(mi)} Mi`;
  };

  const getUtilColor = (pct: number) => {
    if (pct >= 85) return 'var(--error)';
    if (pct >= 65) return 'var(--warning)';
    return 'var(--success)';
  };

  const getGradeColor = (grade: string) => {
    if (grade === 'A+' || grade === 'A') return 'var(--success)';
    if (grade === 'B') return 'var(--accent-blue)';
    if (grade === 'C') return 'var(--warning)';
    return 'var(--error)';
  };

  if (loading) return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '12px' }}>
            <BarChart3 size={24} color="white" />
          </div>
          Capacity Planner
        </h1>
      </header>
      <div className="skeleton" style={{ height: '600px' }} />
    </div>
  );

  if (!capacity) return null;

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '12px' }}>
            <BarChart3 size={24} color="white" />
          </div>
          Capacity Planner
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Cluster resource capacity analysis, forecasting, and optimization recommendations</p>
      </header>

      {/* Top Row: Cluster Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Nodes', value: capacity.nodes, icon: <Server size={22} />, color: 'var(--accent-blue)' },
          { label: 'Total Pods', value: capacity.pods, icon: <Zap size={22} />, color: 'var(--accent-purple)' },
          { label: 'CPU Capacity', value: `${capacity.capacity.cpu} cores`, icon: <Cpu size={22} />, color: 'var(--accent-cyan)' },
          { label: 'Memory Capacity', value: formatMemory(capacity.capacity.memoryMi), icon: <HardDrive size={22} />, color: 'var(--success)' },
        ].map((item, i) => (
          <motion.div key={i} className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{item.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{item.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CPU & Memory Gauges */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* CPU Gauge */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cpu size={20} color="var(--accent-cyan)" />
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>CPU Utilization</h3>
            </div>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: getUtilColor(capacity.utilization.cpuPercent) }}>
              {capacity.utilization.cpuPercent}%
            </span>
          </div>
          
          {/* Gauge Bar */}
          <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(capacity.utilization.cpuPercent, 100)}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{ height: '100%', background: `linear-gradient(90deg, var(--success), ${getUtilColor(capacity.utilization.cpuPercent)})`, borderRadius: '6px' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Requested</div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{capacity.requests.cpu}</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Limits</div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{capacity.limits.cpu}</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Capacity</div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{capacity.capacity.cpu}</div>
            </div>
          </div>
        </motion.div>

        {/* Memory Gauge */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HardDrive size={20} color="var(--accent-purple)" />
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Memory Utilization</h3>
            </div>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: getUtilColor(capacity.utilization.memPercent) }}>
              {capacity.utilization.memPercent}%
            </span>
          </div>

          <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(capacity.utilization.memPercent, 100)}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{ height: '100%', background: `linear-gradient(90deg, var(--success), ${getUtilColor(capacity.utilization.memPercent)})`, borderRadius: '6px' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Requested</div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{formatMemory(capacity.requests.memoryMi)}</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Limits</div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{formatMemory(capacity.limits.memoryMi)}</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Capacity</div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{formatMemory(capacity.capacity.memoryMi)}</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Forecast & Recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Forecast */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <TrendingUp size={20} color="var(--accent-blue)" />
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Capacity Forecast</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {capacity.forecast?.map((f: any, i: number) => (
              <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{f.label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{f.description}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {f.status === 'ok' ? <CheckCircle size={16} color="var(--success)" /> : <AlertTriangle size={16} color="var(--warning)" />}
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: f.status === 'ok' ? 'var(--success)' : 'var(--warning)' }}>{f.value}</span>
                </div>
              </div>
            )) || (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>No forecast data available</div>
            )}
          </div>
        </motion.div>

        {/* Recommendations */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <Zap size={20} color="var(--accent-purple)" />
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Optimization Insights</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {capacity.recommendations?.map((r: any, i: number) => (
              <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', borderLeft: `3px solid ${r.severity === 'warning' ? 'var(--warning)' : r.severity === 'critical' ? 'var(--error)' : 'var(--accent-blue)'}` }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '4px' }}>{r.title}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{r.detail}</div>
              </div>
            )) || (
              <div style={{ padding: '16px', background: 'rgba(16,185,129,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid rgba(16,185,129,0.1)' }}>
                <CheckCircle size={18} color="var(--success)" />
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>Cluster capacity looks healthy. No immediate action needed.</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
