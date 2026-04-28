import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Layout, Shield, Zap, Activity, Info, AlertTriangle, CheckCircle } from 'lucide-react';

export const NamespaceIntelligenceView: React.FC<{ namespace: string }> = ({ namespace }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pods, services, quotas, hpas, events] = await Promise.all([
          K8sService.getPods(namespace),
          K8sService.getServices(namespace),
          K8sService.getQuotas(namespace),
          K8sService.getHPAs(namespace),
          K8sService.getEvents(namespace)
        ]);

        const totalRestarts = pods.reduce((acc, p) => acc + p.restarts, 0);
        const failing = pods.filter(p => !['Running', 'Succeeded'].includes(p.status)).length;
        const issues = [];

        if (failing > 0) issues.push({ type: 'error', text: `${failing} problematic pods detected.` });
        if (totalRestarts > 10) issues.push({ type: 'warning', text: `High churn rate: ${totalRestarts} restarts found.` });
        if (hpas.length === 0 && pods.length > 5) issues.push({ type: 'info', text: 'No HPAs configured for this large namespace.' });
        
        setData({
          stats: { pods: pods.length, services: services.length, hpas: hpas.length, restarts: totalRestarts },
          quotas,
          issues: issues.length > 0 ? issues : [{ type: 'success', text: 'Namespace healthy. No immediate threats detected.' }]
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [namespace]);

  if (loading) return <div className="skeleton" style={{ height: '400px' }} />;

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Layout size={28} color="var(--accent-blue)" /> 
          360° Insight: {namespace === 'all' ? 'Cluster Scope' : namespace}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Aggregated heuristic intelligence for the selected biological context</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <InsightCard label="Active Workloads" value={data.stats.pods} sub="Total Pods" color="var(--accent-blue)" />
        <InsightCard label="Service Interfaces" value={data.stats.services} sub="Endpoints" color="var(--accent-cyan)" />
        <InsightCard label="Churn Frequency" value={data.stats.restarts} sub="Total Restarts" color={data.stats.restarts > 10 ? 'var(--warning)' : 'var(--success)'} />
        <InsightCard label="Auto-scalers" value={data.stats.hpas} sub="HPAs active" color="var(--accent-purple)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Zap size={18} color="var(--accent-blue)" /> AI Health Bulletins
          </h2>
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.issues.map((issue: any, i: number) => (
              <div key={i} style={{ 
                padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', 
                borderLeft: `4px solid ${issue.type === 'error' ? 'var(--error)' : issue.type === 'warning' ? 'var(--warning)' : 'var(--success)'}`,
                display: 'flex', alignItems: 'center', gap: '16px'
              }}>
                {issue.type === 'error' ? <AlertTriangle color="var(--error)" size={20} /> : 
                 issue.type === 'warning' ? <Info color="var(--warning)" size={20} /> : 
                 <CheckCircle color="var(--success)" size={20} />}
                <div style={{ fontSize: '0.95rem' }}>{issue.text}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={18} color="var(--accent-purple)" /> Resource Quotas
          </h2>
          <div className="glass-card" style={{ padding: '24px' }}>
            {data.quotas.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>No quotas defined.</div>
            ) : data.quotas.map((q: any) => (
              <div key={q.id}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px' }}>{q.name}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {q.used && Object.entries(q.used).map(([key, val]: any) => (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{key}</span>
                        <span>{val} / {q.hard[key]}</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                          height: '100%', background: 'var(--accent-blue)', 
                          width: `${Math.min((parseFloat(val)/parseFloat(q.hard[key]))*100, 100)}%` 
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const InsightCard = ({ label, value, sub, color }: any) => (
  <div className="glass-card" style={{ padding: '24px', borderLeft: `2px solid ${color}` }}>
    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{value}</div>
    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{sub}</div>
  </div>
);
