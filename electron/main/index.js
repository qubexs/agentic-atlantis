var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var import_electron = require("electron");
var import_child_process = require("child_process");
var fs = __toESM(require("fs"), 1);
var path = __toESM(require("path"), 1);
var pty = __toESM(require("node-pty"), 1);
var import_mcp = require("./mcp");
const ptyProcesses = /* @__PURE__ */ new Map();
const getBasePath = () => {
  if (import_electron.app.isPackaged) {
    return path.join(import_electron.app.getAppPath(), "dist-electron");
  }
  return process.cwd();
};
const logFile = path.join(import_electron.app.getPath("userData"), "agentic-ide.log");
function log(level, message, ...args) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message} ${args.map((a) => JSON.stringify(a)).join(" ")}
`;
  console.log(logMessage);
  try {
    fs.appendFileSync(logFile, logMessage);
  } catch {
  }
}
process.on("uncaughtException", (error) => {
  log("ERROR", "Uncaught Exception:", error.stack || error.message);
  import_electron.app.exit(1);
});
process.on("unhandledRejection", (reason) => {
  log("ERROR", "Unhandled Rejection:", String(reason));
});
log("INFO", "Application starting...");
const settingsPath = path.join(import_electron.app.getPath("userData"), "settings.json");
function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    }
  } catch {
  }
  return {};
}
function saveSettings(settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}
const store = {
  get: (key) => loadSettings()[key] ?? null,
  set: (key, value) => {
    const settings = loadSettings();
    settings[key] = value;
    saveSettings(settings);
  },
  delete: (key) => {
    const settings = loadSettings();
    delete settings[key];
    saveSettings(settings);
  }
};
let mainWindow = null;
const isDev = !import_electron.app.isPackaged;
function createWindow() {
  mainWindow = new import_electron.BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: path.join(import_electron.app.getAppPath(), "dist-electron/preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    frame: false
  });
  mainWindow.once("ready-to-show", () => {
    log("INFO", "Window ready to show");
    mainWindow?.show();
  });
  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
    log("ERROR", `Failed to load: ${errorCode} - ${errorDescription}`);
  });
  mainWindow.webContents.on("did-finish-load", () => {
    log("INFO", "Window loaded successfully");
  });
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    const appPath = import_electron.app.getAppPath();
    const filePath = path.join(appPath, "dist/index.html");
    log("INFO", "App path:", appPath);
    log("INFO", "Loading file:", filePath);
    mainWindow.loadFile(filePath);
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
import_electron.app.whenReady().then(() => {
  const { Menu } = require("electron");
  Menu.setApplicationMenu(null);
  createWindow();
  import_electron.app.on("activate", () => {
    if (import_electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
import_electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron.app.quit();
  }
});
import_electron.ipcMain.handle("fs:readDir", async (_event, dirPath) => {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    return entries.map((entry) => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      path: path.join(dirPath, entry.name)
    }));
  } catch (error) {
    return { error: error.message };
  }
});
import_electron.ipcMain.handle("fs:readFile", async (_event, filePath) => {
  try {
    const content = await fs.promises.readFile(filePath, "utf-8");
    return { content };
  } catch (error) {
    return { error: error.message };
  }
});
import_electron.ipcMain.handle("fs:writeFile", async (_event, filePath, content) => {
  try {
    await fs.promises.writeFile(filePath, content, "utf-8");
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});
import_electron.ipcMain.handle("fs:exists", async (_event, targetPath) => {
  try {
    await fs.promises.access(targetPath);
    return true;
  } catch {
    return false;
  }
});
import_electron.ipcMain.handle("storage:get", async (_event, key) => {
  try {
    const encrypted = store.get(key);
    if (!encrypted) return null;
    if (import_electron.safeStorage.isEncryptionAvailable()) {
      const decrypted = import_electron.safeStorage.decryptString(Buffer.from(encrypted, "base64"));
      return decrypted;
    }
    return encrypted;
  } catch (error) {
    return null;
  }
});
import_electron.ipcMain.handle("storage:set", async (_event, key, value) => {
  try {
    if (import_electron.safeStorage.isEncryptionAvailable()) {
      const encrypted = import_electron.safeStorage.encryptString(value).toString("base64");
      store.set(key, encrypted);
    } else {
      store.set(key, value);
    }
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});
import_electron.ipcMain.handle("storage:delete", async (_event, key) => {
  store.delete(key);
  return { success: true };
});
import_electron.ipcMain.handle("shell:create", async (_event, shell, sessionId, cols = 80, rows = 30, cwd) => {
  try {
    log("INFO", `[PTY] Creating shell: shell="${shell}", sessionId="${sessionId}", cols=${cols}, rows=${rows}`);
    const shellPath = shell === "cmd" ? "cmd.exe" : "powershell.exe";
    const workDir = cwd || process.cwd();
    log("INFO", `[PTY] Using shell: ${shellPath}, cwd: ${workDir}`);
    const ptyProcess = pty.spawn(shellPath, [], {
      name: "xterm-256color",
      cols,
      rows,
      cwd: workDir,
      env: process.env
    });
    log("INFO", "[PTY] Spawned with pid:", ptyProcess.pid);
    ptyProcesses.set(sessionId, ptyProcess);
    ptyProcess.onData((data) => {
      log("INFO", "[PTY] Data received:", data.substring(0, 100));
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("shell:data", sessionId, data);
      } else {
        log("WARN", "[PTY] mainWindow not available");
      }
    });
    ptyProcess.onExit(({ exitCode }) => {
      log("INFO", "[PTY] Process exited with code:", exitCode);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("shell:exit", sessionId, exitCode);
      }
      ptyProcesses.delete(sessionId);
    });
    return { success: true, pid: ptyProcess.pid };
  } catch (error) {
    log("ERROR", "[PTY] Error:", error.stack || error.message);
    return { success: false, error: error.message };
  }
});
import_electron.ipcMain.handle("shell:write", async (_event, sessionId, data) => {
  const ptyProcess = ptyProcesses.get(sessionId);
  if (ptyProcess) {
    ptyProcess.write(data);
    return { success: true };
  }
  return { success: false, error: "Session not found" };
});
import_electron.ipcMain.handle("shell:resize", async (_event, sessionId, cols, rows) => {
  const ptyProcess = ptyProcesses.get(sessionId);
  if (ptyProcess) {
    ptyProcess.resize(cols, rows);
    return { success: true };
  }
  return { success: false, error: "Session not found" };
});
import_electron.ipcMain.handle("shell:kill", async (_event, sessionId) => {
  const ptyProcess = ptyProcesses.get(sessionId);
  if (ptyProcess) {
    ptyProcess.kill();
    ptyProcesses.delete(sessionId);
    return { success: true };
  }
  return { success: false, error: "Session not found" };
});
import_electron.ipcMain.handle("window:minimize", () => {
  mainWindow?.minimize();
});
import_electron.ipcMain.handle("window:maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
import_electron.ipcMain.handle("window:close", () => {
  mainWindow?.close();
});
import_electron.ipcMain.handle("window:isMaximized", () => {
  return mainWindow?.isMaximized() ?? false;
});
import_electron.ipcMain.handle("mcp:spawn", async (_event, name, command, args) => {
  return await import_mcp.mcpClient.spawnServer(name, command, args);
});
import_electron.ipcMain.handle("mcp:callTool", async (_event, serverName, toolName, args) => {
  return await import_mcp.mcpClient.callTool(serverName, toolName, args);
});
import_electron.ipcMain.handle("mcp:getTools", async (_event, serverName) => {
  return import_mcp.mcpClient.getTools(serverName);
});
import_electron.ipcMain.handle("mcp:getAllTools", async () => {
  return import_mcp.mcpClient.getAllTools();
});
import_electron.ipcMain.handle("mcp:stop", async (_event, name) => {
  return import_mcp.mcpClient.stopServer(name);
});
import_electron.ipcMain.handle("git:status", async (_event, repoPath) => {
  return new Promise((resolve) => {
    const child = (0, import_child_process.spawn)("git", ["status", "--porcelain"], { cwd: repoPath, shell: true });
    let stdout = "";
    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });
    child.on("close", (code) => resolve({ code, stdout }));
    child.on("error", (error) => resolve({ code: -1, stdout: "", stderr: error.message }));
  });
});
import_electron.ipcMain.handle("git:diff", async (_event, repoPath) => {
  return new Promise((resolve) => {
    const child = (0, import_child_process.spawn)("git", ["diff"], { cwd: repoPath, shell: true });
    let stdout = "";
    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });
    child.on("close", (code) => resolve({ code, stdout }));
    child.on("error", (error) => resolve({ code: -1, stdout: "", stderr: error.message }));
  });
});
import_electron.ipcMain.handle("git:add", async (_event, repoPath, files) => {
  return new Promise((resolve) => {
    const child = (0, import_child_process.spawn)("git", ["add", ...files], { cwd: repoPath, shell: true });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });
    child.on("close", (code) => resolve({ code, stdout, stderr }));
    child.on("error", (error) => resolve({ code: -1, stdout: "", stderr: error.message }));
  });
});
import_electron.ipcMain.handle("git:commit", async (_event, repoPath, message) => {
  return new Promise((resolve) => {
    const child = (0, import_child_process.spawn)("git", ["commit", "-m", message], { cwd: repoPath, shell: true });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });
    child.on("close", (code) => resolve({ code, stdout, stderr }));
    child.on("error", (error) => resolve({ code: -1, stdout: "", stderr: error.message }));
  });
});
import_electron.ipcMain.handle("plugins:scan", async () => {
  try {
    const pluginsDir = path.join(import_electron.app.getPath("userData"), "plugins");
    if (!fs.existsSync(pluginsDir)) {
      fs.mkdirSync(pluginsDir, { recursive: true });
    }
    const entries = await fs.promises.readdir(pluginsDir, { withFileTypes: true });
    const plugins = [];
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const pluginPath = path.join(pluginsDir, entry.name);
        const manifestPath = path.join(pluginPath, "plugin.json");
        if (fs.existsSync(manifestPath)) {
          try {
            const manifest = JSON.parse(await fs.promises.readFile(manifestPath, "utf-8"));
            plugins.push({
              name: manifest.name || entry.name,
              version: manifest.version || "1.0.0",
              description: manifest.description || "",
              enabled: true,
              path: pluginPath
            });
          } catch {
          }
        }
      }
    }
    return plugins;
  } catch (error) {
    log("ERROR", "Failed to scan plugins:", error.message);
    return [];
  }
});
import_electron.ipcMain.handle("plugins:getDir", async () => {
  return path.join(import_electron.app.getPath("userData"), "plugins");
});
import_electron.ipcMain.handle("dialog:openFile", async (_event, options) => {
  const result = await import_electron.dialog.showOpenDialog({
    properties: ["openFile"],
    filters: options.filters || [{ name: "JSON", extensions: ["json"] }]
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  try {
    const content = await fs.promises.readFile(result.filePaths[0], "utf-8");
    return { path: result.filePaths[0], content };
  } catch (error) {
    return { error: error.message };
  }
});
log("INFO", "IPC handlers registered");
