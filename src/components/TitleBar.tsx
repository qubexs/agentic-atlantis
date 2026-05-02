import { Bot, ChevronDown, Minus, X, Maximize2, Shrink } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface Tab {
  id: string;
  name: string;
}

interface TitleBarProps {
  mainTabs: Tab[];
  rightTabs: Tab[];
  activeMainTab: string;
  activeRightTab: string;
  onMainTabClick: (id: string) => void;
  onRightTabClick: (id: string) => void;
}

const api = (window as any).api;

export default function TitleBar({
  mainTabs,
  rightTabs,
  activeMainTab,
  activeRightTab,
  onMainTabClick,
  onRightTabClick,
}: TitleBarProps) {
  const [showDropdown, setShowDropdown] = useState<'main' | 'right' | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!dropRef.current?.contains(e.target as Node)) setShowDropdown(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    api.invoke('window:isMaximized').then(setIsMaximized);
  }, []);

  const handleMinimize = () => api.invoke('window:minimize');
  const handleMaximize = () => {
    api.invoke('window:maximize').then(() => {
      api.invoke('window:isMaximized').then(setIsMaximized);
    });
  };
  const handleClose = () => api.invoke('window:close');

  return (
    <div className="titlebar" style={{ WebkitAppRegion: 'drag' } as any}>
      <div className="titlebar-logo" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <Bot size={16} />
        Agentic IDE
      </div>

      <div className="titlebar-tabs" ref={dropRef} style={{ WebkitAppRegion: 'no-drag' } as any}>
        {mainTabs.map((tab) => (
          <button
            key={tab.id}
            className={`titlebar-tab${activeMainTab === tab.id ? ' active' : ''}`}
            onClick={() => onMainTabClick(tab.id)}
          >
            {tab.name}
          </button>
        ))}

        <div style={{ position: 'relative' }}>
          <button
            className="titlebar-tab"
            style={{ display: 'flex', alignItems: 'center', gap: 3 }}
            onClick={() => setShowDropdown(showDropdown === 'right' ? null : 'right')}
          >
            Panels <ChevronDown size={11} />
          </button>
          {showDropdown === 'right' && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                padding: 4,
                minWidth: 140,
                zIndex: 200,
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              }}
            >
              {rightTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`titlebar-tab${activeRightTab === tab.id ? ' active' : ''}`}
                  style={{ display: 'block', width: '100%', textAlign: 'left' }}
                  onClick={() => { onRightTabClick(tab.id); setShowDropdown(null); }}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <span className="titlebar-version" style={{ WebkitAppRegion: 'no-drag' } as any}>v1.0.0</span>

      <div className="titlebar-controls" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button className="titlebar-btn" onClick={handleMinimize} title="Minimize">
          <Minus size={14} />
        </button>
        <button className="titlebar-btn" onClick={handleMaximize} title={isMaximized ? "Restore" : "Maximize"}>
          {isMaximized ? <Shrink size={12} /> : <Maximize2 size={12} />}
        </button>
        <button className="titlebar-btn titlebar-btn-close" onClick={handleClose} title="Close">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}