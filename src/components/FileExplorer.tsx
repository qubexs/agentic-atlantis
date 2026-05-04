import { useState, useEffect } from 'react';
import { Folder, FolderOpen, FileText, ChevronRight, ChevronDown, RefreshCw, Plus, X } from 'lucide-react';
import { useAppStore, FileEntry } from '../store';

const api = (window as any).api;

const DEMO_FILES: FileEntry[] = [
  {
    name: 'src',
    path: '/demo/src',
    isDirectory: true,
    children: [
      { name: 'main.ts', path: '/demo/src/main.ts', isDirectory: false, content: '// Entry point\nconsole.log("Hello, Agentic AI!");\n' },
      { name: 'agent.ts', path: '/demo/src/agent.ts', isDirectory: false, content: `import { generateText } from 'ai';\n\nexport async function runAgent(prompt: string) {\n  const result = await generateText({\n    model: 'gpt-4o',\n    prompt,\n  });\n  return result.text;\n}\n` },
      {
        name: 'tools',
        path: '/demo/src/tools',
        isDirectory: true,
        children: [
          { name: 'fileSystem.ts', path: '/demo/src/tools/fileSystem.ts', isDirectory: false, content: `import * as fs from 'fs/promises';\n\nexport const readFileTool = {\n  name: 'read_file',\n  description: 'Read a file from disk',\n  execute: async ({ path }: { path: string }) => {\n    return await fs.readFile(path, 'utf-8');\n  },\n};\n` },
          { name: 'search.ts', path: '/demo/src/tools/search.ts', isDirectory: false, content: `export const webSearchTool = {\n  name: 'web_search',\n  description: 'Search the web for information',\n  execute: async ({ query }: { query: string }) => {\n    // Implementation here\n    return \`Search results for: \${query}\`;\n  },\n};\n` },
        ],
      },
    ],
  },
  { name: 'package.json', path: '/demo/package.json', isDirectory: false, content: '{\n  "name": "agentic-ai",\n  "version": "1.0.0",\n  "dependencies": {\n    "ai": "^3.0.0"\n  }\n}\n' },
  { name: 'README.md', path: '/demo/README.md', isDirectory: false, content: '# Agentic AI\n\nAn autonomous AI coding assistant with tool-use, planning, and memory.\n\n## Features\n\n- Multi-provider LLM support\n- MCP tool integration\n- Visual workflow builder\n- File system operations\n' },
  { name: '.env', path: '/demo/.env', isDirectory: false, content: 'OPENAI_API_KEY=sk-...\nANTHROPIC_API_KEY=sk-ant-...\n' },
];

interface FileTreeProps {
  entries: FileEntry[];
  depth?: number;
}

function FileTree({ entries, depth = 0 }: FileTreeProps) {
  const { activeFile, openFile, setFileContent } = useAppStore();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const handleClick = async (entry: FileEntry) => {
    if (entry.isDirectory) {
      setExpanded((prev) => ({ ...prev, [entry.path]: !prev[entry.path] }));
    } else {
      if (entry.content) {
        openFile(entry);
        setFileContent(entry.content);
      } else if (api?.invoke && entry.path) {
        try {
          const result: any = await api.invoke('fs:readFile', entry.path);
          const content = result?.content || '';
          openFile({ ...entry, content });
          setFileContent(content);
        } catch (err) {
          console.error('Failed to read file:', err);
        }
      }
    }
  };

  return (
    <div style={{ paddingLeft: depth > 0 ? 12 : 0 }}>
      {entries.map((entry) => (
        <div key={entry.path}>
          <div
            className={`file-tree-item${entry.isDirectory ? '' : (activeFile?.path === entry.path ? ' active' : '')}`}
            onClick={() => handleClick(entry)}
          >
            {entry.isDirectory ? (
              <>
                <span style={{ color: 'var(--text-muted)', width: 12, flexShrink: 0 }}>
                  {expanded[entry.path] ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                </span>
                {expanded[entry.path]
                  ? <FolderOpen size={14} color="#e8a84c" />
                  : <Folder size={14} color="#e8a84c" />}
              </>
            ) : (
              <>
                <span style={{ width: 12 }} />
                <FileText size={13} color="var(--text-muted)" />
              </>
            )}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {entry.name}
            </span>
          </div>
          {entry.isDirectory && expanded[entry.path] && entry.children && (
            <FileTree entries={entry.children} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function FileExplorer() {
  const { currentWorkspace, files, setWorkspace, setFiles, activeFile, openFile, setFileContent } = useAppStore();
  const [inputPath, setInputPath] = useState(currentWorkspace || '');
  const [loading, setLoading] = useState(false);

  const handleBrowseFolder = async () => {
    if (!api?.invoke) return;
    try {
      const path = await api.invoke('dialog:openDirectory');
      if (path) {
        setInputPath(path);
        setLoading(true);
        const fileList = await api.invoke('fs:readDir', path);
        setWorkspace(path);
        setFiles(fileList || []);
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to open folder:', err);
      setLoading(false);
    }
  };

  const handleOpenPath = async () => {
    if (!inputPath.trim()) return;
    setLoading(true);
    try {
      if (api?.invoke) {
        const fileList = await api.invoke('fs:readDir', inputPath);
        setWorkspace(inputPath);
        setFiles(fileList || []);
      } else {
        setWorkspace(inputPath);
        setFiles(DEMO_FILES);
      }
    } catch {
      setWorkspace(inputPath);
      setFiles(DEMO_FILES);
    }
    setLoading(false);
  };

  const handleFileClick = async (entry: FileEntry) => {
    if (entry.isDirectory) return;
    if (entry.content) {
      openFile(entry);
      setFileContent(entry.content);
    } else if (api?.invoke && entry.path) {
      try {
        const result: any = await api.invoke('fs:readFile', entry.path);
        const content = result?.content || '';
        openFile({ ...entry, content });
        setFileContent(content);
      } catch (err) {
        console.error('Failed to read file:', err);
      }
    }
  };

  const displayFiles = files.length > 0 ? files : DEMO_FILES;
  const displayWorkspace = currentWorkspace || '/demo (sample)';

  return (
    <div className="explorer-container">
      <div className="explorer-path-bar">
        <input
          className="explorer-path-input"
          value={inputPath}
          onChange={(e) => setInputPath(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleOpenPath()}
          placeholder="Folder path..."
        />
        <button 
          className="explorer-open-btn" 
          onClick={handleBrowseFolder}
          title="Browse folder"
        >
          <Folder size={12} />
        </button>
        <button 
          className="explorer-open-btn" 
          onClick={handleOpenPath}
          disabled={loading || !inputPath.trim()}
        >
          {loading ? <RefreshCw size={12} className="spin" /> : 'Open'}
        </button>
      </div>
      {currentWorkspace && (
        <div
          style={{
            padding: '5px 10px',
            fontSize: 10,
            color: 'var(--text-muted)',
            background: 'var(--bg-primary)',
            borderBottom: '1px solid var(--border-color)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {currentWorkspace}
        </div>
      )}
      <div className="explorer-tree">
        <FileTree entries={displayFiles} />
      </div>
    </div>
  );
}
