import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Database } from 'lucide-react';

export const RegistryStreamView: React.FC = () => {
  const [logs, setLogs] = useState<{ id: string, text: string, type: 'info' | 'pull' | 'push' | 'scan' }[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate incoming streaming logs from OCI Registry with interval
    const interval = setInterval(() => {
      const types: ('info' | 'pull' | 'push' | 'scan')[] = ['info', 'pull', 'scan', 'pull', 'info'];
      const messages = [
        '[oci-bridge] Heartbeat OK',
        '[pull] docker.io/cerebro46/k8pilot:v3.0 ... extracting layers [=============>]',
        '[scan] Analyzing digest sha256:8b3a... High Severity CVEs: 0',
        '[pull] Handshake successful with registry-1.docker.io',
        '[push] Detected webhook from GitHub Actions... no action required.',
        '[oci-bridge] Caching layer blobd:7f4c...'
      ];
      const newLog = {
        id: Math.random().toString(),
        type: types[Math.floor(Math.random() * types.length)],
        text: `${new Date().toISOString()} ${messages[Math.floor(Math.random() * messages.length)]}`
      };
      
      setLogs(prev => {
        const next = [...prev, newLog];
        if (next.length > 50) return next.slice(next.length - 50); // Keep last 50
        return next;
      });
    }, 1500);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>Registry Matrix Stream</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Live asynchronous OCI Artifact and Image tracking</p>
      </header>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden', height: '60vh', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(34,211,238,0.2)' }}>
        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Terminal size={18} color="var(--accent-cyan)" />
          <span style={{ fontWeight: 600, color: 'var(--accent-cyan)', letterSpacing: '2px' }}>OCI-BRIDGE-SECURE-COM</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--error)' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--warning)' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--success)' }} />
          </div>
        </div>
        
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, fontFamily: 'monospace', fontSize: '0.9rem' }}>
          <AnimatePresence>
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ 
                  marginBottom: '8px',
                  color: log.type === 'pull' ? 'var(--accent-blue)' : log.type === 'scan' ? 'var(--warning)' : 'var(--success)',
                  textShadow: '0 0 5px currentColor'
                }}
              >
                {log.text}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};
