import { useState, useEffect } from 'react';
import { Cpu } from 'lucide-react';
import { useAppStore, ProviderConfig } from '../store';

interface ProviderItem {
  id: string;
  name: string;
  models: Record<string, { name: string }>;
  status: 'active' | 'available' | 'offline';
  badge: string;
}

const DEFAULT_PROVIDERS: ProviderItem[] = [
  { id: 'openai', name: 'OpenAI', models: { 'gpt-4o': { name: 'GPT-4o' }, 'gpt-4o-mini': { name: 'GPT-4o Mini' }, 'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo' } }, status: 'available', badge: 'Cloud' },
  { id: 'anthropic', name: 'Anthropic', models: { 'claude-3-5-sonnet-20241022': { name: 'Claude 3.5 Sonnet' }, 'claude-3-haiku-20240307': { name: 'Claude 3 Haiku' } }, status: 'available', badge: 'Cloud' },
  { id: 'google', name: 'Google Gemini', models: { 'gemini-2.0-flash': { name: 'Gemini 2.0 Flash' }, 'gemini-1.5-pro': { name: 'Gemini 1.5 Pro' } }, status: 'available', badge: 'Cloud' },
  { id: 'ollama', name: 'Ollama', models: { 'llama3': { name: 'Llama 3' }, 'mistral': { name: 'Mistral' }, 'codellama': { name: 'CodeLlama' }, 'qwen2.5-coder': { name: 'Qwen 2.5 Coder' } }, status: 'offline', badge: 'Local' },
];

export default function ProvidersPanel() {
  const { aiSettings, setAiSettings, customProviders } = useAppStore();
  const [providers, setProviders] = useState<ProviderItem[]>([]);

  useEffect(() => {
    const all = [...DEFAULT_PROVIDERS, ...customProviders.map((p: ProviderConfig) => ({
      id: p.id,
      name: p.name || p.id,
      models: p.models || {},
      status: p.id === aiSettings.provider ? 'active' as const : 'available' as const,
      badge: 'Custom',
    }))];
    
    setProviders(all.map(p => ({
      ...p,
      status: p.id === aiSettings.provider ? 'active' as const : p.status === 'active' ? 'available' as const : p.status,
    })));
  }, [customProviders, aiSettings.provider]);

  const activate = (providerId: string) => {
    const p = providers.find((p) => p.id === providerId);
    const firstModel = p ? Object.keys(p.models)[0] : '';
    setProviders((prev) =>
      prev.map((item) => ({
        ...item,
        status: item.id === providerId ? 'active' : item.status === 'active' ? 'available' : item.status,
      }))
    );
    setAiSettings({ provider: providerId, model: firstModel });
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
              value={p.id === aiSettings.provider ? aiSettings.model : Object.keys(p.models)[0]}
              onChange={(e) => {
                if (p.id === aiSettings.provider) setAiSettings({ model: e.target.value });
              }}
              disabled={p.id !== aiSettings.provider}
            >
              {Object.entries(p.models).map(([id, config]) => <option key={id} value={id}>{config.name}</option>)}
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
