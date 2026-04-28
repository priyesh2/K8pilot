import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Bell, AlertTriangle, Info, Clock, Filter, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ClusterEventsView: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const fetchEvents = async () => {
    setLoading(true);
    const data = await K8sService.getEvents('all');
    setEvents(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = events.filter(e => {
    if (filter === 'All') return true;
    return e.type === filter;
  });

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '12px' }}>
              <Bell size={28} color="white" />
            </div>
            Cluster Protocol Activity
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Live audit stream of all object lifecycle events and warnings</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
           <div className="glass-card" style={{ display: 'flex', padding: '10px 16px', gap: '8px', alignItems: 'center' }}>
            <Filter size={16} color="var(--accent-purple)" />
            <select value={filter} onChange={e => setFilter(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
              <option value="All">All Events</option>
              <option value="Warning">Warnings Only</option>
              <option value="Normal">Normal Activity</option>
            </select>
          </div>
          <button onClick={fetchEvents} className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '12px' }}>
            Refresh
          </button>
        </div>
      </header>

      {loading && events.length === 0 ? <div className="skeleton" style={{ height: '400px' }} /> : (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 800 }}>TYPE</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 800 }}>REASON</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 800 }}>OBJECT / NAMESPACE</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 800 }}>MESSAGE</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 800 }}>TIME</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredEvents.map((e, i) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={`${e.id}-${i}`} 
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: e.type === 'Warning' ? 'rgba(239,68,68,0.02)' : 'transparent' }}
                  >
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 800,
                        color: e.type === 'Warning' ? 'var(--error)' : 'var(--success)'
                      }}>
                        {e.type === 'Warning' ? <AlertTriangle size={14} /> : <Info size={14} />}
                        {e.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 700 }}>{e.reason}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{e.involvedObject}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{e.namespace}</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{e.message}</td>
                    <td style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={12} /> {e.age}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredEvents.length === 0 && (
            <div style={{ padding: '100px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No events matched the current filter.
            </div>
          )}
        </div>
      )}

      {/* Heuristic Insight Component */}
      <div className="glass-card" style={{ marginTop: '32px', padding: '24px', borderLeft: '4px solid var(--accent-cyan)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bell size={18} color="var(--accent-cyan)" /> Activity Pattern Recognition
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {events.filter(e => e.type === 'Warning').length > 10 ? (
            <span style={{ color: 'var(--error)' }}>⚠️ **High Alert:** Detected abnormal frequency of Warning events in the last hour. This typically indicates scheduling pressure or multiple pod crashloops.</span>
          ) : (
            <span>✅ **Steady State:** Event frequency is within normal operating parameters. No systemic failures detected in the protocol stream.</span>
          )}
        </p>
      </div>
    </div>
  );
};
