import React, { useEffect, useState, useCallback } from 'react';
import { K8sService, Pod } from '../services/k8s';
import { Activity, Database, Server, Cpu, Filter, AlertCircle, Maximize2, RefreshCw, TrendingUp, Zap, Shield, BarChart3, Eye } from 'lucide-react';

interface DashboardProps {
  currentNS: string;
  namespaces: string[];
  onNamespaceChange: (ns: string) => void;
  onPodClick?: (podName: string, namespace: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentNS, namespaces, onNamespaceChange, onPodClick }) => {
  const [pods, setPods] = useState<Pod[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async (isAuto = false) => {
    if (!isAuto) {
      setRefreshing(true);
      setLoading(true);
    }
    setError(null);
    try {
      const [podData, eventData, healthData] = await Promise.all([
        K8sService.getPods(currentNS),
        K8sService.getEvents(currentNS),
        K8sService.getClusterHealth()
      ]);
      setPods(podData);
      setEvents(eventData);
      setHealth(healthData);
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Cluster communication failed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentNS]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefreshClick = () => {
    fetchData(false);
  };

  const handleScale = async (pod: Pod) => {
    const replicas = prompt(`Scale ${pod.name} to how many replicas?`, '3');
    if (replicas && !isNaN(parseInt(replicas))) {
      const owner = pod.ownerName || pod.name;
      const deployName = owner.replace(/-[a-z0-9]{8,10}$/, '');
      const success = await K8sService.scaleDeployment(pod.namespace, deployName, parseInt(replicas));
      if (success) {
        alert(`✅ Scaling ${deployName} → ${replicas} replicas`);
        fetchData();
      } else {
        alert(`❌ Scale failed for ${deployName}. Check RBAC permissions.`);
      }
    }
  };

  const handleRestart = async (pod: Pod) => {
    const owner = pod.ownerName || pod.name;
    const deployName = owner.replace(/-[a-z0-9]{8,10}$/, '');
    if (confirm(`Restart deployment: ${deployName}?`)) {
      const success = await K8sService.restartService(deployName, pod.namespace);
      if (success) {
        alert(`✅ Restarting ${deployName}`);
        fetchData();
      } else {
        alert(`❌ Restart failed. Check permissions.`);
      }
    }
  };

  const runningPods = pods.filter(p => p.status === 'Running').length;
  const failingPods = pods.filter(p => !['Running', 'Succeeded', 'Completed'].includes(p.status)).length;
  const warningEvents = events.filter(e => e.type === 'Warning');
  const topRestarters = [...pods].sort((a, b) => b.restarts - a.restarts).slice(0, 5);

  return (
    <div className="dashboard">
      {/* Header */}
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '4px', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Control Center</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Live cluster monitoring • Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={handleRefreshClick}
            disabled={refreshing}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', 
              background: refreshing ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', 
              color: 'white', cursor: refreshing ? 'wait' : 'pointer', 
              fontWeight: 600, fontSize: '0.85rem', fontFamily: 'var(--font-main)',
              transition: 'all 0.2s', opacity: refreshing ? 0.6 : 1
            }}
          >
            <RefreshCw size={16} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} /> 
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'var(--bg-card)', border: 'var(--border-glass)', borderRadius: '12px' }}>
            <Filter size={16} color="var(--accent-blue)" />
            <select 
              value={currentNS} 
              onChange={(e) => onNamespaceChange(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-main)', fontSize: '0.85rem' }}
            >
              <option value="all">All Namespaces</option>
              {namespaces.map(ns => <option key={ns} value={ns}>{ns}</option>)}
            </select>
          </div>
        </div>
      </header>

      {error && (
        <div className="glass-card fade-in" style={{ marginBottom: '24px', border: '1px solid var(--error)', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--error)', padding: '16px' }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <StatCard icon={<Server size={20} />} label="Scope" value={currentNS === 'all' ? 'Cluster-wide' : currentNS} color="var(--accent-blue)" />
        <StatCard icon={<Activity size={20} />} label="Pods" value={pods.length.toString()} color="var(--accent-cyan)" sub={`${runningPods} running`} />
        <StatCard icon={<Zap size={20} />} label="Failing" value={failingPods.toString()} color={failingPods > 0 ? 'var(--error)' : 'var(--success)'} sub={failingPods > 0 ? 'needs attention' : 'all clear'} />
        <StatCard icon={<TrendingUp size={20} />} label="Restarts" value={health ? health.totalRestarts.toString() : '...'} color="var(--warning)" sub="cluster-wide" />
        <StatCard icon={<Shield size={20} />} label="Deployments" value={health ? health.totalDeployments.toString() : '...'} color="var(--accent-purple)" sub={health && health.degraded > 0 ? `${health.degraded} degraded` : 'all healthy'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
        {/* Pod List */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={18} color="var(--accent-blue)" /> Active Pods
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{pods.length} total • Click to inspect</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
            {loading && pods.length === 0 ? (
              <>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '72px', borderRadius: '12px' }} />)}
              </>
            ) : pods.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                No pods found in this context.
              </div>
            ) : pods.map(pod => (
              <div key={pod.id} className="glass-card fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', cursor: 'pointer' }}
                onClick={() => onPodClick?.(pod.name, pod.namespace)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                    background: pod.status === 'Running' ? 'var(--success)' : pod.status === 'Succeeded' ? 'var(--accent-cyan)' : 'var(--error)',
                    boxShadow: pod.status === 'Running' ? '0 0 8px var(--success)' : pod.status !== 'Succeeded' ? '0 0 8px var(--error)' : 'none',
                    animation: !['Running', 'Succeeded', 'Completed'].includes(pod.status) ? 'pulse 1.5s infinite' : 'none'
                  }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pod.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {pod.namespace} • {pod.status} {pod.reason ? `• ${pod.reason}` : ''}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
                  {pod.restarts > 0 && (
                    <div style={{ textAlign: 'center', fontSize: '0.78rem' }}>
                      <div style={{ color: pod.restarts > 3 ? 'var(--warning)' : 'var(--text-secondary)' }}>↻ {pod.restarts}</div>
                    </div>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); onPodClick?.(pod.name, pod.namespace); }} title="Inspect" style={{ padding: '6px', background: 'rgba(255,255,255,0.04)', border: 'none', color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--accent-cyan)'; (e.currentTarget as HTMLElement).style.background = 'rgba(34,211,238,0.1)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                  >
                    <Eye size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleRestart(pod); }} title="Restart" style={{ padding: '6px', background: 'rgba(255,255,255,0.04)', border: 'none', color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--warning)'; (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.1)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                  >
                    <RefreshCw size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleScale(pod); }} title="Scale" style={{ padding: '6px', background: 'rgba(255,255,255,0.04)', border: 'none', color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--accent-blue)'; (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.1)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                  >
                    <Maximize2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Restarters */}
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={16} color="var(--warning)" /> Top Restarters
            </h2>
            <div className="glass-card" style={{ padding: '16px' }}>
              {topRestarters.filter(p => p.restarts > 0).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--success)', fontSize: '0.85rem' }}>✅ No pods restarting</div>
              ) : topRestarters.filter(p => p.restarts > 0).map((pod, i) => (
                <div key={pod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < topRestarters.filter(p => p.restarts > 0).length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', cursor: 'pointer' }}
                  onClick={() => onPodClick?.(pod.name, pod.namespace)}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{pod.name.slice(0, 35)}{pod.name.length > 35 ? '...' : ''}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{pod.namespace}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: pod.restarts > 5 ? 'var(--error)' : 'var(--warning)' }}>
                    {pod.restarts}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Events */}
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color={warningEvents.length > 0 ? 'var(--error)' : 'var(--accent-blue)'} /> 
              Events {warningEvents.length > 0 && <span style={{ fontSize: '0.72rem', background: 'rgba(244,63,94,0.15)', color: 'var(--error)', padding: '2px 8px', borderRadius: '10px' }}>{warningEvents.length} warnings</span>}
            </h2>
            <div className="glass-card" style={{ padding: '12px', maxHeight: '300px', overflowY: 'auto' }}>
              {events.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No events</div>
              ) : events.slice(0, 20).map(event => (
                <div key={event.id} style={{ 
                  padding: '10px 12px', borderLeft: `2px solid ${event.type === 'Normal' ? 'var(--accent-blue)' : 'var(--error)'}`,
                  marginBottom: '8px', borderRadius: '0 6px 6px 0', background: event.type === 'Warning' ? 'rgba(244,63,94,0.03)' : 'transparent'
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.75rem', color: event.type === 'Normal' ? 'var(--text-primary)' : 'var(--error)' }}>
                    {event.reason} • {event.object}
                  </div>
                  <div style={{ fontSize: '0.73rem', margin: '3px 0', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{event.message}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', opacity: 0.7 }}>{new Date(event.timestamp).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color, sub }: any) => (
  <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px' }}>
    <div style={{ background: `${color}12`, color: color, padding: '10px', borderRadius: '10px', display: 'flex' }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '1px' }}>{sub}</div>}
    </div>
  </div>
);
