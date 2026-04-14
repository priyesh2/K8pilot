import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { X, Box, Cpu, HardDrive, Network, Tag, Activity, Trash2, Terminal, Clock, Zap } from 'lucide-react';

interface PodDetailModalProps {
  podName: string;
  namespace: string;
  onClose: () => void;
  onViewLogs: (podName: string, namespace: string) => void;
  onOpenTerminal: (container?: string) => void;
}

const MetricChart: React.FC<{ data: any[], label: string, color: string, dataKey: string }> = ({ data, label, color, dataKey }) => {
  const values = data.map(d => d[dataKey]);
  const max = Math.max(...values, 1);
  const points = values.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max * 100)}`).join(' ');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color }}>{values[values.length - 1] || 0}</span>
      </div>
      <div style={{ flex: 1, minHeight: '60px', position: 'relative' }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
            points={points}
            style={{ filter: `drop-shadow(0 0 4px ${color}66)` }}
          />
        </svg>
      </div>
    </div>
  );
};

export const PodDetailModal: React.FC<PodDetailModalProps> = ({ podName, namespace, onClose, onViewLogs, onOpenTerminal }) => {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [debugging, setDebugging] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [history, setHistory] = useState<any[]>([]);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [diagnosing, setDiagnosing] = useState(false);
  const [remediation, setRemediation] = useState<any>(null);
  const [loadingRemediation, setLoadingRemediation] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [d, h] = await Promise.all([
        K8sService.describePod(podName, namespace),
        K8sService.getMetricHistory(namespace, podName)
      ]);
      setDetail(d);
      setHistory(h);
      setLoading(false);
    };
    load();
  }, [podName, namespace]);

  const handleDiagnose = async () => {
    setDiagnosing(true);
    setLoadingRemediation(true);
    const [diag, rem] = await Promise.all([
      K8sService.diagnosePod(namespace, podName),
      K8sService.getRemediationProposal(namespace, podName)
    ]);
    setDiagnosis(diag);
    setRemediation(rem);
    setDiagnosing(false);
    setLoadingRemediation(false);
  };

  const handleDelete = async () => {
    if (!confirm(`⚠️ Delete pod "${podName}" from namespace "${namespace}"?\n\nThis will terminate the pod immediately. If it's managed by a Deployment/ReplicaSet, a replacement will be created.`)) return;
    setDeleting(true);
    const ok = await K8sService.deletePod(podName, namespace);
    if (ok) {
      alert(`✅ Pod "${podName}" deleted`);
      onClose();
    } else {
      alert(`❌ Failed to delete pod. Check RBAC permissions.`);
      setDeleting(false);
    }
  };

  const handleDebug = async () => {
    if (debugging) return;
    setDebugging(true);
    const ok = await K8sService.injectDebugContainer(podName, namespace);
    if (ok) {
      alert(`🚀 Debug container injected. Opening terminal...`);
      setTimeout(() => {
        onOpenTerminal(); // Let it auto-detect the debug container
        setDebugging(false);
      }, 2000);
    } else {
      alert(`❌ Debug injection failed. Verify cluster version >=1.25 and RBAC permissions.`);
      setDebugging(false);
    }
  };

  const phaseColor = (phase: string) => {
    if (phase === 'Running') return 'var(--success)';
    if (phase === 'Succeeded') return 'var(--accent-cyan)';
    if (phase === 'Pending') return 'var(--warning)';
    return 'var(--error)';
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '720px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ padding: '10px', background: 'var(--gradient-primary)', borderRadius: '12px' }}>
              <Box size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>{podName}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{namespace}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', paddingLeft: '28px', paddingRight: '28px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {['overview', 'history'].map(t => (
            <button 
              key={t}
              onClick={() => setActiveTab(t)}
              style={{ 
                padding: '12px 24px', background: 'transparent', border: 'none', 
                color: activeTab === t ? 'var(--accent-blue)' : 'var(--text-secondary)', 
                fontWeight: 700, cursor: 'pointer', borderBottom: activeTab === t ? '2px solid var(--accent-blue)' : '2px solid transparent',
                textTransform: 'capitalize', fontSize: '0.85rem'
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <Activity size={24} style={{ animation: 'pulse 1.5s infinite' }} />
              <div style={{ marginTop: '12px' }}>Loading pod details...</div>
            </div>
          ) : !detail ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--error)' }}>Failed to load pod details</div>
          ) : activeTab === 'overview' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Status Overview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Phase</div>
                  <div style={{ fontWeight: 700, color: phaseColor(detail.phase) }}>{detail.phase}</div>
                </div>
                <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Restarts</div>
                  <div style={{ fontWeight: 700, color: detail.restarts > 5 ? 'var(--error)' : detail.restarts > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>{detail.restarts}</div>
                </div>
                <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Node</div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{detail.nodeName}</div>
                </div>
                <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Pod IP</div>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{detail.ip}</div>
                </div>
              </div>

              {/* Containers */}
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Box size={16} color="var(--accent-purple)" /> Containers ({detail.containers?.length || 0})
                </h3>
                {(detail.containers || []).map((c: any) => (
                  <div key={c.name} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
                      {c.name}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <button onClick={() => onOpenTerminal(c.name)} style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                        background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)',
                        borderRadius: '8px', color: 'var(--accent-purple)', fontWeight: 600, cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}>
                        <Terminal size={12} /> Exec
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Image: </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', wordBreak: 'break-all' }}>{c.image}</span>
                      </div>
                      {c.ports && c.ports.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Network size={14} color="var(--accent-cyan)" />
                          <span>{c.ports.join(', ')}</span>
                        </div>
                      )}
                    </div>
                    {/* Resource Requests/Limits */}
                    {(Object.keys(c.requests || {}).length > 0 || Object.keys(c.limits || {}).length > 0) && (
                      <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem' }}>
                        {Object.keys(c.requests || {}).length > 0 && (
                          <div style={{ padding: '8px', background: 'rgba(59,130,246,0.05)', borderRadius: '8px' }}>
                            <div style={{ color: 'var(--accent-blue)', fontWeight: 600, marginBottom: '4px' }}>Requests</div>
                            {c.requests.cpu && <div><Cpu size={12} style={{ display: 'inline' }} /> CPU: {c.requests.cpu}</div>}
                            {c.requests.memory && <div><HardDrive size={12} style={{ display: 'inline' }} /> Mem: {c.requests.memory}</div>}
                          </div>
                        )}
                        {Object.keys(c.limits || {}).length > 0 && (
                          <div style={{ padding: '8px', background: 'rgba(239,68,68,0.05)', borderRadius: '8px' }}>
                            <div style={{ color: 'var(--error)', fontWeight: 600, marginBottom: '4px' }}>Limits</div>
                            {c.limits.cpu && <div><Cpu size={12} style={{ display: 'inline' }} /> CPU: {c.limits.cpu}</div>}
                            {c.limits.memory && <div><HardDrive size={12} style={{ display: 'inline' }} /> Mem: {c.limits.memory}</div>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Conditions */}
              {detail.conditions && detail.conditions.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={16} color="var(--accent-cyan)" /> Conditions
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {detail.conditions.map((c: any) => (
                      <div key={c.type} style={{
                        padding: '8px 14px', borderRadius: '10px', fontSize: '0.78rem',
                        background: c.status === 'True' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                        border: `1px solid ${c.status === 'True' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        display: 'flex', alignItems: 'center', gap: '6px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.status === 'True' ? 'var(--success)' : 'var(--error)' }} />
                        <span style={{ fontWeight: 600 }}>{c.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Labels */}
              {detail.labels && Object.keys(detail.labels).length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tag size={16} color="var(--warning)" /> Labels
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {Object.entries(detail.labels).map(([k, v]) => (
                      <span key={k} style={{
                        padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem',
                        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.82rem' }}>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Service Account: </span>
                  <span style={{ fontWeight: 600 }}>{detail.serviceAccount}</span>
                </div>
                {detail.startTime && (
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} color="var(--text-secondary)" />
                    <span style={{ color: 'var(--text-secondary)' }}>Started: </span>
                    <span style={{ fontWeight: 600 }}>{new Date(detail.startTime).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Diagnosis Section */}
              <div style={{ padding: '20px', background: 'rgba(59,130,246,0.05)', borderRadius: '16px', border: '1px solid rgba(59,130,246,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                     <Zap size={16} color="var(--accent-blue)" /> AI Pod Doctor
                   </div>
                   {!diagnosis && <button onClick={handleDiagnose} disabled={diagnosing} style={{ background: 'var(--accent-blue)', border: 'none', borderRadius: '6px', color: 'white', padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                     {diagnosing ? 'Analyzing...' : 'Run Diagnosis'}
                   </button>}
                </div>
                {diagnosis && (
                  <div style={{ fontSize: '0.85rem' }}>
                    <div style={{ color: diagnosis.severity === 'HIGH' ? 'var(--error)' : 'var(--text-primary)', fontWeight: 600 }}>{diagnosis.diagnosis}</div>
                    <div style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>💡 **Action:** {diagnosis.action}</div>
                    
                    {remediation && remediation.type !== 'INFO' && (
                      <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--accent-purple)', marginBottom: '8px' }}>
                          <Zap size={14} /> Orion Auto-Fix Suggestion
                        </div>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{remediation.title}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{remediation.description}</div>
                        {remediation.patch && (
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify(remediation.patch, null, 2));
                              alert('📋 Patch copied to clipboard! You can apply this via the YAML editor or kubectl.');
                            }}
                            style={{ 
                              marginTop: '12px', width: '100%', padding: '8px', background: 'var(--accent-purple)', 
                              border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' 
                            }}
                          >
                            Copy Remediation Patch
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* History Tab Content */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px' }}>Performance History (60m Window)</h3>
                <div style={{ height: '250px', position: 'relative', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <MetricChart data={history} label="CPU Usage (m)" color="var(--accent-blue)" dataKey="c" />
                  <MetricChart data={history} label="Memory Usage (Mi)" color="var(--accent-purple)" dataKey="m" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={handleDebug} disabled={debugging} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
            background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)',
            borderRadius: '10px', color: 'var(--accent-cyan)', fontWeight: 600, cursor: debugging ? 'wait' : 'pointer',
            fontSize: '0.85rem', fontFamily: 'var(--font-main)', opacity: debugging ? 0.5 : 1
          }}>
            <Box size={16} /> {debugging ? 'Injecting...' : 'Debug Shell'}
          </button>
          <button onClick={() => onViewLogs(podName, namespace)} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: '10px', color: 'var(--accent-blue)', fontWeight: 600, cursor: 'pointer',
            fontSize: '0.85rem', fontFamily: 'var(--font-main)'
          }}>
            <Terminal size={16} /> View Logs
          </button>
          <button onClick={() => onOpenTerminal()} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
            background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)',
            borderRadius: '10px', color: 'var(--accent-purple)', fontWeight: 600, cursor: 'pointer',
            fontSize: '0.85rem', fontFamily: 'var(--font-main)'
          }}>
            <Terminal size={16} /> Interactive Terminal
          </button>
          <button onClick={handleDelete} disabled={deleting} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '10px', color: 'var(--error)', fontWeight: 600, cursor: deleting ? 'wait' : 'pointer',
            fontSize: '0.85rem', fontFamily: 'var(--font-main)', opacity: deleting ? 0.5 : 1
          }}>
            <Trash2 size={16} /> {deleting ? 'Deleting...' : 'Delete Pod'}
          </button>
        </div>
      </div>
    </div>
  );
};
