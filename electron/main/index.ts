import { app, BrowserWindow, ipcMain, safeStorage, dialog } from 'electron';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as pty from 'node-pty';
import { mcpClient } from './mcp';

const ptyProcesses: Map<string, pty.IPty> = new Map();

const getBasePath = () => {
  if (app.isPackaged) {
    return path.join(app.getAppPath(), 'dist-electron');
  }
  return process.cwd();
};

const logFile = path.join(app.getPath('userData'), 'agentic-ide.log');

function log(level: string, message: string, ...args: any[]) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message} ${args.map(a => JSON.stringify(a)).join(' ')}\n`;
  console.log(logMessage);
  try {
    fs.appendFileSync(logFile, logMessage);
  } catch {}
}

process.on('uncaughtException', (error) => {
  log('ERROR', 'Uncaught Exception:', error.stack || error.message);
  app.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log('ERROR', 'Unhandled Rejection:', String(reason));
});

log('INFO', 'Application starting...');

// Simple JSON store for settings
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

function loadSettings(): Record<string, string> {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    }
  } catch {}
  return {};
}

function saveSettings(settings: Record<string, string>) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

const store = {
  get: (key: string) => loadSettings()[key] ?? null,
  set: (key: string, value: string) => {
    const settings = loadSettings();
    settings[key] = value;
    saveSettings(settings);
  },
  delete: (key: string) => {
    const settings = loadSettings();
    delete settings[key];
    saveSettings(settings);
  }
};

let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(app.getAppPath(), 'dist-electron/preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    frame: false
  });

  mainWindow.once('ready-to-show', () => {
    log('INFO', 'Window ready to show');
    mainWindow?.show();
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    log('ERROR', `Failed to load: ${errorCode} - ${errorDescription}`);
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    log('ERROR', `Render process gone: ${details.reason}`);
  });

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    log('INFO', `Console: ${message}`);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    log('INFO', 'Window loaded successfully');
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    const appPath = app.getAppPath();
    const filePath = path.join(appPath, 'dist', 'index.html');
    log('INFO', 'App path:', appPath);
    log('INFO', 'Loading file:', filePath);
    log('INFO', 'File exists:', fs.existsSync(filePath));
    mainWindow.loadFile(filePath, { baseURLForDevTools: `file://${appPath}/dist` });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  const { Menu } = require('electron');
  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// Dialog
ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.canceled ? null : result.filePaths[0];
});

// File System
ipcMain.handle('fs:readDir', async (_event, dirPath: string) => {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    return entries.map(entry => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      path: path.join(dirPath, entry.name)
    }));
  } catch (error) {
    return { error: (error as Error).message };
  }
});

ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return { content };
  } catch (error) {
    return { error: (error as Error).message };
  }
});

ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
  try {
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { error: (error as Error).message };
  }
});

ipcMain.handle('fs:exists', async (_event, targetPath: string) => {
  try {
    await fs.promises.access(targetPath);
    return true;
  } catch {
    return false;
  }
});

// Secure Storage
ipcMain.handle('storage:get', async (_event, key: string) => {
  try {
    const encrypted = store.get(key) as string | undefined;
    if (!encrypted) return null;
    if (safeStorage.isEncryptionAvailable()) {
      const decrypted = safeStorage.decryptString(Buffer.from(encrypted, 'base64'));
      return decrypted;
    }
    return encrypted;
  } catch (error) {
    return null;
  }
});

ipcMain.handle('storage:set', async (_event, key: string, value: string) => {
  try {
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(value).toString('base64');
      store.set(key, encrypted);
    } else {
      store.set(key, value);
    }
    return { success: true };
  } catch (error) {
    return { error: (error as Error).message };
  }
});

ipcMain.handle('storage:delete', async (_event, key: string) => {
  store.delete(key);
  return { success: true };
});

// PTY Shell - persistent terminal
ipcMain.handle('shell:create', async (_event, shell: string, sessionId: string, cols: number = 80, rows: number = 30, cwd?: string) => {
  try {
    log('INFO', `[PTY] Creating shell: shell="${shell}", sessionId="${sessionId}", cols=${cols}, rows=${rows}`);
    const shellPath = shell === 'cmd' ? 'cmd.exe' : 'powershell.exe';
    const workDir = cwd || process.cwd();
    log('INFO', `[PTY] Using shell: ${shellPath}, cwd: ${workDir}`);
    
    const ptyProcess = pty.spawn(shellPath, [], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: workDir,
      env: process.env as { [key: string]: string }
    });

    log('INFO', '[PTY] Spawned with pid:', ptyProcess.pid);
    ptyProcesses.set(sessionId, ptyProcess);

    ptyProcess.onData((data) => {
      log('INFO', '[PTY] Data received:', data.substring(0, 100));
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('shell:data', sessionId, data);
      } else {
        log('WARN', '[PTY] mainWindow not available');
      }
    });

    ptyProcess.onExit(({ exitCode }) => {
      log('INFO', '[PTY] Process exited with code:', exitCode);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('shell:exit', sessionId, exitCode);
      }
      ptyProcesses.delete(sessionId);
    });

    return { success: true, pid: ptyProcess.pid };
  } catch (error: any) {
    log('ERROR', '[PTY] Error:', error.stack || error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('shell:write', async (_event, sessionId: string, data: string) => {
  const ptyProcess = ptyProcesses.get(sessionId);
  if (ptyProcess) {
    ptyProcess.write(data);
    return { success: true };
  }
  return { success: false, error: 'Session not found' };
});

ipcMain.handle('shell:resize', async (_event, sessionId: string, cols: number, rows: number) => {
  const ptyProcess = ptyProcesses.get(sessionId);
  if (ptyProcess) {
    ptyProcess.resize(cols, rows);
    return { success: true };
  }
  return { success: false, error: 'Session not found' };
});

ipcMain.handle('shell:kill', async (_event, sessionId: string) => {
  const ptyProcess = ptyProcesses.get(sessionId);
  if (ptyProcess) {
    ptyProcess.kill();
    ptyProcesses.delete(sessionId);
    return { success: true };
  }
  return { success: false, error: 'Session not found' };
});

// Window controls
ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window:close', () => {
  mainWindow?.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow?.isMaximized() ?? false;
});

