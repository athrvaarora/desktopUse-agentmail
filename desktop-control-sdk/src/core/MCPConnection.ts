/**
 * MCPConnection - WebSocket client that connects desktop app to MCP server
 * Handles bidirectional communication for AI-controlled UI navigation
 */

import { componentRegistry } from './ComponentRegistry';
import { navigationEngine } from './NavigationEngine';
import type { NavigationStep, NavigationPath } from '../types';

interface MCPConnectionOptions {
  url: string;
  syncInterval?: number; // UI state sync frequency (default: 100ms)
  heartbeatInterval?: number; // Heartbeat frequency (default: 15000ms)
  reconnectDelay?: number; // Reconnect delay (default: 2000ms)
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export class MCPConnection {
  private ws: WebSocket | null = null;
  private reconnectTimer: any = null;
  private syncTimer: any = null;
  private heartbeatTimer: any = null;
  private isConnecting = false;
  private shouldReconnect = true;

  private options: Required<MCPConnectionOptions>;

  constructor(options: MCPConnectionOptions) {
    this.options = {
      url: options.url,
      syncInterval: options.syncInterval || 100,
      heartbeatInterval: options.heartbeatInterval || 15000,
      reconnectDelay: options.reconnectDelay || 2000,
      onConnect: options.onConnect || (() => {}),
      onDisconnect: options.onDisconnect || (() => {}),
      onError: options.onError || ((error) => console.error('[MCPConnection]', error)),
    };
  }

  /**
   * Connect to MCP server
   */
  connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      console.log('[MCPConnection] Already connected or connecting');
      return;
    }

    this.isConnecting = true;
    this.shouldReconnect = true;

    console.log(`[MCPConnection] Connecting to ${this.options.url}...`);

    try {
      this.ws = new WebSocket(this.options.url);

      this.ws.onopen = () => {
        console.log('[MCPConnection] Connected to MCP server');
        this.isConnecting = false;
        this.startUISync();
        this.startHeartbeat();
        this.options.onConnect();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (event) => {
        console.error('[MCPConnection] WebSocket error:', event);
        this.isConnecting = false;
        this.options.onError(new Error('WebSocket connection error'));
      };

      this.ws.onclose = () => {
        console.log('[MCPConnection] Disconnected from MCP server');
        this.isConnecting = false;
        this.stopTimers();
        this.options.onDisconnect();

        // Attempt reconnection
        if (this.shouldReconnect) {
          console.log(`[MCPConnection] Reconnecting in ${this.options.reconnectDelay}ms...`);
          this.reconnectTimer = setTimeout(() => {
            this.connect();
          }, this.options.reconnectDelay);
        }
      };
    } catch (error) {
      this.isConnecting = false;
      this.options.onError(error as Error);
    }
  }

