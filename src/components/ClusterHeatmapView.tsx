import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Grid, Activity, Cpu, HardDrive, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export const ClusterHeatmapView: React.FC = () => {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    const data = await K8sService.getPodMetrics('all');
    setMetrics(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 20000);
    return () => clearInterval(interval);
  }, []);

  const parseCpu = (s: string) => {
    if (!s) return 0;
    if (s.endsWith('m')) return parseInt(s);
    if (s.endsWith('n')) return parseInt(s) / 1000000;
    return parseFloat(s) * 1000;
  };

  const getHeatColor = (cpuStr: string) => {
    const val = parseCpu(cpuStr);
    if (val > 500) return 'var(--error)';
    if (val > 200) return 'var(--warning)';
    if (val > 50) return 'var(--accent-purple)';
    return 'var(--success)';
  };

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '12px' }}>
            <Grid size={28} color="white" />
          </div>
          Resource Heatmap
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Global cluster workload density and thermal hotspots</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
         <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--success)' }} />
            <span style={{ fontSize: '0.85rem' }}>Idle (&lt; 50m)</span>
         </div>
         <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--accent-purple)' }} />
            <span style={{ fontSize: '0.85rem' }}>Nominal (50m - 200m)</span>
         </div>
         <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--error)' }} />
            <span style={{ fontSize: '0.85rem' }}>Thermal Spike (&gt; 500m)</span>
         </div>
      </div>

      {loading ? <div className="skeleton" style={{ height: '400px' }} /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(24px, 1fr))', gap: '6px' }}>
          {metrics.map((m: any, i: number) => {
             const cpu = m.containers?.[0]?.cpu || '0';
             return (
               <motion.div 
                 key={i}
                 initial={{ scale: 0 }} animate={{ scale: 1 }}
                 style={{ 
                   aspectRatio: '1/1', borderRadius: '4px', background: getHeatColor(cpu),
                   cursor: 'pointer', opacity: 0.8
                 }}
                 title={`${m.name}: ${cpu}`}
               />
             );
          })}
        </div>
      )}

      <div className="glass-card" style={{ marginTop: '40px', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Info size={24} color="var(--accent-cyan)" />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Heatmap utilizes real-time metrics-server telemetry. Hover over any block to view pod name and current usage. Gray blocks indicate pods without metrics telemetry.
        </div>
      </div>
    </div>
  );
};
