import React, { useState } from 'react';
import { Bot, Lock, User, Sparkles, Send } from 'lucide-react';

interface LoginProps {
  onLogin: (token: string, user: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const resp = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Login failed');

      onLogin(data.token, data.username);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: `var(--bg-deep)`,
      backgroundImage: 'var(--bg-gradient)'
    }}>
      <div className="glass-card" style={{ 
        width: '100%', 
        maxWidth: '400px', 
        padding: '40px', 
        textAlign: 'center',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ 
          background: 'var(--gradient-primary)', 
          width: '64px', 
          height: '64px', 
          borderRadius: '16px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 24px',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <Bot size={32} color="white" />
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>k8pilot</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Enterprise Control Center</p>

        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            color: 'var(--error)', 
            padding: '12px', 
            borderRadius: '12px', 
            fontSize: '0.85rem', 
            marginBottom: '24px',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} 
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary" 
            style={{ padding: '14px', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {loading ? 'Authenticating...' : (
              <>
                <Sparkles size={18} /> Access Control Center
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '32px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Restricted to authorized personnel only. All access is logged.
        </div>
      </div>
    </div>
  );
};
