import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Shield, ShieldAlert, ShieldCheck, Info, ArrowUpRight, Download, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export const ComplianceView: React.FC = () => {
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    K8sService.getSecurityAudit().then(res => {
      setAudit(res);
      setLoading(false);
    });
  }, []);

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'var(--success)';
    if (grade === 'B') return 'var(--accent-blue)';
    if (grade === 'C') return 'var(--warning)';
    return 'var(--error)';
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="dashboard">
      {/* Print-Only Header */}
      <div className="print-only" style={{ borderBottom: '2px solid #111', paddingBottom: '24px', marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px', margin: 0 }}>K8PILOT <span style={{ color: '#6366f1' }}>ORION</span></h1>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#444' }}>Official Cluster Intelligence Report</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#666' }}>
            <div>Generated: {new Date().toLocaleString()}</div>
            <div>Scanned Workloads: {audit?.scannedPods || 0}</div>
          </div>
        </div>
      </div>

      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>Security Compliance</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Advanced automated auditing and cluster risk scoring</p>
        </div>
        {!loading && (
          <button onClick={handleExportPDF} className="btn-primary no-print" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} /> Export Intelligence Report
          </button>
        )}
      </header>

      {loading ? <div className="skeleton" style={{ height: '400px' }} /> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          
          {/* GPA Gauge */}
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto 30px' }}>
              <svg width="200" height="200" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <motion.circle 
                  cx="50" cy="50" r="45" fill="none" 
                  stroke={getGradeColor(audit.grade || 'A')} 
                  strokeWidth="8" 
                  strokeDasharray="283"
                  initial={{ strokeDashoffset: 283 }}
                  animate={{ strokeDashoffset: 283 - (283 * ((audit.gpa || 0) / 100)) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <div style={{ fontSize: '3.5rem', fontWeight: 900, color: getGradeColor(audit.grade || 'A') }}>{audit.grade}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{audit.gpa}% SCORE</div>
              </div>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Cluster Grade</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Based on {audit.scannedPods} scanned workloads</p>
          </div>

          {/* Breakdown / Findings */}
          <div className="glass-card">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
               <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Risk Breakdown</h2>
               <div style={{ display: 'flex', gap: '12px' }}>
                 <Badge count={audit.high} label="High" color="var(--error)" />
                 <Badge count={audit.medium} label="Medium" color="var(--warning)" />
                 <Badge count={audit.low} label="Low" color="var(--accent-blue)" />
               </div>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               <AuditItem icon={<ShieldAlert color="var(--error)" />} title="Privileged Access" value={audit.high === 0 ? 'Passed' : `${audit.high} Violations`} status={audit.high === 0 ? 'good' : 'bad'} />
               <AuditItem icon={<Shield color="var(--warning)" />} title="Resource Boundaries" value={audit.medium === 0 ? 'Protected' : 'Missing Limits'} status={audit.medium === 0 ? 'good' : 'warning'} />
               <AuditItem icon={<ShieldCheck color="var(--success)" />} title="Health Probes" value={audit.low === 0 ? 'Complete' : 'Partially Missing'} status={audit.low === 0 ? 'good' : 'info'} />
             </div>

             <div className="no-print" style={{ marginTop: '32px', padding: '20px', background: 'rgba(59,130,246,0.05)', borderRadius: '16px', display: 'flex', gap: '16px' }}>
                <div style={{ padding: '10px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', alignSelf: 'flex-start' }}>
                  <Info size={20} color="var(--accent-blue)" />
                </div>
                <div>
                   <div style={{ fontWeight: 700, marginBottom: '4px' }}>How to improve?</div>
                   <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                     Your grade is heavily impacted by containers running in privileged mode or without memory limits. Fix these in your deployment specs to reach an **A+** rating.
                   </div>
                </div>
             </div>
          </div>

        </div>
      )}

      {/* Detailed Findings Report */}
      {!loading && audit?.findings?.length > 0 && (
        <div className="glass-card" style={{ marginTop: '24px', padding: '32px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="var(--accent-blue)" /> Detailed Security Findings Report
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Resource</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Severity</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Security Violation</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Remediation Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {audit.findings.map((f: any, i: number) => (
                  <tr key={i} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600 }}>{f.pod}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{f.namespace}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800,
                        background: f.severity === 'HIGH' ? 'rgba(239,68,68,0.1)' : f.severity === 'MEDIUM' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)',
                        color: f.severity === 'HIGH' ? 'var(--error)' : f.severity === 'MEDIUM' ? 'var(--warning)' : 'var(--accent-blue)',
                        border: `1px solid ${f.severity === 'HIGH' ? 'var(--error)' : f.severity === 'MEDIUM' ? 'var(--warning)' : 'var(--accent-blue)'}33`
                      }}>
                        {f.severity}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-primary)' }}>{f.issue}</td>
                    <td style={{ padding: '16px', color: 'var(--accent-cyan)', fontSize: '0.85rem', maxWidth: '300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={14} /> {f.recommendation}
                      </div>
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

const Badge = ({ count, label, color }: any) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '8px', border: `1px solid ${color}33` }}>
    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{count} {label}</span>
  </div>
);

const AuditItem = ({ icon, title, value, status }: any) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {icon}
      <span style={{ fontWeight: 600 }}>{title}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '0.85rem', color: status === 'good' ? 'var(--success)' : 'var(--text-secondary)' }}>{value}</span>
      <ArrowUpRight size={14} color="rgba(255,255,255,0.2)" />
    </div>
  </div>
);
