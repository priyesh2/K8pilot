import React, { useState, useEffect, useRef } from 'react';
import { K8sService } from '../services/k8s';
import { Search, Box, Layers, Globe, Zap, ArrowRight, CornerDownLeft, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResult {
  id: string;
  name: string;
  type: 'Pod' | 'Service' | 'Deployment';
  namespace: string;
}

interface OmniSearchProps {
  onClose: () => void;
  onNavigate: (view: string, ns?: string) => void;
  onPodClick: (name: string, ns: string) => void;
}

export const OmniSearch: React.FC<OmniSearchProps> = ({ onClose, onNavigate, onPodClick }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [commandMode, setCommandMode] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const search = async () => {
      if (query.startsWith('/')) {
        setCommandMode(true);
        const cmds = ['/scale ', '/restart ', '/debug ', '/logs '];
        setResults([]);
        setSuggestions(cmds.filter(c => c.startsWith(query)));
        return;
      }
      
      setCommandMode(false);
      if (query.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const [pods, svcs, deps] = await Promise.all([
          K8sService.getPods('all'),
          K8sService.getServices('all'),
          K8sService.getDeployments('all')
        ]);

        const filtered: SearchResult[] = [
          ...pods.filter(p => p.name.includes(query)).map(p => ({ id: p.id, name: p.name, type: 'Pod' as const, namespace: p.namespace })),
          ...svcs.filter(s => s.name.includes(query)).map(s => ({ id: s.name + s.namespace, name: s.name, type: 'Service' as const, namespace: s.namespace })),
          ...deps.filter(d => d.name.includes(query)).map(d => ({ id: d.name + d.namespace, name: d.name, type: 'Deployment' as const, namespace: d.namespace }))
        ];
        setResults(filtered.slice(0, 10));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % Math.max(results.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + results.length) % Math.max(results.length, 1));
      } else if (e.key === 'Enter' && results[activeIndex]) {
        handleAction(results[activeIndex]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleDown);
    return () => window.removeEventListener('keydown', handleDown);
  }, [results, activeIndex]);

  const handleAction = (res: SearchResult) => {
    if (res.type === 'Pod') {
      onPodClick(res.name, res.namespace);
    } else if (res.type === 'Service') {
       onNavigate('services', res.namespace);
    } else if (res.type === 'Deployment') {
       onNavigate('deployments', res.namespace);
    }
    onClose();
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'Pod': return <Box size={16} color="var(--success)" />;
      case 'Service': return <Globe size={16} color="var(--accent-blue)" />;
      case 'Deployment': return <Layers size={16} color="var(--accent-purple)" />;
      default: return <Zap size={16} />;
    }
  };

  return (
    <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: '15vh' }} onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card" 
        style={{ width: '600px', padding: '0', overflow: 'hidden', background: 'var(--bg-glass)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '20px', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Search size={22} color="var(--text-secondary)" />
          <input 
            ref={inputRef}
            autoFocus
            type="text" 
            placeholder="Search pods, services... or type / for commands"
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIndex(0); }}
            style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: '1.2rem', outline: 'none' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            <Command size={10} /> K
          </div>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px' }}>
          {loading && query.length >= 2 ? (
             <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Filtering the cluster...</div>
          ) : commandMode ? (
            <div style={{ padding: '8px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '12px', paddingLeft: '8px' }}>Slash Commands</div>
              {suggestions.map((s, i) => (
                <div 
                  key={s} 
                  onClick={() => setQuery(s)}
                  style={{ padding: '12px 16px', borderRadius: '10px', background: i === activeIndex ? 'rgba(59,130,246,0.1)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <motion.div animate={{ rotate: i === activeIndex ? 360 : 0 }}><Zap size={14} color="var(--accent-blue)" /></motion.div>
                  <span style={{ fontWeight: 600 }}>{s}</span>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            results.map((res, i) => (
              <div 
                key={res.id} 
                onClick={() => handleAction(res)}
                onMouseEnter={() => setActiveIndex(i)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
                  background: i === activeIndex ? 'rgba(255,255,255,0.05)' : 'transparent',
                  transition: 'background 0.1s'
                }}
              >
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px' }}>
                  {getIcon(res.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: i === activeIndex ? 'var(--accent-blue)' : 'white' }}>{res.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{res.type} • {res.namespace}</div>
                </div>
                {i === activeIndex && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                    Go to <CornerDownLeft size={10} />
                  </div>
                )}
              </div>
            ))
          ) : query.length >= 2 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No resources matching "{query}"</div>
          ) : (
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', paddingLeft: '8px' }}>Quick Actions</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <QuickAction icon={<Layers size={14} />} label="View Deployments" onClick={() => onNavigate('deployments')} />
                <QuickAction icon={<Globe size={14} />} label="View Services" onClick={() => onNavigate('services')} />
                <QuickAction icon={<Command size={14} />} label="View Settings" onClick={() => onNavigate('settings')} />
                <QuickAction icon={<Box size={14} />} label="View Nodes" onClick={() => onNavigate('nodes')} />
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.68rem', display: 'flex', gap: '16px' }}>
            <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '3px' }}>↑↓</kbd> to navigate</span>
            <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '3px' }}>Enter</kbd> to select</span>
            <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '3px' }}>ESC</kbd> to dismiss</span>
          </div>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--accent-blue)', opacity: 0.6 }}>GALAXY SEARCH</div>
        </div>
      </motion.div>
    </div>
  );
};

const QuickAction = ({ icon, label, onClick }: any) => (
  <div 
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.15s' }}
    onMouseEnter={e => { (e.currentTarget as any).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as any).style.borderColor = 'rgba(255,255,255,0.1)'; }}
    onMouseLeave={e => { (e.currentTarget as any).style.background = 'rgba(255,255,255,0.02)'; (e.currentTarget as any).style.borderColor = 'transparent'; }}
  >
    {icon}
    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{label}</span>
  </div>
);
