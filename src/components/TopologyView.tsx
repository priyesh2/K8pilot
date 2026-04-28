import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Network, Box, Globe, Share2, Activity, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TopologyView: React.FC = () => {
  const [topology, setTopology] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [namespace, setNamespace] = useState('all');
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    K8sService.getNamespaces().then(setNamespaces).catch(() => {});
    const load = async () => {
      setLoading(true);
      const data = await K8sService.getTopology(namespace);
      setTopology(data);
      setLoading(false);
    };
    load();
  }, [namespace]);

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '12px' }}>
              <Network size={28} color="white" />
            </div>
            Service Topology
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Relational mapping between services and workloads</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {namespace === 'all' && (
            <div style={{ fontSize: '0.75rem', color: 'var(--warning)', background: 'rgba(245,158,11,0.1)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.2)' }}>
              ⚠️ Default View (Truncated)
            </div>
          )}
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px' }}>
            <Filter size={18} color="var(--accent-purple)" />
            <select value={namespace} onChange={e => setNamespace(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
              <option value="all">Cluster Overview</option>
              {namespaces.map(ns => <option key={ns} value={ns}>{ns}</option>)}
            </select>
          </div>
        </div>
      </header>

      {loading ? <div className="skeleton" style={{ height: '400px' }} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {topology.length === 0 && (
            <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No services found in this namespace.
            </div>
          )}
          {topology.map((item, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={item.service} 
              className="glass-card" 
              style={{ 
                padding: '0', overflow: 'hidden', 
                border: hovered === item.service ? '1px solid var(--accent-blue)' : 'var(--border-glass)'
              }}
              onMouseEnter={() => setHovered(item.service)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', minHeight: '120px' }}>
                {/* Service Side */}
                <div style={{ background: 'rgba(59,130,246,0.05)', padding: '24px', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Globe size={18} color="var(--accent-blue)" />
                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{item.service}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {item.type} • {item.clusterIP}
                  </div>
                </div>

                {/* Pods Side */}
                <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-15px', top: '50%', transform: 'translateY(-50%)' }}>
                    <Share2 size={24} color="var(--accent-blue)" style={{ opacity: 0.3 }} />
                  </div>
                  
                  {item.pods.length === 0 ? (
                    <div style={{ color: 'var(--error)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={14} /> NO MATCHING ENDPOINTS (ORPHANED SERVICE)
                    </div>
                  ) : item.pods.map((pod: string) => (
                    <div key={pod} style={{ 
                      padding: '8px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' 
                    }}>
                      <Box size={14} color="var(--success)" /> {pod}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Logic for AI analysis of topology */}
      {!loading && topology.length > 0 && (
        <div className="glass-card" style={{ marginTop: '32px', padding: '24px', background: 'linear-gradient(90deg, rgba(59,130,246,0.05), transparent)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={18} color="var(--accent-cyan)" /> Topology Health Report
          </h3>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {topology.some(t => t.pods.length === 0) ? (
              <p style={{ color: 'var(--error)' }}>⚠️ **Warning:** Detected Services without endpoints. This will cause 503 errors for upstream consumers. Check Pod selectors.</p>
            ) : (
              <p>✅ All services have healthy backends mapped. Service-to-pod distribution is functioning correctly.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
