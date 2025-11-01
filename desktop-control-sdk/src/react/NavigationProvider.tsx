/**
 * NavigationProvider - React context provider with MCP server connection
 * Wraps your app to enable AI-controlled navigation
 */

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { componentRegistry } from '../core/ComponentRegistry';
import { MCPConnection } from '../core/MCPConnection';
import type { NavigationGraph } from '../types';

interface NavigationContextValue {
  graph: NavigationGraph;
  isConnected: boolean;
  connectionError: Error | null;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export interface NavigationProviderProps {
  children: React.ReactNode;
  mcpServerUrl: string;
  syncInterval?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onGraphUpdate?: (graph: NavigationGraph) => void;
}

// Singleton connection instance to prevent multiple connections in React Strict Mode
let globalMCPConnection: MCPConnection | null = null;
let connectionRefCount = 0;

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ 
  children,
  mcpServerUrl,
  syncInterval = 100,
  onConnect,
  onDisconnect,
  onError,
  onGraphUpdate,
}) => {
  const [graph, setGraph] = useState<NavigationGraph>(componentRegistry.getGraph());
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const hasInitialized = useRef(false);
  const callbacksRef = useRef({ onConnect, onDisconnect, onError, onGraphUpdate });

  // Update callbacks ref without triggering re-render
  useEffect(() => {
    callbacksRef.current = { onConnect, onDisconnect, onError, onGraphUpdate };
  }, [onConnect, onDisconnect, onError, onGraphUpdate]);

  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

    console.log('[NavigationProvider] Initializing MCP connection...');
    connectionRefCount++;

    // Create or reuse singleton connection
    if (!globalMCPConnection) {
      console.log('[NavigationProvider] Creating new MCP connection (singleton)');
      globalMCPConnection = new MCPConnection({
        url: mcpServerUrl,
        syncInterval,
        onConnect: () => {
          console.log('[NavigationProvider] Connected to MCP server');
          setIsConnected(true);
          setConnectionError(null);
          callbacksRef.current.onConnect?.();
        },
        onDisconnect: () => {
          console.log('[NavigationProvider] Disconnected from MCP server');
          setIsConnected(false);
          callbacksRef.current.onDisconnect?.();
        },
        onError: (error) => {
          console.error('[NavigationProvider] Connection error:', error);
          setConnectionError(error);
          callbacksRef.current.onError?.(error);
        },
      });

      // Connect to MCP server
      globalMCPConnection.connect();
    } else {
      console.log('[NavigationProvider] Reusing existing MCP connection (singleton)');
      // Update state with existing connection status
      setIsConnected(globalMCPConnection.isConnected());
    }

    // Subscribe to component registry updates
    const unsubscribe = componentRegistry.subscribe((updatedGraph) => {
      setGraph(updatedGraph);
      callbacksRef.current.onGraphUpdate?.(updatedGraph);
    });

    // Cleanup on unmount
    return () => {
      console.log('[NavigationProvider] Cleaning up...');
      unsubscribe();
      connectionRefCount--;

      // Only disconnect if this is the last provider instance
      if (connectionRefCount === 0 && globalMCPConnection) {
        console.log('[NavigationProvider] Last instance unmounting - disconnecting...');
        globalMCPConnection.disconnect();
        globalMCPConnection = null;
      }
    };
  }, [mcpServerUrl, syncInterval]);

  return (
    <NavigationContext.Provider value={{ graph, isConnected, connectionError }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationContext = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationContext must be used within NavigationProvider');
  }
  return context;
};
