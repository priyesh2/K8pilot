import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { ShieldCheck, Filter, ChevronRight, BarChart, HardDrive, Cpu } from 'lucide-react';

export const QuotaView: React.FC = () => {
  const [quotas, setQuotas] = useState<any[]>([]);
  const [limits, setLimits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [namespace, setNamespace] = useState('all');
  const [namespaces, setNamespaces] = useState<string[]>([]);

  useEffect(() => {
    K8sService.getNamespaces().then(setNamespaces).catch(() => {});
    const load = async () => {
      setLoading(true);
      const [q, l] = await Promise.all([
        K8sService.getQuotas(namespace),
        K8sService.getLimitRanges(namespace)
      ]);
      setQuotas(q);
      setLimits(l);
      setLoading(false);
    };
    load();
  }, [namespace]);

  const parseResourceValue = (val: string) => {
    if (!val) return 0;
    if (val.endsWith('m')) return parseInt(val) / 1000;
    if (val.endsWith('Gi')) return parseInt(val);
    if (val.endsWith('Mi')) return parseInt(val) / 1024;
    return parseFloat(val);
  };

  const calculatePercent = (used: string, hard: string) => {
    const u = parseResourceValue(used);
    const h = parseResourceValue(hard);
    if (!h) return 0;
    return Math.min(Math.round((u / h) * 100), 100);
  };

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>Resource Auditor</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Audit namespace quotas, constraints, and capacity limits</p>
        </div>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px' }}>
          <Filter size={18} color="var(--accent-purple)" />
          <select value={namespace} onChange={e => setNamespace(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
            <option value="all">All Namespaces</option>
            {namespaces.map(ns => <option key={ns} value={ns}>{ns}</option>)}
          </select>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        
        {/* Quotas Section */}
        <section>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BarChart size={20} color="var(--accent-blue)" /> Active Resource Quotas
          </h2>
          {loading ? <div className="skeleton" style={{ height: '200px' }} /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {quotas.length === 0 && <div className="glass-card" style={{ padding: '20px', color: 'var(--text-secondary)' }}>No quotas defined in this context.</div>}
              {quotas.map(q => (
                <div key={q.name} className="glass-card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{q.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{q.namespace}</div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {Object.keys(q.status?.hard || {}).map(res => {
                      const used = q.status?.used?.[res] || '0';
                      const hard = q.status?.hard?.[res] || '0';
                      const percent = calculatePercent(used, hard);
                      
                      return (
                        <div key={res}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{res}</span>
                            <span>{used} / {hard}</span>
                          </div>
                          <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ 
                              height: '100%', width: `${percent}%`, 
                              background: percent > 90 ? 'var(--error)' : percent > 70 ? 'var(--warning)' : 'var(--accent-blue)',
                              transition: 'width 1s ease-out'
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* LimitRanges Section */}
        <section>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldCheck size={20} color="var(--success)" /> Constraint LimitRanges
          </h2>
          {loading ? <div className="skeleton" style={{ height: '200px' }} /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {limits.length === 0 && <div className="glass-card" style={{ padding: '20px', color: 'var(--text-secondary)' }}>No limit ranges defined.</div>}
              {limits.map(l => (
                <div key={l.name} className="glass-card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{l.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{l.namespace}</div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {l.limits.map((lim: any, idx: number) => (
                      <div key={idx} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Type: {lim.type}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div style={{ fontSize: '0.75rem' }}>
                            <div style={{ color: 'var(--text-secondary)' }}>Default Request</div>
                            {lim.defaultRequest ? (
                              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <span><Cpu size={12} /> {lim.defaultRequest.cpu || '-'}</span>
                                <span><HardDrive size={12} /> {lim.defaultRequest.memory || '-'}</span>
                              </div>
                            ) : '-'}
                          </div>
                          <div style={{ fontSize: '0.75rem' }}>
                            <div style={{ color: 'var(--text-secondary)' }}>Default Limit</div>
                            {lim.default ? (
                              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <span><Cpu size={12} /> {lim.default.cpu || '-'}</span>
                                <span><HardDrive size={12} /> {lim.default.memory || '-'}</span>
                              </div>
                            ) : '-'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};
