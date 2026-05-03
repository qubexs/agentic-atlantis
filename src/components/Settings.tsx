import { useState, useEffect } from 'react';
import { Check, Eye, EyeOff, Plus, X, Settings as SettingsIcon } from 'lucide-react';
import { useAppStore, ProviderConfig } from '../store';

const DEFAULT_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', models: { 'gpt-4o': { name: 'GPT-4o' }, 'gpt-4o-mini': { name: 'GPT-4o Mini' }, 'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo' } } },
  { id: 'anthropic', name: 'Anthropic', baseUrl: 'https://api.anthropic.com', models: { 'claude-3-5-sonnet-20241022': { name: 'Claude 3.5 Sonnet' }, 'claude-3-haiku-20240307': { name: 'Claude 3 Haiku' } } },
  { id: 'google', name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', models: { 'gemini-2.0-flash': { name: 'Gemini 2.0 Flash' }, 'gemini-1.5-pro': { name: 'Gemini 1.5 Pro' } } },
  { id: 'ollama', name: 'Ollama (Local)', baseUrl: 'http://localhost:11434/v1', models: { 'llama3': { name: 'Llama 3' }, 'mistral': { name: 'Mistral' }, 'codellama': { name: 'CodeLlama' }, 'qwen2.5-coder': { name: 'Qwen 2.5 Coder' } } },
  { id: 'custom', name: 'Custom / OpenAI-compatible', baseUrl: '', models: { 'custom-model': { name: 'Custom Model' } } },
];

const SHORTCUTS = [
  { action: 'Save file', key: 'Ctrl+S' },
  { action: 'Open settings', key: 'Ctrl+,' },
  { action: 'Toggle sidebar', key: 'Ctrl+B' },
  { action: 'New terminal', key: 'Ctrl+`' },
  { action: 'Focus chat input', key: 'Ctrl+L' },
  { action: 'Open file', key: 'Ctrl+K' },
  { action: 'Command palette', key: 'Ctrl+Shift+P' },
  { action: 'Choose model', key: "Ctrl+'" },
  { action: 'Navigate back', key: 'Ctrl+[' },
  { action: 'Navigate forward', key: 'Ctrl+]' },
  { action: 'Close tab', key: 'Ctrl+W' },
];

type TabId = 'model' | 'editor' | 'shortcuts' | 'general';

