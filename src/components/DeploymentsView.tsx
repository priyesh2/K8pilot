import React, { useState, useEffect } from 'react';
import { K8sService, Deployment } from '../services/k8s';
import { Layers, Maximize2, RefreshCw, Filter, CheckCircle2, AlertTriangle, FileCode } from 'lucide-react';
import { LiveYamlEditorModal } from './LiveYamlEditorModal';

export const DeploymentsView: React.FC = () => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [namespace, setNamespace] = useState('all');
  const [editTarget, setEditTarget] = useState<{ kind: string; name: string } | null>(null);

  useEffect(() => {
    K8sService.getNamespaces().then(setNamespaces).catch(() => {});
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const data = await K8sService.getDeployments(namespace);
    setDeployments(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [namespace]);

  const handleRestart = async (d: Deployment) => {
    const ok = await K8sService.restartService(d.name, d.namespace);
    if (ok) { alert(`Restart initiated for ${d.name}`); fetchData(); }
    else alert(`Restart failed for ${d.name}`);
  };

  const handleScale = async (d: Deployment) => {
    const replicas = prompt(`Scale ${d.name} to:`, d.replicas.split('/')[1]);
    if (replicas !== null) {
      const ok = await K8sService.scaleDeployment(d.namespace, d.name, parseInt(replicas));
      if (ok) fetchData();
    }
  };

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>Deployment Center</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage rollout strategies and horizontal scaling</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', cursor: 'pointer' }}>
            <RefreshCw size={16} /> Refresh
          </button>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px' }}>
            <Filter size={18} color="var(--accent-blue)" />
            <select value={namespace} onChange={e => setNamespace(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
              <option value="all">All Namespaces</option>
              {namespaces.map(ns => <option key={ns} value={ns}>{ns}</option>)}
            </select>
          </div>
        </div>
      </header>

      <div className="pod-grid" style={{ gridTemplateColumns: '1fr' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading deployments...</div>
        ) : deployments.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No deployments found.
          </div>
        ) : deployments.map(dep => (
          <div key={`${dep.namespace}-${dep.name}`} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{
                background: dep.status === 'Healthy' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                color: dep.status === 'Healthy' ? 'var(--success)' : 'var(--error)',
                padding: '12px', borderRadius: '12px'
              }}>
                {dep.status === 'Healthy' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{dep.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                  {dep.namespace} • {dep.images[0]}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '48px', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>READY</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{dep.replicas}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>AGE</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{dep.age}</div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setEditTarget({ kind: 'deployment', name: dep.name })} title="Edit YAML"
                  style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>
                  <FileCode size={18} />
                </button>
                <button onClick={() => handleScale(dep)} title="Scale"
                  style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>
                  <Maximize2 size={18} />
                </button>
                <button onClick={() => handleRestart(dep)} title="Restart"
                  style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editTarget && (
        <LiveYamlEditorModal 
          namespace={editTarget.name && deployments.find(d => d.name === editTarget.name)?.namespace || namespace} 
          kind={editTarget.kind} 
          name={editTarget.name} 
          onClose={() => setEditTarget(null)} 
        />
      )}
    </div>
  );
};
