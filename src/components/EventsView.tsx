import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Clock, Filter, RefreshCw, Search, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';

export const EventsView: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [namespace, setNamespace] = useState('all');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Normal' | 'Warning'>('all');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = async () => {
    setLoading(true);
    const [ev, ns] = await Promise.all([
      K8sService.getEvents(namespace),
      K8sService.getNamespaces()
    ]);
    setEvents(ev);
    setNamespaces(ns);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [namespace]);
  useEffect(() => {
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [namespace]);

  const filtered = events
    .filter(e => typeFilter === 'all' || e.type === typeFilter)
    .filter(e =>
      e.message?.toLowerCase().includes(search.toLowerCase()) ||
      e.object?.toLowerCase().includes(search.toLowerCase()) ||
      e.reason?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const warnings = events.filter(e => e.type === 'Warning').length;
  const normals = events.filter(e => e.type === 'Normal').length;

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '4px', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Cluster Events
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Real-time event stream • Updated: {lastRefresh.toLocaleTimeString()}
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
          <div style={{ background: 'rgba(99,102,241,0.1)', padding: '10px', borderRadius: '12px' }}>
            <Activity size={20} color="var(--accent-blue)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Events</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{events.length}</div>
          </div>
        </div>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px', borderColor: warnings > 0 ? 'rgba(239,68,68,0.2)' : undefined }}>
          <div style={{ background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '12px' }}>
            <AlertTriangle size={20} color="var(--error)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Warnings</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: warnings > 0 ? 'var(--error)' : 'var(--text-primary)' }}>{warnings}</div>
          </div>
        </div>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px' }}>
          <div style={{ background: 'rgba(16,185,129,0.1)', padding: '10px', borderRadius: '12px' }}>
            <CheckCircle2 size={20} color="var(--success)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Normal</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{normals}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
        {/* Type Filter */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px' }}>
          {(['all', 'Warning', 'Normal'] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={{
              padding: '6px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: typeFilter === t ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: typeFilter === t ? (t === 'Warning' ? 'var(--error)' : t === 'Normal' ? 'var(--success)' : 'white') : 'var(--text-secondary)',
              fontWeight: 600, fontSize: '0.82rem', fontFamily: 'var(--font-main)', transition: 'all 0.2s'
            }}>
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input type="text" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 8px 8px 38px', borderRadius: '10px', color: 'white', outline: 'none', fontSize: '0.85rem', fontFamily: 'var(--font-main)' }} />
        </div>
      </div>

      {/* Events Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: 'calc(100vh - 420px)', overflowY: 'auto' }}>
        {loading ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading events...</div>
        ) : filtered.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No events match your filters</div>
        ) : filtered.slice(0, 100).map((event, i) => (
          <div key={event.id || i} className="event-row fade-in" style={{
            display: 'flex', gap: '16px', padding: '14px 20px',
            background: event.type === 'Warning' ? 'rgba(244,63,94,0.03)' : 'rgba(255,255,255,0.01)',
            borderLeft: `3px solid ${event.type === 'Warning' ? 'var(--error)' : 'var(--accent-blue)'}`,
            borderRadius: '0 8px 8px 0',
            transition: 'background 0.2s'
          }}>
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '80px' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: event.type === 'Warning' ? 'var(--error)' : 'var(--accent-blue)',
                boxShadow: event.type === 'Warning' ? '0 0 8px rgba(244,63,94,0.5)' : '0 0 8px rgba(99,102,241,0.5)'
              }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{formatTime(event.timestamp)}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{
                  padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
                  background: event.type === 'Warning' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                  color: event.type === 'Warning' ? 'var(--error)' : 'var(--accent-blue)'
                }}>{event.reason}</span>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{event.object}</span>
                {event.namespace && <span className="ns-badge" style={{ fontSize: '0.68rem' }}>{event.namespace}</span>}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {event.message}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
