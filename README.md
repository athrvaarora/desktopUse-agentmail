# Desktop MCP Server

Model Context Protocol (MCP) server that enables AI agents to control desktop applications through natural language.

## 🚀 Features

- **12 Navigation Tools** - Complete UI control (click, type, scroll, etc.)
- **WebSocket Communication** - Real-time connection with desktop apps
- **Component Discovery** - Find UI elements by label, type, or metadata
- **Custom Actions** - Support for app-specific behaviors
- **Navigation Paths** - Execute multi-step workflows
- **MCP Protocol** - Full compatibility with Claude Desktop

## 📦 Installation

```bash
cd mcp-server
npm install
npm run build
npm start
```

## 🔧 Configuration

Set environment variables:
```bash
WEBSOCKET_PORT=8080  # WebSocket server port (default: 8080)
```

## 🛠️ Available Tools

1. **get_ui_state** - Get current UI state with all components
2. **find_component** - Search for components by query
3. **click_component** - Click buttons, cards, etc.
4. **type_text** - Type into inputs/textareas
5. **clear_input** - Clear input fields
6. **open_component** - Open modals, popovers, dropdowns
7. **close_component** - Close overlays
8. **scroll_to_component** - Scroll to make components visible
9. **select_option** - Select from dropdowns
10. **execute_custom_action** - Run custom component actions
11. **execute_navigation_path** - Multi-step navigation workflows
12. **get_component_sitemap** - Get complete UI hierarchy

## 🌐 Deploy to Replit

1. Import this repo to Replit
2. Replit auto-configures using `.replit` and `replit.nix`
3. Run `npm install && npm run build && npm start`
4. Get your WebSocket URL: `wss://your-repl.repl.co`

## 🔌 Integration

Desktop applications connect via WebSocket on port 8080:

```typescript
const ws = new WebSocket('ws://localhost:8080');

// Send UI state updates
ws.send(JSON.stringify({
  type: 'ui_state',
  data: {
    components: [...],
    hierarchy: {...},
    currentlyVisible: [...],
    timestamp: Date.now()
  }
}));

// Listen for action requests
ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.type === 'action_request') {
    // Execute action on UI
    // Send result back
    ws.send(JSON.stringify({
      type: 'action_result',
      data: { success: true }
    }));
  }
});
```

## 📄 License

MIT

## 👤 Author

Athrva Arora (@athrvaarora)
