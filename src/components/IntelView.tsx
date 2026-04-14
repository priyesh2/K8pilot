import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Zap, Activity, ShieldAlert, Clock, Filter, Trash2, RefreshCw, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const IntelView: React.FC = () => {
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetchFeed = async () => {
      const data = await K8sService.getUnifiedFeed();
      setFeed(data);
      setLoading(false);
    };
    fetchFeed();
    const interval = setInterval(fetchFeed, 10000); // 10s polling for "live" feel
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (type: string, reason: string) => {
    if (type === 'Warning') return 'var(--error)';
    if (reason === 'Deleted' || reason === 'Killing') return 'var(--accent-purple)';
    if (reason === 'Created' || reason === 'Started') return 'var(--success)';
    return 'var(--accent-blue)';
  };

  const getIcon = (type: string, reason: string) => {
    if (type === 'Warning') return <ShieldAlert size={18} />;
    if (reason === 'Deleted' || reason === 'Killing') return <Trash2 size={18} />;
    if (reason === 'Created' || reason === 'Started') return <Box size={18} />;
    return <Activity size={18} />;
  };

  const filteredFeed = feed.filter(f => {
    if (filter === 'ALL') return true;
    if (filter === 'WARNING') return f.type === 'Warning';
    if (filter === 'LIFECYCLE') return ['Created', 'Deleted', 'Killing', 'Started'].includes(f.reason);
    return true;
  });

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '12px' }}>
              <Zap size={24} color="white" />
            </div>
            Intelligence Feed
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Unified cluster-wide event auditing and smart incident tracking</p>
        </div>
        
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', gap: '4px' }}>
          {['ALL', 'WARNING', 'LIFECYCLE'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              style={{ 
                padding: '8px 16px', borderRadius: '8px', border: 'none', 
                background: filter === f ? 'rgba(59,130,246,0.1)' : 'transparent',
                color: filter === f ? 'var(--accent-blue)' : 'var(--text-secondary)',
                fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize'
              }}
            >
              {f.toLowerCase()}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="skeleton" style={{ height: '600px' }} />
      ) : (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', padding: '24px' }}>
            <AnimatePresence initial={false}>
              {filteredFeed.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>
                  <Clock size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                  <div>No events matching the current filter.</div>
                </div>
              ) : filteredFeed.map((ev, i) => (
                <motion.div 
                  key={ev.id + i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{ 
                    display: 'flex', gap: '20px', padding: '20px', 
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: i === 0 ? 'rgba(59,130,246,0.02)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      padding: '10px', background: `${getSeverityColor(ev.type, ev.reason)}15`, 
                      borderRadius: '12px', color: getSeverityColor(ev.type, ev.reason) 
                    }}>
                      {getIcon(ev.type, ev.reason)}
                    </div>
                    <div style={{ width: '2px', flex: 1, background: 'rgba(255,255,255,0.05)' }} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: '1rem', marginRight: '12px' }}>{ev.reason}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{ev.objectKind}/{ev.objectName}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={12} /> {new Date(ev.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
                      {ev.message}
                    </p>
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                      <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}>
                        {ev.namespace}
                      </span>
                      {ev.count > 1 && (
                        <span style={{ padding: '4px 8px', background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>
                          {ev.count}X RECURRENCE
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};
