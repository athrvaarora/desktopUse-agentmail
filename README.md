# Desktop Use Agent Mail

AI-powered desktop application control framework using Model Context Protocol (MCP). This project demonstrates how to enable LLM agents to navigate and control complex desktop applications through natural language commands.

## Project Overview

This repository contains a complete implementation of desktop AI control, featuring:

- **TypeScript MCP Server** - Built and deployed on Replit for 24/7 availability
- **Desktop Use SDK** - React integration for seamless UI navigation tagging
- **RapidRAW Integration** - Full navigation framework for a professional photo editor
- **Hyperspell Memory System** - Persistent sitemap memory stored in Notion

## Core Features

- **12 Navigation Tools** - Complete UI control (click, type, scroll, etc.)
- **WebSocket Communication** - Real-time connection with desktop apps
- **Component Discovery** - Find UI elements by label, type, or metadata
- **Custom Actions** - Support for app-specific behaviors
- **Navigation Paths** - Execute multi-step workflows
- **MCP Protocol** - Full compatibility with Claude Desktop
- **Sitemap Memory** - Complete UI hierarchy preserved across sessions

## Installation

```bash
cd mcp-server
npm install
npm run build
npm start
```

## Configuration

Set environment variables:
```bash
WEBSOCKET_PORT=8080  # WebSocket server port (default: 8080)
```

## Available Tools

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

## Architecture

### MCP Server (TypeScript on Replit)

The MCP server is deployed on Replit for reliable 24/7 uptime. Replit provides:
- Automatic dependency management via `replit.nix`
- Zero-configuration deployment
- Built-in WebSocket support
- Always-on server capability

**Deployment Steps:**
1. Import this repo to Replit
2. Replit auto-configures using `.replit` and `replit.nix`
3. Run `npm install && npm run build && npm start`
4. Get your WebSocket URL: `wss://your-repl.repl.co`

### Hyperspell Memory Integration

The agent uses Hyperspell for persistent memory management:
- **Sitemap Storage**: Complete UI hierarchy saved to Notion
- **Navigation Memory**: Agent remembers previous interactions
- **Context Preservation**: Full sitemap reference across sessions
- **Notion Integration**: [View Complete Sitemap Documentation](https://cerulean-visage-643.notion.site/RapidRAW-UI-Sitemap-Complete-LLM-Navigation-Framework-dd0b8dd1d07941909a22a4f9bcfb287d)

The Notion document contains:
- Complete RapidRAW UI component tree
- Navigation tag reference guide
- Component interaction patterns
- State management documentation

### Desktop Use SDK

The SDK provides React hooks for seamless navigation tagging:
```typescript
import { useNavigation } from 'desktopuse-sdk';

const { ref } = useNavigation({
  id: 'brightness-slider',
  type: 'input',
  label: 'Brightness Slider',
  availableActions: ['type', 'click'],
  metadata: {
    description: 'Adjust image brightness',
    value: brightness,
    min: -5,
    max: 5
  },
  customActions: {
    setValue: (newValue: number) => setBrightness(newValue),
    increase: (amount: number) => setBrightness(prev => prev + amount),
    decrease: (amount: number) => setBrightness(prev => prev - amount)
  }
});

return <div ref={ref}><Slider ... /></div>;
```

## Integration

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

## Implementation Example: RapidRAW

This project includes a complete implementation for [RapidRAW](./RapidRAW), a professional RAW photo editor. The integration demonstrates:

- **70+ Navigation Tags**: Every interactive element is AI-navigable
- **Dynamic Component Handling**: Lists, modals, and contextual UI
- **Complex State Management**: Masks, adjustments, and tools
- **Multi-level Navigation**: Panels, tabs, and nested controls

See the [RapidRAW README](./RapidRAW/README.md) for implementation details.

## Resources

- **Notion Sitemap**: [Complete RapidRAW UI Documentation](https://cerulean-visage-643.notion.site/RapidRAW-UI-Sitemap-Complete-LLM-Navigation-Framework-dd0b8dd1d07941909a22a4f9bcfb287d)
- **MCP Server**: [Replit Deployment Guide](./mcp-server/REPLIT_DEPLOYMENT.md)
- **Desktop Use SDK**: [SDK Documentation](./desktop-control-sdk/README.md)

## License

MIT

## Author

Athrva Arora (@athrvaarora)
