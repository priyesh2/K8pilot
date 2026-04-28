import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Network, Globe, Layers, Box, ChevronRight, Activity, AlertCircle, CheckCircle2, List, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import { Pod } from '../types';

interface ResourceApp {
  id: string;
  name: string;
  ingress: any;
  service: any;
  deployment: any;
  pods: Pod[];
  status: 'Healthy' | 'Degraded';
}

export const AuraTreeView: React.FC<{ 
  onAppClick: (name: string, ns: string) => void;
  onTerminal?: (pod: string, ns: string) => void;
  onLogs?: (pod: string, ns: string) => void;
}> = ({ onAppClick, onTerminal, onLogs }) => {
  const [namespace, setNamespace] = useState('default');
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [graphData, setGraphData] = useState<ResourceApp[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGraph = async () => {
    setLoading(true);
    // Heuristic: Fetch ingresses, services, and deployments for the NS
    const [ingresses, services, deployments, pods] = await Promise.all([
      K8sService.getIngresses(namespace),
      K8sService.getServices(namespace),
      K8sService.getDeployments(namespace),
      K8sService.getPods(namespace)
    ]);

    // Map relationships
    const apps = (deployments as any[]).map(d => {
      const appSvc = (services as any[]).find(s => s.selector && Object.entries(s.selector).every(([k, v]) => d.labels?.[k] === v));
      const appIng = appSvc ? (ingresses as any[]).find(i => i.rules?.some((r: any) => r.http?.paths?.some((p: any) => p.backend?.service?.name === appSvc.name))) : null;
      const appPods = (pods as any[]).filter(p => p.name.startsWith(d.name));
      
      const status = d.status === 'Healthy' ? 'Healthy' : 'Degraded';
      
      return {
        id: d.name,
        name: d.name,
        ingress: appIng,
        service: appSvc,
        deployment: d,
        pods: appPods,
        status: status as 'Healthy' | 'Degraded'
      };
    });

    setGraphData(apps);
    setLoading(false);
  };

  useEffect(() => {
    K8sService.getNamespaces().then(setNamespaces);
  }, []);

  useEffect(() => {
    fetchGraph();
  }, [namespace]);

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '12px' }}>
              <Layers size={28} color="white" />
            </div>
            Application Tree (Sync Engine)
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Full-stack resource dependency mapping and Argo-style health propagation</p>
        </div>
        <div className="glass-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Namespace:</span>
          <select value={namespace} onChange={e => setNamespace(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
            {namespaces.filter(n => n !== 'all').map(ns => <option key={ns} value={ns}>{ns}</option>)}
          </select>
        </div>
      </header>

      {loading ? <div className="skeleton" style={{ height: '400px' }} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {graphData.length === 0 && (
            <div className="glass-card" style={{ padding: '80px', textAlign: 'center' }}>
               No applications found in this namespace.
            </div>
          )}
          {graphData.map(app => (
            <div key={app.id} className="glass-card" style={{ padding: '24px', borderLeft: `4px solid ${app.status === 'Healthy' ? 'var(--success)' : 'var(--error)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {app.status === 'Healthy' ? <CheckCircle2 color="var(--success)" /> : <AlertCircle color="var(--error)" />}
                    <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{app.name}</span>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                      {app.status.toUpperCase()}
                    </span>
                    {app.pods.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onLogs && onLogs(app.pods[0].name, namespace); }}
                          style={{ background: 'rgba(59,130,246,0.1)', border: 'none', color: 'var(--accent-blue)', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}
                          title="Stream Logs"
                        >
                          <List size={12} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onTerminal && onTerminal(app.pods[0].name, namespace); }}
                          style={{ background: 'rgba(168,85,247,0.1)', border: 'none', color: 'var(--accent-purple)', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}
                          title="Interactive Terminal"
                        >
                          <Terminal size={12} />
                        </button>
                      </div>
                    )}
                 </div>
                 <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: app.status === 'Healthy' ? 'var(--success)' : 'var(--warning)' }}>
                       <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: app.status === 'Healthy' ? 'var(--success)' : 'var(--warning)' }} /> 
                       {app.status === 'Healthy' ? 'Synced' : 'Out of Sync'}
                    </div>
                    <button 
                      onClick={async () => {
                        await K8sService.restartDeployment(namespace, app.name);
                        fetchGraph();
                      }}
                      style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', padding: '4px 10px', color: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                    >
                       Sync Now
                    </button>
                 </div>
              </div>

              {/* The "Argo" Tree Flow */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflowX: 'auto', paddingBottom: '10px' }}>
                {/* INGRESS */}
                <ResourceNode type="Ingress" name={app.ingress?.name || 'No Ingress'} icon={Globe} active={!!app.ingress} />
                <Connector />
                {/* SERVICE */}
                <ResourceNode type="Service" name={app.service?.name || 'No Service'} icon={Activity} active={!!app.service} />
                <Connector />
                {/* DEPLOYMENT */}
                <div onClick={() => app.deployment.name && onAppClick(app.deployment.name, namespace)} style={{ cursor: 'pointer' }}>
                   <ResourceNode type="Deployment" name={app.deployment.name} icon={Layers} active={true} status={app.status} />
                </div>
                <Connector />
                {/* PODS */}
                <div style={{ display: 'flex', gap: '8px', minWidth: '150px' }}>
                   {app.pods.length > 0 ? app.pods.map((p: any, i: number) => (
                      <div key={i} style={{ 
                        width: '32px', height: '32px', borderRadius: '6px', 
                        background: p.status === 'Running' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        border: `1px solid ${p.status === 'Running' ? 'var(--success)' : 'var(--error)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                         <Box size={14} color={p.status === 'Running' ? 'var(--success)' : 'var(--error)'} />
                      </div>
                   )) : <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>0 Pods</div>}
                </div>
              </div>

              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: '24px' }}>
                 <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <strong>Desired:</strong> {app.deployment.replicas} Replicas
                 </div>
                 <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <strong>Live:</strong> {app.pods.filter((p: any) => p.status === 'Running').length} Healthy
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ResourceNode = ({ type, name, icon: Icon, active, status }: any) => (
  <div style={{ 
    minWidth: '180px', padding: '12px', borderRadius: '10px', 
    background: active ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
    border: `1px solid ${status === 'Degraded' ? 'var(--error)' : active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'}`,
    opacity: active ? 1 : 0.4
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <Icon size={16} color={active ? 'var(--accent-blue)' : 'var(--text-secondary)'} />
      <div style={{ overflow: 'hidden' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 800 }}>{type.toUpperCase()}</div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{name}</div>
      </div>
    </div>
  </div>
);

const Connector = () => (
   <ChevronRight size={18} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />
);
