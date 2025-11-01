/**
 * NavigationProvider - React context provider with MCP server connection
 * Wraps your app to enable AI-controlled navigation
 */

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
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
  children: ReactNode;
  mcpServerUrl: string;
  syncInterval?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onGraphUpdate?: (graph: NavigationGraph) => void;
}

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
  const mcpConnectionRef = useRef<MCPConnection | null>(null);

  useEffect(() => {
    console.log('[NavigationProvider] Initializing MCP connection...');

    // Create MCP connection
    const mcpConnection = new MCPConnection({
      url: mcpServerUrl,
      syncInterval,
      onConnect: () => {
        console.log('[NavigationProvider] Connected to MCP server');
        setIsConnected(true);
        setConnectionError(null);
        onConnect?.();
      },
      onDisconnect: () => {
        console.log('[NavigationProvider] Disconnected from MCP server');
        setIsConnected(false);
        onDisconnect?.();
      },
      onError: (error) => {
        console.error('[NavigationProvider] Connection error:', error);
        setConnectionError(error);
        onError?.(error);
      },
    });

    mcpConnectionRef.current = mcpConnection;

    // Connect to MCP server
    mcpConnection.connect();

    // Subscribe to component registry updates
    const unsubscribe = componentRegistry.subscribe((updatedGraph) => {
      setGraph(updatedGraph);
      onGraphUpdate?.(updatedGraph);
    });

    // Cleanup on unmount
    return () => {
      console.log('[NavigationProvider] Cleaning up...');
      unsubscribe();
      mcpConnection.disconnect();
    };
  }, [mcpServerUrl, syncInterval, onConnect, onDisconnect, onError, onGraphUpdate]);

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
