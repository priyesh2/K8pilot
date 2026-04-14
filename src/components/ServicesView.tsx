import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Globe, Filter, RefreshCw, Network, ArrowRight, Lock, Unlock, Search } from 'lucide-react';

const TypeBadge = ({ type }: { type: string }) => {
  const colors: Record<string, { bg: string; color: string }> = {
    'ClusterIP': { bg: 'rgba(99,102,241,0.15)', color: 'var(--accent-blue)' },
    'NodePort': { bg: 'rgba(245,158,11,0.15)', color: 'var(--warning)' },
    'LoadBalancer': { bg: 'rgba(34,197,94,0.15)', color: 'var(--success)' },
    'ExternalName': { bg: 'rgba(139,92,246,0.15)', color: 'var(--accent-purple)' },
  };
  const style = colors[type] || colors['ClusterIP'];
  return (
    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, background: style.bg, color: style.color }}>
      {type}
    </span>
  );
};

const formatAge = (timestamp: string): string => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

export const ServicesView: React.FC = () => {
  const [services, setServices] = useState<any[]>([]);
  const [ingresses, setIngresses] = useState<any[]>([]);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [namespace, setNamespace] = useState('all');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'services' | 'ingresses'>('services');

  const fetchData = async () => {
    setLoading(true);
    const [svc, ing, ns] = await Promise.all([
      K8sService.getServices(namespace),
      K8sService.getIngresses(namespace),
      K8sService.getNamespaces()
    ]);
    setServices(svc);
    setIngresses(ing);
    setNamespaces(ns);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [namespace]);

  const filteredServices = services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.namespace.toLowerCase().includes(search.toLowerCase()));
  const filteredIngresses = ingresses.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.namespace.toLowerCase().includes(search.toLowerCase()));

  const typeCounts = services.reduce((acc: Record<string, number>, s) => { acc[s.type] = (acc[s.type] || 0) + 1; return acc; }, {});

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '4px', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Services & Networking
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Service discovery, ingress rules & network traffic
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

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px' }}>
          <div style={{ background: 'rgba(99,102,241,0.1)', padding: '10px', borderRadius: '12px' }}>
            <Globe size={20} color="var(--accent-blue)" />
          </div>
          <div>
            <div style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading cluster infrastructure...</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{services.length}</div>
          </div>
        </div>
        {Object.entries(typeCounts).map(([type, count]) => (
          <div key={type} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px' }}>
            <div style={{ background: 'rgba(139,92,246,0.1)', padding: '10px', borderRadius: '12px' }}>
              <Network size={20} color="var(--accent-purple)" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{type}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{count}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
        {(['services', 'ingresses'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: tab === t ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: tab === t ? 'white' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem',
            fontFamily: 'var(--font-main)', transition: 'all 0.2s'
          }}>
            {t === 'services' ? `Services (${services.length})` : `Ingresses (${ingresses.length})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input type="text" placeholder={`Search ${tab}...`} value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 10px 10px 40px', borderRadius: '12px', color: 'white', outline: 'none', fontSize: '0.9rem', fontFamily: 'var(--font-main)' }} />
      </div>

      {tab === 'services' ? (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Namespace</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Cluster IP</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Ports</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Age</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading services...</td></tr>
              ) : filteredServices.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No services found</td></tr>
              ) : filteredServices.map(svc => (
                <tr key={`${svc.namespace}-${svc.name}`} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{svc.name}</td>
                  <td style={{ padding: '12px 16px' }}><span className="ns-badge">{svc.namespace}</span></td>
                  <td style={{ padding: '12px 16px' }}><TypeBadge type={svc.type} /></td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{svc.clusterIP}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {svc.ports.map((p: string, i: number) => (
                        <span key={i} style={{ padding: '2px 8px', background: 'rgba(34,211,238,0.1)', color: 'var(--accent-cyan)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>{p}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{formatAge(svc.age)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading ingresses...</div>
          ) : filteredIngresses.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No ingresses found in this namespace</div>
          ) : filteredIngresses.map(ing => (
            <div key={`${ing.namespace}-${ing.name}`} className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '10px', background: 'rgba(99,102,241,0.1)', borderRadius: '12px' }}>
                    <Globe size={20} color="var(--accent-blue)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{ing.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{ing.namespace} • Class: {ing.className}</div>
                  </div>
                </div>
                {ing.tls.length > 0 ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(16,185,129,0.15)', color: 'var(--success)', fontSize: '0.72rem', fontWeight: 700 }}>
                    <Lock size={12} /> TLS
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(245,158,11,0.15)', color: 'var(--warning)', fontSize: '0.72rem', fontWeight: 700 }}>
                    <Unlock size={12} /> HTTP
                  </span>
                )}
              </div>
              {/* Rules */}
              {ing.rules.map((rule: any, ri: number) => (
                <div key={ri} style={{ marginBottom: '8px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', color: 'var(--accent-cyan)' }}>{rule.host}</div>
                  {rule.paths.map((p: any, pi: number) => (
                    <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', padding: '4px 0' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{p.path}</span>
                      <ArrowRight size={14} color="var(--text-secondary)" />
                      <span style={{ fontWeight: 600 }}>{p.backend}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
