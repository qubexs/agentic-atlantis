import { useState, useCallback } from 'react';
import { Search as SearchIcon, FileText } from 'lucide-react';
import { useAppStore, FileEntry } from '../store';

interface SearchResult {
  file: FileEntry;
  line: number;
  text: string;
  matchStart: number;
  matchEnd: number;
}

const DEMO_FILES: FileEntry[] = [
  { name: 'main.ts', path: '/demo/src/main.ts', isDirectory: false, content: '// Entry point\nconsole.log("Hello, Agentic AI!");\nimport { runAgent } from "./agent";\n' },
  { name: 'agent.ts', path: '/demo/src/agent.ts', isDirectory: false, content: "import { generateText } from 'ai';\n\nexport async function runAgent(prompt: string) {\n  const result = await generateText({ model: 'gpt-4o', prompt });\n  return result.text;\n}\n" },
  { name: 'fileSystem.ts', path: '/demo/src/tools/fileSystem.ts', isDirectory: false, content: "import * as fs from 'fs/promises';\n\nexport const readFileTool = {\n  name: 'read_file',\n  execute: async ({ path }: { path: string }) => fs.readFile(path, 'utf-8'),\n};\n" },
  { name: 'search.ts', path: '/demo/src/tools/search.ts', isDirectory: false, content: "export const webSearchTool = {\n  name: 'web_search',\n  execute: async ({ query }: { query: string }) => `Results for: ${query}`,\n};\n" },
  { name: 'package.json', path: '/demo/package.json', isDirectory: false, content: '{\n  "name": "agentic-ai",\n  "version": "1.0.0",\n  "dependencies": { "ai": "^3.0.0" }\n}\n' },
  { name: 'README.md', path: '/demo/README.md', isDirectory: false, content: '# Agentic AI\nAn autonomous AI coding assistant with tool-use, planning, and memory.\n' },
];

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function Search() {
  const { openFile, setFileContent } = useAppStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(() => {
    if (!query.trim()) { setResults([]); setSearched(false); return; }
    const q = query.toLowerCase();
    const found: SearchResult[] = [];
    for (const file of DEMO_FILES) {
      const lines = (file.content ?? '').split('\n');
      lines.forEach((line, i) => {
        const idx = line.toLowerCase().indexOf(q);
        if (idx !== -1) {
          found.push({ file, line: i + 1, text: line.trim(), matchStart: idx, matchEnd: idx + q.length });
        }
      });
    }
    setResults(found);
    setSearched(true);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') doSearch();
  };

  const handleResultClick = (result: SearchResult) => {
    openFile(result.file);
    if (result.file.content !== undefined) setFileContent(result.file.content);
  };

  return (
    <div className="search-container">
      <div className="search-input-row">
        <input
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search in files..."
          autoFocus
        />
        <button onClick={doSearch} style={{ padding: '4px 10px', background: 'var(--accent-primary)', color: 'white' }}>
          <SearchIcon size={13} />
        </button>
      </div>

      <div className="search-results">
        {results.length > 0 ? (
          results.map((result, i) => (
            <div
              key={i}
              className="search-result-item"
              onClick={() => handleResultClick(result)}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                className="search-result-file"
              >
                <FileText size={12} color="var(--text-muted)" />
                {result.file.name}
                <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  line {result.line}
                </span>
              </div>
              <div className="search-result-match">
                {highlight(result.text, query)}
              </div>
            </div>
          ))
        ) : searched ? (
          <div className="search-empty">
            No results for "{query}"
          </div>
        ) : (
          <div className="search-empty">
            Type to search across all files
          </div>
        )}
      </div>
    </div>
  );
}
