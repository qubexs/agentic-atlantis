var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var mcp_exports = {};
__export(mcp_exports, {
  MCPClient: () => MCPClient,
  mcpClient: () => mcpClient
});
module.exports = __toCommonJS(mcp_exports);
var import_child_process = require("child_process");
class MCPClient {
  servers = /* @__PURE__ */ new Map();
  async spawnServer(name, command, args = []) {
    try {
      log("INFO", `Spawning MCP server: ${name}`, command, args);
      const child = (0, import_child_process.spawn)(command, args, {
        stdio: ["pipe", "pipe", "pipe"],
        shell: true
      });
      let initialized = false;
      let tools = [];
      child.stdout?.on("data", (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.method === "initialize" && message.id === 1) {
            initialized = true;
            child.stdin?.write(JSON.stringify({
              jsonrpc: "2.0",
              id: 2,
              result: { protocolVersion: "2024-11-05", capabilities: {} }
            }) + "\n");
          }
          if (message.method === "tools/list") {
            tools = message.result?.tools || [];
            log("INFO", `MCP Server ${name} registered ${tools.length} tools`);
          }
        } catch {
        }
      });
      child.stderr?.on("data", (data) => {
        log("WARN", `MCP Server ${name} stderr:`, data.toString());
      });
      child.on("error", (error) => {
        log("ERROR", `MCP Server ${name} error:`, error.message);
      });
      this.servers.set(name, { name, process: child, tools });
      return true;
    } catch (error) {
      log("ERROR", `Failed to spawn MCP server ${name}:`, error.message);
      return false;
    }
  }
  async callTool(serverName, toolName, args) {
    const server = this.servers.get(serverName);
    if (!server) {
      return { error: `Server ${serverName} not found` };
    }
    return new Promise((resolve) => {
      let result = "";
      server.process.stdout?.on("data", (data) => {
        result += data.toString();
        try {
          const message = JSON.parse(result);
          if (message.id) {
            resolve(message.result);
            result = "";
          }
        } catch {
        }
      });
      const request = JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: { name: toolName, arguments: args }
      }) + "\n";
      server.process.stdin?.write(request);
      setTimeout(() => resolve({ error: "Timeout" }), 3e4);
    });
  }
  getTools(serverName) {
    const server = this.servers.get(serverName);
    return server?.tools || [];
  }
  getAllTools() {
    const result = {};
    for (const [name, server] of this.servers) {
      result[name] = server.tools;
    }
    return result;
  }
  stopServer(name) {
    const server = this.servers.get(name);
    if (server) {
      server.process.kill();
      this.servers.delete(name);
      return true;
    }
    return false;
  }
  stopAll() {
    for (const server of this.servers.values()) {
      server.process.kill();
    }
    this.servers.clear();
  }
}
const mcpClient = new MCPClient();
function log(level, message, ...args) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message} ${args.map((a) => JSON.stringify(a)).join(" ")}
`;
  console.log(logMessage);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MCPClient,
  mcpClient
});
