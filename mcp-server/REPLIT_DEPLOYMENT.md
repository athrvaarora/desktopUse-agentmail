# 🚀 Deploying Desktop MCP Server on Replit

Complete step-by-step guide to deploy your MCP server on Replit.

## 📋 Prerequisites

- Replit account with credits
- This repository cloned/uploaded to Replit

## 🔧 Step 1: Create New Repl

1. Go to [Replit](https://replit.com)
2. Click **"+ Create Repl"**
3. Choose **"Import from GitHub"**
4. Enter repository URL: `https://github.com/athrvaarora/desktopUse-agentmail`
5. Or upload the `mcp-server` folder directly

## ⚙️ Step 2: Configure Environment

1. In Replit, navigate to **Tools** → **Secrets**
2. Add environment variable:
   - Key: `WEBSOCKET_PORT`
   - Value: `8080`

## 📦 Step 3: Install Dependencies

In the Shell tab, run:

```bash
cd mcp-server
npm install
```

This will install:
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `ws` - WebSocket server
- `typescript` - TypeScript compiler
- Other dependencies

## 🏗️ Step 4: Build the Server

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

## ▶️ Step 5: Start the Server

Click the **"Run"** button in Replit, or run:

```bash
npm start
```

You should see:

```
[MCP] Starting Desktop UI Control Server...
[WebSocket] Server listening on port 8080
[MCP] Server ready!
[MCP] Waiting for desktop application connections...
```

## 🌐 Step 6: Get Your WebSocket URL

1. Replit will assign you a URL like: `https://your-repl-name.your-username.repl.co`
2. Your WebSocket URL is: `wss://your-repl-name.your-username.repl.co` (note the `wss://`)
3. Save this URL - you'll need it for your desktop app

## 🔗 Step 7: Connect Desktop App

In your desktop application using `@roxy/llm-nav`, configure the WebSocket connection:

```tsx
// src/main.tsx
import { NavigationProvider } from '@roxy/llm-nav'

ReactDOM.render(
  <NavigationProvider 
    mcpServer="wss://your-repl-name.your-username.repl.co"
  >
    <App />
  </NavigationProvider>,
  document.getElementById('root')
)
```

## 🔌 Step 8: Configure AI Assistant

### For Claude Desktop

Edit `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "desktop-ui-control": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "WEBSOCKET_PORT": "8080"
      }
    }
  }
}
```

**Note:** For Replit deployment, the MCP server runs on Replit and connects via WebSocket. Claude connects to the MCP server via stdio locally.

## ✅ Step 9: Test the Connection

1. Start your desktop app (it should connect to Replit WebSocket)
2. Open Claude Desktop
3. Ask: "What UI components are available?"
4. Claude should use the `get_ui_state` tool and show your components

## 📊 Monitoring

### Check Server Logs

In Replit Console, you'll see:

```
[WebSocket] New client connected: client_abc123
[WebSocket] Received UI state update: 42 components
[MCP] Executing tool: click_component
[MCP] Tool result: { success: true, ... }
```

### Check Connection Status

In Claude, ask: "What's the connection status?"

This uses the `desktop://connection-status` resource.

## 🔧 Troubleshooting

### Issue: "No desktop application connected"

**Solution:**
- Check your desktop app is running
- Verify WebSocket URL is correct
- Check Replit server logs for connection attempts
- Ensure port 8080 is open

### Issue: WebSocket connection fails

**Solution:**
- Use `wss://` (not `ws://`) for Replit
- Check Replit is running (not sleeping)
- Verify firewall/proxy settings
- Try upgrading to Replit's always-on plan

### Issue: MCP tools not showing in Claude

**Solution:**
- Restart Claude Desktop
- Check `claude_desktop_config.json` syntax
- Verify file path is correct
- Check Claude logs: `~/Library/Logs/Claude/mcp*.log`

### Issue: TypeScript errors

**Solution:**
```bash
npm install @types/node @types/ws --save-dev
npm run build
```

## 🚀 Production Tips

### 1. Keep Repl Always On

Upgrade to Replit's **Hacker Plan** for always-on repls:
- No sleep after inactivity
- Faster startup
- Better reliability

### 2. Add Health Check Endpoint

Create a simple HTTP endpoint for monitoring:

```typescript
// Add to src/index.ts
import express from 'express'

const app = express()
app.get('/health', (req, res) => {
  const status = connectionManager.getConnectionStatus()
  res.json({ 
    status: 'ok', 
    connected: status.connected,
    clients: status.clientCount 
  })
})
app.listen(3000)
```

### 3. Enable Logging

Use a logging service:
- Logtail
- Papertrail
- Datadog

### 4. Secure Your Connection

For production:
- Add authentication tokens
- Validate component IDs
- Rate limit requests
- Use environment variables for secrets

### 5. Monitor Performance

Track:
- WebSocket connection uptime
- Tool execution latency
- Error rates
- Active connections

## 📈 Scaling

For multiple desktop apps:

1. **Multi-tenant Setup**
   - Add client authentication
   - Route actions to correct client
   - Track per-client UI state

2. **Load Balancing**
   - Deploy multiple Replit instances
   - Use Redis for shared state
   - Route by client ID

3. **Database Integration**
   - Store UI state history
   - Track usage analytics
   - Cache component sitemaps

## 🔄 Continuous Deployment

### Auto-deploy from GitHub

1. Connect Replit to GitHub
2. Enable auto-pull
3. Push changes trigger rebuild

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Replit
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: replit/replitdeploy@v1
        with:
          repl-id: ${{ secrets.REPL_ID }}
```

## 📞 Support

Issues? Check:
- [GitHub Issues](https://github.com/athrvaarora/ArkAngel/issues)
- Replit Console logs
- Claude Desktop logs
- Desktop app console

## 🎉 Next Steps

1. ✅ Deploy to Replit
2. ✅ Connect desktop app
3. ✅ Configure Claude
4. 🚀 Start controlling your UI with AI!

---

**Need Help?** Open an issue on GitHub or check the [main documentation](../README.md).
