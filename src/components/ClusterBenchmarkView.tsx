import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Award, CheckCircle, XCircle, AlertTriangle, Shield, Cpu, HardDrive, Network, Lock, Server, Download, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface BenchmarkCategory {
  name: string;
  score: number;
  maxScore: number;
  icon: string;
  checks: { name: string; passed: boolean; detail: string; severity: 'critical' | 'warning' | 'info' }[];
}

export const ClusterBenchmarkView: React.FC = () => {
  const [benchmark, setBenchmark] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBenchmark();
  }, []);

  const fetchBenchmark = async () => {
    setLoading(true);
    try {
      const data = await K8sService.getClusterBenchmark();
      setBenchmark(data);
    } catch (e) {
      console.error('Benchmark failed:', e);
    }
    setLoading(false);
  };

  const getGradeColor = (pct: number) => {
    if (pct >= 90) return 'var(--success)';
    if (pct >= 70) return 'var(--accent-blue)';
    if (pct >= 50) return 'var(--warning)';
    return 'var(--error)';
  };

  const getGrade = (pct: number) => {
    if (pct >= 95) return 'A+';
    if (pct >= 90) return 'A';
    if (pct >= 80) return 'B+';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C+';
    if (pct >= 50) return 'C';
    return 'D';
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'security': return <Shield size={20} />;
      case 'resources': return <Cpu size={20} />;
      case 'reliability': return <Server size={20} />;
      case 'networking': return <Network size={20} />;
      case 'storage': return <HardDrive size={20} />;
      default: return <Award size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '12px' }}>
              <Award size={24} color="white" />
            </div>
            Cluster Benchmark
          </h1>
        </header>
        <div className="skeleton" style={{ height: '600px' }} />
      </div>
    );
  }

  if (!benchmark) return null;

  const overallPct = benchmark.overallScore;
  const overallGrade = getGrade(overallPct);
  const categories: BenchmarkCategory[] = benchmark.categories || [];

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '12px' }}>
              <Award size={24} color="white" />
            </div>
            Cluster Benchmark
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Comprehensive cluster health audit across security, reliability, resources, and networking</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.print()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
            <Download size={16} /> Export
          </button>
          <button onClick={fetchBenchmark} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} /> Re-Scan
          </button>
        </div>
      </header>

      {/* Overall Score Hero */}
      <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: '40px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '40px' }}>
        <div style={{ position: 'relative', width: '180px', height: '180px', flexShrink: 0 }}>
          <svg width="180" height="180" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <motion.circle cx="50" cy="50" r="42" fill="none"
              stroke={getGradeColor(overallPct)} strokeWidth="8" strokeDasharray="264"
              initial={{ strokeDashoffset: 264 }}
              animate={{ strokeDashoffset: 264 - (264 * overallPct / 100) }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              strokeLinecap="round" transform="rotate(-90 50 50)" />
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: getGradeColor(overallPct), lineHeight: 1 }}>{overallGrade}</div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '4px' }}>{overallPct}%</div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Overall Cluster Grade</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }}>
            {overallPct >= 90 ? 'Excellent! Your cluster follows industry best practices across all categories.' :
             overallPct >= 70 ? 'Good standing, but there are areas that could be improved for production hardening.' :
             overallPct >= 50 ? 'Several issues found. Focus on security and reliability improvements.' :
             'Critical issues detected. Review the findings below and address high-severity items first.'}
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={16} color="var(--success)" />
              <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{benchmark.passedChecks || 0} Passed</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={16} color="var(--warning)" />
              <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{benchmark.warningChecks || 0} Warnings</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <XCircle size={16} color="var(--error)" />
              <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{benchmark.failedChecks || 0} Failed</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Category Scores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {categories.map((cat, i) => {
          const pct = cat.maxScore > 0 ? Math.round((cat.score / cat.maxScore) * 100) : 0;
          return (
            <motion.div key={cat.name} className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
              style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ color: getGradeColor(pct), marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>{getCategoryIcon(cat.icon)}</div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginBottom: '10px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                  style={{ height: '100%', background: getGradeColor(pct), borderRadius: '3px' }} />
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: getGradeColor(pct) }}>{pct}%</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '4px' }}>{cat.name}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Detailed Checks */}
      {categories.map((cat, ci) => (
        <motion.div key={cat.name} className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + ci * 0.1 }}
          style={{ padding: '28px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ color: getGradeColor(cat.maxScore > 0 ? (cat.score / cat.maxScore) * 100 : 0) }}>{getCategoryIcon(cat.icon)}</div>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{cat.name}</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>{cat.score}/{cat.maxScore} points</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {cat.checks.map((check, j) => (
              <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 16px', background: 'rgba(255,255,255,0.015)', borderRadius: '10px', borderLeft: `3px solid ${check.passed ? 'var(--success)' : check.severity === 'critical' ? 'var(--error)' : 'var(--warning)'}` }}>
                <div style={{ marginTop: '2px' }}>
                  {check.passed ? <CheckCircle size={16} color="var(--success)" /> : check.severity === 'critical' ? <XCircle size={16} color="var(--error)" /> : <AlertTriangle size={16} color="var(--warning)" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>{check.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{check.detail}</div>
                </div>
                <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800, background: check.passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: check.passed ? 'var(--success)' : 'var(--error)', flexShrink: 0 }}>
                  {check.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