  /**
   * Disconnect from MCP server
   */
  disconnect(): void {
    console.log('[MCPConnection] Disconnecting...');
    this.shouldReconnect = false;
    this.stopTimers();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Send UI state to MCP server only when it changes
   */
  private startUISync(): void {
    this.stopTimer(this.syncTimer);

    let lastUIStateHash = '';

    // Function to compute simple hash of UI state
    const hashUIState = (state: any): string => {
      return JSON.stringify({
        count: state.components?.length || 0,
        ids: state.components?.map((c: any) => c.id).sort() || [],
        visible: state.currentlyVisible?.sort() || []
      });
    };

    // Subscribe to component registry changes
    const sendUIStateIfChanged = () => {
      if (!this.isConnected()) return;

      try {
        const uiState = componentRegistry.exportForLLM();
        const currentHash = hashUIState(uiState);

        // Only send if UI state actually changed
        if (currentHash !== lastUIStateHash) {
          lastUIStateHash = currentHash;
          
          const message = {
            type: 'ui_state',
            data: {
              ...uiState,
              timestamp: Date.now(),
            },
          };

          this.send(message);
          console.log('[MCPConnection] UI state changed, sent update');
        }
      } catch (error) {
        console.error('[MCPConnection] Error syncing UI state:', error);
        this.options.onError?.(error as Error);
      }
    };

    // Check for changes periodically
    this.syncTimer = setInterval(sendUIStateIfChanged, this.options.syncInterval);

    // Send immediately on connect
    try {
      const uiState = componentRegistry.exportForLLM();
      lastUIStateHash = hashUIState(uiState);
      
      this.send({
        type: 'ui_state',
        data: {
          ...uiState,
          timestamp: Date.now(),
        },
      });
      console.log('[MCPConnection] Sent initial UI state');
    } catch (error) {
      console.error('[MCPConnection] Error sending initial UI state:', error);
      this.options.onError?.(error as Error);
    }
  }

  /**
   * Send heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopTimer(this.heartbeatTimer);

    this.heartbeatTimer = setInterval(() => {
      if (!this.isConnected()) return;

      this.send({
        type: 'heartbeat',
        data: { timestamp: Date.now() },
      });
    }, this.options.heartbeatInterval);
  }

  /**
   * Handle incoming message from MCP server
   */
  private async handleMessage(data: string): Promise<void> {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'action_request':
          await this.handleActionRequest(message.data);
          break;

        case 'heartbeat':
          // Heartbeat received from server
          break;

        default:
          console.warn('[MCPConnection] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[MCPConnection] Error handling message:', error);
      this.options.onError(error as Error);
    }
  }

  /**
   * Handle action request from MCP server
   */
  private async handleActionRequest(data: any): Promise<void> {
    const { action, params } = data;

    console.log(`[MCPConnection] Received action request: ${action}`, params);

    try {
      // Create timeout promise (10s to match MCP server)
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Action execution timeout (10s)')), 10000)
      );

      let result;

      // Execute action with timeout
      const executeAction = async () => {
        // Handle navigation path (multi-step)
        if (action === 'navigation_path') {
          const path: NavigationPath = {
            steps: params.steps,
            description: params.description,
            estimatedDuration: params.steps.reduce((sum: number, step: NavigationStep) => sum + (step.wait || 300), 0),
          };

          return await navigationEngine.executePath(path);
        }
        // Handle custom action
        else if (action === 'custom') {
          const step: NavigationStep = {
            componentId: params.componentId,
            action: params.actionName, // Use custom action name
            value: params.actionValue,
            wait: params.waitAfter || 300,
          };

          const success = await navigationEngine.executeStep(step);
          return { success };
        }
        // Handle standard action
        else {
          const step: NavigationStep = {
            componentId: params.componentId,
            action: action,
            value: params.text || params.value,
            wait: params.waitAfter || 300,
          };

          const success = await navigationEngine.executeStep(step);
          return { success };
        }
      };

      // Race between action execution and timeout
      result = await Promise.race([executeAction(), timeout]);

      // Send result back to MCP server
      this.send({
        type: 'action_result',
        data: result,
      });

      console.log(`[MCPConnection] Action completed:`, result);
    } catch (error) {
      console.error('[MCPConnection] Error executing action:', error);

      // Send error result
      this.send({
        type: 'action_result',
        data: {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  /**
   * Send message to MCP server
   */
  private send(message: any): void {
    if (!this.isConnected()) {
      console.warn('[MCPConnection] Cannot send message, not connected');
      return;
    }

    try {
      this.ws!.send(JSON.stringify(message));
    } catch (error) {
      console.error('[MCPConnection] Error sending message:', error);
      this.options.onError(error as Error);
    }
  }

  /**
   * Check if connected to MCP server
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection status
   */
  getStatus(): { connected: boolean; url: string } {
    return {
      connected: this.isConnected(),
      url: this.options.url,
    };
  }

  /**
   * Stop all timers
   */
  private stopTimers(): void {
    this.stopTimer(this.syncTimer);
    this.stopTimer(this.heartbeatTimer);
    this.stopTimer(this.reconnectTimer);
  }

  /**
   * Stop a single timer
   */
  private stopTimer(timer: any): void {
    if (timer) {
      clearInterval(timer);
      clearTimeout(timer);
    }
  }
}
