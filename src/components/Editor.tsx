import { useEffect, useRef, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useAppStore } from '../store';
import { FileCode, X, Circle } from 'lucide-react';

const langMap: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
  json: 'json', html: 'html', css: 'css', md: 'markdown', py: 'python',
  rs: 'rust', go: 'go', sh: 'shell', yaml: 'yaml', yml: 'yaml',
  txt: 'plaintext', env: 'plaintext',
};

function getLanguage(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return langMap[ext] || 'plaintext';
}

export default function Editor() {
  const { activeFile, openFiles, fileContent, isDirty, setFileContent, setDirty, closeFile, openFile, setActiveFile } = useAppStore();
  const [localContent, setLocalContent] = useState(fileContent);
  const savedRef = useRef(false);

  useEffect(() => {
    setLocalContent(fileContent);
  }, [fileContent, activeFile?.path]);

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      setLocalContent(value);
      setFileContent(value);
      setDirty(true);
    }
  };

  const handleSave = () => {
    setDirty(false);
    savedRef.current = true;
    setTimeout(() => { savedRef.current = false; }, 1000);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {openFiles.length > 0 && (
        <div className="file-tabs">
          {openFiles.map((file) => (
            <div
              key={file.path}
              className={`file-tab${activeFile?.path === file.path ? ' active' : ''}`}
              onClick={() => {
                setActiveFile(file);
                if (file.content !== undefined) setFileContent(file.content);
              }}
            >
              <FileCode size={12} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
              {activeFile?.path === file.path && isDirty && (
                <span className="file-tab-dirty" title="Unsaved changes" />
              )}
              <button
                className="file-tab-close"
                onClick={(e) => { e.stopPropagation(); closeFile(file); }}
                title="Close"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {!activeFile ? (
        <div className="editor-empty">
          <FileCode size={48} />
          <p>Open a file to start editing</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Select a file from the Explorer panel
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: 6,
              right: 12,
              fontSize: 11,
              color: isDirty ? 'var(--yellow)' : 'var(--success)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'var(--bg-primary)',
              padding: '2px 6px',
              borderRadius: 3,
              border: '1px solid var(--border-color)',
            }}
          >
            <Circle size={6} fill="currentColor" />
            {isDirty ? 'Unsaved' : 'Saved'}
          </div>
          <MonacoEditor
            height="100%"
            language={getLanguage(activeFile.name)}
            value={localContent}
            onChange={handleChange}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              fontLigatures: true,
              minimap: { enabled: true, scale: 1 },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              renderLineHighlight: 'line',
              cursorBlinking: 'smooth',
              smoothScrolling: true,
              padding: { top: 12, bottom: 12 },
              tabSize: 2,
              wordWrap: 'on',
              automaticLayout: true,
            }}
          />
        </div>
      )}

      {activeFile && (
        <div className="status-bar">
          <span className="status-item">
            <FileCode size={11} />
            {activeFile.name}
          </span>
          <span className="status-item" style={{ marginLeft: 'auto' }}>
            {getLanguage(activeFile.name).toUpperCase()}
          </span>
          <span className="status-item">UTF-8</span>
        </div>
      )}
    </div>
  );
}
