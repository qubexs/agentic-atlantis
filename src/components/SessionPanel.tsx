import { useState } from 'react';
import { Clock, Plus, Trash2, MessageSquare } from 'lucide-react';
import { useAppStore } from '../store';

interface Session {
  id: number;
  name: string;
  timestamp: string;
  messages: number;
}

const INITIAL_SESSIONS: Session[] = [
  { id: 1, name: 'Build agentic CLI tool', timestamp: '10 mins ago', messages: 24 },
  { id: 2, name: 'Blockchain node config', timestamp: '2 hours ago', messages: 11 },
  { id: 3, name: 'React workflow editor', timestamp: 'Yesterday', messages: 37 },
];

export default function SessionPanel() {
  const { chatHistory, clearChat } = useAppStore();
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);

  const removeSession = (id: number) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const newSession = () => {
    clearChat();
    setSessions((prev) => [
      {
        id: Date.now(),
        name: `Session ${prev.length + 1}`,
        timestamp: 'Just now',
        messages: 0,
      },
      ...prev,
    ]);
  };

  return (
    <div className="session-container">
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
          <Clock size={13} color="var(--yellow)" />
          <span style={{ fontSize: 12, fontWeight: 600 }}>Sessions</span>
        </div>
        <button
          onClick={newSession}
          style={{ padding: '3px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Plus size={12} /> New
        </button>
      </div>

      {chatHistory.length > 0 && (
        <div
          style={{
            margin: '6px 8px',
            background: '#1a3a2a',
            border: '1px solid var(--success)',
            borderRadius: 6,
            padding: '8px 10px',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600, marginBottom: 3 }}>
            Active Session
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <MessageSquare size={11} />
            {chatHistory.length} message{chatHistory.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      <div className="session-list">
        {sessions.length === 0 ? (
          <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            No saved sessions
          </div>
        ) : (
          sessions.map((session) => (
            <div className="session-item" key={session.id}>
              <div>
                <div className="session-name">{session.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="session-time">{session.timestamp}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <MessageSquare size={10} />{session.messages}
                  </span>
                </div>
              </div>
              <button
                className="session-remove-btn"
                onClick={(e) => { e.stopPropagation(); removeSession(session.id); }}
                title="Remove session"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
