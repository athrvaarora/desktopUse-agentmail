# Desktop.use Demo Website

AI-powered demo website showcasing the `desktopuse-sdk` with live component control via Claude AI.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Add Your Claude API Key

Create a `.env.local` file in this directory:

```env
# Get your API key from: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# MCP Server (already deployed)
NEXT_PUBLIC_MCP_SERVER_URL=wss://desktopuse.replit.app
```

**🔑 Where to get your Claude API key:**
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Click "API Keys" → "Create Key"
4. Copy and paste into `.env.local`

### 3. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ✨ Features

- **8 Interactive Components**: Slider, Input, Button, Toggle, Select, Textarea, Card, Dialog
- **AI Chat Interface**: Control components with natural language
- **Real-time MCP Integration**: Connected to deployed MCP server
- **SDK-Wrapped Components**: All components discoverable by AI

## 🎯 Try These AI Commands

```
"navigate to slider page"
"set slider to 75"
"increase slider by 20"
"type john@example.com in email field"
"click the primary button"
"turn on notifications"
"select USA"
"open settings dialog"
"expand the card"
```

## 🏗️ Architecture

```
User Chat → Claude API → MCP Tools → WebSocket → desktopuse-sdk → UI Components
```

1. User types command in chat
2. Claude AI interprets with MCP tools
3. WebSocket sends to browser (wss://desktopuse.replit.app)
4. SDK executes custom actions
5. Components update in real-time

## 📦 Tech Stack

- **Next.js 15** (React 18)
- **Claude 3.5 Sonnet** (@anthropic-ai/sdk)
- **desktopuse-sdk v1.0.0** (published on NPM)
- **Tailwind CSS v4**
- **TypeScript**

## 🛠️ File Structure

```
demo-website/
├── app/
│   ├── api/chat/route.ts         # ← Claude API integration
│   ├── components/
│   │   ├── demos/                # ← 8 component demos
│   │   ├── AIChat.tsx            # ← AI chat interface
│   │   ├── Sidebar.tsx           # ← Navigation
│   │   └── ...
│   ├── providers.tsx             # ← NavigationProvider with MCP
│   └── page.tsx                  # ← Main page
├── .env.local                    # ← YOU CREATE THIS (API key here)
├── .env.example                  # ← Template
└── package.json
```

## 🐛 Troubleshooting

### "Claude API key not configured"
→ Add `ANTHROPIC_API_KEY` to `.env.local`

### "Invalid Claude API key"  
→ Verify your key at https://console.anthropic.com/

### Components not responding
→ Open browser console (F12) and check for SDK connection logs

## 📚 Resources

- **SDK Repo**: https://github.com/athrvaarora/desktopUse-agentmail
- **NPM Package**: https://npmjs.com/package/desktopuse-sdk
- **Claude Docs**: https://docs.anthropic.com/

---

Built with ❤️ using Desktop.use SDK
