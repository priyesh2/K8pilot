import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Network, Filter, RefreshCw, Search, ChevronRight, ChevronDown, Link } from 'lucide-react';

const formatAge = (timestamp: string): string => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

export const IngressesView: React.FC = () => {
  const [ingresses, setIngresses] = useState<any[]>([]);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [namespace, setNamespace] = useState('all');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [ings, ns] = await Promise.all([
      K8sService.getIngresses(namespace),
      K8sService.getNamespaces()
    ]);
    setIngresses(ings);
    setNamespaces(ns);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [namespace]);

  const toggleRow = (key: string) => setExpandedRow(expandedRow === key ? null : key);

  const filtered = ingresses.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.namespace.toLowerCase().includes(search.toLowerCase()) ||
    (i.rules || []).some((r: any) => r.host.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '4px', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Ingresses
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Networking routes & external access
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
        <input type="text" placeholder="Search ingresses or hosts..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 10px 10px 40px', borderRadius: '12px', color: 'white', outline: 'none', fontSize: '0.9rem', fontFamily: 'var(--font-main)' }} />
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No Ingresses found</div>
        ) : (
          <div>
            {filtered.map(item => {
              const key = `${item.namespace}-${item.name}`;
              const isExpanded = expandedRow === key;
              return (
                <div key={key}>
                  <div onClick={() => toggleRow(key)} className="table-row-hover" style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 16px', cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {isExpanded ? <ChevronDown size={16} color="var(--accent-blue)" /> : <ChevronRight size={16} color="var(--text-secondary)" />}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                         <div style={{ background: 'rgba(34,211,238,0.1)', padding: '8px', borderRadius: '8px' }}>
                           <Network size={18} color="var(--accent-cyan)" />
                         </div>
                         <div>
                           <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.name}</div>
                           <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', marginTop: '4px' }}>
                             <span className="ns-badge">{item.namespace}</span>
                             <span>{item.className}</span>
                           </div>
                         </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{formatAge(item.age)}</span>
                    </div>
                  </div>
                  {isExpanded && item.rules && item.rules.length > 0 && (
                    <div style={{ padding: '16px 16px 20px 64px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>Routing Rules</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {item.rules.map((r: any, i: number) => (
                           <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px' }}>
                              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-cyan)' }}>
                                <Link size={14} /> {r.host}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '22px' }}>
                                {r.paths.map((p: any, j: number) => (
                                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'white', fontFamily: 'var(--font-mono)' }}>{p.path}</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>→</span>
                                    <span style={{ color: 'var(--accent-blue)' }}>{p.backend}</span>
                                  </div>
                                ))}
                              </div>
                           </div>
                        ))}
                      </div>
                      {item.tls && item.tls.length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 600, background: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: '8px' }}>
                            TLS Enabled: {item.tls.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