export default function Settings() {
  const { aiSettings, setAiSettings } = useAppStore();
  const [tab, setTab] = useState<TabId>('model');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [localSettings, setLocalSettings] = useState({ ...aiSettings });
  const [editorSettings, setEditorSettings] = useState({
    fontSize: 13,
    tabSize: 2,
    wordWrap: true,
    minimap: true,
    lineNumbers: true,
    fontLigatures: true,
  });
  const [generalSettings, setGeneralSettings] = useState({
    autoSave: false,
    autoAccept: false,
    showProgressBar: true,
    theme: 'dark',
  });
  const { providerJson, customProviders, setProviderJson } = useAppStore();
  const [localProviderJson, setLocalProviderJson] = useState(providerJson);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [customProvider, setCustomProvider] = useState({
    id: 'myprovider',
    name: 'My AI Provider',
    baseUrl: 'https://api.myprovider.com/v1',
    apiKey: '',
    models: [{ id: 'model-id', name: 'Display Name' }],
    headers: [{ name: '', value: '' }],
  });

  const allProviders = [...DEFAULT_PROVIDERS, ...customProviders];

  const handleSave = () => {
    const customModels: Record<string, { name: string }> = {};
    customProvider.models.forEach(m => {
      if (m.id) customModels[m.id] = { name: m.name || m.id };
    });
    
    const customHeaders: Record<string, string> = {};
    customProvider.headers.forEach(h => {
      if (h.name) customHeaders[h.name] = h.value;
    });
    
    const customProviderConfig: any = {
      npm: "@ai-sdk/openai-compatible",
      options: {
        baseURL: customProvider.baseUrl || "https://api.example.com/v1",
      },
      models: customModels,
    };
    
    if (customProvider.apiKey) {
      customProviderConfig.options.apiKey = customProvider.apiKey;
    }
    
    if (Object.keys(customHeaders).length > 0) {
      customProviderConfig.options.headers = customHeaders;
    }
    
    const newProviderJson: any = { provider: {} };
    newProviderJson.provider[customProvider.id] = customProviderConfig;
    
    const jsonStr = JSON.stringify(newProviderJson, null, 2);
    setProviderJson(jsonStr);
    setLocalProviderJson(jsonStr);
    
    const firstModel = customProvider.models[0]?.id || '';
    setAiSettings({
      ...localSettings,
      provider: customProvider.id,
      baseUrl: customProvider.baseUrl,
      model: firstModel
    });
    setLocalSettings({
      ...localSettings,
      provider: customProvider.id,
      baseUrl: customProvider.baseUrl,
      model: firstModel
    });
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-container">
      <div className="panel-tabs">
        {(['model', 'editor', 'general', 'shortcuts'] as TabId[]).map((t) => (
          <button
            key={t}
            className={`panel-tab${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'model' ? 'Model' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="settings-body">
        {tab === 'model' && (
          <div className="settings-section">
            <div className="settings-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>AI Model Provider</span>
              <button
                onClick={() => setShowProviderModal(true)}
                style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                title="Provider Configuration"
              >
                <SettingsIcon size={14} />
              </button>
            </div>

            <div className="settings-field">
              <label className="settings-label">Provider</label>
              <select
                className="settings-input"
                value={localSettings.provider}
                onChange={(e) => {
                  const provider = allProviders.find(p => p.id === e.target.value);
                  const firstModel = provider ? Object.keys(provider.models)[0] : '';
                  setLocalSettings({ 
                    ...localSettings, 
                    provider: e.target.value,
                    baseUrl: provider?.options?.baseURL || '',
                    model: firstModel
                  });
                }}
              >
                {allProviders.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="settings-field">
              <label className="settings-label">Model</label>
              <select
                className="settings-input"
                value={localSettings.model}
                onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value })}
              >
                {(() => {
                  const provider = allProviders.find(p => p.id === localSettings.provider);
                  if (!provider) return null;
                  return Object.entries(provider.models).map(([id, config]) => (
                    <option key={id} value={id}>{config.name}</option>
                  ));
                })()}
              </select>
            </div>

            <div className="settings-field">
              <label className="settings-label">Provider ID</label>
              <input
                className="settings-input"
                value={customProvider.id}
                onChange={(e) => setCustomProvider({ ...customProvider, id: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') })}
                placeholder="myprovider"
              />
              <span className="settings-description">Lowercase letters, numbers, hyphens, or underscores</span>
            </div>

            <div className="settings-field">
              <label className="settings-label">Display name</label>
              <input
                className="settings-input"
                value={customProvider.name}
                onChange={(e) => setCustomProvider({ ...customProvider, name: e.target.value })}
                placeholder="My AI Provider"
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">Base URL</label>
              <input
                className="settings-input"
                value={customProvider.baseUrl}
                onChange={(e) => setCustomProvider({ ...customProvider, baseUrl: e.target.value })}
                placeholder="https://api.myprovider.com/v1"
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">API key</label>
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  className="settings-input"
                  type={showKey ? 'text' : 'password'}
                  value={customProvider.apiKey}
                  onChange={(e) => setCustomProvider({ ...customProvider, apiKey: e.target.value })}
                  placeholder="API key"
                  style={{ flex: 1 }}
                />
                <button onClick={() => setShowKey(!showKey)} style={{ padding: '4px 8px', flexShrink: 0 }}>
                  {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <span className="settings-description">Optional. Leave empty if you manage auth via headers.</span>
            </div>

            <div className="settings-field">
              <label className="settings-label">Models</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {customProvider.models.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      className="settings-input"
                      value={m.id}
                      onChange={(e) => {
                        const models = [...customProvider.models];
                        models[i].id = e.target.value;
                        setCustomProvider({ ...customProvider, models });
                      }}
                      placeholder="model-id"
                      style={{ flex: 1 }}
                    />
                    <input
                      className="settings-input"
                      value={m.name}
                      onChange={(e) => {
                        const models = [...customProvider.models];
                        models[i].name = e.target.value;
                        setCustomProvider({ ...customProvider, models });
                      }}
                      placeholder="Display Name"
                      style={{ flex: 1 }}
                    />
                    <button
                      onClick={() => {
                        const models = customProvider.models.filter((_, idx) => idx !== i);
                        setCustomProvider({ ...customProvider, models });
                      }}
                      style={{ padding: 4 }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setCustomProvider({ ...customProvider, models: [...customProvider.models, { id: '', name: '' }] })}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: 12, width: 'fit-content' }}
                >
                  <Plus size={14} /> Add Model
                </button>
              </div>
            </div>

            <div className="settings-field">
              <label className="settings-label">Headers (optional)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {customProvider.headers.map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      className="settings-input"
                      value={h.name}
                      onChange={(e) => {
                        const headers = [...customProvider.headers];
                        headers[i].name = e.target.value;
                        setCustomProvider({ ...customProvider, headers });
                      }}
                      placeholder="Header-Name"
                      style={{ flex: 1 }}
                    />
                    <input
                      className="settings-input"
                      value={h.value}
                      onChange={(e) => {
                        const headers = [...customProvider.headers];
                        headers[i].value = e.target.value;
                        setCustomProvider({ ...customProvider, headers });
                      }}
                      placeholder="Value"
                      style={{ flex: 1 }}
                    />
                    <button
                      onClick={() => {
                        const headers = customProvider.headers.filter((_, idx) => idx !== i);
                        setCustomProvider({ ...customProvider, headers });
                      }}
                      style={{ padding: 4 }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setCustomProvider({ ...customProvider, headers: [...customProvider.headers, { name: '', value: '' }] })}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: 12, width: 'fit-content' }}
                >
                  <Plus size={14} /> Add Header
                </button>
              </div>
            </div>

            <button
              className={`settings-save-btn${saved ? ' saved' : ''}`}
              onClick={handleSave}
              style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16 }}
            >
              {saved ? <><Check size={13} /> Saved!</> : 'Save Settings'}
            </button>
          </div>
        )}

        {tab === 'editor' && (
          <div className="settings-section">
            <div className="settings-section-title">Editor Preferences</div>
            {[
              { key: 'fontSize', label: 'Font Size', type: 'number' },
              { key: 'tabSize', label: 'Tab Size', type: 'number' },
            ].map(({ key, label, type }) => (
              <div className="settings-field" key={key}>
                <label className="settings-label">{label}</label>
                <input
                  className="settings-input"
                  type={type}
                  value={editorSettings[key as keyof typeof editorSettings] as number}
                  onChange={(e) => setEditorSettings({ ...editorSettings, [key]: Number(e.target.value) })}
                  style={{ width: 80 }}
                />
              </div>
            ))}
            {[
              { key: 'wordWrap', label: 'Word Wrap' },
              { key: 'minimap', label: 'Show Minimap' },
              { key: 'lineNumbers', label: 'Line Numbers' },
              { key: 'fontLigatures', label: 'Font Ligatures' },
            ].map(({ key, label }) => (
              <div className="settings-field" key={key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="settings-label">{label}</label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={editorSettings[key as keyof typeof editorSettings] as boolean}
                    onChange={(e) => setEditorSettings({ ...editorSettings, [key]: e.target.checked })}
                  />
                  <span className="toggle-track" />
                  <span className="toggle-thumb" />
                </label>
              </div>
            ))}
          </div>
        )}

        {tab === 'general' && (
          <div className="settings-section">
            <div className="settings-section-title">General</div>
            {[
              { key: 'autoSave', label: 'Auto Save', desc: 'Automatically save files on change' },
              { key: 'autoAccept', label: 'Auto Accept Permissions', desc: 'Automatically approve agent actions' },
              { key: 'showProgressBar', label: 'Show Progress Bar', desc: 'Show progress indicator during operations' },
            ].map(({ key, label, desc }) => (
              <div className="settings-field" key={key}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="settings-label">{label}</label>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={generalSettings[key as keyof typeof generalSettings] as boolean}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, [key]: e.target.checked })}
                    />
                    <span className="toggle-track" />
                    <span className="toggle-thumb" />
                  </label>
                </div>
                <span className="settings-description">{desc}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'shortcuts' && (
          <div className="settings-section">
            <div className="settings-section-title">Keyboard Shortcuts</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {SHORTCUTS.map((s) => (
                <div
                  key={s.action}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '5px 8px',
                    borderRadius: 4,
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.action}</span>
                  <kbd
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 3,
                      padding: '2px 6px',
                      fontSize: 11,
                      fontFamily: 'monospace',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showProviderModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowProviderModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              width: 600,
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Provider Configuration (provider.json)</span>
              <button onClick={() => setShowProviderModal(false)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 16, flex: 1, overflow: 'auto' }}>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Configure OpenAI-compatible providers in JSON format. See the provider config docs for details.
              </p>
              <textarea
                style={{
                  width: '100%',
                  height: 300,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 4,
                  color: 'var(--text-primary)',
                  fontFamily: 'monospace',
                  fontSize: 12,
                  padding: 8,
                  resize: 'vertical',
                }}
                value={localProviderJson}
                onChange={(e) => setLocalProviderJson(e.target.value)}
              />
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setShowProviderModal(false)}
                style={{ padding: '6px 12px', background: 'var(--bg-tertiary)', borderRadius: 4 }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setProviderJson(localProviderJson);
                  setShowProviderModal(false);
                }}
                style={{ padding: '6px 12px', background: 'var(--accent-primary)', color: '#fff', borderRadius: 4 }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}