import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { K8sService } from '../services/k8s';
import { Zap, Activity, Filter, Info, Search } from 'lucide-react';

export const PulseView: React.FC = () => {
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [namespace, setNamespace] = useState('all');
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [viewType, setViewType] = useState<'cpu' | 'mem'>('cpu');

  useEffect(() => {
    K8sService.getNamespaces().then(setNamespaces).catch(() => {});
    const load = async () => {
      setLoading(true);
      const data = await K8sService.getMetricHeatmap();
      setHeatmap(data);
      setLoading(false);
    };
    load();
    const interval = setInterval(async () => {
      const data = await K8sService.getMetricHeatmap();
      setHeatmap(data);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredHeatmap = heatmap.filter(h => 
    (namespace === 'all' || h.namespace === namespace) &&
    (h.name.toLowerCase().includes(filter.toLowerCase()))
  );

  const getIntensityColor = (value: number, type: 'cpu' | 'mem') => {
    // Arbitrary scaling for visualization
    const threshold = type === 'cpu' ? 500 : 1024; // 500m or 1Gi
    const ratio = Math.min(value / threshold, 1);
    
    if (ratio < 0.1) return 'rgba(34, 197, 94, 0.2)'; // Green
    if (ratio < 0.4) return 'rgba(34, 197, 94, 0.4)';
    if (ratio < 0.7) return 'rgba(245, 158, 11, 0.5)'; // Yellow
    return 'rgba(239, 68, 68, 0.6)'; // Red
  };

  const getStatusBorder = (status: string) => {
    if (status === 'Running' || status === 'Succeeded') return 'rgba(255,255,255,0.05)';
    return 'rgba(239, 68, 68, 0.4)';
  };

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            Cluster Pulse <Activity className="pulse" color="var(--accent-cyan)" />
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Real-time resource intensity heatmap across all workloads</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px' }}>
            <Search size={16} color="var(--text-secondary)" />
            <input 
              type="text" placeholder="Filter pods..." value={filter} onChange={e => setFilter(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '150px' }}
            />
          </div>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px' }}>
            <Filter size={18} color="var(--accent-purple)" />
            <select value={namespace} onChange={e => setNamespace(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
              <option value="all">All Namespaces</option>
              {namespaces.map(ns => <option key={ns} value={ns}>{ns}</option>)}
            </select>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        <button onClick={() => setViewType('cpu')} 
          style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600,
            background: viewType === 'cpu' ? 'var(--accent-purple)' : 'rgba(255,255,255,0.05)', color: 'white' }}>
          CPU Intensity
        </button>
        <button onClick={() => setViewType('mem')}
          style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600,
            background: viewType === 'mem' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)', color: 'white' }}>
          Memory Intensity
        </button>
      </div>

      {loading && heatmap.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>
          <Zap size={48} className="pulse" style={{ marginBottom: '24px' }} />
          <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Syncing pulse data...</div>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(24px, 1fr))', 
          gap: '8px',
          background: 'rgba(0,0,0,0.2)',
          padding: '24px',
          borderRadius: '16px',
          border: 'var(--border-glass)'
        }}>
          <AnimatePresence>
            {filteredHeatmap.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                layout
                title={`${p.name} (${p.namespace})\nStatus: ${p.status}\nCPU: ${p.cpu}m\nMem: ${p.memMi}Mi`}
                style={{
                  aspectRatio: '1/1',
                  borderRadius: '4px',
                  background: getIntensityColor(viewType === 'cpu' ? parseFloat(p.cpu) : parseInt(p.memMi), viewType),
                  border: `1px solid ${getStatusBorder(p.status)}`,
                  cursor: 'help',
                  position: 'relative'
                }}
              >
                {parseFloat(p.cpu) > 400 && viewType === 'cpu' && (
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }} 
                    transition={{ repeat: Infinity, duration: 1 }}
                    style={{ position: 'absolute', inset: 0, background: 'rgba(239, 68, 68, 0.4)', borderRadius: '4px' }}
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Legend */}
      <div style={{ marginTop: '32px', display: 'flex', gap: '32px', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', background: 'rgba(34, 197, 94, 0.2)', borderRadius: '2px' }} /> Idle
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', background: 'rgba(245, 158, 11, 0.5)', borderRadius: '2px' }} /> Active
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', background: 'rgba(239, 68, 68, 0.6)', borderRadius: '2px' }} /> High Intensity
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '2px' }} /> Failing/Pending
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={14} /> Hover over blocks for details
        </div>
      </div>
    </div>
  );
};
