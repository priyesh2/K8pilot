import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Trash2, ShieldAlert, CheckCircle, RefreshCw, AlertTriangle, Database, FileText, Key, HardDrive, Filter, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const GhostInspectorView: React.FC = () => {
  const [zombies, setZombies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lastScan, setLastScan] = useState<Date>(new Date());

  const scan = async () => {
    setLoading(true);
    try {
      const data = await K8sService.getZombies();
      setZombies(data);
      setSelected(new Set());
      setLastScan(new Date());
    } catch (err) {
      console.error('Scan failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scan();
  }, []);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === zombies.length) setSelected(new Set());
    else setSelected(new Set(zombies.map(z => z.id)));
  };

  const handleCleanup = async () => {
    const toDelete = zombies.filter(z => selected.has(z.id));
    if (toDelete.length === 0) return;
    
    if (!confirm(`Are you sure you want to permanently delete ${toDelete.length} unused resources? This cannot be undone.`)) return;
    
    setCleaning(true);
    try {
      await K8sService.deleteZombies(toDelete);
      await scan();
    } catch (err) {
      alert('Cleanup failed. Check logs.');
    } finally {
      setCleaning(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'ConfigMap': return <FileText size={18} color="var(--accent-blue)" />;
      case 'Secret': return <Key size={18} color="var(--accent-purple)" />;
      case 'PVC': return <HardDrive size={18} color="var(--accent-cyan)" />;
      case 'Service': return <RefreshCw size={18} color="var(--warning)" />;
      default: return <Database size={18} />;
    }
  };

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '12px' }}>
              <Trash2 size={24} color="white" />
            </div>
            Ghost Inspector
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Identify and purge "Zombie" resources—unused ConfigMaps, Secrets, PVCs, and orphaned Services.</p>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={scan} disabled={loading || cleaning} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={18} className={loading && !cleaning ? 'spin' : ''} /> Rescan
          </button>
          <button 
            onClick={handleCleanup} 
            disabled={loading || cleaning || selected.size === 0} 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--error)' }}
          >
            <Trash2 size={18} /> Purge Selected ({selected.size})
          </button>
        </div>
      </header>

      {loading && !cleaning ? (
        <div className="skeleton" style={{ height: '400px' }} />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
            <SummaryCard label="Unused ConfigMaps" count={zombies.filter(z => z.type === 'ConfigMap').length} color="var(--accent-blue)" />
            <SummaryCard label="Zombie Secrets" count={zombies.filter(z => z.type === 'Secret').length} color="var(--accent-purple)" />
            <SummaryCard label="Orphaned PVCs" count={zombies.filter(z => z.type === 'PVC').length} color="var(--accent-cyan)" />
            <SummaryCard label="Ghost Services" count={zombies.filter(z => z.type === 'Service').length} color="var(--warning)" />
          </div>

          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={selectAll} style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                {selected.size === zombies.length ? 'Deselect All' : 'Select All Resources'}
              </button>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {zombies.length} zombies identified • Scan date: {lastScan.toLocaleTimeString()}
              </div>
            </div>

            <div style={{ maxHeight: 'calc(100vh - 450px)', overflowY: 'auto' }}>
              {zombies.length === 0 ? (
                <div style={{ padding: '80px', textAlign: 'center', color: 'var(--success)' }}>
                  <CheckCircle size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                  <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Your cluster is clean!</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px' }}>No unused resources found.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {zombies.map(z => (
                    <div 
                      key={z.id} 
                      onClick={() => toggleSelect(z.id)}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '20px', padding: '16px 24px', 
                        borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer',
                        background: selected.has(z.id) ? 'rgba(59,130,246,0.05)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      <div style={{ 
                        width: '20px', height: '20px', borderRadius: '4px', border: '2px solid rgba(255,255,255,0.1)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: selected.has(z.id) ? 'var(--accent-blue)' : 'transparent',
                        borderColor: selected.has(z.id) ? 'var(--accent-blue)' : 'rgba(255,255,255,0.1)'
                      }}>
                        {selected.has(z.id) && <CheckCircle size={14} color="white" />}
                      </div>
                      <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
                        {getIcon(z.type)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{z.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{z.namespace} • {z.type} {z.size ? `• Capacity: ${z.size}` : ''} {z.reason ? `• ${z.reason}` : ''}</div>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--error)', opacity: 0.8, fontWeight: 600 }}>
                        <Trash2 size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Unused
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="glass-card" style={{ marginTop: '24px', border: '1px solid rgba(245,158,11,0.2)', padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <AlertTriangle size={20} color="var(--warning)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--warning)', marginBottom: '4px' }}>Expert Caution Advisable</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Ghost Inspector identifies resources not referenced by active Pods. However, some resources may be intended for future use, sidecar injection, or external tools. Always double-check before performing a bulk purge on production clusters.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const SummaryCard = ({ label, count, color }: any) => (
  <div className="glass-card" style={{ textAlign: 'center', padding: '20px' }}>
    <div style={{ fontSize: '1.8rem', fontWeight: 800, color }}>{count}</div>
    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 600 }}>{label}</div>
  </div>
);
