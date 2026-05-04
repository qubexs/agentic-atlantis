import { useEffect, useRef, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useAppStore } from '../store';
import { FileCode, X, Circle, Save } from 'lucide-react';

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

  const handleSave = async () => {
    if (!activeFile) return;
    console.log('Saving file:', activeFile.path, 'content length:', fileContent.length);
    try {
      const result = await (window as any).api.invoke('fs:writeFile', activeFile.path, fileContent);
      console.log('Save result:', result);
      if (result?.error) {
        console.error('Save error:', result.error);
        return;
      }
      setDirty(false);
      savedRef.current = true;
      setTimeout(() => { savedRef.current = false; }, 1000);
    } catch (err) {
      console.error('Failed to save file:', err);
    }
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
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="file-tabs" style={{ flex: 1 }}>
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
          <button
            onClick={handleSave}
            disabled={!isDirty}
            title="Save (Ctrl+S)"
            style={{
              padding: '4px 8px',
              background: isDirty ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
              color: isDirty ? 'white' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 4,
              marginRight: 8,
              cursor: isDirty ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
            }}
          >
            <Save size={12} />
            Save
          </button>
        </div>
      )}

      {activeFile ? (
        <MonacoEditor
          height="100%"
          language={getLanguage(activeFile.name)}
          value={localContent}
          onChange={handleChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 13,
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
          }}
        />
      ) : (
        <div className="editor-empty">
          <FileCode size={48} />
          <p>Open a file to start editing</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Select a file from the Explorer panel
          </p>
        </div>
      )}

      <div className="status-bar">
        <span className="status-item">
          <FileCode size={11} />
          {activeFile?.name || ''}
        </span>
        <span className="status-item" style={{ marginLeft: 'auto' }}>
          {activeFile ? getLanguage(activeFile.name).toUpperCase() : ''}
        </span>
        <span className="status-item">UTF-8</span>
      </div>
    </div>
  );
}
