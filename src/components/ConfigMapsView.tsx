import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { FileText, Filter, RefreshCw, Search, Key, ChevronDown, ChevronRight, Lock, Database } from 'lucide-react';

const formatAge = (timestamp: string): string => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

export const ConfigMapsView: React.FC = () => {
  const [configmaps, setConfigmaps] = useState<any[]>([]);
  const [secrets, setSecrets] = useState<any[]>([]);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [namespace, setNamespace] = useState('all');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'configmaps' | 'secrets'>('configmaps');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [cm, sec, ns] = await Promise.all([
      K8sService.getConfigMaps(namespace),
      K8sService.getSecrets(namespace),
      K8sService.getNamespaces()
    ]);
    setConfigmaps(cm);
    setSecrets(sec);
    setNamespaces(ns);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [namespace]);

  const toggleRow = (key: string) => setExpandedRow(expandedRow === key ? null : key);

  const filteredCM = configmaps.filter(cm => cm.name.toLowerCase().includes(search.toLowerCase()) || cm.namespace.toLowerCase().includes(search.toLowerCase()));
  const filteredSecrets = secrets.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.namespace.toLowerCase().includes(search.toLowerCase()));

  const data = tab === 'configmaps' ? filteredCM : filteredSecrets;

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '4px', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Configuration
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            ConfigMaps & Secrets management
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px' }}>
          <div style={{ background: 'rgba(34,211,238,0.1)', padding: '10px', borderRadius: '12px' }}>
            <FileText size={20} color="var(--accent-cyan)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ConfigMaps</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{configmaps.length}</div>
          </div>
        </div>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px' }}>
          <div style={{ background: 'rgba(245,158,11,0.1)', padding: '10px', borderRadius: '12px' }}>
            <Lock size={20} color="var(--warning)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Secrets</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{secrets.length}</div>
          </div>
        </div>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px' }}>
          <div style={{ background: 'rgba(139,92,246,0.1)', padding: '10px', borderRadius: '12px' }}>
            <Database size={20} color="var(--accent-purple)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Keys</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              {(tab === 'configmaps' ? configmaps : secrets).reduce((s, item) => s + (item.keys?.length || 0), 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
        <button onClick={() => { setTab('configmaps'); setExpandedRow(null); }} style={{
          padding: '8px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
          background: tab === 'configmaps' ? 'rgba(255,255,255,0.08)' : 'transparent',
          color: tab === 'configmaps' ? 'white' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem',
          fontFamily: 'var(--font-main)', transition: 'all 0.2s'
        }}>
          ConfigMaps ({configmaps.length})
        </button>
        <button onClick={() => { setTab('secrets'); setExpandedRow(null); }} style={{
          padding: '8px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
          background: tab === 'secrets' ? 'rgba(255,255,255,0.08)' : 'transparent',
          color: tab === 'secrets' ? 'white' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem',
          fontFamily: 'var(--font-main)', transition: 'all 0.2s'
        }}>
          Secrets ({secrets.length})
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input type="text" placeholder={`Search ${tab}...`} value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 10px 10px 40px', borderRadius: '12px', color: 'white', outline: 'none', fontSize: '0.9rem', fontFamily: 'var(--font-main)' }} />
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
        ) : data.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No {tab} found</div>
        ) : (
          <div>
            {data.map(item => {
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
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                          <span className="ns-badge">{item.namespace}</span>
                          {item.type && <span style={{ color: 'var(--accent-purple)' }}>{item.type}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Key size={14} color="var(--accent-cyan)" />
                        <span style={{ fontWeight: 600 }}>{item.keys?.length || 0} keys</span>
                      </div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{formatAge(item.age)}</span>
                    </div>
                  </div>
                  {isExpanded && item.keys && item.keys.length > 0 && (
                    <div style={{ padding: '12px 16px 16px 44px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Data Keys:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {item.keys.map((k: string) => (
                          <span key={k} style={{
                            padding: '4px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600,
                            background: tab === 'secrets' ? 'rgba(245,158,11,0.1)' : 'rgba(34,211,238,0.1)',
                            color: tab === 'secrets' ? 'var(--warning)' : 'var(--accent-cyan)',
                            fontFamily: 'var(--font-mono)'
                          }}>
                            {tab === 'secrets' ? '••••' : ''}{k}
                          </span>
                        ))}
                      </div>
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
