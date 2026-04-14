import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Plus, Trash2, Box, Activity, Search, RefreshCw, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const NamespacesView: React.FC = () => {
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [breakdown, setBreakdown] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNsName, setNewNsName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [nsList, stats] = await Promise.all([
        K8sService.getNamespaces(),
        K8sService.getNamespaceBreakdown()
      ]);
      setNamespaces(nsList);
      setBreakdown(stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNsName.trim()) return;
    setCreating(true);
    const ok = await K8sService.createNamespace(newNsName.trim());
    if (ok) {
      setNewNsName('');
      setIsModalOpen(false);
      fetchData();
    } else {
      alert('Failed to create namespace. Check RBAC permissions.');
    }
    setCreating(false);
  };

  const handleDelete = async (name: string) => {
    if (['default', 'kube-system', 'k8pilot'].includes(name)) {
      alert('Cannot delete protected system namespaces.');
      return;
    }
    if (!confirm(`⚠️ Permanently delete namespace "${name}" and ALL resources within it?`)) return;
    
    const ok = await K8sService.deleteNamespace(name);
    if (ok) {
      fetchData();
    } else {
      alert('Failed to delete namespace.');
    }
  };

  const filtered = namespaces.filter(ns => ns.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>Namespace Center</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Lifecycle management and resource isolation</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'var(--bg-card)', border: 'var(--border-glass)', borderRadius: '12px' }}>
            <Search size={16} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="Search namespaces..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '0.85rem' }}
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> New Namespace
          </button>
        </div>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <RefreshCw size={32} className="spin" color="var(--accent-blue)" />
          <div style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading cluster topology...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          <AnimatePresence>
            {filtered.map(ns => {
              const stats = breakdown[ns] || { pods: 0, running: 0, failing: 0, restarts: 0 };
              const isSystem = ['default', 'kube-system', 'k8pilot', 'kube-public', 'kube-node-lease'].includes(ns);
              
              return (
                <motion.div 
                  key={ns}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="glass-card"
                  style={{ borderLeft: `4px solid ${isSystem ? 'var(--accent-purple)' : 'var(--accent-blue)'}` }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{ns}</h3>
                        {isSystem && <span style={{ fontSize: '0.65rem', background: 'rgba(168,85,247,0.1)', color: 'var(--accent-purple)', padding: '2px 6px', borderRadius: '4px' }}>SYSTEM</span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Active Workspace</div>
                    </div>
                    <button 
                      onClick={() => handleDelete(ns)}
                      disabled={isSystem}
                      style={{ padding: '8px', background: 'rgba(239,68,68,0.05)', border: 'none', borderRadius: '8px', color: 'var(--error)', cursor: isSystem ? 'not-allowed' : 'pointer', opacity: isSystem ? 0.3 : 1 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Layers size={12} /> Workloads
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{stats.pods} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>Pods</span></div>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Activity size={12} /> Health
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: stats.failing > 0 ? 'var(--error)' : 'var(--success)' }}>
                         {stats.pods > 0 ? (stats.failing === 0 ? '100%' : `${Math.round(((stats.running)/stats.pods)*100)}%`) : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {stats.restarts > 0 && (
                    <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                       ⚠️ {stats.restarts} total pod restarts detected
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="modal-content" 
            style={{ maxWidth: '400px', padding: '32px' }}
          >
            <h2 style={{ marginBottom: '8px' }}>New Namespace</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>Create an isolated workspace for your workloads.</p>
            
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Namespace Name</label>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="e.g. production, staging"
                  value={newNsName}
                  onChange={e => setNewNsName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'var(--border-glass)', borderRadius: '10px', padding: '12px', color: 'white', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: 'var(--border-glass)', color: 'white', borderRadius: '12px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={creating || !newNsName} className="btn-primary" style={{ flex: 1, opacity: (creating || !newNsName) ? 0.5 : 1 }}>
                   {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
