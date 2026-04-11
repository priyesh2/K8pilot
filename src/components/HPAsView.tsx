import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { TrendingUp, Filter, RefreshCw, Search, Activity, Target } from 'lucide-react';

const formatAge = (timestamp: string): string => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

export const HPAsView: React.FC = () => {
  const [hpas, setHpas] = useState<any[]>([]);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [namespace, setNamespace] = useState('all');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const [res, ns] = await Promise.all([
      K8sService.getHPAs(namespace),
      K8sService.getNamespaces()
    ]);
    setHpas(res);
    setNamespaces(ns);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [namespace]);

  const filtered = hpas.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.namespace.toLowerCase().includes(search.toLowerCase()) ||
    i.target.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '4px', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Autoscaling
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Horizontal Pod Autoscalers
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
        <input type="text" placeholder="Search HPA or deployment target..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 10px 10px 40px', borderRadius: '12px', color: 'white', outline: 'none', fontSize: '0.9rem', fontFamily: 'var(--font-main)' }} />
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No HPAs found</div>
        ) : (
          <div>
             <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 2fr) 2fr 1fr 1fr 1fr', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <div>Name / Target</div>
                <div>Metrics</div>
                <div>Min / Max</div>
                <div>Replicas</div>
                <div style={{ textAlign: 'right' }}>Age</div>
             </div>
            {filtered.map(item => {
              const isScaled = item.currentReplicas > item.minReplicas;
              const isMaxedOut = item.currentReplicas === item.maxReplicas && item.maxReplicas !== '?';

              return (
                <div key={`${item.namespace}-${item.name}`} className="table-row-hover" style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 2fr) 2fr 1fr 1fr 1fr', padding: '16px 24px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  
                  {/* Name section */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ background: isScaled ? (isMaxedOut ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)') : 'rgba(16,185,129,0.1)', padding: '10px', borderRadius: '12px' }}>
                      <TrendingUp size={20} color={isScaled ? (isMaxedOut ? 'var(--error)' : 'var(--warning)') : 'var(--success)'} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span className="ns-badge">{item.namespace}</span>
                        <span style={{ color: 'var(--text-primary)' }}>→ {item.target}</span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                     {item.metrics.map((m: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                          <Target size={14} color="var(--accent-purple)" />
                          <span style={{ color: 'var(--text-primary)' }}>{m.type}:</span>
                          <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{m.target} target</span>
                        </div>
                     ))}
                     {item.metrics.length === 0 && <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No metrics</span>}
                  </div>

                  {/* Min/Max */}
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {item.minReplicas} / {item.maxReplicas}
                  </div>

                  {/* Replicas */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                     <Activity size={16} color="var(--accent-cyan)" />
                     <span style={{ fontWeight: 600 }}>{item.currentReplicas}</span>
                     <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>/ {item.desiredReplicas} desired</span>
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
