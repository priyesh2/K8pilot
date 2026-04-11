import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Network, Filter, ShieldAlert } from 'lucide-react';

export const NetworkPoliciesView: React.FC = () => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [namespace, setNamespace] = useState('all');
  const [namespaces, setNamespaces] = useState<string[]>([]);

  useEffect(() => {
    K8sService.getNamespaces().then(setNamespaces).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchPolicies = async () => {
      setLoading(true);
      const data = await K8sService.getNetworkPolicies(namespace);
      setPolicies(data);
      setLoading(false);
    };
    fetchPolicies();
  }, [namespace]);

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>Network Policies</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Zero-trust cluster firewall definitions</p>
        </div>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px' }}>
          <Filter size={18} color="var(--accent-blue)" />
          <select value={namespace} onChange={e => setNamespace(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
            <option value="all">All Namespaces</option>
            {namespaces.map(ns => <option key={ns} value={ns}>{ns}</option>)}
          </select>
        </div>
      </header>

      {loading ? <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Network Policies...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
          {policies.length === 0 ? (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', color: 'var(--warning)', gridColumn: '1 / -1' }}>
              <ShieldAlert size={48} style={{ marginBottom: '16px' }} />
              <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>No policies detected</div>
              <div style={{ color: 'var(--text-secondary)' }}>Cluster is open by default. Consider adding default-deny policies.</div>
            </div>
          ) : policies.map((p, i) => (
            <div key={i} className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px' }}>
                  <Network size={20} color="var(--accent-blue)" />
                </div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{p.namespace}</div>
                </div>
              </div>
              
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>Policy Types Enforced:</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {p.types.map((t: string) => (
                    <div key={t} style={{ background: t === 'Ingress' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: t === 'Ingress' ? 'var(--success)' : 'var(--error)', padding: '4px 12px', borderRadius: '4px', fontWeight: 600, fontSize: '0.8rem' }}>
                      {t}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Age: {p.age}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
