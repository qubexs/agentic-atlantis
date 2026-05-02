#!/usr/bin/env bun
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import chalk from 'chalk';
import boxen from 'boxen';
import ora from 'ora';
import * as fs from 'node:fs';
import * as path from 'node:path';

const CONFIG_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.agentic-ai');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

interface Config {
  provider: 'openai' | 'anthropic' | 'ollama' | 'custom';
  apiKey: string;
  baseUrl: string;
  model: string;
  workspace: string;
}

function loadConfig(): Config {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  }
  return {
    provider: 'openai',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
    workspace: process.cwd()
  };
}

function saveConfig(config: Config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

async function chatWithAI(config: Config, message: string) {
  const spinner = ora('Thinking...').start();
  
  try {
    const openai = createOpenAI({
      apiKey: config.apiKey || 'sk-dummy',
      baseURL: config.baseUrl || 'https://api.openai.com/v1'
    });

    const systemPrompt = `You are an AI coding assistant called Agentic AI. You help developers write, edit, and understand code.
Current workspace: ${config.workspace}

You can help with:
- Reading, writing and editing files
- Running shell commands  
- Searching for patterns in code
- Explaining code
- Debugging issues

Be helpful, concise, and explain what you're doing.`;

    const result = await generateText({
      model: openai(config.model),
      system: systemPrompt,
      prompt: message
    });

    spinner.stop();
    return result.text;
  } catch (error: any) {
    spinner.stop();
    return `Error: ${error.message}`;
  }
}

function showLogo() {
  console.clear();
  const logo = boxen('🤖 Agentic AI', {
    padding: 1,
    margin: 0,
    borderStyle: 'round',
    borderColor: 'cyan'
  });
  console.log(chalk.cyan(logo));
  console.log(chalk.gray('  AI Coding Agent - Type your request or /help\n'));
}

async function main() {
  const config = loadConfig();
  
  if (!config.apiKey) {
    console.log(chalk.yellow('Welcome! Let me configure your AI provider first.\n'));
    
    const { default: inquirer } = await import('inquirer');
    
    const { provider } = await inquirer.prompt({
      type: 'list',
      name: 'provider',
      message: 'Choose AI provider:',
      choices: ['OpenAI', 'Anthropic', 'Ollama (local)', 'Custom'],
      default: 'OpenAI'
    });
    config.provider = (provider as string).toLowerCase().includes('anthropic') ? 'anthropic' :
                  (provider as string).toLowerCase().includes('ollama') ? 'ollama' : 'openai';
    
    const { apiKey } = await inquirer.prompt({
      type: 'password',
      name: 'apiKey',
      message: 'Enter API key:'
    });
    config.apiKey = apiKey;
    
    const currentProvider = config.provider as string;
    if (currentProvider === 'ollama') {
      config.baseUrl = 'http://localhost:11434/v1';
      config.model = 'llama3';
    } else if (currentProvider === 'custom') {
      const { baseUrl } = await inquirer.prompt({
        type: 'input',
        name: 'baseUrl',
        message: 'Enter base URL:',
        default: 'https://api.openai.com/v1'
      });
      config.baseUrl = baseUrl;
    }
    
    if (config.provider !== 'ollama') {
      const { model } = await inquirer.prompt({
        type: 'input',
        name: 'model',
        message: 'Enter model:',
        default: config.model
      });
      config.model = model || config.model;
    }
    
    const { workspace } = await inquirer.prompt({
      type: 'input',
      name: 'workspace',
      message: 'Enter workspace folder:',
      default: config.workspace
    });
    config.workspace = workspace || config.workspace;
    
    saveConfig(config);
    console.log(chalk.green('✓ Configuration saved!\n'));
  }

  showLogo();

  while (true) {
    const { default: inquirer } = await import('inquirer');
    
    const { input } = await inquirer.prompt({
      type: 'input',
      name: 'input',
      message: chalk.cyan('> ')
    });
    
    if (!input.trim()) continue;
    
    if (input === '/exit' || input === '/quit') {
      console.log(chalk.yellow('Goodbye! 👋'));
      process.exit(0);
    }
    
    if (input === '/help') {
      console.log(chalk.gray(`
Commands:
  /exit, /quit    Exit the agent
  /config        Show configuration
  /workspace    Change workspace
  /clear        Clear screen
      `));
      continue;
    }
    
    if (input === '/config') {
      console.log(chalk.gray(JSON.stringify({ ...config, apiKey: '***' }, null, 2)));
      continue;
    }
    
    if (input === '/clear') {
      showLogo();
      continue;
    }

    if (input === '/workspace') {
      const { workspace } = await inquirer.prompt({
        type: 'input',
        name: 'workspace',
        message: 'Enter workspace:'
      });
      config.workspace = workspace;
      saveConfig(config);
      console.log(chalk.green(`✓ Workspace: ${workspace}`));
      continue;
    }

    const response = await chatWithAI(config, input);
    console.log(chalk.white(response));
    console.log();
  }
}

main().catch(console.error);