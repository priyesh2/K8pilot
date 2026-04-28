import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CrdsView: React.FC = () => {
  const [crds, setCrds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [instances, setInstances] = useState<Record<string, any[]>>({});
  const [expanding, setExpanding] = useState<string | null>(null);

  useEffect(() => {
    K8sService.getCrds().then(data => {
      setCrds(data);
      setLoading(false);
    });
  }, []);

  const handleExpand = async (crd: any) => {
    if (expanding === crd.name) {
      setExpanding(null);
      return;
    }
    setExpanding(crd.name);
    if (!instances[crd.name]) {
      const data = await K8sService.getCrdInstances(crd.group, crd.version, crd.plural);
      setInstances((prev: Record<string, any[]>) => ({ ...prev, [crd.name]: data }));
    }
  };

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>Custom Resource Definitions (CRDs)</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Explore and browse instances of custom cluster extensions</p>
      </header>

      {loading ? <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading extensions...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
          {crds.map((c: any) => (
            <div key={c.name} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '10px', background: 'rgba(139,92,246,0.1)', borderRadius: '10px' }}>
                    <Layers size={20} color="var(--accent-purple)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', wordBreak: 'break-all' }}>{c.kind}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.name}</div>
                  </div>
                </div>
                <button onClick={() => handleExpand(c)} 
                  style={{ background: 'rgba(255,255,255,0.04)', border: 'none', color: 'var(--accent-cyan)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                  {expanding === c.name ? 'HIDE' : 'INSTANCES'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.7rem' }}>Group</span>
                  {c.group}
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.7rem' }}>Version</span>
                  {c.version}
                </div>
              </div>

              <AnimatePresence>
                {expanding === c.name && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>Active Instances</div>
                    {instances[c.name] ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {instances[c.name].length === 0 ? <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No instances found.</div> : 
                          instances[c.name].map((inst: any) => (
                            <div key={inst.metadata.uid} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontWeight: 600 }}>{inst.metadata.name}</span>
                              <span style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>{inst.metadata.namespace || 'cluster'}</span>
                            </div>
                        ))}
                      </div>
                    ) : <div className="skeleton" style={{ height: '60px' }} />}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
