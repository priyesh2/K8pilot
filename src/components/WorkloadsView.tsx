import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Filter, Database, Ghost, PlaySquare, Calendar } from 'lucide-react';

export const WorkloadsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sts' | 'ds' | 'jobs' | 'cron'>('sts');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [namespace, setNamespace] = useState('all');
  const [namespaces, setNamespaces] = useState<string[]>([]);

  useEffect(() => { K8sService.getNamespaces().then(setNamespaces).catch(()=>{}); }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let res: any[] = [];
      if (activeTab === 'sts') res = await K8sService.getStatefulSets(namespace);
      else if (activeTab === 'ds') res = await K8sService.getDaemonSets(namespace);
      else if (activeTab === 'jobs') res = await K8sService.getJobs(namespace);
      else if (activeTab === 'cron') res = await K8sService.getCronJobs(namespace);
      setData(res);
      setLoading(false);
    };
    fetchData();
  }, [activeTab, namespace]);

  const tabs = [
    { id: 'sts', label: 'StatefulSets', icon: <Database size={16} /> },
    { id: 'ds', label: 'DaemonSets', icon: <Ghost size={16} /> },
    { id: 'jobs', label: 'Jobs', icon: <PlaySquare size={16} /> },
    { id: 'cron', label: 'CronJobs', icon: <Calendar size={16} /> }
  ];

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>Advanced Workloads</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage StatefulSets, DaemonSets, Jobs, and CronJobs</p>
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

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer',
              background: activeTab === t.id ? 'var(--accent-purple)' : 'rgba(255,255,255,0.05)',
              color: activeTab === t.id ? 'white' : 'var(--text-secondary)', border: 'none'
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>Loading...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {data.length === 0 && <div style={{ color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>No {activeTab} found.</div>}
          {data.map((item, i) => (
            <div key={i} className="glass-card" style={{ padding: '20px' }}>
              <div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '4px' }}>{item.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>{item.namespace}</div>
              
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', display: 'grid', gap: '8px' }}>
                {activeTab === 'sts' && <div><strong>Replicas:</strong> {item.replicas}</div>}
                {activeTab === 'ds' && <><div><strong>Desired:</strong> {item.desired}</div><div><strong>Ready:</strong> {item.ready}</div></>}
                {activeTab === 'jobs' && <div><strong>Status:</strong> <span style={{ color: item.status === 'Complete' ? 'var(--success)' : 'var(--warning)' }}>{item.status}</span></div>}
                {activeTab === 'cron' && <>
                  <div><strong>Schedule:</strong> <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>{item.schedule}</code></div>
                  <div><strong>Active Jobs:</strong> {item.active}</div>
                  <div><strong>Suspended:</strong> {item.suspend ? 'Yes' : 'No'}</div>
                </>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
