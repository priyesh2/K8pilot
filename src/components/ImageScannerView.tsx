import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { Shield, AlertTriangle, CheckCircle, Package, Search, Filter, RefreshCw, Tag, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface ImageInfo {
  image: string;
  tag: string;
  registry: string;
  deployments: string[];
  namespaces: string[];
  podCount: number;
  issues: string[];
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'CLEAN';
}

export const ImageScannerView: React.FC = () => {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [selectedImage, setSelectedImage] = useState<ImageInfo | null>(null);

  useEffect(() => {
    scanImages();
  }, []);

  const scanImages = async () => {
    setLoading(true);
    try {
      const [deps, pods] = await Promise.all([
        K8sService.getDeployments('all'),
        K8sService.getPods('all')
      ]);

      const imageMap = new Map<string, ImageInfo>();

      deps.forEach(d => {
        (d.images || []).forEach((img: string) => {
          const parsed = parseImage(img);
          const key = img;
          if (!imageMap.has(key)) {
            imageMap.set(key, {
              image: parsed.name,
              tag: parsed.tag,
              registry: parsed.registry,
              deployments: [],
              namespaces: [],
              podCount: 0,
              issues: [],
              riskLevel: 'CLEAN'
            });
          }
          const entry = imageMap.get(key)!;
          if (!entry.deployments.includes(d.name)) entry.deployments.push(d.name);
          if (!entry.namespaces.includes(d.namespace)) entry.namespaces.push(d.namespace);
        });
      });

      // Count pods per image
      pods.forEach((p: any) => {
        imageMap.forEach((info, key) => {
          if (p.ownerName && info.deployments.some(d => p.ownerName?.includes(d))) {
            info.podCount++;
          }
        });
      });

      // Run heuristic security checks
      imageMap.forEach((info, key) => {
        const issues: string[] = [];
        
        if (info.tag === 'latest' || info.tag === '') {
          issues.push('Uses :latest tag — no version pinning');
        }
        if (!key.includes('@sha256:') && !key.includes('sha256:')) {
          issues.push('No digest pinning — vulnerable to supply chain attacks');
        }
        if (info.registry === 'docker.io' || info.registry === '') {
          issues.push('Uses Docker Hub public registry — consider private registry');
        }
        if (info.tag && /^[0-9]+$/.test(info.tag)) {
          issues.push('Numeric-only tag — may not represent a meaningful version');
        }
        if (key.includes('alpine') && info.tag === 'latest') {
          issues.push('Alpine base with :latest — pin to specific Alpine version');
        }

        info.issues = issues;
        if (issues.length >= 3) info.riskLevel = 'CRITICAL';
        else if (issues.length === 2) info.riskLevel = 'HIGH';
        else if (issues.length === 1) info.riskLevel = 'MEDIUM';
        else info.riskLevel = 'CLEAN';
      });

      setImages(Array.from(imageMap.values()).sort((a, b) => {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, CLEAN: 4 };
        return order[a.riskLevel] - order[b.riskLevel];
      }));
    } catch (e) {
      console.error('Image scan failed:', e);
    }
    setLoading(false);
  };

  const parseImage = (img: string): { registry: string; name: string; tag: string } => {
    let registry = '';
    let name = img;
    let tag = 'latest';

    if (name.includes('@sha256:')) {
      const [n] = name.split('@');
      name = n;
      tag = 'sha256-pinned';
    }
    if (name.includes(':')) {
      const parts = name.split(':');
      tag = parts.pop() || 'latest';
      name = parts.join(':');
    }
    if (name.includes('/') && (name.split('/')[0].includes('.') || name.split('/')[0].includes(':'))) {
      const parts = name.split('/');
      registry = parts.shift() || '';
      name = parts.join('/');
    } else if (!name.includes('/')) {
      registry = 'docker.io';
      name = `library/${name}`;
    } else {
      registry = 'docker.io';
    }
    return { registry, name, tag };
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'var(--error)';
      case 'HIGH': return '#f97316';
      case 'MEDIUM': return 'var(--warning)';
      case 'LOW': return 'var(--accent-blue)';
      default: return 'var(--success)';
    }
  };

  const filtered = images.filter(img => {
    const matchesSearch = !search || img.image.toLowerCase().includes(search.toLowerCase()) || img.deployments.some(d => d.toLowerCase().includes(search.toLowerCase()));
    const matchesRisk = riskFilter === 'ALL' || img.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const stats = {
    total: images.length,
    critical: images.filter(i => i.riskLevel === 'CRITICAL').length,
    high: images.filter(i => i.riskLevel === 'HIGH').length,
    medium: images.filter(i => i.riskLevel === 'MEDIUM').length,
    clean: images.filter(i => i.riskLevel === 'CLEAN').length,
  };

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: 'var(--gradient-primary)', borderRadius: '12px' }}>
              <Package size={24} color="white" />
            </div>
            Image Scanner
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Container image security hygiene analysis across all workloads</p>
        </div>
        <button onClick={scanImages} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} /> Re-Scan
        </button>
      </header>

      {/* Stats Row */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Images', value: stats.total, color: 'var(--accent-blue)', icon: <Package size={20} /> },
            { label: 'Critical', value: stats.critical, color: 'var(--error)', icon: <AlertTriangle size={20} /> },
            { label: 'High Risk', value: stats.high, color: '#f97316', icon: <Shield size={20} /> },
            { label: 'Medium Risk', value: stats.medium, color: 'var(--warning)', icon: <Tag size={20} /> },
            { label: 'Clean', value: stats.clean, color: 'var(--success)', icon: <CheckCircle size={20} /> },
          ].map((s, i) => (
            <motion.div key={i} className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ color: s.color, marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filter Row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input placeholder="Search images or deployments..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 16px 12px 40px', background: 'rgba(255,255,255,0.04)', border: 'var(--border-glass)', borderRadius: '12px', color: 'var(--text-primary)', fontFamily: 'var(--font-main)', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '12px', gap: '4px' }}>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'CLEAN'].map(f => (
            <button key={f} onClick={() => setRiskFilter(f)}
              style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: riskFilter === f ? 'rgba(59,130,246,0.12)' : 'transparent', color: riskFilter === f ? 'var(--accent-blue)' : 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Image Table */}
      {loading ? <div className="skeleton" style={{ height: '500px' }} /> : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ maxHeight: 'calc(100vh - 420px)', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontSize: '0.82rem', position: 'sticky', top: 0, background: 'var(--bg-deep)', zIndex: 1 }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600 }}>Image</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600 }}>Tag</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600 }}>Registry</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600 }}>Workloads</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600 }}>Risk</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600 }}>Issues</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600 }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((img, i) => (
                  <tr key={i} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.88rem' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{img.image}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{img.deployments.slice(0, 2).join(', ')}{img.deployments.length > 2 ? ` +${img.deployments.length - 2}` : ''}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ padding: '3px 8px', background: img.tag === 'latest' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)', color: img.tag === 'latest' ? 'var(--error)' : 'var(--text-primary)', borderRadius: '6px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {img.tag || 'latest'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{img.registry || 'docker.io'}</td>
                    <td style={{ padding: '16px', textAlign: 'center', fontWeight: 700 }}>{img.deployments.length}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, background: `${getRiskColor(img.riskLevel)}15`, color: getRiskColor(img.riskLevel), border: `1px solid ${getRiskColor(img.riskLevel)}33` }}>
                        {img.riskLevel}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: img.issues.length > 0 ? 'var(--warning)' : 'var(--success)' }}>
                      {img.issues.length}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button onClick={() => setSelectedImage(img)} style={{ background: 'rgba(255,255,255,0.04)', border: 'none', color: 'var(--accent-blue)', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 600 }}>
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedImage && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
          <motion.div className="modal-content" onClick={e => e.stopPropagation()} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            style={{ maxWidth: '600px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Image Analysis</h2>
              <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, background: `${getRiskColor(selectedImage.riskLevel)}15`, color: getRiskColor(selectedImage.riskLevel) }}>
                {selectedImage.riskLevel}
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', marginBottom: '20px', wordBreak: 'break-all' }}>
              {selectedImage.image}:{selectedImage.tag}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Registry</div>
                <div style={{ fontWeight: 700 }}>{selectedImage.registry || 'docker.io'}</div>
              </div>
              <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Workloads</div>
                <div style={{ fontWeight: 700 }}>{selectedImage.deployments.length} deployment(s)</div>
              </div>
            </div>
            {selectedImage.issues.length > 0 && (
              <div>
                <div style={{ fontWeight: 700, marginBottom: '12px', fontSize: '0.95rem' }}>Security Issues</div>
                {selectedImage.issues.map((issue, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', background: 'rgba(239,68,68,0.04)', borderRadius: '10px', marginBottom: '8px', border: '1px solid rgba(239,68,68,0.08)' }}>
                    <AlertTriangle size={16} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{issue}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontWeight: 700, marginBottom: '8px', fontSize: '0.95rem' }}>Used In</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedImage.deployments.map((d, i) => (
                  <span key={i} style={{ padding: '4px 10px', background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>{d}</span>
                ))}
              </div>
            </div>
            <button onClick={() => setSelectedImage(null)} style={{ marginTop: '24px', width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: 'var(--border-glass)', borderRadius: '12px', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
