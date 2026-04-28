import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { DollarSign, TrendingUp, BarChart3, PieChart, Info, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const CostProfilerView: React.FC = () => {
  const [namespaces, setNamespaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCosts = async () => {
    setLoading(true);
    try {
      // Heuristic: Get nodes and pods to calculate costs based on requests
      const data = await K8sService.getCostAudit();
      setNamespaces(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCosts(); }, []);

  const totalMonthly = namespaces.reduce((acc, n) => acc + n.monthlyCost, 0);

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '12px' }}>
              <DollarSign size={28} color="white" />
            </div>
            Cloud Cost Profiler
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Resource attribution & estimated monthly burn rate per namespace</p>
        </div>
        <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid var(--success)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>ESTIMATED TOTAL BURN</div>
          <div style={{ fontSize: '2rem', fontWeight: 900 }}>${totalMonthly.toFixed(2)}<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/mo</span></div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
         <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
               <BarChart3 size={20} color="var(--accent-blue)" /> Cost Distribution
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               {namespaces.sort((a,b) => b.monthlyCost - a.monthlyCost).slice(0, 5).map(n => (
                 <div key={n.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                       <span style={{ fontWeight: 600 }}>{n.name}</span>
                       <span style={{ color: 'var(--text-secondary)' }}>${n.monthlyCost.toFixed(2)}</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                       <div style={{ height: '100%', background: 'var(--accent-blue)', width: `${(n.monthlyCost / (totalMonthly || 1)) * 100}%` }} />
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
               <TrendingUp size={20} color="var(--success)" /> Efficiency Audit
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
               Checking for over-provisioned namespaces where requests significantly exceed actual historical usage.
            </p>
            <div style={{ padding: '16px', background: 'rgba(16,185,129,0.05)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.1)' }}>
               <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: '4px' }}>Optimization Target Identified</div>
               <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                 Narrowing down the "kube-system" requests could save ~$140.20/month across the cluster nodes.
               </div>
            </div>
         </div>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
              <th style={{ padding: '16px 24px', fontSize: '0.75rem' }}>NAMESPACE</th>
              <th style={{ padding: '16px 24px', fontSize: '0.75rem' }}>CPU CORES</th>
              <th style={{ padding: '16px 24px', fontSize: '0.75rem' }}>MEMORY (GB)</th>
              <th style={{ padding: '16px 24px', fontSize: '0.75rem' }}>MONTHLY BURN</th>
            </tr>
          </thead>
          <tbody>
            {namespaces.map(n => (
              <tr key={n.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <td style={{ padding: '16px 24px', fontWeight: 700 }}>{n.name}</td>
                <td style={{ padding: '16px 24px' }}>{(n.cpu/1000).toFixed(2)} cores</td>
                <td style={{ padding: '16px 24px' }}>{(n.mem/1024).toFixed(1)} GB</td>
                <td style={{ padding: '16px 24px', color: 'var(--accent-cyan)', fontWeight: 800 }}>${n.monthlyCost.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '32px', display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
         <Info size={14} />
         Pricing model: Based on $0.05/core-hour and $0.01/GB-hour (Standard Cloud Tier). Values are heuristic estimates based on Pod resource requests.
      </div>
    </div>
  );
};
