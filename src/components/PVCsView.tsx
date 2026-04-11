import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { HardDrive, Filter, RefreshCw, Search, Database } from 'lucide-react';

const formatAge = (timestamp: string): string => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

export const PVCsView: React.FC = () => {
  const [pvcs, setPvcs] = useState<any[]>([]);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [namespace, setNamespace] = useState('all');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const [res, ns] = await Promise.all([
      K8sService.getPVCs(namespace),
      K8sService.getNamespaces()
    ]);
    setPvcs(res);
    setNamespaces(ns);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [namespace]);

  const filtered = pvcs.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.namespace.toLowerCase().includes(search.toLowerCase()) ||
    (i.storageClass || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard">
       <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '4px', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Storage
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Persistent Volume Claims (PVCs)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', fontFamily: 'var(--font-main)' }}>
            <RefreshCw size={16} /> Refresh
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'var(--bg-card)', border: 'var(--border-glass)', borderRadius: '12px' }}>
            <Filter size={16} color="var(--accent-blue)" />
            <select value={namespace} onChange={e => setNamespace(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-main)', fontSize: '0.85rem' }}>
              <option value="all">All Namespaces</option>
              {namespaces.map(ns => <option key={ns} value={ns}>{ns}</option>)}
            </select>
          </div>
        </div>
      </header>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input type="text" placeholder="Search PVCs or storage classes..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 10px 10px 40px', borderRadius: '12px', color: 'white', outline: 'none', fontSize: '0.9rem', fontFamily: 'var(--font-main)' }} />
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
           <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
           <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No PVCs found</div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 2fr) 1fr 1fr 1fr 1.5fr 1fr', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <div>Claim Name</div>
              <div>Status</div>
              <div>Capacity</div>
              <div>Class</div>
              <div>Volume</div>
              <div style={{ textAlign: 'right' }}>Age</div>
            </div>
            {filtered.map(item => {
              const isBound = item.status === 'Bound';
              const isPending = item.status === 'Pending';
              
              return (
                <div key={`${item.namespace}-${item.name}`} className="table-row-hover" style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 2fr) 1fr 1fr 1fr 1.5fr 1fr', padding: '16px 24px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  
                  {/* Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ background: isBound ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', padding: '10px', borderRadius: '12px' }}>
                      <HardDrive size={20} color={isBound ? 'var(--success)' : 'var(--warning)'} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span className="ns-badge">{item.namespace}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
                      background: isBound ? 'rgba(16,185,129,0.1)' : isPending ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                      color: isBound ? 'var(--success)' : isPending ? 'var(--warning)' : 'var(--error)'
                    }}>
                      {item.status}
                    </span>
                  </div>

                  {/* Capacity */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <Database size={14} color="var(--accent-purple)" />
                    {item.capacity !== 'N/A' ? item.capacity : item.requestedStorage}
                  </div>

                  {/* Class */}
                  <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
                    {item.storageClass}
                  </div>

                  {/* Volume Name */}
                  <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }} title={item.volumeName}>
                    {item.volumeName}
                  </div>

                  {/* Age */}
                  <div style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {formatAge(item.age)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
