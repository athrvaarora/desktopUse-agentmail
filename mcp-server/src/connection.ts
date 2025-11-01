/**
 * WebSocket Connection Manager
 * Manages connections between MCP server and desktop applications
 */

import WebSocket, { WebSocketServer } from 'ws';
import type { Server as HTTPServer } from 'http';
import type { ClientConnection, UIState, WebSocketMessage } from './types/index.js';

export class ConnectionManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, { ws: WebSocket; connection: ClientConnection }> = new Map();
  private currentUIState: UIState | null = null;

  constructor() {}

  /**
   * Start WebSocket server on an existing HTTP server (for Replit/single port)
   */
  startWithHttpServer(httpServer: HTTPServer): Promise<void> {
    return new Promise((resolve) => {
      this.wss = new WebSocketServer({ server: httpServer });

      this.wss.on('listening', () => {
        console.log(`[WebSocket] Server attached to HTTP server`);
        resolve();
      });

      this.wss.on('connection', (ws: WebSocket) => {
        const clientId = this.generateClientId();
        console.log(`[WebSocket] New client connected: ${clientId}`);

        const connection: ClientConnection = {
          id: clientId,
          connected: true,
          lastHeartbeat: Date.now(),
        };

        this.clients.set(clientId, { ws, connection });

        ws.on('message', (data: Buffer) => {
          this.handleMessage(clientId, data);
        });

        ws.on('close', () => {
          console.log(`[WebSocket] Client disconnected: ${clientId}`);
          this.clients.delete(clientId);
        });

        ws.on('error', (error) => {
          console.error(`[WebSocket] Error for client ${clientId}:`, error);
          this.clients.delete(clientId);
        });

        // Send welcome message
        this.sendToClient(clientId, {
          type: 'heartbeat',
          data: { message: 'Connected to Desktop MCP Server', clientId },
        });
      });

      this.wss.on('error', (error) => {
        console.error('[WebSocket] Server error:', error);
      });

      // Start heartbeat checker
      this.startHeartbeatChecker();
    });
  }

  private handleMessage(clientId: string, data: Buffer): void {
    try {
      const message = JSON.parse(data.toString()) as WebSocketMessage;
      const client = this.clients.get(clientId);

      if (!client) return;

      switch (message.type) {
        case 'ui_state':
          // Update UI state from client
          this.currentUIState = message.data as UIState;
          this.currentUIState.timestamp = Date.now();
          client.connection.uiState = this.currentUIState;
          console.log(`[WebSocket] Received UI state update: ${this.currentUIState.components.length} components`);
          break;

        case 'action_result':
          // Action result from desktop app - handled by sendAction promise
          console.log(`[WebSocket] Action result:`, message.data);
          break;

        case 'heartbeat':
          client.connection.lastHeartbeat = Date.now();
          break;

        default:
          console.warn(`[WebSocket] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`[WebSocket] Error parsing message from ${clientId}:`, error);
    }
  }

  private sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`[WebSocket] Error sending to client ${clientId}:`, error);
    }
  }

  broadcast(message: WebSocketMessage): void {
    this.clients.forEach((_client, clientId) => {
      this.sendToClient(clientId, message);
    });
  }

  async sendAction(action: string, params: any): Promise<any> {
    if (this.clients.size === 0) {
      throw new Error('No desktop application connected');
    }

    // Send to the first connected client (can be enhanced for multi-client)
    const [clientId, client] = Array.from(this.clients.entries())[0];

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        client.ws.off('message', messageHandler);
        reject(new Error('Action timeout'));
      }, 10000);

      const messageHandler = (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          if (message.type === 'action_result') {
            clearTimeout(timeout);
            client.ws.off('message', messageHandler);
            resolve(message.data);
          }
        } catch (error) {
          // Ignore parse errors
        }
      };

      client.ws.on('message', messageHandler);

      // Send action request to desktop app
      this.sendToClient(clientId, {
        type: 'action_request',
        data: { action, params },
      });
    });
  }

  getCurrentUIState(): UIState | null {
    return this.currentUIState;
  }

  getConnectionStatus(): { connected: boolean; clientCount: number } {
    return {
      connected: this.clients.size > 0,
      clientCount: this.clients.size,
    };
  }

  private startHeartbeatChecker(): void {
    setInterval(() => {
      const now = Date.now();
      const timeout = 30000; // 30 seconds

      for (const [clientId, client] of this.clients.entries()) {
        if (now - client.connection.lastHeartbeat > timeout) {
          console.log(`[WebSocket] Client ${clientId} timed out`);
          client.ws.close();
          this.clients.delete(clientId);
        }
      }
    }, 10000); // Check every 10 seconds
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  stop(): void {
    if (this.wss) {
      this.wss.close();
      console.log('[WebSocket] Server stopped');
    }
  }
}
