import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

interface Plugin {
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  path: string;
}

class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private pluginsDir: string;

  constructor() {
    this.pluginsDir = path.join(app.getPath('userData'), 'plugins');
    this.ensurePluginsDir();
  }

  private ensurePluginsDir() {
    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir, { recursive: true });
    }
  }

  async scanPlugins(): Promise<Plugin[]> {
    const foundPlugins: Plugin[] = [];

    try {
      const entries = await fs.promises.readdir(this.pluginsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pluginPath = path.join(this.pluginsDir, entry.name);
          const manifestPath = path.join(pluginPath, 'plugin.json');

          if (fs.existsSync(manifestPath)) {
            try {
              const manifest = JSON.parse(await fs.promises.readFile(manifestPath, 'utf-8'));
              foundPlugins.push({
                name: manifest.name || entry.name,
                version: manifest.version || '1.0.0',
                description: manifest.description || '',
                enabled: manifest.enabled ?? true,
                path: pluginPath
              });
              this.plugins.set(entry.name, foundPlugins[foundPlugins.length - 1]);
            } catch {}
          }
        }
      }
    } catch (error) {
      log('ERROR', 'Failed to scan plugins:', (error as Error).message);
    }

    return foundPlugins;
  }

  async enablePlugin(name: string): Promise<boolean> {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.enabled = true;
      return true;
    }
    return false;
  }

  async disablePlugin(name: string): Promise<boolean> {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.enabled = false;
      return true;
    }
    return false;
  }

  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getEnabledPlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter(p => p.enabled);
  }
}

const pluginManager = new PluginManager();

function log(level: string, message: string, ...args: any[]) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`, ...args);
}

export { pluginManager, PluginManager };
export type { Plugin };