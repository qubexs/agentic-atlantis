import { useState, useRef, useEffect } from 'react';
import { Trash2, Terminal as TermIcon } from 'lucide-react';
import { useAppStore } from '../store';

const SIMULATED: Record<string, string[]> = {
  help: ['Available commands: ls, pwd, echo, node --version, npm --version, git status, clear, help'],
  ls: ['agent.ts  main.ts  package.json  README.md  .env  node_modules/'],
  pwd: ['/demo/agentic-ai'],
  'node --version': ['v20.11.0'],
  'npm --version': ['10.2.4'],
  'bun --version': ['1.1.0'],
  'git status': ['On branch main\nYour branch is up to date with origin/main.\n\nnothing to commit, working tree clean'],
  'git log --oneline -5': [
    'a1b2c3d feat: add workflow editor\n8f9e0d1 feat: add MCP panel\n3c4d5e6 fix: chat streaming\nb7a8f9e feat: monaco editor integration\n1d2e3f4 init: project setup',
  ],
  whoami: ['developer'],
  date: [new Date().toString()],
  uname: ['Linux agentic-ai 5.15.0 x86_64'],
};

interface TerminalLine {
  text: string;
  type: 'prompt' | 'output' | 'error';
}

export default function Terminal() {
  const { clearTerminal } = useAppStore();
  const [lines, setLines] = useState<TerminalLine[]>([
    { text: 'Welcome to Agentic AI Terminal', type: 'output' },
    { text: 'Type "help" for available commands', type: 'output' },
    { text: '', type: 'output' },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    outputRef.current?.scrollTo(0, outputRef.current.scrollHeight);
  }, [lines]);

  const runCommand = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setLines((prev) => [...prev, { text: `$ ${trimmed}`, type: 'prompt' }]);
    setHistory((prev) => [...prev, trimmed]);
    setHistoryIdx(-1);
    setIsRunning(true);

    await new Promise((r) => setTimeout(r, 80 + Math.random() * 120));

    if (trimmed === 'clear') {
      setLines([]);
      setIsRunning(false);
      return;
    }

    const response = SIMULATED[trimmed];
    if (response) {
      response.forEach((line) => setLines((prev) => [...prev, { text: line, type: 'output' }]));
    } else if (trimmed.startsWith('echo ')) {
      setLines((prev) => [...prev, { text: trimmed.slice(5), type: 'output' }]);
    } else if (trimmed.startsWith('npm install') || trimmed.startsWith('bun install')) {
      setLines((prev) => [
        ...prev,
        { text: 'Resolving packages...', type: 'output' },
        { text: 'Packages installed successfully.', type: 'output' },
      ]);
    } else if (trimmed.startsWith('npm run') || trimmed.startsWith('bun run')) {
      const script = trimmed.replace(/^(npm|bun) run\s+/, '');
      setLines((prev) => [
        ...prev,
        { text: `> agentic-ai@1.0.0 ${script}`, type: 'output' },
        { text: `Executing ${script}...`, type: 'output' },
        { text: 'Done.', type: 'output' },
      ]);
    } else {
      setLines((prev) => [
        ...prev,
        { text: `command not found: ${trimmed}`, type: 'error' },
        { text: 'Type "help" for available commands', type: 'output' },
      ]);
    }

    setIsRunning(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      runCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIdx = Math.min(historyIdx + 1, history.length - 1);
      setHistoryIdx(newIdx);
      setInput(history[history.length - 1 - newIdx] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx <= 0) { setHistoryIdx(-1); setInput(''); return; }
      const newIdx = historyIdx - 1;
      setHistoryIdx(newIdx);
      setInput(history[history.length - 1 - newIdx] ?? '');
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <div className="terminal-container" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-header">
        <div className="terminal-status">
          <div className={`terminal-status-dot${isRunning ? ' running' : ''}`} />
          <TermIcon size={12} />
          <span>{isRunning ? 'Running' : 'Terminal'}</span>
        </div>
        <button
          onClick={() => { setLines([]); clearTerminal(); }}
          style={{ background: 'transparent', padding: '2px 6px' }}
          title="Clear terminal"
        >
          <Trash2 size={12} color="var(--text-muted)" />
        </button>
      </div>

      <div className="terminal-output" ref={outputRef}>
        {lines.map((line, i) => (
          <div
            key={i}
            className={`terminal-line${line.type === 'error' ? ' error' : ''}${line.type === 'prompt' ? ' prompt-line' : ''}`}
          >
            {line.text}
          </div>
        ))}
      </div>

      <div className="terminal-input-row">
        <span className="terminal-prompt-symbol">$</span>
        <input
          ref={inputRef}
          className="terminal-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command..."
          disabled={isRunning}
          autoFocus
          spellCheck={false}
        />
      </div>
    </div>
  );
}
