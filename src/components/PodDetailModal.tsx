import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { X, Box, Cpu, HardDrive, Network, Tag, Activity, Trash2, Terminal, Clock } from 'lucide-react';

interface PodDetailModalProps {
  podName: string;
  namespace: string;
  onClose: () => void;
  onViewLogs: (podName: string, namespace: string) => void;
}

export const PodDetailModal: React.FC<PodDetailModalProps> = ({ podName, namespace, onClose, onViewLogs }) => {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const d = await K8sService.describePod(podName, namespace);
      setDetail(d);
      setLoading(false);
    };
    load();
  }, [podName, namespace]);

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

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <Activity size={24} style={{ animation: 'pulse 1.5s infinite' }} />
              <div style={{ marginTop: '12px' }}>Loading pod details...</div>
            </div>
          ) : !detail ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--error)' }}>Failed to load pod details</div>
          ) : (
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
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={() => onViewLogs(podName, namespace)} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: '10px', color: 'var(--accent-blue)', fontWeight: 600, cursor: 'pointer',
            fontSize: '0.85rem', fontFamily: 'var(--font-main)'
          }}>
            <Terminal size={16} /> View Logs
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
