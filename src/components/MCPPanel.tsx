import { useState } from 'react';
import { Server, Plus, RefreshCw } from 'lucide-react';

interface MCPServer {
  id: number;
  name: string;
  description: string;
  connected: boolean;
  tools: number;
}

const INITIAL_SERVERS: MCPServer[] = [
  { id: 1, name: 'Local File System', description: 'Read/write files', connected: true, tools: 4 },
  { id: 2, name: 'GitHub Integration', description: 'Repos, PRs, issues', connected: false, tools: 8 },
  { id: 3, name: 'Web Search', description: 'Tavily search API', connected: true, tools: 2 },
  { id: 4, name: 'Code Executor', description: 'Run code snippets', connected: false, tools: 3 },
];

export default function MCPPanel() {
  const [servers, setServers] = useState<MCPServer[]>(INITIAL_SERVERS);
  const [connecting, setConnecting] = useState<number | null>(null);

  const toggleConnection = async (id: number) => {
    setConnecting(id);
    await new Promise((r) => setTimeout(r, 600));
    setServers((prev) => prev.map((s) => (s.id === id ? { ...s, connected: !s.connected } : s)));
    setConnecting(null);
  };

  const connected = servers.filter((s) => s.connected).length;
  const totalTools = servers.filter((s) => s.connected).reduce((a, s) => a + s.tools, 0);

  return (
    <div className="mcp-container">
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Server size={13} color="var(--success)" />
          <span style={{ fontSize: 12, fontWeight: 600 }}>MCP Servers</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {connected}/{servers.length} · {totalTools} tools
        </span>
      </div>

      <div className="mcp-list">
        {servers.map((server) => (
          <div className="mcp-server-item" key={server.id}>
            <div>
              <div className="mcp-server-name">{server.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{server.description}</div>
              <div className="mcp-server-status">
                <span className={`status-dot ${server.connected ? 'connected' : 'disconnected'}`} />
                {server.connected ? `Connected · ${server.tools} tools` : 'Disconnected'}
              </div>
            </div>
            <button
              className="mcp-toggle-btn"
              onClick={() => toggleConnection(server.id)}
              disabled={connecting === server.id}
              style={{
                background: server.connected ? 'var(--bg-hover)' : 'var(--accent-primary)',
                color: server.connected ? 'var(--text-secondary)' : 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {connecting === server.id
                ? <><RefreshCw size={11} style={{ animation: 'spin 0.8s linear infinite' }} /> ...</>
                : server.connected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        ))}

        <button
          style={{
            width: '100%',
            padding: '8px',
            background: 'transparent',
            border: '1px dashed var(--border-color)',
            borderRadius: 6,
            color: 'var(--text-muted)',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            cursor: 'pointer',
            marginTop: 4,
          }}
        >
          <Plus size={13} /> Add MCP Server
        </button>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
