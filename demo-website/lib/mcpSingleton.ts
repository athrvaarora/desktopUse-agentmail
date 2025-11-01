/**
 * Singleton MCP Connection Manager
 * Prevents multiple WebSocket connections in React dev mode (StrictMode + Fast Refresh)
 */

import { MCPConnection } from 'desktopuse-sdk';

let globalConnection: MCPConnection | null = null;
let connectionCount = 0;

export function getOrCreateMCPConnection(
  url: string,
  options?: {
    syncInterval?: number;
    heartbeatInterval?: number;
    reconnectDelay?: number;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Error) => void;
  }
): MCPConnection {
  // If connection exists and URL matches, reuse it
  if (globalConnection) {
    const status = globalConnection.getStatus();
    if (status.url === url) {
      console.log('[MCP Singleton] Reusing existing connection');
      return globalConnection;
    } else {
      // URL changed, disconnect old and create new
      console.log('[MCP Singleton] URL changed, disconnecting old connection');
      globalConnection.disconnect();
      globalConnection = null;
    }
  }

  connectionCount++;
  console.log(`[MCP Singleton] Creating connection #${connectionCount} to ${url}`);

  globalConnection = new MCPConnection({
    url,
    ...options,
  });

  globalConnection.connect();
  return globalConnection;
}

export function disconnectMCP() {
  if (globalConnection) {
    console.log('[MCP Singleton] Disconnecting global connection');
    globalConnection.disconnect();
    globalConnection = null;
  }
}
