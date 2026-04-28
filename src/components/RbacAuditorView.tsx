import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Shield, ShieldAlert, ShieldCheck, User, Users, Key, AlertTriangle, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

export const RbacAuditorView: React.FC = () => {
  const [bindings, setBindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const fetchRbac = async () => {
    setLoading(true);
    // Fetch ClusterRoleBindings and RoleBindings
    const data = await K8sService.getRbacAudit();
    setBindings(data);
    setLoading(false);
  };

  useEffect(() => { fetchRbac(); }, []);

  const filtered = bindings.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase()) || b.subject.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || (filter === 'Critical' && b.isCritical);
    return matchesSearch && matchesFilter;
  });

  const criticalCount = bindings.filter(b => b.isCritical).length;

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '12px' }}>
              <Shield size={28} color="white" />
            </div>
            RBAC Security Auditor
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Analyzing permission escalation risks and privileged service accounts</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
             <ShieldAlert color="var(--error)" size={20} />
             <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--error)' }}>{criticalCount}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>CRITICAL BINDINGS</div>
             </div>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input type="text" placeholder="Search subjects or roles..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 12px 12px 42px', borderRadius: '12px', color: 'white', outline: 'none' }} />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0 20px', borderRadius: '12px', fontWeight: 600 }}>
          <option value="All">All Subjects</option>
          <option value="Critical">Privileged Only</option>
        </select>
      </div>

      {loading ? <div className="skeleton" style={{ height: '400px' }} /> : (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SUBJECT</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TYPE</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ROLE / BINDING</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>RISK LEVEL</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: b.isCritical ? 'rgba(239,68,68,0.02)' : 'transparent' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {b.kind === 'ServiceAccount' ? <Users size={18} color="var(--accent-blue)" /> : <User size={18} color="var(--accent-purple)" />}
                      <div>
                        <div style={{ fontWeight: 700 }}>{b.subject}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Namespace: {b.namespace || 'Cluster-wide'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '0.85rem' }}>{b.kind}</td>
                  <td style={{ padding: '16px 24px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: b.isCritical ? 'var(--error)' : 'var(--text-primary)' }}>
                        <Key size={14} />
                        <span style={{ fontWeight: 600 }}>{b.role}</span>
                     </div>
                     <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Binding: {b.name}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800,
                      background: b.isCritical ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                      color: b.isCritical ? 'var(--error)' : 'var(--success)',
                      display: 'inline-flex', alignItems: 'center', gap: '6px'
                    }}>
                      {b.isCritical ? <AlertTriangle size={12} /> : <ShieldCheck size={12} />}
                      {b.isCritical ? 'CRITICAL RISK' : 'LOW RISK'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="glass-card" style={{ marginTop: '32px', padding: '24px', borderLeft: '4px solid var(--error)' }}>
         <h4 style={{ color: 'var(--error)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem' }}>
            <AlertTriangle size={18} /> Heuristic Security Findings
         </h4>
         <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {criticalCount > 0 
              ? `Detected ${criticalCount} subjects with extreme privileges (ClusterAdmin or equivalent). It is highly recommended to audit these ServiceAccounts and migrate to fine-grained Roles where possible.`
              : "No high-risk role bindings detected. Your cluster RBAC follows the principle of least privilege."
            }
         </p>
      </div>
    </div>
  );
};
