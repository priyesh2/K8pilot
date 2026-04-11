import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { K8sService } from '../services/k8s';
import { Filter, Network, Box, Layers, Activity } from 'lucide-react';

export const TopologyView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [namespace, setNamespace] = useState('all');
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [pods, setPods] = useState<any[]>([]);

  useEffect(() => {
    K8sService.getNamespaces().then(setNamespaces).catch(() => {});
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [svcs, deps, p] = await Promise.all([
      K8sService.getServices(namespace),
      K8sService.getDeployments(namespace),
      K8sService.getPods(namespace)
    ]);
    setServices(svcs);
    setDeployments(deps);
    setPods(p);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [namespace]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300 } }
  };

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>Interactive Topology</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Visual map of your application architecture and traffic flow</p>
        </div>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px' }}>
          <Filter size={18} color="var(--accent-purple)" />
          <select value={namespace} onChange={e => setNamespace(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
            <option value="all">All Namespaces</option>
            {namespaces.map(ns => <option key={ns} value={ns}>{ns}</option>)}
          </select>
        </div>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <Activity size={32} style={{ animation: 'pulse 1.5s infinite' }} />
          <div style={{ marginTop: '16px', fontWeight: 600 }}>Mapping cluster topology...</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* Services Layer */}
          <div className="glass-card" style={{ padding: '32px', background: 'rgba(255,255,255,0.02)' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: 'var(--accent-blue)' }}>
              <Network size={24} /> Load Balancers & Services
            </h2>
            <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              {services.length === 0 && <span style={{ color: 'var(--text-secondary)' }}>No services found.</span>}
              {services.map(s => (
                <motion.div key={s.name} variants={itemVariants} drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  style={{ padding: '16px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '16px', minWidth: '200px', cursor: 'grab' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{s.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{s.type} • {s.clusterIP}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Deployments Layer */}
          <div className="glass-card" style={{ padding: '32px', background: 'rgba(255,255,255,0.02)' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: 'var(--accent-purple)' }}>
              <Layers size={24} /> Workloads & Deployments
            </h2>
            <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              {deployments.length === 0 && <span style={{ color: 'var(--text-secondary)' }}>No deployments found.</span>}
              {deployments.map(d => (
                <motion.div key={d.name} variants={itemVariants} drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  style={{ padding: '16px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '16px', minWidth: '200px', cursor: 'grab' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{d.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Replicas: {d.replicas}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Pods Layer */}
          <div className="glass-card" style={{ padding: '32px', background: 'rgba(255,255,255,0.02)' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: 'var(--success)' }}>
              <Box size={24} /> Pods
            </h2>
            <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              {pods.length === 0 && <span style={{ color: 'var(--text-secondary)' }}>No pods found.</span>}
              {pods.slice(0, 30).map((p, i) => (
                <motion.div key={p.id || i} variants={itemVariants} drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  style={{ padding: '12px', background: p.status === 'Running' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', 
                    border: `1px solid ${p.status === 'Running' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, 
                    borderRadius: '12px', minWidth: '150px', cursor: 'grab' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>{p.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{p.status}</div>
                </motion.div>
              ))}
              {pods.length > 30 && <div style={{ alignSelf: 'center', color: 'var(--text-secondary)' }}>+ {pods.length - 30} more</div>}
            </motion.div>
          </div>

        </div>
      )}
    </div>
  );
};
