import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { DollarSign, TrendingUp, PieChart } from 'lucide-react';

export const CostProfilerView: React.FC = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    K8sService.getCostProfile().then(data => {
      setProfiles(data);
      setLoading(false);
    });
  }, []);

  const totalMonthlyCost = profiles.reduce((sum, p) => sum + parseFloat(p.estimatedMonthlyCost), 0);

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>Cost Estimation Profiler</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Resource burn rate calculation by Namespace</p>
      </header>

      {loading ? <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Calculating infrastructure costs...</div> : (
        <div>
          <div className="glass-card" style={{ padding: '32px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.1))', padding: '24px', borderRadius: '50%', border: '2px solid rgba(34,197,94,0.3)' }}>
              <DollarSign size={48} color="var(--success)" />
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Estimated Monthly Burn</div>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: 'white' }}>${totalMonthlyCost.toFixed(2)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)', marginTop: '8px' }}>
                <TrendingUp size={16} /> Based on resource requests at $30/vCPU and $10/GB
              </div>
            </div>
          </div>

          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PieChart size={20} color="var(--accent-purple)" /> Namespace Breakdown
          </h2>
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Namespace</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-secondary)' }}>CPU Reserved</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-secondary)' }}>RAM Reserved</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 800 }}>Est. Cost/mo</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p, i) => (
                  <tr key={p.namespace} style={{ borderBottom: i === profiles.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '16px', fontWeight: 700 }}>{p.namespace}</td>
                    <td style={{ padding: '16px', textAlign: 'right', color: 'var(--accent-purple)' }}>{p.cpu} cores</td>
                    <td style={{ padding: '16px', textAlign: 'right', color: 'var(--accent-cyan)' }}>{p.memGi} GB</td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 800, color: 'var(--success)', fontSize: '1.1rem' }}>
                      ${p.estimatedMonthlyCost}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
