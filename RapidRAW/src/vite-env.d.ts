/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MCP_SERVER_URL: string
  readonly VITE_CHAT_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
