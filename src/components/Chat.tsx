import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Trash2, Bot } from 'lucide-react';
import { useAppStore } from '../store';

const DEFAULT_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', models: { 'gpt-4o': { name: 'GPT-4o' }, 'gpt-4o-mini': { name: 'GPT-4o Mini' }, 'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo' } } },
  { id: 'anthropic', name: 'Anthropic', baseUrl: 'https://api.anthropic.com', models: { 'claude-3-5-sonnet-20241022': { name: 'Claude 3.5 Sonnet' }, 'claude-3-haiku-20240307': { name: 'Claude 3 Haiku' } } },
  { id: 'google', name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', models: { 'gemini-2.0-flash': { name: 'Gemini 2.0 Flash' }, 'gemini-1.5-pro': { name: 'Gemini 1.5 Pro' } } },
  { id: 'ollama', name: 'Ollama (Local)', baseUrl: 'http://localhost:11434/v1', models: { 'llama3': { name: 'Llama 3' }, 'mistral': { name: 'Mistral' }, 'codellama': { name: 'CodeLlama' }, 'qwen2.5-coder': { name: 'Qwen 2.5 Coder' } } },
];

export default function Chat() {
  const { chatHistory, addChatMessage, clearChat, activeFile, fileContent, aiSettings, setAiSettings, customProviders } = useAppStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  const allProviders = [...DEFAULT_PROVIDERS, ...customProviders];
  const selectedProvider = allProviders.find((p) => p.id === aiSettings.provider) ?? DEFAULT_PROVIDERS[0];
  const currentModelName = selectedProvider.models[aiSettings.model]?.name || aiSettings.model;

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');

    addChatMessage({ role: 'user', content: userMsg, timestamp: Date.now() });
    setLoading(true);

    try {
      let systemPrompt = 'You are an expert AI coding assistant. Help the user write, debug, and understand code. Be concise and precise. Use markdown formatting for code blocks.';
      if (activeFile && fileContent) {
        systemPrompt += `\n\nThe user is currently editing ${activeFile.name}:\n\`\`\`\n${fileContent.slice(0, 3000)}\n\`\`\``;
      }

      const baseUrl = aiSettings.baseUrl || selectedProvider.options?.baseURL || selectedProvider.baseUrl;
      const model = aiSettings.model || Object.keys(selectedProvider.models)[0];

      const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.slice(-12).map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMsg },
      ];

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${aiSettings.apiKey || 'sk-dummy'}`,
        },
        body: JSON.stringify({ model, messages, max_tokens: 2000, stream: false }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || 'No response received.';
      addChatMessage({ role: 'assistant', content: reply, timestamp: Date.now() });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addChatMessage({
        role: 'assistant',
        content: `**Error:** ${msg}\n\nMake sure your API key is configured in Settings.`,
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Bot size={14} color="var(--success)" />
          <span style={{ fontSize: 12, fontWeight: 600 }}>AI Assistant</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <select
            value={aiSettings.provider}
            onChange={(e) => {
              const p = allProviders.find((p) => p.id === e.target.value)!;
              const firstModel = Object.keys(p.models)[0];
              setAiSettings({ provider: e.target.value, baseUrl: p.options?.baseURL || p.baseUrl, model: firstModel });
            }}
            style={{ fontSize: 11, padding: '3px 6px' }}
          >
            {allProviders.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={aiSettings.model}
            onChange={(e) => setAiSettings({ model: e.target.value })}
            style={{ fontSize: 11, padding: '3px 6px', minWidth: 80 }}
          >
            {Object.entries(selectedProvider.models).map(([id, config]) => (
              <option key={id} value={id}>{config.name}</option>
            ))}
          </select>
          {chatHistory.length > 0 && (
            <button
              onClick={clearChat}
              style={{ padding: '3px 6px', background: 'transparent' }}
              title="Clear chat"
            >
              <Trash2 size={13} color="var(--text-muted)" />
            </button>
          )}
        </div>
      </div>

      <div className="chat-messages">
        {chatHistory.length === 0 ? (
          <div className="chat-empty">
            <Bot size={36} color="var(--text-muted)" />
            <div>
              <p style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>
                AI Assistant Ready
              </p>
              <p style={{ fontSize: 12 }}>
                Configure your API key in Settings, then ask me anything about your code.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', marginTop: 4 }}>
              {['Explain this code', 'Find bugs in my file', 'Write a unit test', 'Refactor this function'].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    padding: '6px 10px',
                    borderRadius: 4,
                    fontSize: 11,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-bright)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatHistory.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              <div className="chat-message-label">
                {msg.role === 'user' ? 'You' : `AI (${currentModelName})`}
              </div>
              <div className="chat-message-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="chat-thinking">
            <div className="thinking-dots">
              <span /><span /><span />
            </div>
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          ref={textareaRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={activeFile ? `Ask about ${activeFile.name}... (Enter to send)` : 'Ask anything... (Enter to send)'}
          rows={1}
          disabled={loading}
        />
        <button className="chat-send-btn" onClick={handleSend} disabled={loading || !input.trim()}>
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}
