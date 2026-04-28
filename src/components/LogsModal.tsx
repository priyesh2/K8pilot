import React, { useEffect, useRef, useState } from 'react';
import { X, Download, Terminal, Settings, Clock, Search, List, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { K8sService } from '../services/k8s';

interface LogsModalProps {
  podName: string;
  namespace: string;
  container?: string;
  onClose: () => void;
}

export const LogsModal: React.FC<LogsModalProps> = ({ podName, namespace, container, onClose }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [wrapLines, setWrapLines] = useState(true);
  const [filter, setFilter] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containers, setContainers] = useState<string[]>([]);
  const [activeContainer, setActiveContainer] = useState(container || '');
  const logEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    K8sService.describePod(podName, namespace).then(pod => {
      const names = (pod.containers || []).map((c: any) => c.name);
      setContainers(names);
      if (!activeContainer && names.length > 0) setActiveContainer(names[0]);
    });
  }, [podName, namespace]);

  useEffect(() => {
    if (!activeContainer) return;
    setLogs([]); // Clear logs on container change
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const token = localStorage.getItem('k8s_token');
    const wsUrl = `${protocol}//${host}/api/logs/stream?token=${token}&namespace=${namespace}&pod=${podName}&container=${activeContainer}&tail=200`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      setError(null);
    };

    socket.onmessage = (event) => {
      setLogs(prev => [...prev.slice(-1000), event.data]);
    };

    socket.onerror = () => {
      setError('Connection error. Retrying...');
    };

    socket.onclose = () => {
      setConnected(false);
    };

    return () => socket.close();
  }, [podName, namespace, activeContainer]);

  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(line => line.toLowerCase().includes(filter.toLowerCase()));

  const downloadLogs = () => {
    const blob = new Blob([logs.join('')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${podName}-${activeContainer}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" style={{ padding: '40px' }}>
      <div className="modal-content" style={{ width: '90%', maxWidth: '1200px', height: '85vh', display: 'flex', flexDirection: 'column', background: '#0a0b10' }}>
        {/* Header */}
        <header style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div style={{ padding: '8px', background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)', borderRadius: '10px' }}>
                <List size={20} />
             </div>
             <div>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>Log Stream: {podName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {namespace} 
                  {containers.length > 1 ? (
                    <select 
                      value={activeContainer} 
                      onChange={e => setActiveContainer(e.target.value)}
                      style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--accent-blue)', fontSize: '0.75rem', fontWeight: 600, outline: 'none', cursor: 'pointer', padding: '0 4px', borderRadius: '4px' }}
                    >
                      {containers.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <span>• {activeContainer}</span>
                  )}
                </div>
             </div>
             {connected ? (
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--success)', marginLeft: '12px', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', animation: 'pulse 1.5s infinite' }} /> Connected
               </div>
             ) : (
               <div style={{ fontSize: '0.7rem', color: 'var(--warning)', marginLeft: '12px' }}>Connecting...</div>
             )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
             <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  value={filter} onChange={e => setFilter(e.target.value)}
                  placeholder="Filter logs..." 
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px 8px 32px', color: 'white', fontSize: '0.85rem', width: '200px' }} 
                />
             </div>
             <button onClick={downloadLogs} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <Download size={16} /> Download
             </button>
             <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
                <X size={24} />
             </button>
          </div>
        </header>

        {/* Toolbar */}
        <div style={{ padding: '8px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '24px' }}>
           <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} /> Auto-scroll
           </label>
           <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={wrapLines} onChange={e => setWrapLines(e.target.checked)} /> Wrap Lines
           </label>
           <div style={{ flex: 1 }} />
           <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Showing {filteredLogs.length} / {logs.length} lines</div>
        </div>

        {/* Log Area */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#050608', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', lineHeight: 1.6 }}>
           {filteredLogs.length === 0 && !error && (
             <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Waiting for log output...</div>
           )}
           {error && (
             <div style={{ padding: '40px', textAlign: 'center', color: 'var(--error)' }}>{error}</div>
           )}
           <div style={{ whiteSpace: wrapLines ? 'pre-wrap' : 'pre', wordBreak: 'break-all', color: '#cad2e2' }}>
             {filteredLogs.map((line, i) => (
                <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', padding: '2px 0' }}>{line}</div>
             ))}
           </div>
           <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
};
