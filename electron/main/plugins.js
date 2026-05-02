var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var plugins_exports = {};
__export(plugins_exports, {
  PluginManager: () => PluginManager,
  pluginManager: () => pluginManager
});
module.exports = __toCommonJS(plugins_exports);
var fs = __toESM(require("fs"), 1);
var path = __toESM(require("path"), 1);
var import_electron = require("electron");
class PluginManager {
  plugins = /* @__PURE__ */ new Map();
  pluginsDir;
  constructor() {
    this.pluginsDir = path.join(import_electron.app.getPath("userData"), "plugins");
    this.ensurePluginsDir();
  }
  ensurePluginsDir() {
    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir, { recursive: true });
    }
  }
  async scanPlugins() {
    const foundPlugins = [];
    try {
      const entries = await fs.promises.readdir(this.pluginsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pluginPath = path.join(this.pluginsDir, entry.name);
          const manifestPath = path.join(pluginPath, "plugin.json");
          if (fs.existsSync(manifestPath)) {
            try {
              const manifest = JSON.parse(await fs.promises.readFile(manifestPath, "utf-8"));
              foundPlugins.push({
                name: manifest.name || entry.name,
                version: manifest.version || "1.0.0",
                description: manifest.description || "",
                enabled: manifest.enabled ?? true,
                path: pluginPath
              });
              this.plugins.set(entry.name, foundPlugins[foundPlugins.length - 1]);
            } catch {
            }
          }
        }
      }
    } catch (error) {
      log("ERROR", "Failed to scan plugins:", error.message);
    }
    return foundPlugins;
  }
  async enablePlugin(name) {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.enabled = true;
      return true;
    }
    return false;
  }
  async disablePlugin(name) {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.enabled = false;
      return true;
    }
    return false;
  }
  getPlugins() {
    return Array.from(this.plugins.values());
  }
  getEnabledPlugins() {
    return Array.from(this.plugins.values()).filter((p) => p.enabled);
  }
}
const pluginManager = new PluginManager();
function log(level, message, ...args) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`, ...args);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PluginManager,
  pluginManager
});
