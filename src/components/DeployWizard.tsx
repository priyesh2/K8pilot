import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Plus, Rocket, Box, Globe, Shield, Activity, RefreshCw, Layers, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const DeployWizard: React.FC = () => {
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    namespace: 'default',
    image: '',
    replicas: 1,
    port: ''
  });

  useEffect(() => {
    K8sService.getNamespaces().then(setNamespaces).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.image) return;

    setDeploying(true);
    setError(null);
    try {
      const ok = await K8sService.quickDeploy({
        ...formData,
        port: formData.port ? parseInt(formData.port) : undefined
      });
      if (ok) {
        setSuccess(true);
        setFormData({ name: '', namespace: 'default', image: '', replicas: 1, port: '' });
      } else {
        setError('Deployment failed. Check RBAC permissions or cluster resource limits.');
      }
    } catch (err) {
      setError('An unexpected error occurred during deployment.');
    } finally {
      setDeploying(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (success) {
    return (
      <div className="dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card" 
          style={{ textAlign: 'center', padding: '60px', maxWidth: '500px' }}
        >
          <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', padding: '20px', borderRadius: '50%', width: 'fit-content', margin: '0 auto 24px' }}>
            <CheckCircle size={48} />
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '16px' }}>Deployment Launched!</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px' }}>
            Your workload has been successfully submitted to the cluster. It may take a minute for the pods to transition to "Running".
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => setSuccess(false)} className="btn-primary" style={{ padding: '12px 32px' }}>Deploy Another</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>Launch Center</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Deploy containerized applications to your cluster in seconds</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '40px' }}>
        <div className="glass-card" style={{ padding: '40px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>App Name</label>
                <input 
                  name="name"
                  type="text" 
                  placeholder="e.g. my-web-app"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'var(--border-glass)', borderRadius: '12px', padding: '14px', color: 'white', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Target Namespace</label>
                <select 
                  name="namespace"
                  value={formData.namespace}
                  onChange={handleChange}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'var(--border-glass)', borderRadius: '12px', padding: '14px', color: 'white', outline: 'none', cursor: 'pointer' }}
                >
                  {namespaces.map(ns => <option key={ns} value={ns}>{ns}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Container Image</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  name="image"
                  type="text" 
                  placeholder="e.g. nginx:latest, my-registry.com/app:v1"
                  required
                  value={formData.image}
                  onChange={handleChange}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: 'var(--border-glass)', borderRadius: '12px', padding: '14px', color: 'white', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Replicas (Scale)</label>
                <input 
                  name="replicas"
                  type="number" 
                  min="1" max="10"
                  value={formData.replicas}
                  onChange={handleChange}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'var(--border-glass)', borderRadius: '12px', padding: '14px', color: 'white', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Expose Port (Optional)</label>
                <input 
                  name="port"
                  type="number" 
                  placeholder="e.g. 80, 8080"
                  value={formData.port}
                  onChange={handleChange}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'var(--border-glass)', borderRadius: '12px', padding: '14px', color: 'white', outline: 'none' }}
                />
              </div>
            </div>

            {error && (
              <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--error)', color: 'var(--error)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={16} /> {error}
              </div>
            )}

            <button 
               type="submit" 
               className="btn-primary" 
               disabled={deploying}
               style={{ width: '100%', padding: '16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 0 20px rgba(99,102,241,0.2)' }}
            >
              {deploying ? <RefreshCw className="spin" size={20} /> : <Rocket size={20} />}
              {deploying ? 'Establishing connection...' : 'Launch Application'}
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
             <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'var(--accent-blue)', opacity: 0.1, borderRadius: '50%' }} />
             <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Shield size={18} color="var(--accent-blue)" /> Security First
             </h3>
             <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
               All deployments initiated via the wizard automatically include basic security practices:
             </p>
             <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '12px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
               <li>Resource labeling for easy tracking</li>
               <li>Automatic ClusterIP service creation</li>
               <li>Integrated health monitoring</li>
             </ul>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
             <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Layers size={18} color="var(--accent-purple)" /> Manifest Preview
             </h3>
             <pre style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', overflowX: 'auto', fontFamily: 'var(--font-mono)' }}>
{`apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${formData.name || 'app'}
  namespace: ${formData.namespace}
spec:
  replicas: ${formData.replicas}
  selector:
    matchLabels:
      app: ${formData.name || 'app'}`}
             </pre>
             <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'center' }}>
               Full YAML is generated dynamically
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
