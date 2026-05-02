import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface MCPServer {
  name: string;
  process: ChildProcess;
  tools: any[];
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

class MCPClient {
  private servers: Map<string, MCPServer> = new Map();

  async spawnServer(name: string, command: string, args: string[] = []): Promise<boolean> {
    try {
      log('INFO', `Spawning MCP server: ${name}`, command, args);

      const child = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let initialized = false;
      let tools: MCPTool[] = [];

      child.stdout?.on('data', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.method === 'initialize' && message.id === 1) {
            initialized = true;
            child.stdin?.write(JSON.stringify({
              jsonrpc: '2.0',
              id: 2,
              result: { protocolVersion: '2024-11-05', capabilities: {} }
            }) + '\n');
          }
          if (message.method === 'tools/list') {
            tools = message.result?.tools || [];
            log('INFO', `MCP Server ${name} registered ${tools.length} tools`);
          }
        } catch {}
      });

      child.stderr?.on('data', (data) => {
        log('WARN', `MCP Server ${name} stderr:`, data.toString());
      });

      child.on('error', (error) => {
        log('ERROR', `MCP Server ${name} error:`, error.message);
      });

      this.servers.set(name, { name, process: child, tools });
      return true;
    } catch (error) {
      log('ERROR', `Failed to spawn MCP server ${name}:`, (error as Error).message);
      return false;
    }
  }

  async callTool(serverName: string, toolName: string, args: Record<string, any>): Promise<any> {
    const server = this.servers.get(serverName);
    if (!server) {
      return { error: `Server ${serverName} not found` };
    }

    return new Promise((resolve) => {
      let result = '';

      server.process.stdout?.on('data', (data) => {
        result += data.toString();
        try {
          const message = JSON.parse(result);
          if (message.id) {
            resolve(message.result);
            result = '';
          }
        } catch {}
      });

      const request = JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: { name: toolName, arguments: args }
      }) + '\n';

      server.process.stdin?.write(request);

      setTimeout(() => resolve({ error: 'Timeout' }), 30000);
    });
  }

  getTools(serverName: string): MCPTool[] {
    const server = this.servers.get(serverName);
    return server?.tools || [];
  }

  getAllTools(): Record<string, MCPTool[]> {
    const result: Record<string, MCPTool[]> = {};
    for (const [name, server] of this.servers) {
      result[name] = server.tools;
    }
    return result;
  }

  stopServer(name: string): boolean {
    const server = this.servers.get(name);
    if (server) {
      server.process.kill();
      this.servers.delete(name);
      return true;
    }
    return false;
  }

  stopAll(): void {
    for (const server of this.servers.values()) {
      server.process.kill();
    }
    this.servers.clear();
  }
}

const mcpClient = new MCPClient();

function log(level: string, message: string, ...args: any[]) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message} ${args.map(a => JSON.stringify(a)).join(' ')}\n`;
  console.log(logMessage);
}

export { mcpClient, MCPClient };
export type { MCPServer, MCPTool };