import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Server, Cpu, HardDrive, Activity, RefreshCw, Wifi, WifiOff, Shield, Clock } from 'lucide-react';

const parseCpuNano = (s: string): number => {
  if (!s) return 0;
  if (s.endsWith('n')) return parseInt(s);
  if (s.endsWith('u')) return parseInt(s) * 1000;
  if (s.endsWith('m')) return parseInt(s) * 1000000;
  return parseFloat(s) * 1000000000;
};

const formatCpu = (nano: number): string => {
  if (nano >= 1000000000) return `${(nano / 1000000000).toFixed(2)} cores`;
  if (nano >= 1000000) return `${Math.round(nano / 1000000)}m`;
  return `${Math.round(nano / 1000)}µ`;
};

const parseCapCpu = (s: string): number => {
  if (!s) return 0;
  if (s.endsWith('m')) return parseInt(s) * 1000000;
  return parseFloat(s) * 1000000000;
};

const parseCapMem = (s: string): number => {
  if (!s) return 0;
  if (s.endsWith('Ki')) return parseInt(s);
  if (s.endsWith('Mi')) return parseInt(s) * 1024;
  if (s.endsWith('Gi')) return parseInt(s) * 1024 * 1024;
  return parseInt(s) / 1024;
};

const formatMem = (ki: number): string => {
  if (ki >= 1048576) return `${(ki / 1048576).toFixed(1)} Gi`;
  if (ki >= 1024) return `${Math.round(ki / 1024)} Mi`;
  return `${ki} Ki`;
};

const formatAge = (timestamp: string): string => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const GaugeRing = ({ percent, color, label, value }: { percent: number; color: string; label: string; value: string }) => {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(percent, 100) / 100) * circumference;
  const gaugeColor = percent > 85 ? 'var(--error)' : percent > 60 ? 'var(--warning)' : color;

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx="55" cy="55" r={radius} fill="none" stroke={gaugeColor} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" transform="rotate(-90 55 55)"
          style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.3s' }} />
        <text x="55" y="52" textAnchor="middle" fill="white" fontSize="18" fontWeight="800">{percent}%</text>
        <text x="55" y="70" textAnchor="middle" fill="var(--text-secondary)" fontSize="10">{value}</text>
      </svg>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 600 }}>{label}</div>
    </div>
  );
};

