import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Layers } from 'lucide-react';

export const CrdsView: React.FC = () => {
  const [crds, setCrds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    K8sService.getCrds().then(data => {
      setCrds(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>Custom Resource Definitions (CRDs)</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Explore installed operators and custom cluster extensions</p>
      </header>

      {loading ? <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading CRDs...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {crds.map(c => (
            <div key={c.name} className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ padding: '10px', background: 'rgba(139,92,246,0.1)', borderRadius: '10px' }}>
                  <Layers size={18} color="var(--accent-purple)" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', wordBreak: 'break-all' }}>{c.name}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>Group</span>
                  {c.group}
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>Version</span>
                  {c.version}
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', gridColumn: '1 / -1' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>Scope</span>
                  {c.scope}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
