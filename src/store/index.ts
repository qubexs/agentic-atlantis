import { create } from 'zustand';

export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileEntry[];
  content?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AiSettings {
  provider: 'openai' | 'anthropic' | 'google' | 'ollama' | 'custom';
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface AppState {
  currentWorkspace: string;
  files: FileEntry[];
  openFiles: FileEntry[];
  activeFile: FileEntry | null;
  fileContent: string;
  isDirty: boolean;
  chatHistory: ChatMessage[];
  aiSettings: AiSettings;
  terminalOutput: string[];
  activePanel: string;

  setWorkspace: (path: string) => void;
  setFiles: (files: FileEntry[]) => void;
  openFile: (file: FileEntry) => void;
  closeFile: (file: FileEntry) => void;
  setActiveFile: (file: FileEntry | null) => void;
  setFileContent: (content: string) => void;
  setDirty: (dirty: boolean) => void;
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
  setAiSettings: (settings: Partial<AiSettings>) => void;
  addTerminalOutput: (output: string) => void;
  clearTerminal: () => void;
  setActivePanel: (panel: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentWorkspace: '',
  files: [],
  openFiles: [],
  activeFile: null,
  fileContent: '',
  isDirty: false,
  chatHistory: [],
  aiSettings: {
    provider: 'openai',
    apiKey: '',
    baseUrl: '',
    model: 'gpt-4o',
  },
  terminalOutput: [],
  activePanel: 'explorer',

  setWorkspace: (path) => set({ currentWorkspace: path }),
  setFiles: (files) => set({ files }),
  openFile: (file) =>
    set((state) => {
      if (state.openFiles.find((f) => f.path === file.path)) {
        return { activeFile: file };
      }
      return { openFiles: [...state.openFiles, file], activeFile: file };
    }),
  closeFile: (file) =>
    set((state) => {
      const openFiles = state.openFiles.filter((f) => f.path !== file.path);
      const activeFile =
        state.activeFile?.path === file.path
          ? openFiles[0] ?? null
          : state.activeFile;
      return { openFiles, activeFile };
    }),
  setActiveFile: (file) => set({ activeFile: file }),
  setFileContent: (content) => set({ fileContent: content }),
  setDirty: (dirty) => set({ isDirty: dirty }),
  addChatMessage: (msg) =>
    set((state) => ({ chatHistory: [...state.chatHistory, msg] })),
  clearChat: () => set({ chatHistory: [] }),
  setAiSettings: (settings) =>
    set((state) => ({ aiSettings: { ...state.aiSettings, ...settings } })),
  addTerminalOutput: (output) =>
    set((state) => ({ terminalOutput: [...state.terminalOutput, output] })),
  clearTerminal: () => set({ terminalOutput: [] }),
  setActivePanel: (panel) => set({ activePanel: panel }),
}));
