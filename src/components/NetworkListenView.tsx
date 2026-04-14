import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Activity, Globe, Zap, ArrowRight, Server, Search, Filter, RefreshCw, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const NetworkListenView: React.FC = () => {
  const [flows, setFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchFlows = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    
    try {
      const data = await K8sService.getNetworkFlows();
      setFlows(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch network flows', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFlows();
    const interval = setInterval(() => fetchFlows(true), 8000);
    return () => clearInterval(interval);
  }, []);

  const filteredFlows = flows.filter(f => 
    f.source.toLowerCase().includes(filter.toLowerCase()) || 
    f.destination.toLowerCase().includes(filter.toLowerCase()) ||
    f.sourceNamespace.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '12px' }}>
              <Activity size={24} color="white" />
            </div>
            Network Listen
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Live cluster-wide service relationship traffic & flow monitoring</p>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px' }}>
            <Search size={16} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="Search flows..." 
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '200px' }}
            />
          </div>
          <button 
            onClick={() => fetchFlows()}
            disabled={refreshing}
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
          >
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </header>

      {loading ? (
        <div className="skeleton" style={{ height: '500px' }} />
      ) : (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <tr>
                  <th style={{ padding: '20px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Source Service</th>
                  <th style={{ padding: '20px', width: '40px' }}></th>
                  <th style={{ padding: '20px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Target Pod / IP</th>
                  <th style={{ padding: '20px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Protocol</th>
                  <th style={{ padding: '20px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Latency</th>
                  <th style={{ padding: '20px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Throughput</th>
                  <th style={{ padding: '20px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredFlows.map((flow) => (
                    <motion.tr 
                      key={flow.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '20px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>{flow.source}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', opacity: 0.8 }}>{flow.sourceNamespace}</div>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <ArrowRight size={14} color="var(--text-secondary)" />
                      </td>
                      <td style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Server size={14} color="var(--text-secondary)" />
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{flow.destination}</div>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{flow.destIp}</div>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>
                          {flow.protocol} • {flow.port}
                        </span>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <div style={{ width: '40px', textAlign: 'right', fontWeight: 700, fontSize: '0.85rem', color: parseInt(flow.latency) > 10 ? 'var(--warning)' : 'var(--success)' }}>
                             {flow.latency}
                           </div>
                           <div style={{ flex: 1, height: '4px', width: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                              <div style={{ height: '100%', width: `${Math.min(parseInt(flow.latency) * 5, 100)}%`, background: parseInt(flow.latency) > 10 ? 'var(--warning)' : 'var(--success)', borderRadius: '2px' }} />
                           </div>
                        </div>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Zap size={14} color="var(--accent-cyan)" />
                          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{flow.throughput}</div>
                        </div>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: flow.status === 'Active' ? 'var(--success)' : 'var(--text-secondary)', boxShadow: flow.status === 'Active' ? '0 0 8px var(--success)' : 'none' }} />
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: flow.status === 'Active' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{flow.status}</span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {filteredFlows.length === 0 && (
              <div style={{ padding: '100px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Globe size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                <div>No active network flows detected.</div>
              </div>
            )}
          </div>
          
          <div style={{ padding: '12px 24px', background: 'rgba(0,0,0,0.1)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span><Clock size={12} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Last Sync: {lastUpdated.toLocaleTimeString()}</span>
              <span>Total Active Paths: {filteredFlows.length}</span>
            </div>
            <div style={{ fontWeight: 800, color: 'var(--accent-blue)', opacity: 0.6 }}>BETA • REAL-TIME SAMPLING</div>
          </div>
        </div>
      )}
    </div>
  );
};
