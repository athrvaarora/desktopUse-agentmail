# Desktop Control SDK

TypeScript SDK for building AI-controlled desktop applications with [Model Context Protocol](https://modelcontextprotocol.io) server integration.

## Features

- 🤖 **AI-Native**: Let LLMs control your React application through natural language
- 🔌 **MCP Integration**: Built-in WebSocket connection to deployed MCP server
- ⚡ **Real-time Sync**: Component state synced every 100ms
- 🎯 **Type-Safe**: Full TypeScript support with strict typing
- 🪝 **React Hooks**: Simple `useNavigation` hook for component tagging
- 🧩 **Component Registry**: Automatic component graph management
- 🚀 **Production Ready**: Reconnection handling, error callbacks, lifecycle management

## Installation

```bash
npm install desktopuse-sdk react react-dom
```

## Quick Start

### 1. Wrap your app with NavigationProvider

```tsx
import { NavigationProvider } from 'desktopuse-sdk';

function App() {
  return (
    <NavigationProvider 
      mcpServerUrl="wss://desktopuse.replit.app"
      onConnect={() => console.log('Connected to MCP server')}
      onError={(error) => console.error('MCP error:', error)}
    >
      <YourApp />
    </NavigationProvider>
  );
}
```

### 2. Tag components with useNavigation

```tsx
import { useNavigation } from 'desktopuse-sdk';

function LoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  const navProps = useNavigation({
    id: 'login-button',
    type: 'button',
    label: 'Log In',
    availableActions: ['click'],
    metadata: { role: 'primary-action' },
  });

  return (
    <button {...navProps} onClick={handleLogin}>
      {isLoading ? 'Logging in...' : 'Log In'}
    </button>
  );
}
```

### 3. Tag form inputs

```tsx
function EmailInput() {
  const [email, setEmail] = useState('');

  const navProps = useNavigation({
    id: 'email-input',
    type: 'input',
    label: 'Email Address',
    availableActions: ['type', 'clear'],
    metadata: { 
      placeholder: 'Enter your email',
      value: email 
    },
    onValueChange: setEmail, // LLM can update value
  });

  return (
    <input 
      {...navProps}
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      placeholder="Enter your email"
    />
  );
}
```

### 4. Tag dialogs and dropdowns

```tsx
function SettingsDialog() {
  const [isOpen, setIsOpen] = useState(false);

  const navProps = useNavigation({
    id: 'settings-dialog',
    type: 'dialog',
    label: 'Settings',
    availableActions: ['open', 'close'],
    metadata: { isOpen },
    onOpen: setIsOpen, // LLM can open/close
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger {...navProps}>
        Settings
      </DialogTrigger>
      <DialogContent>
        {/* Dialog content */}
      </DialogContent>
    </Dialog>
  );
}
```

## Architecture

```
Desktop App (React)
    ↓ WebSocket
MCP Server (Replit)
    ↓ stdio
Claude Desktop / LLM
```

### How it works

1. **Component Registration**: `useNavigation` hook tags components and registers them in the component graph
2. **State Sync**: NavigationProvider sends UI state to MCP server every 100ms via WebSocket
3. **Action Requests**: MCP server receives natural language from LLM, converts to structured actions
4. **Action Execution**: SDK's NavigationEngine executes DOM actions (click, type, scroll, etc.)
5. **Result Reporting**: Action results sent back to MCP server, then to LLM

## API Reference

### NavigationProvider

Wraps your app and manages MCP server connection.

```tsx
interface NavigationProviderProps {
  children: ReactNode;
  mcpServerUrl: string;           // WebSocket URL of MCP server
  syncInterval?: number;          // UI sync interval in ms (default: 100)
  onConnect?: () => void;         // Called when connected
  onDisconnect?: () => void;      // Called when disconnected
  onError?: (error: Error) => void; // Called on errors
}
```

### useNavigation

Hook for tagging components.

```tsx
interface UseNavigationOptions {
  id: string;                     // Unique component ID
  type: ComponentType;            // Component type (button, input, etc.)
  label: string;                  // Human-readable label
  parent?: string;                // Parent component ID
  availableActions?: NavigationAction[]; // Actions this component supports
  metadata?: ComponentMetadata;   // Additional data for LLM
  
  // State setters (called by LLM)
  onOpen?: (value: boolean) => void;
  onValueChange?: (value: any) => void;
  onFocus?: () => void;
  
  // Custom actions
  customActions?: Record<string, (value?: any) => void>;
}

// Returns
{
  ref: RefCallback<HTMLElement>;  // Attach to DOM element
  updateMetadata: (updates) => void;
  setVisible: (visible) => void;
  setLoading: (loading) => void;
  'data-nav-id': string;
  'data-nav-type': string;
  'data-nav-label': string;
}
```

### Component Types

```typescript
type ComponentType =
  | 'page' | 'popover' | 'modal' | 'dialog' | 'button' | 'input'
  | 'textarea' | 'select' | 'checkbox' | 'toggle' | 'card'
  | 'tab' | 'accordion' | 'menu' | 'dropdown' | 'list' | 'form';
```

### Navigation Actions

```typescript
type NavigationAction =
  | 'click' | 'type' | 'clear' | 'focus' | 'blur' | 'scroll'
  | 'open' | 'close' | 'select' | 'toggle' | 'hover' | 'submit';
```

## Advanced Usage

### Custom Actions

```tsx
const navProps = useNavigation({
  id: 'color-picker',
  type: 'button',
  label: 'Pick Color',
  customActions: {
    setRed: () => setColor('#FF0000'),
    setBlue: () => setColor('#0000FF'),
  },
});
```

### Dynamic Metadata

```tsx
const navProps = useNavigation({
  id: 'search-results',
  type: 'card',
  label: 'Search Results',
  metadata: { 
    count: results.length,
    hasMore: hasNextPage 
  },
});

// Update metadata when results change
useEffect(() => {
  navProps.updateMetadata({ 
    count: results.length,
    hasMore: hasNextPage 
  });
}, [results]);
```

### Connection Status

```tsx
import { useNavigationContext } from 'desktopuse-sdk';

function ConnectionStatus() {
  const { isConnected, connectionError } = useNavigationContext();

  if (connectionError) {
    return <div>Error: {connectionError.message}</div>;
  }

  return (
    <div>
      {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
    </div>
  );
}
```

## Examples

See the [examples](./examples) directory for complete working examples:

- [Basic Button](./examples/BasicButton.example.tsx)
- [Form Input](./examples/ComplexForm.example.tsx)
- [Dialog](./examples/Dialog.example.tsx)
- [Dropdown](./examples/Dropdown.example.tsx)
- [Search & Cards](./examples/SearchAndCard.example.tsx)

## MCP Server Deployment

The SDK connects to a deployed MCP server. To deploy your own:

1. Clone: `git clone https://github.com/athrvaarora/desktopUse-agentmail`
2. Deploy to Replit with Node 20
3. Set build command: `cd mcp-server && npm install && npm run build`
4. Set run command: `cd mcp-server && npm start`
5. Get WebSocket URL: `wss://your-repl.replit.app`

## Development

```bash
# Install dependencies
npm install

# Build SDK
npm run build

# Watch mode
npm run watch
```

## License

MIT

## Support

- 📖 [Documentation](https://github.com/athrvaarora/desktopUse-agentmail)
- 🐛 [Issues](https://github.com/athrvaarora/desktopUse-agentmail/issues)
- 💬 [NPM Package](https://www.npmjs.com/package/desktopuse-sdk)
