import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Cpu, HardDrive, Shield, AlertTriangle, CheckCircle2, XCircle, Activity, Server } from 'lucide-react';

const ProgressBar = ({ percent, color, label }: { percent: number; color: string; label: string }) => (
  <div style={{ marginBottom: '16px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{percent}%</span>
    </div>
    <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${Math.min(percent, 100)}%`, borderRadius: '4px',
        background: percent > 85 ? 'var(--error)' : percent > 60 ? 'var(--warning)' : color,
        transition: 'width 0.8s ease-out',
        boxShadow: `0 0 12px ${percent > 85 ? 'rgba(239,68,68,0.4)' : 'transparent'}`
      }} />
    </div>
  </div>
);

export const MetricsView: React.FC = () => {
  const [resources, setResources] = useState<any>(null);
  const [security, setSecurity] = useState<any>(null);
  const [nodeMetrics, setNodeMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [res, sec, nm] = await Promise.all([
        K8sService.getResourceSummary(),
        K8sService.getSecurityAudit(),
        K8sService.getNodeMetrics()
      ]);
      setResources(res);
      setSecurity(sec);
      setNodeMetrics(nm);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !resources) return (
    <div className="dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
        <Activity size={32} style={{ animation: 'pulse 1.5s infinite' }} />
        <div style={{ marginTop: '16px', fontWeight: 600 }}>Scanning cluster resources...</div>
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>Metrics & Security</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Resource utilization, capacity planning & compliance audit</p>
      </header>

      {/* Resource Utilization Cards */}
      {resources && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '10px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px' }}>
                  <Server size={20} color="var(--accent-blue)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nodes</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{resources.nodes}</div>
                </div>
              </div>
            </div>
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '10px', background: 'rgba(34,211,238,0.1)', borderRadius: '12px' }}>
                  <Activity size={20} color="var(--accent-cyan)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pods</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{resources.pods}</div>
                </div>
              </div>
            </div>
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '10px', background: 'rgba(139,92,246,0.1)', borderRadius: '12px' }}>
                  <Cpu size={20} color="var(--accent-purple)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CPU Requested</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{resources.requests.cpu} cores</div>
                </div>
              </div>
            </div>
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '10px', background: 'rgba(34,197,94,0.1)', borderRadius: '12px' }}>
                  <HardDrive size={20} color="var(--success)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Memory Requested</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{resources.requests.memoryMi} Mi</div>
                </div>
              </div>
            </div>
          </div>

          {/* Utilization Gauges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            <div className="glass-card">
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Cpu size={18} color="var(--accent-purple)" /> CPU Utilization
              </div>
              <ProgressBar percent={resources.utilization.cpuPercent} color="var(--accent-purple)" label="Requests / Capacity" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '16px', fontSize: '0.82rem' }}>
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-secondary)' }}>Requested</div>
                  <div style={{ fontWeight: 700 }}>{resources.requests.cpu}</div>
                </div>
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-secondary)' }}>Limits</div>
                  <div style={{ fontWeight: 700 }}>{resources.limits.cpu}</div>
                </div>
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-secondary)' }}>Capacity</div>
                  <div style={{ fontWeight: 700 }}>{resources.capacity.cpu}</div>
                </div>
              </div>
            </div>
            <div className="glass-card">
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <HardDrive size={18} color="var(--success)" /> Memory Utilization
              </div>
              <ProgressBar percent={resources.utilization.memPercent} color="var(--success)" label="Requests / Capacity" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '16px', fontSize: '0.82rem' }}>
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-secondary)' }}>Requested</div>
                  <div style={{ fontWeight: 700 }}>{resources.requests.memoryMi} Mi</div>
                </div>
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-secondary)' }}>Limits</div>
                  <div style={{ fontWeight: 700 }}>{resources.limits.memoryMi} Mi</div>
                </div>
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-secondary)' }}>Capacity</div>
                  <div style={{ fontWeight: 700 }}>{resources.capacity.memoryMi} Mi</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Node Metrics (if metrics-server available) */}
      {nodeMetrics.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Server size={18} color="var(--accent-blue)" /> Live Node Metrics
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {nodeMetrics.map(n => (
              <div key={n.name} className="glass-card" style={{ padding: '16px' }}>
                <div style={{ fontWeight: 700, marginBottom: '12px' }}>{n.name}</div>
                <div style={{ display: 'flex', gap: '24px', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>CPU: </span>
                    <span style={{ fontWeight: 600, color: 'var(--accent-purple)' }}>{n.cpu}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Memory: </span>
                    <span style={{ fontWeight: 600, color: 'var(--success)' }}>{n.memory}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Audit Section */}
      {security && (
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={18} color="var(--accent-cyan)" /> Security Audit
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Scanned</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{security.scannedPods}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>pods</div>
            </div>
            <div className="glass-card" style={{ padding: '16px', textAlign: 'center', borderColor: security.high > 0 ? 'rgba(239,68,68,0.3)' : undefined }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--error)', marginBottom: '8px' }}>High</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: security.high > 0 ? 'var(--error)' : 'var(--text-primary)' }}>{security.high}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>findings</div>
            </div>
            <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--warning)', marginBottom: '8px' }}>Medium</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{security.medium}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>findings</div>
            </div>
            <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', marginBottom: '8px' }}>Low</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{security.low}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>findings</div>
            </div>
          </div>

          {security.findings.length > 0 ? (
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Severity</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Pod</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Issue</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {security.findings.slice(0, 15).map((f: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
                          background: f.severity === 'HIGH' ? 'rgba(239,68,68,0.15)' : f.severity === 'MEDIUM' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                          color: f.severity === 'HIGH' ? 'var(--error)' : f.severity === 'MEDIUM' ? 'var(--warning)' : 'var(--accent-blue)'
                        }}>
                          {f.severity}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.pod}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.issue}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{f.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="glass-card" style={{ textAlign: 'center', padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--success)' }}>
              <CheckCircle2 size={24} /> All pods pass security checks!
            </div>
          )}
        </div>
      )}
    </div>
  );
};
