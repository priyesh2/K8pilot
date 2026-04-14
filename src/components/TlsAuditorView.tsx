import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Lock, Unlock, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export const TlsAuditorView: React.FC<{ onNavigate?: (view: string) => void }> = ({ onNavigate }) => {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    K8sService.getTlsAudit().then(res => {
      setCerts(res);
      setLoading(false);
    });
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'CRITICAL': return 'var(--error)';
      case 'WARNING': return 'var(--warning)';
      default: return 'var(--success)';
    }
  };

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>TLS Auditor</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Automated X.509 expiration tracking and security monitoring</p>
      </header>

      {loading ? <div className="skeleton" style={{ height: '400px' }} /> : certs.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
          <Unlock size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>No TLS Secrets Found</h2>
          <p style={{ color: 'var(--text-secondary)' }}>We couldn't find any 'kubernetes.io/tls' secrets in this cluster.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
          {certs.map((c, i) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              key={c.namespace + c.name}
              className="glass-card" 
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ 
                position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', 
                background: getStatusColor(c.status) 
              }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <Lock size={18} color={getStatusColor(c.status)} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{c.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Namespace: {c.namespace}</div>
                  </div>
                </div>
                {c.status !== 'HEALTHY' && (
                  <div style={{ padding: '4px 8px', background: `${getStatusColor(c.status)}22`, borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, color: getStatusColor(c.status), display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={10} /> {c.status}
                  </div>
                )}
              </div>

              <div style={{ background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Common Name / Subject</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>{c.subject}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Expires In</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: getStatusColor(c.status) }}>{c.daysRemaining}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Days</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Expiration Date</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{new Date(c.expires).toLocaleDateString()}</div>
                </div>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
                 <button 
                   onClick={() => onNavigate && onNavigate('configmaps')} // Navigates to Config/Secrets view
                   style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                 >
                   View Secret Details <ExternalLink size={14} />
                 </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
