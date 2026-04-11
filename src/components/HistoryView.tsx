import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { RefreshCw, History, GitMerge, AlertCircle, CheckCircle2 } from 'lucide-react';

export const HistoryView: React.FC = () => {
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [namespace, setNamespace] = useState('default');
  const [deployments, setDeployments] = useState<any[]>([]);
  const [deployment, setDeployment] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    K8sService.getNamespaces().then(setNamespaces).catch(() => {});
  }, []);

  useEffect(() => {
    if (namespace !== 'all') {
      K8sService.getDeployments(namespace).then(deps => {
        setDeployments(deps);
        if (deps.length > 0) setDeployment(deps[0].name);
        else setDeployment('');
      });
    }
  }, [namespace]);

  const fetchHistory = async () => {
    if (!namespace || !deployment || namespace === 'all') return;
    setLoading(true);
    const data = await K8sService.getHistory(namespace, deployment);
    setHistory(data);
    setLoading(false);
  };

  useEffect(() => { fetchHistory(); }, [deployment, namespace]);

  const handleRollback = async () => {
    if (confirm(`Are you sure you want to rollback ${deployment} to its previous stable state?`)) {
      const ok = await K8sService.rollbackDeployment(namespace, deployment);
      if (ok) {
        alert('Rollback initiated successfully.');
        setTimeout(fetchHistory, 2000);
      } else {
        alert('Rollback failed.');
      }
    }
  };

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>Rollout History & Engine</h1>
          <p style={{ color: 'var(--text-secondary)' }}>GitOps-style revision tracking and instant 1-click rollback</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="glass-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>NS:</span>
            <select value={namespace} onChange={e => setNamespace(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
              {namespaces.filter(n => n !== 'all').map(ns => <option key={ns} value={ns}>{ns}</option>)}
            </select>
          </div>
          <div className="glass-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Deploy:</span>
            <select value={deployment} onChange={e => setDeployment(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
              {deployments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
            </select>
          </div>
        </div>
      </header>

      {deployment && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <button onClick={handleRollback} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', borderRadius: '12px', color: 'var(--error)', fontWeight: 700, cursor: 'pointer' }}>
            <RefreshCw size={18} /> Instant Rollback
          </button>
        </div>
      )}

      {loading ? <div style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Loading Timeline...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
           {/* Timeline line */}
           <div style={{ position: 'absolute', left: '26px', top: '24px', bottom: '24px', width: '2px', background: 'rgba(255,255,255,0.1)' }} />
           
           {history.length === 0 && <div className="glass-card">No revision history found.</div>}
           {history.map((rs, index) => {
             const isActive = rs.replicas > 0;
             return (
               <div key={rs.name} className="glass-card" style={{ display: 'flex', gap: '24px', position: 'relative', zIndex: 1, borderColor: isActive ? 'rgba(34,197,94,0.3)' : undefined }}>
                 <div style={{ 
                   width: '52px', height: '52px', borderRadius: '50%', background: isActive ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)', 
                   display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                   border: `2px solid ${isActive ? 'var(--success)' : 'rgba(255,255,255,0.1)'}`
                 }}>
                   {isActive ? <CheckCircle2 size={24} color="var(--success)" /> : <GitMerge size={20} color="var(--text-secondary)" />}
                 </div>
                 <div style={{ flex: 1 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                     <div>
                       <div style={{ fontSize: '1.2rem', fontWeight: 700, color: isActive ? 'var(--success)' : 'white' }}>
                         Revision {rs.revision} {isActive && '(active)'}
                       </div>
                       <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{rs.name} • {rs.age}</div>
                     </div>
                     <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem' }}>
                       {rs.replicas} Replicas
                     </div>
                   </div>
                   <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                     <strong>Images:</strong> {rs.images.join(', ')}
                   </div>
                 </div>
               </div>
             )
           })}
        </div>
      )}
    </div>
  );
};
