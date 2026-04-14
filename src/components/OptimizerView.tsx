import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { TrendingDown, DollarSign, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const OptimizerView: React.FC = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    K8sService.getOptimizerRecommendations().then(res => {
      setRecommendations(res);
      setLoading(false);
    });
  }, []);

  const totalSavings = recommendations.reduce((sum, r) => {
    const val = parseFloat(r.potentialSavings.replace('$', '').replace('/mo', ''));
    return sum + val;
  }, 0);

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>AI Cost Optimizer</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Economic insights and resource rightsizing recommendations</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Savings Card */}
        <div className="glass-card" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ padding: '12px', background: 'rgba(34,197,94,0.1)', borderRadius: '12px' }}>
              <DollarSign size={24} color="var(--success)" />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Potential Monthly Savings</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success)' }}>${totalSavings.toFixed(2)}</div>
            </div>
          </div>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', marginBottom: '20px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingDown size={16} color="var(--accent-cyan)" /> Resource Waste Found
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {recommendations.length} containers are requesting more resources than they historically consume.
            </div>
          </div>
          <div style={{ padding: '16px', background: 'rgba(59,130,246,0.05)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.1)', color: 'var(--accent-blue)', fontSize: '0.8rem', textAlign: 'center' }}>
            AI models are currently calculating the optimal thresholds for these workloads.
          </div>
        </div>

        {/* Recommendations List */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px' }}>Recommendations</h2>
          {loading ? (
            <div className="skeleton" style={{ height: '300px' }} />
          ) : recommendations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <CheckCircle size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <div>No resource waste detected. Your cluster is perfectly sized.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recommendations.map((r, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={`${r.namespace}-${r.pod}-${r.container}`}
                  style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ padding: '10px', background: 'rgba(250,204,21,0.1)', borderRadius: '10px' }}>
                      <AlertTriangle size={20} color="var(--warning)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{r.pod}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.namespace} • {r.container}</div>
                      <div style={{ fontSize: '0.75rem', marginTop: '6px', color: 'var(--accent-cyan)' }}>{r.issue} • {r.suggestedAction}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)' }}>+{r.potentialSavings}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Est. Recovery</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