// MCP Handlers
ipcMain.handle('mcp:spawn', async (_event, name: string, command: string, args: string[]) => {
  return await mcpClient.spawnServer(name, command, args);
});

ipcMain.handle('mcp:callTool', async (_event, serverName: string, toolName: string, args: Record<string, any>) => {
  return await mcpClient.callTool(serverName, toolName, args);
});

ipcMain.handle('mcp:getTools', async (_event, serverName: string) => {
  return mcpClient.getTools(serverName);
});

ipcMain.handle('mcp:getAllTools', async () => {
  return mcpClient.getAllTools();
});

ipcMain.handle('mcp:stop', async (_event, name: string) => {
  return mcpClient.stopServer(name);
});

// Git operations
ipcMain.handle('git:status', async (_event, repoPath: string) => {
  return new Promise((resolve) => {
    const child = spawn('git', ['status', '--porcelain'], { cwd: repoPath, shell: true });
    let stdout = '';
    child.stdout?.on('data', (data) => { stdout += data.toString(); });
    child.on('close', (code) => resolve({ code, stdout }));
    child.on('error', (error) => resolve({ code: -1, stdout: '', stderr: error.message }));
  });
});

ipcMain.handle('git:diff', async (_event, repoPath: string) => {
  return new Promise((resolve) => {
    const child = spawn('git', ['diff'], { cwd: repoPath, shell: true });
    let stdout = '';
    child.stdout?.on('data', (data) => { stdout += data.toString(); });
    child.on('close', (code) => resolve({ code, stdout }));
    child.on('error', (error) => resolve({ code: -1, stdout: '', stderr: error.message }));
  });
});

ipcMain.handle('git:add', async (_event, repoPath: string, files: string[]) => {
  return new Promise((resolve) => {
    const child = spawn('git', ['add', ...files], { cwd: repoPath, shell: true });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (data) => { stdout += data.toString(); });
    child.stderr?.on('data', (data) => { stderr += data.toString(); });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
    child.on('error', (error) => resolve({ code: -1, stdout: '', stderr: error.message }));
  });
});

ipcMain.handle('git:commit', async (_event, repoPath: string, message: string) => {
  return new Promise((resolve) => {
    const child = spawn('git', ['commit', '-m', message], { cwd: repoPath, shell: true });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (data) => { stdout += data.toString(); });
    child.stderr?.on('data', (data) => { stderr += data.toString(); });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
    child.on('error', (error) => resolve({ code: -1, stdout: '', stderr: error.message }));
  });
});

// Plugin Handlers
ipcMain.handle('plugins:scan', async () => {
  try {
    const pluginsDir = path.join(app.getPath('userData'), 'plugins');
    if (!fs.existsSync(pluginsDir)) {
      fs.mkdirSync(pluginsDir, { recursive: true });
    }

    const entries = await fs.promises.readdir(pluginsDir, { withFileTypes: true });
    const plugins: any[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const pluginPath = path.join(pluginsDir, entry.name);
        const manifestPath = path.join(pluginPath, 'plugin.json');

        if (fs.existsSync(manifestPath)) {
          try {
            const manifest = JSON.parse(await fs.promises.readFile(manifestPath, 'utf-8'));
            plugins.push({
              name: manifest.name || entry.name,
              version: manifest.version || '1.0.0',
              description: manifest.description || '',
              enabled: true,
              path: pluginPath
            });
          } catch {}
        }
      }
    }

    return plugins;
  } catch (error) {
    log('ERROR', 'Failed to scan plugins:', (error as Error).message);
    return [];
  }
});

ipcMain.handle('plugins:getDir', async () => {
  return path.join(app.getPath('userData'), 'plugins');
});

ipcMain.handle('dialog:openFile', async (_event, options: { filters?: { name: string; extensions: string[] }[] }) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: options.filters || [{ name: 'JSON', extensions: ['json'] }]
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  try {
    const content = await fs.promises.readFile(result.filePaths[0], 'utf-8');
    return { path: result.filePaths[0], content };
  } catch (error) {
    return { error: (error as Error).message };
  }
});

log('INFO', 'IPC handlers registered');