import React, { useState, useEffect } from 'react';
import { K8sService } from '../services/k8s';
import { X, Save, FileCode } from 'lucide-react';
import yaml from 'js-yaml';

interface LiveYamlEditorModalProps {
  namespace: string;
  kind: string;
  name: string;
  onClose: () => void;
}

export const LiveYamlEditorModal: React.FC<LiveYamlEditorModalProps> = ({ namespace, kind, name, onClose }) => {
  const [yamlText, setYamlText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchYaml = async () => {
      const data = await K8sService.getYaml(namespace, kind, name);
      if (data && data.metadata && data.metadata.managedFields) {
        delete data.metadata.managedFields;
      }
      setYamlText(yaml.dump(data, { indent: 2 }));
      setLoading(false);
    };
    fetchYaml();
  }, [namespace, kind, name]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const parsed = yaml.load(yamlText);
      const ok = await K8sService.patchYaml(namespace, kind, name, parsed);
      if (ok) {
        alert('Patched successfully!');
        onClose();
      } else {
        alert('Patch failed. Check your YAML format or cluster permissions.');
      }
    } catch (err) {
      alert('Invalid YAML formatting.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '40px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '1000px', height: '100%', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
        
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileCode size={24} color="var(--accent-purple)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>Live YAML/JSON Editor</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Editing: {kind} / {name} ({namespace})</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '8px' }}>
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Fetching live cluster state...</div>
        ) : (
          <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <textarea 
              value={yamlText}
              onChange={e => setYamlText(e.target.value)}
              spellCheck="false"
              style={{
                flex: 1, width: '100%', background: '#0d1117', color: '#c9d1d9', border: 'none', padding: '24px', fontFamily: 'monospace', fontSize: '0.9rem', outline: 'none', resize: 'none', lineHeight: '1.5'
              }}
            />
          </div>
        )}

        <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'rgba(255,255,255,0.02)' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--accent-purple)', color: 'white', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={18} /> {saving ? 'Patching...' : 'Apply Live Patch'}
          </button>
        </div>
      </div>
    </div>
  );
};
