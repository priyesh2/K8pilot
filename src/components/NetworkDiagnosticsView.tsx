import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Wifi, WifiOff, Globe, Search, RefreshCw, CheckCircle, XCircle, Clock, ArrowRight, Server, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DnsResult {
  service: string;
  namespace: string;
  fqdn: string;
  resolved: boolean;
  clusterIP: string;
  endpoints: number;
  ports: string[];
}

interface ConnectivityResult {
  source: string;
  target: string;
  port: string;
  status: 'reachable' | 'unreachable' | 'unknown';
  latency?: string;
}

export const NetworkDiagnosticsView: React.FC = () => {
  const [dnsResults, setDnsResults] = useState<DnsResult[]>([]);
  const [connectivity, setConnectivity] = useState<ConnectivityResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dns' | 'connectivity'>('dns');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const data = await K8sService.getNetworkDiagnostics();
      setDnsResults(data.dns || []);
      setConnectivity(data.connectivity || []);
    } catch (e) {
      console.error('Network diagnostics failed:', e);
    }
    setLoading(false);
  };

  const filteredDns = dnsResults.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return d.service.toLowerCase().includes(q) || d.namespace.toLowerCase().includes(q);
  });

  const filteredConn = connectivity.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.source.toLowerCase().includes(q) || c.target.toLowerCase().includes(q);
  });

  const dnsHealthy = dnsResults.filter(d => d.resolved).length;
  const dnsUnresolved = dnsResults.filter(d => !d.resolved).length;
  const noEndpoints = dnsResults.filter(d => d.endpoints === 0).length;
  const connReachable = connectivity.filter(c => c.status === 'reachable').length;

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '12px' }}>
              <Wifi size={24} color="white" />
            </div>
            Network Diagnostics
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>DNS resolution audit, endpoint health, and service connectivity analysis</p>
        </div>
        <button onClick={fetchDiagnostics} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} /> Re-Scan
        </button>
      </header>

      {/* Stats */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Services Scanned', value: dnsResults.length, color: 'var(--accent-blue)', icon: <Globe size={20} /> },
            { label: 'DNS Healthy', value: dnsHealthy, color: 'var(--success)', icon: <CheckCircle size={20} /> },
            { label: 'No Endpoints', value: noEndpoints, color: 'var(--warning)', icon: <WifiOff size={20} /> },
            { label: 'Connections', value: connectivity.length, color: 'var(--accent-cyan)', icon: <Wifi size={20} /> },
          ].map((s, i) => (
            <motion.div key={i} className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{s.value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tabs + Search */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '12px', gap: '4px' }}>
          {[
            { key: 'dns', label: 'DNS & Endpoints' },
            { key: 'connectivity', label: 'Connectivity Map' },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as 'dns' | 'connectivity')}
              style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: activeTab === t.key ? 'rgba(59,130,246,0.12)' : 'transparent', color: activeTab === t.key ? 'var(--accent-blue)' : 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 16px 10px 40px', background: 'rgba(255,255,255,0.04)', border: 'var(--border-glass)', borderRadius: '12px', color: 'var(--text-primary)', fontFamily: 'var(--font-main)', outline: 'none', fontSize: '0.88rem' }} />
        </div>
      </div>

      {/* Content */}
      {loading ? <div className="skeleton" style={{ height: '500px' }} /> : activeTab === 'dns' ? (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ maxHeight: 'calc(100vh - 420px)', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontSize: '0.82rem', position: 'sticky', top: 0, background: 'var(--bg-deep)', zIndex: 1 }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600 }}>Service</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600 }}>FQDN</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600 }}>ClusterIP</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600 }}>Endpoints</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600 }}>Ports</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600 }}>DNS Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredDns.map((d, i) => (
                  <tr key={i} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.88rem' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600 }}>{d.service}</div>
                      <span className="ns-badge" style={{ marginTop: '4px' }}>{d.namespace}</span>
                    </td>
                    <td style={{ padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>{d.fqdn}</td>
                    <td style={{ padding: '16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{d.clusterIP}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, color: d.endpoints === 0 ? 'var(--error)' : 'var(--success)' }}>{d.endpoints}</span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {d.ports.slice(0, 3).map((p, j) => (
                          <span key={j} style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>{p}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, background: d.resolved ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: d.resolved ? 'var(--success)' : 'var(--error)' }}>
                        {d.resolved ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {d.resolved ? 'Resolved' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
          {filteredConn.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)', gridColumn: '1/-1' }}>
              <Wifi size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <div>No service-to-service connections detected</div>
            </div>
          ) : filteredConn.map((c, i) => (
            <motion.div key={i} className="glass-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
              style={{ padding: '20px', borderTop: `3px solid ${c.status === 'reachable' ? 'var(--success)' : c.status === 'unreachable' ? 'var(--error)' : 'var(--warning)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <Server size={16} color="var(--accent-blue)" />
                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{c.source}</span>
                <ArrowRight size={14} color="var(--text-secondary)" />
                <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--accent-cyan)' }}>{c.target}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600, fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,0.04)' }}>:{c.port}</span>
                  {c.latency && <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600, background: 'rgba(255,255,255,0.04)' }}>{c.latency}</span>}
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, background: c.status === 'reachable' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: c.status === 'reachable' ? 'var(--success)' : 'var(--error)' }}>
                  {c.status === 'reachable' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                  {c.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
