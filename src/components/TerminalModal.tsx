import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { X, Maximize2, Minimize2, Terminal as TerminalIcon, AlertCircle } from 'lucide-react';
import 'xterm/css/xterm.css';

interface TerminalModalProps {
  podName: string;
  namespace: string;
  container?: string;
  onClose: () => void;
}

export const TerminalModal: React.FC<TerminalModalProps> = ({ podName, namespace, container, onClose }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"JetBrains Mono", monospace',
      theme: {
        background: '#06070e',
        foreground: '#f1f5f9',
        cursor: '#6366f1',
        selectionBackground: 'rgba(99, 102, 241, 0.3)',
        black: '#000000',
        red: '#f43f5e',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#6366f1',
        magenta: '#a855f7',
        cyan: '#22d3ee',
        white: '#f1f5f9',
      },
      allowProposedApi: true
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    xtermRef.current = term;

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const token = localStorage.getItem('k8s_token');
    const wsUrl = `${protocol}//${host}/api/terminal?token=${token}&namespace=${namespace}&pod=${podName}${container ? `&container=${container}` : ''}`;

    const socket = new WebSocket(wsUrl);
    socket.binaryType = 'arraybuffer';
    socketRef.current = socket;

    socket.onopen = () => {
      term.writeln('\x1b[1;32mConnected to pod shell\x1b[0m');
      term.focus();
    };

    socket.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        term.write(new Uint8Array(event.data));
      } else {
        term.write(event.data);
      }
    };

    socket.onerror = () => {
      setError('WebSocket connection error. Check RBAC permissions or pod status.');
    };

    socket.onclose = () => {
      term.writeln('\n\x1b[1;31mSession closed\x1b[0m');
    };

    term.onData((data) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(data);
      }
    });

    const handleResize = () => {
      fitAddon.fit();
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'resize',
          cols: term.cols,
          rows: term.rows
        }));
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      socket.close();
      term.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, [podName, namespace, container]);

  return (
    <div className="modal-overlay" style={{ padding: isMaximized ? '0' : '40px' }}>
      <div className="modal-content" style={{ 
        width: isMaximized ? '100%' : '90%', 
        height: isMaximized ? '100%' : '80%',
        maxWidth: isMaximized ? 'none' : '1000px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: isMaximized ? '0' : '20px'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '16px 24px', 
          background: 'rgba(255,255,255,0.03)', 
          borderBottom: 'var(--border-glass)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-blue)', padding: '8px', borderRadius: '8px' }}>
              <TerminalIcon size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Pod Terminal</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {namespace} / {podName} {container ? `(${container})` : ''}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setIsMaximized(!isMaximized)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
            >
              {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button 
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Terminal Area */}
        <div style={{ flex: 1, padding: '20px', background: '#06070e', position: 'relative' }}>
          {error && (
            <div style={{ 
              position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(6,7,14,0.9)', 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--error)'
            }}>
              <AlertCircle size={48} style={{ marginBottom: '16px' }} />
              <div style={{ fontWeight: 600 }}>{error}</div>
              <button 
                onClick={onClose}
                className="btn-primary" 
                style={{ marginTop: '24px', padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Close Terminal
              </button>
            </div>
          )}
          <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Footer Info */}
        <div style={{ padding: '8px 24px', background: 'rgba(0,0,0,0.2)', fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'flex', gap: '16px' }}>
          <div>SH: /bin/sh (fallback)</div>
          <div>BASH: /bin/bash (preferred)</div>
          <div style={{ marginLeft: 'auto' }}>ESC to focus • Ctrl+C to interrupt</div>
        </div>
      </div>
    </div>
  );
};
