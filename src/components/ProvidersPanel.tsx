import { useState } from 'react';
import { Cpu } from 'lucide-react';
import { useAppStore } from '../store';

interface ProviderItem {
  id: string;
  name: string;
  models: string[];
  status: 'active' | 'available' | 'offline';
  badge: string;
}

const ALL_PROVIDERS: ProviderItem[] = [
  { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'], status: 'available', badge: 'Cloud' },
  { id: 'anthropic', name: 'Anthropic', models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'], status: 'available', badge: 'Cloud' },
  { id: 'google', name: 'Google Gemini', models: ['gemini-2.0-flash', 'gemini-1.5-pro'], status: 'available', badge: 'Cloud' },
  { id: 'ollama', name: 'Ollama', models: ['llama3', 'mistral', 'codellama', 'qwen2.5-coder'], status: 'offline', badge: 'Local' },
];

export default function ProvidersPanel() {
  const { aiSettings, setAiSettings } = useAppStore();
  const [providers, setProviders] = useState<ProviderItem[]>(
    ALL_PROVIDERS.map((p) => ({
      ...p,
      status: p.id === aiSettings.provider ? 'active' : p.status,
    }))
  );

  const activate = (providerId: string) => {
    const p = ALL_PROVIDERS.find((p) => p.id === providerId)!;
    setProviders((prev) =>
      prev.map((item) => ({
        ...item,
        status: item.id === providerId ? 'active' : item.status === 'active' ? 'available' : item.status,
      }))
    );
    setAiSettings({ provider: providerId as never, model: p.models[0] });
  };

  return (
    <div className="providers-container">
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0,
        }}
      >
        <Cpu size={13} color="var(--accent-bright)" />
        <span style={{ fontSize: 12, fontWeight: 600 }}>Model Providers</span>
      </div>

      <div className="providers-list">
        {providers.map((p) => (
          <div className="provider-item" key={p.id}>
            <div className="provider-header">
              <span className="provider-name">{p.name}</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: 10,
                    padding: '1px 6px',
                    borderRadius: 8,
                    background: 'var(--bg-hover)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {p.badge}
                </span>
                <span className={`provider-status-badge${p.status === 'active' ? ' active' : ''}`}>
                  {p.status}
                </span>
              </div>
            </div>

            <select
              style={{ fontSize: 11, padding: '3px 6px', width: '100%' }}
              value={p.id === aiSettings.provider ? aiSettings.model : p.models[0]}
              onChange={(e) => {
                if (p.id === aiSettings.provider) setAiSettings({ model: e.target.value });
              }}
              disabled={p.id !== aiSettings.provider}
            >
              {p.models.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>

            {p.status !== 'active' && (
              <button
                onClick={() => activate(p.id)}
                style={{ fontSize: 11, background: 'var(--accent-primary)', color: 'white', padding: '4px 10px', alignSelf: 'flex-start' }}
              >
                Set Active
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
