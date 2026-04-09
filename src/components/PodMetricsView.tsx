import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Cpu, MemoryStick, Filter, RefreshCw, Activity, ArrowUpDown, Search, Zap } from 'lucide-react';

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

const parseMemKi = (s: string): number => {
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

interface PodMetric {
  name: string;
  namespace: string;
  containers: { name: string; cpu: string; memory: string }[];
  totalCpu: number;
  totalMem: number;
}

type SortField = 'name' | 'namespace' | 'cpu' | 'memory';

export const PodMetricsView: React.FC = () => {
  const [metrics, setMetrics] = useState<PodMetric[]>([]);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [namespace, setNamespace] = useState('all');
  const [loading, setLoading] = useState(true);
  const [metricsAvailable, setMetricsAvailable] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('cpu');
  const [sortAsc, setSortAsc] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = async () => {
    setLoading(true);
    const [raw, ns] = await Promise.all([
      K8sService.getPodMetrics(namespace),
      K8sService.getNamespaces()
    ]);
    setNamespaces(ns);
    if (raw.length === 0) {
      setMetricsAvailable(false);
      setMetrics([]);
    } else {
      setMetricsAvailable(true);
      const parsed: PodMetric[] = raw.map((m: any) => {
        const totalCpu = (m.containers || []).reduce((s: number, c: any) => s + parseCpuNano(c.cpu), 0);
        const totalMem = (m.containers || []).reduce((s: number, c: any) => s + parseMemKi(c.memory), 0);
        return { ...m, totalCpu, totalMem };
      });
      setMetrics(parsed);
    }
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [namespace]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const maxCpu = Math.max(...metrics.map(m => m.totalCpu), 1);
  const maxMem = Math.max(...metrics.map(m => m.totalMem), 1);

  const filtered = metrics
    .filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.namespace.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'cpu') cmp = a.totalCpu - b.totalCpu;
      else if (sortField === 'memory') cmp = a.totalMem - b.totalMem;
      else if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'namespace') cmp = a.namespace.localeCompare(b.namespace);
      return sortAsc ? cmp : -cmp;
    });

  const totalClusterCpu = metrics.reduce((s, m) => s + m.totalCpu, 0);
  const totalClusterMem = metrics.reduce((s, m) => s + m.totalMem, 0);

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '4px', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Pod Metrics
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Live CPU & memory usage per pod • Updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', fontFamily: 'var(--font-main)' }}>
            <RefreshCw size={16} /> Refresh
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'var(--bg-card)', border: 'var(--border-glass)', borderRadius: '12px' }}>
            <Filter size={16} color="var(--accent-blue)" />
            <select value={namespace} onChange={e => setNamespace(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-main)', fontSize: '0.85rem' }}>
              <option value="all">All Namespaces</option>
              {namespaces.map(ns => <option key={ns} value={ns}>{ns}</option>)}
            </select>
          </div>
        </div>
      </header>

      {!metricsAvailable ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
          <Activity size={40} style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} />
          <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Metrics Server Not Available</div>
          <div style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
            Pod metrics require <code style={{ color: 'var(--accent-cyan)', background: 'rgba(34,211,238,0.1)', padding: '2px 8px', borderRadius: '4px' }}>metrics-server</code> to be installed on your cluster.
            Install via: <code style={{ color: 'var(--accent-cyan)', background: 'rgba(34,211,238,0.1)', padding: '2px 8px', borderRadius: '4px', display: 'block', marginTop: '12px' }}>kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml</code>
          </div>
        </div>
      ) : (
        <>
          {/* Cluster Totals */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px' }}>
              <div style={{ background: 'rgba(139,92,246,0.1)', padding: '12px', borderRadius: '12px' }}>
                <Zap size={22} color="var(--accent-purple)" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Pods Measured</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{metrics.length}</div>
              </div>
            </div>
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px' }}>
              <div style={{ background: 'rgba(99,102,241,0.1)', padding: '12px', borderRadius: '12px' }}>
                <Cpu size={22} color="var(--accent-blue)" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total CPU Usage</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{formatCpu(totalClusterCpu)}</div>
              </div>
            </div>
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px' }}>
              <div style={{ background: 'rgba(34,197,94,0.1)', padding: '12px', borderRadius: '12px' }}>
                <MemoryStick size={22} color="var(--success)" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Memory Usage</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{formatMem(totalClusterMem)}</div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input type="text" placeholder="Search pods..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 10px 10px 40px', borderRadius: '12px', color: 'white', outline: 'none', fontSize: '0.9rem', fontFamily: 'var(--font-main)' }} />
          </div>

          {/* Metrics Table */}
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th onClick={() => handleSort('name')} style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Pod {sortField === 'name' && <ArrowUpDown size={12} />}</div>
                  </th>
                  <th onClick={() => handleSort('namespace')} style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Namespace {sortField === 'namespace' && <ArrowUpDown size={12} />}</div>
                  </th>
                  <th onClick={() => handleSort('cpu')} style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', userSelect: 'none', width: '30%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>CPU Usage {sortField === 'cpu' && <ArrowUpDown size={12} />}</div>
                  </th>
                  <th onClick={() => handleSort('memory')} style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', userSelect: 'none', width: '30%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Memory Usage {sortField === 'memory' && <ArrowUpDown size={12} />}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && metrics.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Activity size={20} style={{ animation: 'pulse 1.5s infinite' }} /> Fetching pod metrics...
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No pods found</td></tr>
                ) : filtered.map((pod, i) => (
                  <tr key={`${pod.namespace}-${pod.name}`} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pod.name}</div>
                      {pod.containers.length > 1 && <div style={{ fontSize: '0.72rem', color: 'var(--accent-purple)', marginTop: '2px' }}>{pod.containers.length} containers</div>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="ns-badge">{pod.namespace}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: '3px', transition: 'width 0.6s ease-out',
                            width: `${Math.min((pod.totalCpu / maxCpu) * 100, 100)}%`,
                            background: (pod.totalCpu / maxCpu) > 0.8 ? 'var(--error)' : (pod.totalCpu / maxCpu) > 0.5 ? 'var(--warning)' : 'var(--accent-purple)'
                          }} />
                        </div>
                        <span style={{ fontWeight: 600, minWidth: '70px', fontSize: '0.82rem' }}>{formatCpu(pod.totalCpu)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: '3px', transition: 'width 0.6s ease-out',
                            width: `${Math.min((pod.totalMem / maxMem) * 100, 100)}%`,
                            background: (pod.totalMem / maxMem) > 0.8 ? 'var(--error)' : (pod.totalMem / maxMem) > 0.5 ? 'var(--warning)' : 'var(--success)'
                          }} />
                        </div>
                        <span style={{ fontWeight: 600, minWidth: '70px', fontSize: '0.82rem' }}>{formatMem(pod.totalMem)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
