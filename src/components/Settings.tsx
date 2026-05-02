import { useState } from 'react';
import { Check, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '../store';

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'] },
  { id: 'anthropic', name: 'Anthropic', baseUrl: 'https://api.anthropic.com', models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'] },
  { id: 'google', name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', models: ['gemini-2.0-flash', 'gemini-1.5-pro'] },
  { id: 'ollama', name: 'Ollama (Local)', baseUrl: 'http://localhost:11434/v1', models: ['llama3', 'mistral', 'codellama', 'qwen2.5-coder'] },
  { id: 'custom', name: 'Custom / OpenAI-compatible', baseUrl: '', models: ['custom-model'] },
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

type TabId = 'ai' | 'editor' | 'shortcuts' | 'general';

export default function Settings() {
  const { aiSettings, setAiSettings } = useAppStore();
  const [tab, setTab] = useState<TabId>('ai');
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

  const selectedProvider = PROVIDERS.find((p) => p.id === localSettings.provider) ?? PROVIDERS[0];

  const handleSave = () => {
    setAiSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-container">
      <div className="panel-tabs">
        {(['ai', 'editor', 'general', 'shortcuts'] as TabId[]).map((t) => (
          <button
            key={t}
            className={`panel-tab${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="settings-body">
        {tab === 'ai' && (
          <>
            <div className="settings-section">
              <div className="settings-section-title">AI Provider</div>

              <div className="settings-field">
                <label className="settings-label">Provider</label>
                <select
                  className="settings-input"
                  value={localSettings.provider}
                  onChange={(e) => {
                    const p = PROVIDERS.find((p) => p.id === e.target.value)!;
                    setLocalSettings({ ...localSettings, provider: e.target.value as never, baseUrl: p.baseUrl, model: p.models[0] });
                  }}
                >
                  {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="settings-field">
                <label className="settings-label">Model</label>
                {localSettings.provider === 'custom' ? (
                  <input
                    className="settings-input"
                    value={localSettings.model}
                    onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value })}
                    placeholder="model-name"
                  />
                ) : (
                  <select
                    className="settings-input"
                    value={localSettings.model}
                    onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value })}
                  >
                    {selectedProvider.models.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                )}
              </div>

              <div className="settings-field">
                <label className="settings-label">API Key</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    className="settings-input"
                    type={showKey ? 'text' : 'password'}
                    value={localSettings.apiKey}
                    onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
                    placeholder={localSettings.provider === 'ollama' ? 'Not required for Ollama' : 'sk-...'}
                    disabled={localSettings.provider === 'ollama'}
                    style={{ flex: 1 }}
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    style={{ padding: '4px 8px', flexShrink: 0 }}
                    disabled={localSettings.provider === 'ollama'}
                  >
                    {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                <span className="settings-description">
                  {localSettings.provider === 'ollama'
                    ? 'Ollama runs locally, no API key needed.'
                    : 'Your API key is stored locally and never sent to our servers.'}
                </span>
              </div>

              <div className="settings-field">
                <label className="settings-label">Base URL</label>
                <input
                  className="settings-input"
                  value={localSettings.baseUrl}
                  onChange={(e) => setLocalSettings({ ...localSettings, baseUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                />
                <span className="settings-description">Override the default API endpoint.</span>
              </div>
            </div>

            <button
              className={`settings-save-btn${saved ? ' saved' : ''}`}
              onClick={handleSave}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {saved ? <><Check size={13} /> Saved!</> : 'Save Settings'}
            </button>
          </>
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
    </div>
  );
}
