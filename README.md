# Agentic Atlantis IDE

A powerful, AI-enhanced desktop IDE built with Electron, React, and Vite. Designed for modern developers who want intelligent coding assistance directly in their development environment.

![Agentic Atlantis IDE](./screenshot.png)

## Features

### Core IDE Features
- **File Explorer** - Browse and manage project files with intuitive navigation
- **Code Editor** - Full-featured code editing with syntax highlighting (Monaco Editor)
- **Multi-tab Editor** - Work on multiple files simultaneously
- **Integrated Terminal** - Built-in terminal with full shell support

### AI-Powered Features
- **AI Chat Interface** - Conversational AI assistant for code help, debugging, and explanations
- **Multi-Provider Support** - Connect to multiple AI providers:
  - OpenAI (GPT-4o, GPT-4o Mini, GPT-3.5 Turbo)
  - Anthropic (Claude 3.5 Sonnet, Claude 3 Haiku)
  - Google Gemini (Gemini 2.0 Flash, Gemini 1.5 Pro)
  - Ollama (Local AI - Llama3, Mistral, CodeLlama, etc.)
  - Custom/OpenAI-compatible providers
- **Model Selection** - Choose and switch between available models per provider

### Workflow & Automation
- **Workflow Editor** - Visual workflow creation with node-based interface
- **MCP (Model Context Protocol)** - Integration support for extended AI capabilities

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Development Setup

```bash
# Clone the repository
git clone https://github.com/qubexs/agentic-atlantis.git
cd agentic-atlantis

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
# Build frontend
npm run build

# Build Electron app for Windows
npx electron-builder --win --dir

# Build Electron app for macOS
npx electron-builder --mac --dir

# Build Electron app for Linux
npx electron-builder --linux --dir

# Build distributable installers
npx electron-builder --win
npx electron-builder --mac
npx electron-builder --linux
```

## Configuration

### AI Provider Setup

1. Open **Settings** (Ctrl+,)
2. Navigate to **Model** tab
3. Select your provider from the dropdown
4. Enter your API key
5. Choose your model

### Adding Custom Providers

You can add custom OpenAI-compatible providers via the provider.json configuration:

1. Click the gear icon in the Model settings
2. Edit the provider.json configuration
3. Add your custom provider with models

Example provider.json format:
```json
{
  "provider": {
    "myprovider": {
      "npm": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "https://api.myprovider.com/v1",
        "apiKey": "{env:MY_API_KEY}"
      },
      "models": {
        "model-id": { "name": "Display Name" }
      }
    }
  }
}
```

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Save file | Ctrl+S |
| Open settings | Ctrl+, |
| Toggle sidebar | Ctrl+B |
| New terminal | Ctrl+` |
| Focus chat input | Ctrl+L |
| Open file | Ctrl+K |
| Command palette | Ctrl+Shift+P |
| Choose model | Ctrl+' |
| Navigate back | Ctrl+[ |
| Navigate forward | Ctrl+] |
| Close tab | Ctrl+W |

## Tech Stack

- **Electron 41** - Desktop application framework
- **React 18** - UI library
- **Vite 5** - Build tool
- **TypeScript** - Type safety
- **Monaco Editor** - Code editing
- **Zustand** - State management
- **xterm.js** - Terminal emulation
- **ReactFlow** - Workflow visualization

## Project Structure

```
agentic-atlantis/
├── electron/           # Electron main & preload scripts
│   ├── main/          # Main process
│   └── preload/       # Preload scripts
├── src/              # React source code
│   ├── components/   # React components
│   ├── store/        # Zustand state management
│   ├── App.tsx       # Main app component
│   └── main.tsx     # App entry point
├── dist/             # Built frontend
├── dist-electron/    # Built Electron scripts
├── release/          # Packaged applications
└── package.json     # Project dependencies
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you find this project useful, please consider supporting its development:

### Donations

Your support helps keep this project alive and improving!

**Bitcoin (BTC)**
```
bc1qxy2kxdy0na3mprymjp7u4ljvyh4kjrm8r4hc3r
```

**Ethereum (ETH)**
```
0x7427dC08d4A9b0dE13D1f3E7c1d3F4d5e6f7g8h9
```

**Solana (SOL)**
```
7xKXtg2wG2p9m8nV4t5r6y7z8A9b0c1d2e3f4g5h6i7j8k9l0
```

---

Built with ❤️ by the Agentic Atlantis Team