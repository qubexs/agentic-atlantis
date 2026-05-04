import { useState, useRef, useCallback } from 'react';
import TitleBar from './components/TitleBar';
import FileExplorer from './components/FileExplorer';
import Editor from './components/Editor';
import Chat from './components/Chat';
import Terminal from './components/Terminal';
import Settings from './components/Settings';
import WorkflowEditor from './components/WorkflowEditor';
import Search from './components/Search';
import MCPPanel from './components/MCPPanel';
import ProvidersPanel from './components/ProvidersPanel';
import SessionPanel from './components/SessionPanel';

type MainTab = 'explorer' | 'search' | 'editor' | 'workflow';
type RightTab = 'chat' | 'session' | 'mcp' | 'providers' | 'settings';
type BottomTab = 'terminal';

const MAIN_TABS = [
  { id: 'explorer' as MainTab, name: 'Explorer' },
  { id: 'search' as MainTab, name: 'Search' },
  { id: 'editor' as MainTab, name: 'Editor' },
  { id: 'workflow' as MainTab, name: 'Workflow' },
];

const RIGHT_TABS = [
  { id: 'chat' as RightTab, name: 'Chat' },
  { id: 'session' as RightTab, name: 'Session' },
  { id: 'mcp' as RightTab, name: 'MCP' },
  { id: 'providers' as RightTab, name: 'Providers' },
  { id: 'settings' as RightTab, name: 'Settings' },
];

function useResize(initialSize: number, minSize: number, maxSize: number, reverse = false) {
  const [size, setSize] = useState(initialSize);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startSize = useRef(initialSize);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    startSize.current = size;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = ev.clientX - startX.current;
      const adjustedDelta = reverse ? -delta : delta;
      setSize(Math.min(maxSize, Math.max(minSize, startSize.current + adjustedDelta)));
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [size, minSize, maxSize, reverse]);

  return [size, onMouseDown] as const;
}

function useResizeY(initialSize: number, minSize: number, maxSize: number) {
  const [size, setSize] = useState(initialSize);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startSize = useRef(initialSize);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    startY.current = e.clientY;
    startSize.current = size;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = startY.current - ev.clientY;
      setSize(Math.min(maxSize, Math.max(minSize, startSize.current + delta)));
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [size, minSize, maxSize]);

  return [size, onMouseDown] as const;
}

export default function App() {
  const [mainTab, setMainTab] = useState<MainTab>('explorer');
  const [rightTab, setRightTab] = useState<RightTab>('chat');
  const [showTerminal, setShowTerminal] = useState(true);

  const [sidebarWidth, sidebarDragHandle] = useResize(220, 140, 380);
  const [rightWidth, rightDragHandle] = useResize(320, 220, 500, true);
  const [terminalHeight, terminalDragHandle] = useResizeY(180, 80, 400);

  const renderMainContent = () => {
    switch (mainTab) {
      case 'explorer': return <FileExplorer />;
      case 'search': return <Search />;
      case 'workflow': return <WorkflowEditor />;
      default: return null;
    }
  };

  const renderRight = () => {
    switch (rightTab) {
      case 'chat': return <Chat />;
      case 'session': return <SessionPanel />;
      case 'mcp': return <MCPPanel />;
      case 'providers': return <ProvidersPanel />;
      case 'settings': return <Settings />;
      default: return null;
    }
  };

  return (
    <div className="app">
      <TitleBar
        mainTabs={MAIN_TABS}
        rightTabs={RIGHT_TABS}
        activeMainTab={mainTab}
        activeRightTab={rightTab}
        onMainTabClick={(id) => setMainTab(id as MainTab)}
        onRightTabClick={(id) => setRightTab(id as RightTab)}
      />

      <div className="main-layout">
        {/* Left sidebar (Explorer only - search shows in center) */}
        {mainTab === 'explorer' && (
          <>
            <div className="sidebar" style={{ width: sidebarWidth }}>
              <div className="sidebar-header">
                {mainTab === 'explorer' ? 'Explorer' : 'Search'}
              </div>
              <div className="sidebar-content">
                {renderMainContent()}
              </div>
            </div>
            <div className="resize-handle-x" onMouseDown={sidebarDragHandle} />
          </>
        )}

        {/* Center column: editor + terminal */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <div className="center-content" style={{ flex: 1 }}>
            {mainTab === 'search' ? (
              <Search />
            ) : mainTab === 'workflow' ? (
              <WorkflowEditor />
            ) : (
              <Editor />
            )}
          </div>

          {/* Terminal resize + bottom panel */}
          {showTerminal && (
            <>
              <div className="resize-handle-y" onMouseDown={terminalDragHandle} />
              <div className="bottom-panel" style={{ height: terminalHeight }}>
                <div className="panel-tabs">
                  <button
                    className="panel-tab active"
                    onClick={() => setShowTerminal(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    Terminal
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: 'var(--bg-hover)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </span>
                  </button>
                </div>
                <Terminal />
              </div>
            </>
          )}

          {!showTerminal && (
            <div
              style={{
                height: 24,
                background: 'var(--bg-secondary)',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 10px',
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => setShowTerminal(true)}
                style={{ fontSize: 11, background: 'transparent', color: 'var(--text-muted)', padding: '2px 8px' }}
              >
                Terminal ›
              </button>
            </div>
          )}
        </div>

        {/* Right panel resize + panel */}
        <div className="resize-handle-x" onMouseDown={rightDragHandle} />
        <div className="right-panel" style={{ width: rightWidth }}>
          <div className="panel-tabs">
            {RIGHT_TABS.map((tab) => (
              <button
                key={tab.id}
                className={`panel-tab${rightTab === tab.id ? ' active' : ''}`}
                onClick={() => setRightTab(tab.id)}
              >
                {tab.name}
              </button>
            ))}
          </div>
          {renderRight()}
        </div>
      </div>
    </div>
  );
}
