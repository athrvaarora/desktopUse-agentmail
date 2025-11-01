# Desktop MCP Server

**Model Context Protocol (MCP) Server for Desktop UI Control**

Enable AI agents to control desktop applications through a standardized protocol. This MCP server provides tools for AI assistants to interact with desktop UIs that have been instrumented with component tags.

## 🚀 Features

- **12 Navigation Tools** - Click, type, scroll, open, close, and more
- **Component Discovery** - Find UI components by name or description
- **Real-time UI State** - Get live snapshots of application state
- **WebSocket Communication** - Fast, bidirectional connection with desktop apps
- **Component Sitemap** - Generate full UI hierarchy maps
- **Production Ready** - Error handling, logging, graceful shutdown

## 📦 Installation

```bash
npm install @roxy/desktop-mcp-server
```

Or use directly with npx:

```bash
npx @roxy/desktop-mcp-server
```

## 🔧 Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "desktop-ui-control": {
      "command": "npx",
      "args": ["@roxy/desktop-mcp-server"],
      "env": {
        "WEBSOCKET_PORT": "8080"
      }
    }
  }
}
```

### Environment Variables

- `WEBSOCKET_PORT` - WebSocket port for desktop app connections (default: 8080)

## 🏗️ How It Works

```
┌─────────────────┐      WebSocket      ┌─────────────────┐
│  Desktop App    │◄───────────────────►│   MCP Server    │
│  (with SDK)     │      (Port 8080)    │                 │
└─────────────────┘                     └─────────────────┘
                                               │
                                               │ MCP Protocol
                                               │ (stdio)
                                               ▼
                                        ┌─────────────────┐
                                        │   AI Assistant  │
                                        │  (Claude, etc)  │
                                        └─────────────────┘
```

1. **Desktop Application** uses `@roxy/llm-nav` SDK to tag UI components
2. **MCP Server** receives UI state via WebSocket
3. **AI Assistant** calls MCP tools to control the desktop app
4. **Actions** are sent back through WebSocket and executed

## 🛠️ Available Tools

### Navigation Tools

- **get_ui_state** - Get current UI state with all components
- **find_component** - Search for components by name/type
- **click_component** - Click buttons, cards, or clickable elements
- **type_text** - Type text into input fields
- **clear_input** - Clear input field contents
- **open_component** - Open modals, popovers, dropdowns
- **close_component** - Close overlay components
- **scroll_to_component** - Scroll element into view
- **select_option** - Select from dropdown menus
- **execute_custom_action** - Run component-specific actions
- **execute_navigation_path** - Execute multi-step workflows
- **get_component_sitemap** - Generate full UI hierarchy

### Resources

- **desktop://ui-state** - Real-time UI state
- **desktop://connection-status** - Connection status and client count

## 📖 Usage Example

Once configured, AI assistants can control your desktop app:

```
User: "Open the settings and change theme to dark"

AI executes:
1. get_ui_state() → Sees all components
2. find_component({ query: "settings", type: "button" })
3. click_component({ componentId: "settings-button" })
4. find_component({ query: "theme" })
5. select_option({ componentId: "theme-select", value: "dark" })

✅ Done!
```

## 🔗 Related Packages

- **[@roxy/llm-nav](../llm-nav)** - React SDK for tagging components
- **[@roxy/desktop-mcp-cli](../cli)** - CLI tools for management

## 🚀 Deployment

### Replit

1. Create a new Repl
2. Import this repository
3. Set environment variables:
   - `WEBSOCKET_PORT=8080`
4. Run: `npm install && npm run build && npm start`
5. Connect your desktop app to the Replit WebSocket URL

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm", "start"]
```

```bash
docker build -t desktop-mcp-server .
docker run -p 8080:8080 desktop-mcp-server
```

### Production

For production deployment:

1. Use a reverse proxy (nginx/caddy) for WebSocket
2. Enable SSL/TLS for secure connections
3. Set up monitoring and logging
4. Configure firewall rules for port 8080
5. Use PM2 or systemd for process management

## 🔐 Security

- WebSocket connections are local by default
- No authentication required for local connections
- For remote connections, use SSL/TLS and authentication
- Validate all component IDs before execution
- Rate limit tool calls in production

## 📝 Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Development mode (watch)
npm run dev

# Type check
npm run typecheck

# Start server
npm start
```

## 🐛 Debugging

The server logs to stderr:

```bash
[MCP] Starting Desktop UI Control Server...
[WebSocket] Server listening on port 8080
[MCP] Server ready!
[MCP] Waiting for desktop application connections...
[WebSocket] New client connected: client_123
[WebSocket] Received UI state update: 42 components
[MCP] Executing tool: click_component
```

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md)

## 📄 License

MIT - See [LICENSE](../LICENSE)

## 🔗 Links

- [Documentation](https://github.com/athrvaarora/ArkAngel)
- [Examples](../examples)
- [Issues](https://github.com/athrvaarora/ArkAngel/issues)
