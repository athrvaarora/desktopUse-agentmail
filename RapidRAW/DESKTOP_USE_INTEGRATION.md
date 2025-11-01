# Desktop Use SDK Integration for RapidRAW

This implementation adds LLM control to RapidRAW using the Desktop Use SDK framework with the **deployed Replit MCP server**.

## What Was Implemented

### 1. **Desktop Use SDK Integration**
- Added `desktopuse-sdk` dependency to RapidRAW
- Wrapped App with `NavigationProvider` for WebSocket connection to deployed MCP server
- Connected to **wss://desktopuse.replit.app** (Replit deployment)

### 2. **Chat API Integration**
- ChatPanel connects to **https://desktopuse.replit.app/api/chat**
- Uses deployed server with Claude Sonnet 4 integration
- No local server needed - everything runs on Replit!

### 3. **Chat Panel Integration**
- Updated ChatPanel to call deployed MCP API and execute tool calls
- Real-time tool execution via NavigationEngine
- Loading states and error handling

### 4. **Tagged Components**
The following adjustment sliders are now LLM-controllable:

#### **Brightness Slider** (`brightness-slider`)
- Range: -5 to 5
- Custom Actions:
  - `setValue(value)` - Set exact value
  - `increase(amount)` - Increase by amount
  - `decrease(amount)` - Decrease by amount

#### **Contrast Slider** (`contrast-slider`)
- Range: -100 to 100
- Custom Actions:
  - `setValue(value)` - Set exact value
  - `increase(amount)` - Increase by amount
  - `decrease(amount)` - Decrease by amount

#### **Highlights Slider** (`highlights-slider`)
- Range: -100 to 100
- Custom Actions:
  - `setValue(value)` - Set exact value
  - `increase(amount)` - Increase by amount
  - `decrease(amount)` - Decrease by amount

---

## Setup Instructions

### Step 1: Install Dependencies

```bash
cd /Users/athrva/desktopUse-agentmail/RapidRAW
npm install
```

### Step 2: Start RapidRAW

```bash
npm start
```

That's it! The app automatically connects to the deployed Replit server at:
- **WebSocket**: wss://desktopuse.replit.app
- **Chat API**: https://desktopuse.replit.app/api/chat

### Environment Variables (Optional)

The `.env` file is already configured with the deployed server URLs:

```env
# MCP Server WebSocket URL (Replit deployment)
VITE_MCP_SERVER_URL=wss://desktopuse.replit.app

# Chat API Endpoint (Replit deployment)  
VITE_CHAT_API_URL=https://desktopuse.replit.app/api/chat
```

You can override these if you want to test with a different deployment.

---

## Testing Commands

Once RapidRAW is running, open the chat panel (circular button in bottom right) and try these commands:

### Basic Commands
- "set brightness to 80"
- "set brightness to 2" (for range -5 to 5)
- "increase contrast by 20"
- "decrease highlights by 30"
- "make it brighter" (increases by 0.5)
- "set contrast to 50"
- "set highlights to -20"

### Combined Commands
- "increase brightness by 1 and set contrast to 40"
- "make it brighter and increase contrast"

---

## How It Works

### Architecture Flow

1. **User Input** → ChatPanel receives message
2. **API Call** → POST to `http://localhost:3001/api/chat`
3. **Claude Processing** → LLM analyzes request and returns tool calls
4. **Tool Execution** → ChatPanel executes tools via `executeAction()`:
   ```typescript
   await executeAction('brightness-slider', 'setValue', 80);
   await executeAction('contrast-slider', 'increase', 20);
   ```
5. **Component Update** → useNavigation hook's customActions update slider values
6. **UI Sync** → WebSocket syncs UI state back to MCP server every 100ms

### Component Tagging Pattern

Each slider is wrapped with `useNavigation` hook:

```typescript
const { ref: brightnessRef } = useNavigation({
  id: 'brightness-slider',
  type: 'input',
  label: 'Brightness Slider',
  metadata: {
    value: adjustments.brightness,
    min: -5,
    max: 5,
  },
  customActions: {
    setValue: (val) => handleAdjustmentChange('brightness', val),
    increase: (amt) => /* increase logic */,
    decrease: (amt) => /* decrease logic */,
  },
});

<div ref={brightnessRef}>
  <Slider ... />
</div>
```

---

## WebSocket Connection

The app connects to `ws://localhost:8080` by default. To change this:

1. Edit `src/App.tsx`:
   ```typescript
   const mcpServerUrl = 'ws://your-server-url:8080';
   ```

2. For production, deploy the MCP server from `mcp-server/` directory

---

## Troubleshooting

### Chat shows "Error connecting to server"
- Check if Replit deployment is running: https://desktopuse.replit.app/health
- Verify internet connection
- Check browser console for WebSocket connection logs

### "Cannot find module 'desktopuse-sdk'"
- Reinstall RapidRAW dependencies: `cd RapidRAW && npm install`

### Sliders not responding to commands
- Check browser console for MCP connection logs (should see "✅ [MCP] Connected")
- Verify component IDs match: `brightness-slider`, `contrast-slider`, `highlights-slider`
- Make sure Replit server is running (check https://replit.com/@your-username/desktopuse)

### WebSocket connection fails
- Ensure Replit app is running (click "Run" button on Replit)
- Check if port 8080 is exposed on Replit
- Try refreshing the RapidRAW app

---

## Next Steps

To extend LLM control to more components:

1. **Tag more sliders** (Shadows, Whites, Blacks):
   ```typescript
   const { ref: shadowsRef } = useNavigation({
     id: 'shadows-slider',
     type: 'input',
     label: 'Shadows Slider',
     customActions: { setValue, increase, decrease },
   });
   ```

2. **Tag buttons** (Undo, Redo, Reset):
   ```typescript
   const { ref: undoRef } = useNavigation({
     id: 'undo-button',
     type: 'button',
     label: 'Undo Button',
     customActions: { click: () => handleUndo() },
   });
   ```

3. **Tag panels** (Crop, Masks, Export):
   ```typescript
   const { ref: cropPanelRef } = useNavigation({
     id: 'crop-panel',
     type: 'panel',
     label: 'Crop Panel',
     customActions: {
       open: () => setActiveRightPanel('crop'),
       close: () => setActiveRightPanel(null),
     },
   });
   ```

---

## File Structure

```
RapidRAW/
├── .env                  # Environment variables (Replit URLs)
├── src/
│   ├── App.tsx           # Wrapped with NavigationProvider
│   ├── vite-env.d.ts     # TypeScript env declarations
│   └── components/
│       ├── chat/
│       │   └── ChatPanel.tsx  # Connects to Replit chat API
│       └── adjustments/
│           └── Basic.tsx      # Tagged sliders with useNavigation
└── package.json          # RapidRAW dependencies (includes desktopuse-sdk)
```

---

## Documentation

- **Desktop Use SDK**: `/desktop-control-sdk/README.md`
- **MCP Server**: `/mcp-server/README.md`
- **Demo Website**: `/demo-website/README.md`

---

## Support

For issues or questions about:
- **SDK integration**: Check `/desktop-control-sdk/examples/`
- **MCP tools**: See `/mcp-server/src/tools.ts`
- **Component tagging**: Reference `/demo-website/app/components/demos/`
