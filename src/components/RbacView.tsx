import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Shield, Key, Filter, CheckCircle } from 'lucide-react';

export const RbacView: React.FC = () => {
  const [data, setData] = useState<{ roles: string[], bindings: any[] }>({ roles: [], bindings: [] });
  const [loading, setLoading] = useState(true);
  const [namespace, setNamespace] = useState('all');
  const [namespaces, setNamespaces] = useState<string[]>([]);

  useEffect(() => {
    K8sService.getNamespaces().then(setNamespaces).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchRbac = async () => {
      setLoading(true);
      const rbacData = await K8sService.getRbac(namespace);
      setData(rbacData);
      setLoading(false);
    };
    fetchRbac();
  }, [namespace]);

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>RBAC Security Explorer</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Audit Roles, ClusterRoles, and RoleBindings across your cluster</p>
        </div>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px' }}>
          <Filter size={18} color="var(--accent-cyan)" />
          <select value={namespace} onChange={e => setNamespace(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
            <option value="all">Cluster Level (ClusterRoles)</option>
            {namespaces.map(ns => <option key={ns} value={ns}>{ns} (Roles)</option>)}
          </select>
        </div>
      </header>

      {loading ? <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading RBAC configurations...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px' }}>
          
          <div className="glass-card">
            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)' }}>
              <Shield size={20} /> {namespace === 'all' ? 'ClusterRoles' : 'Roles'} ({data.roles.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '600px', overflowY: 'auto' }}>
              {data.roles.map(r => (
                <div key={r} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '0.85rem' }}>
                  {r}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card">
            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-purple)' }}>
              <Key size={20} /> RoleBindings ({data.bindings.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto' }}>
              {data.bindings.map((b, i) => (
                <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>{b.name}</div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
                    <div style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--accent-cyan)', padding: '4px 12px', borderRadius: '4px' }}>
                      <strong>Role:</strong> {b.role}
                    </div>
                  </div>
                  {b.subjects.length > 0 && (
                     <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                       <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '8px' }}>Subjects (Users/ServiceAccounts):</div>
                       <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                         {b.subjects.map((sub: any, j: number) => (
                           <div key={j} style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                             <CheckCircle size={14} color="var(--success)" /> {sub.kind}: {sub.name}
                           </div>
                         ))}
                       </div>
                     </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