export const NodesView: React.FC = () => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [nodeMetrics, setNodeMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = async () => {
    setLoading(true);
    const [n, nm] = await Promise.all([
      K8sService.getNodes(),
      K8sService.getNodeMetrics()
    ]);
    setNodes(n);
    setNodeMetrics(nm);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const getNodeMetric = (name: string) => nodeMetrics.find(m => m.name === name);

  // Cluster-wide totals
  const totalCpuCap = nodes.reduce((s, n) => s + parseCapCpu(n.cpu), 0);
  const totalMemCap = nodes.reduce((s, n) => s + parseCapMem(n.memory), 0);
  const totalCpuUsed = nodeMetrics.reduce((s, m) => s + parseCpuNano(m.cpu), 0);
  const totalMemUsed = nodeMetrics.reduce((s, m) => s + parseCapMem(m.memory), 0);
  const clusterCpuPercent = totalCpuCap > 0 ? Math.round((totalCpuUsed / totalCpuCap) * 100) : 0;
  const clusterMemPercent = totalMemCap > 0 ? Math.round((totalMemUsed / totalMemCap) * 100) : 0;

  if (loading && nodes.length === 0) return (
    <div className="dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
        <Server size={32} style={{ animation: 'pulse 1.5s infinite' }} />
        <div style={{ marginTop: '16px', fontWeight: 600 }}>Discovering nodes...</div>
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '4px', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Node Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Cluster node health, capacity & live metrics • {nodes.length} node{nodes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', fontFamily: 'var(--font-main)' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      {/* Cluster Overview Gauges */}
      {nodeMetrics.length > 0 && (
        <div className="glass-card" style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '32px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <Activity size={18} color="var(--accent-blue)" /> Cluster Utilization
            </div>
            <div style={{ display: 'flex', gap: '48px', justifyContent: 'center' }}>
              <GaugeRing percent={clusterCpuPercent} color="var(--accent-purple)" label="CPU" value={formatCpu(totalCpuUsed)} />
              <GaugeRing percent={clusterMemPercent} color="var(--success)" label="Memory" value={formatMem(totalMemUsed)} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '48px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total CPU Capacity</span>
              <span style={{ fontWeight: 700 }}>{formatCpu(totalCpuCap)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '48px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Memory Capacity</span>
              <span style={{ fontWeight: 700 }}>{formatMem(totalMemCap)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '48px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Active Nodes</span>
              <span style={{ fontWeight: 700, color: 'var(--success)' }}>{nodes.filter(n => n.status === 'Ready').length}/{nodes.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '48px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Last Updated</span>
              <span style={{ fontWeight: 700 }}>{lastRefresh.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Node Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
        {nodes.map(node => {
          const metric = getNodeMetric(node.name);
          const cpuCap = parseCapCpu(node.cpu);
          const memCap = parseCapMem(node.memory);
          const cpuUsed = metric ? parseCpuNano(metric.cpu) : 0;
          const memUsed = metric ? parseCapMem(metric.memory) : 0;
          const cpuPercent = cpuCap > 0 ? Math.round((cpuUsed / cpuCap) * 100) : 0;
          const memPercent = memCap > 0 ? Math.round((memUsed / memCap) * 100) : 0;

          return (
            <div key={node.name} className="glass-card" style={{ padding: '24px' }}>
              {/* Node Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    padding: '12px', borderRadius: '14px',
                    background: node.status === 'Ready' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'
                  }}>
                    {node.status === 'Ready' ? <Wifi size={22} color="var(--success)" /> : <WifiOff size={22} color="var(--error)" />}
                  </div>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{node.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                      <span className="role-badge">{node.roles || 'worker'}</span>
                      <span>v{node.version}</span>
                    </div>
                  </div>
                </div>
                <div style={{
                  padding: '4px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
                  background: node.status === 'Ready' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  color: node.status === 'Ready' ? 'var(--success)' : 'var(--error)'
                }}>
                  {node.status}
                </div>
              </div>

              {/* Metrics */}
              {metric ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* CPU */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                        <Cpu size={14} color="var(--accent-purple)" /> CPU
                      </span>
                      <span style={{ fontWeight: 700 }}>{formatCpu(cpuUsed)} / {node.cpu} cores <span style={{ color: cpuPercent > 85 ? 'var(--error)' : cpuPercent > 60 ? 'var(--warning)' : 'var(--text-secondary)' }}>({cpuPercent}%)</span></span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '4px', transition: 'width 0.8s ease-out',
                        width: `${Math.min(cpuPercent, 100)}%`,
                        background: cpuPercent > 85 ? 'var(--error)' : cpuPercent > 60 ? 'var(--warning)' : 'var(--accent-purple)',
                        boxShadow: cpuPercent > 85 ? '0 0 12px rgba(239,68,68,0.4)' : 'none'
                      }} />
                    </div>
                  </div>
                  {/* Memory */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                        <HardDrive size={14} color="var(--success)" /> Memory
                      </span>
                      <span style={{ fontWeight: 700 }}>{formatMem(memUsed)} / {formatMem(memCap)} <span style={{ color: memPercent > 85 ? 'var(--error)' : memPercent > 60 ? 'var(--warning)' : 'var(--text-secondary)' }}>({memPercent}%)</span></span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '4px', transition: 'width 0.8s ease-out',
                        width: `${Math.min(memPercent, 100)}%`,
                        background: memPercent > 85 ? 'var(--error)' : memPercent > 60 ? 'var(--warning)' : 'var(--success)',
                        boxShadow: memPercent > 85 ? '0 0 12px rgba(239,68,68,0.4)' : 'none'
                      }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                  <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>CPU Capacity</div>
                    <div style={{ fontWeight: 700 }}>{node.cpu} cores</div>
                  </div>
                  <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Memory</div>
                    <div style={{ fontWeight: 700 }}>{formatMem(parseCapMem(node.memory))}</div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> Age: {formatAge(node.age)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Shield size={12} /> Kubelet {node.version}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* No metrics-server hint */}
      {nodeMetrics.length === 0 && nodes.length > 0 && (
        <div className="glass-card" style={{ marginTop: '24px', padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          💡 Install <strong>metrics-server</strong> to see live CPU & memory usage per node
        </div>
      )}
    </div>
  );
};
