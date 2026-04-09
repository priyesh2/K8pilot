import React, { useState, useEffect } from 'react';
import { K8sService, Pod } from '../services/k8s';
import { Terminal, Download, RefreshCcw, Search, Box } from 'lucide-react';

export const LogsView: React.FC = () => {
  const [pods, setPods] = useState<Pod[]>([]);
  const [selectedPod, setSelectedPod] = useState('');
  const [selectedNS, setSelectedNS] = useState('');
  const [selectedContainer, setSelectedContainer] = useState('');
  const [containers, setContainers] = useState<string[]>([]);
  const [logs, setLogs] = useState('Select a pod to view logs...');
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [showPrevious, setShowPrevious] = useState(false);

  useEffect(() => {
    K8sService.getPods('all').then(data => {
      setPods(data);
      if (data.length > 0) {
        selectPod(data[0]);
      }
    }).catch(() => {});
  }, []);

  const fetchLogs = async (podName: string, ns: string, container?: string) => {
    if (!podName) return;
    setIsLoading(true);
    const data = await K8sService.getLogs(podName, ns, 200, showPrevious, container || undefined);
    setLogs(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (selectedPod && selectedNS) fetchLogs(selectedPod, selectedNS, selectedContainer);
  }, [selectedPod, selectedNS, selectedContainer, showPrevious]);

  const selectPod = (pod: Pod) => {
    setSelectedPod(pod.name);
    setSelectedNS(pod.namespace);
    const podContainers = pod.containers || [];
    setContainers(podContainers);
    // Auto-select first non-sidecar container
    const sidecars = ['istio-init', 'istio-proxy', 'envoy', 'linkerd-init', 'linkerd-proxy'];
    const appContainer = podContainers.find(c => !sidecars.includes(c)) || podContainers[0] || '';
    setSelectedContainer(appContainer);
  };

  const handleExport = () => {
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${selectedPod}-${selectedContainer}-logs.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>Log Stream Explorer</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Real-time container log monitoring</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={showPrevious} onChange={e => setShowPrevious(e.target.checked)} />
            Previous
          </label>
          <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', cursor: 'pointer' }}>
            <Download size={18} /> Export
          </button>
          <button onClick={() => fetchLogs(selectedPod, selectedNS, selectedContainer)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
            <RefreshCcw size={18} className={isLoading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', height: 'calc(100vh - 250px)' }}>
        {/* Pod List */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input type="text" placeholder="Filter pods..." value={filter} onChange={e => setFilter(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 8px 8px 32px', borderRadius: '8px', color: 'white', outline: 'none' }} />
          </div>
          {pods.filter(p => p.name.toLowerCase().includes(filter.toLowerCase())).map(pod => (
            <button key={pod.id} onClick={() => selectPod(pod)}
              style={{
                textAlign: 'left', padding: '10px 12px', borderRadius: '8px',
                background: selectedPod === pod.name ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                border: selectedPod === pod.name ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                color: selectedPod === pod.name ? 'var(--accent-blue)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: '0.82rem'
              }}>
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block', background: pod.status === 'Running' ? 'var(--success)' : 'var(--error)' }}></span>
                {pod.name}
              </div>
              <div style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                {pod.namespace} • {pod.status}
                {(pod.containers || []).length > 1 && <span style={{ color: 'var(--accent-purple)', marginLeft: '6px' }}>({pod.containers!.length} containers)</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Log Panel */}
        <div className="glass-card" style={{ padding: '0', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Header with Container Selector */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
              <Terminal size={16} color="var(--accent-blue)" /> {selectedPod || 'No pod selected'}
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>({selectedNS})</span>
            </div>
            {containers.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Box size={14} color="var(--accent-purple)" />
                <select
                  value={selectedContainer}
                  onChange={e => setSelectedContainer(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}>
                  {containers.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
          </div>
          <pre style={{ margin: 0, padding: '24px', overflowY: 'auto', flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', lineHeight: '1.6', color: '#abb2bf', scrollbarWidth: 'thin' }}>
            {isLoading ? 'Loading logs...' : logs}
          </pre>
        </div>
      </div>
    </div>
  );
};
