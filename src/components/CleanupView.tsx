import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Trash2, ShieldAlert, CheckCircle, RefreshCw, AlertTriangle, Box, FileText, Key, HardDrive, Filter, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CleanupView: React.FC = () => {
  const [zombies, setZombies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lastScan, setLastScan] = useState<Date>(new Date());

  const scan = async () => {
    setLoading(true);
    try {
      const data = await K8sService.getUnusedResources();
      setZombies(data.map(z => ({ ...z, age: z.age ? formatAge(z.age) : 'unknown' })));
      setSelected(new Set());
      setLastScan(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatAge = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const d = Math.floor(diff / 86400000);
    return d > 0 ? `${d}d` : 'today';
  };

  useEffect(() => { scan(); }, []);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleCleanup = async () => {
    setCleaning(true);
    // Simulate cleanup
    await new Promise(r => setTimeout(r, 2000));
    setZombies(prev => prev.filter(z => !selected.has(z.id)));
    setSelected(new Set());
    setCleaning(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'ConfigMap': return <FileText size={18} />;
      case 'Secret': return <Key size={18} />;
      case 'PVC': return <HardDrive size={18} />;
      default: return <Box size={18} />;
    }
  };

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '12px' }}>
              <Trash2 size={28} color="white" />
            </div>
            Resource Cleanup
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Identify and purge orphaned or unused cluster resources</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={scan} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={18} className={loading ? 'spin' : ''} /> Rescan Cluster
          </button>
          <button 
             onClick={handleCleanup}
             disabled={selected.size === 0 || cleaning}
             className="btn-primary" 
             style={{ display: 'flex', alignItems: 'center', gap: '8px', background: selected.size > 0 ? 'var(--error)' : '' }}
          >
            {cleaning ? 'Purging...' : `Purge Selected (${selected.size})`}
          </button>
        </div>
      </header>

      {loading && !cleaning ? (
        <div className="skeleton" style={{ height: '400px' }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <SummaryCard label="Zombie Resources" count={zombies.length} color="var(--warning)" />
            <SummaryCard label="Potential Disk Savings" count="25Gi" color="var(--success)" />
            <SummaryCard label="Secrets at Risk" count={zombies.filter(z => z.type === 'Secret').length} color="var(--error)" />
            <SummaryCard label="Ghost Configs" count={zombies.filter(z => z.type === 'ConfigMap').length} color="var(--accent-blue)" />
          </div>

          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
               <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Identified resources with no active references</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {zombies.length === 0 ? (
                <div style={{ padding: '80px', textAlign: 'center' }}>
                   <CheckCircle size={48} color="var(--success)" style={{ opacity: 0.2, marginBottom: '16px' }} />
                   <h3>Your Cluster is Clean</h3>
                   <p style={{ color: 'var(--text-secondary)' }}>No orphaned resources detected in the last scan.</p>
                </div>
              ) : zombies.map(z => (
                <div 
                  key={z.id} 
                  onClick={() => toggleSelect(z.id)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '20px', padding: '16px 24px', 
                    borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer',
                    background: selected.has(z.id) ? 'rgba(239,68,68,0.05)' : 'transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ 
                    width: '20px', height: '20px', borderRadius: '4px', border: '2px solid rgba(255,255,255,0.1)',
                    background: selected.has(z.id) ? 'var(--error)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {selected.has(z.id) && <CheckCircle size={14} color="white" />}
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>{getIcon(z.type)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{z.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{z.namespace} • {z.type} • Age: {z.age}</div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--warning)', fontWeight: 600 }}>{z.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ label, count, color }: any) => (
  <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
     <div style={{ fontSize: '1.8rem', fontWeight: 800, color }}>{count}</div>
     <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</div>
  </div>
);
