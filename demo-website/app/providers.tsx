'use client';

import { NavigationProvider } from 'desktopuse-sdk';
import { useState, useEffect, useRef } from 'react';
import { getOrCreateMCPConnection, disconnectMCP } from '@/lib/mcpSingleton';

/**
 * Providers - Root provider component that wraps the app with SDK NavigationProvider
 * 
 * This enables:
 * - Real-time MCP server connection for AI control
 * - Component registry for tracking all UI components
 * - Automatic UI state synchronization (100ms interval)
 * - WebSocket reconnection handling
 * 
 * MCP Server: ws://localhost:8080 (local development)
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const hasInitialized = useRef(false);
  const connectionAttemptsRef = useRef(0);

  const MCP_SERVER_URL = process.env.NEXT_PUBLIC_MCP_SERVER_URL || '';

  // Skip MCP connection if URL is not provided
  const shouldConnectMCP = MCP_SERVER_URL && MCP_SERVER_URL.trim() !== '';

  // Use useRef for callbacks to prevent re-creating on every render
  const handleConnect = useRef(() => {
    console.log('✅ [MCP] Connected to server:', MCP_SERVER_URL);
    setIsConnected(true);
    connectionAttemptsRef.current = 0;
    setConnectionAttempts(0);
  }).current;

  const handleDisconnect = useRef(() => {
    console.warn('⚠️ [MCP] Disconnected from server');
    setIsConnected(false);
  }).current;

  const handleError = useRef((error: Error) => {
    console.error('❌ [MCP] Connection error:', error.message);
    connectionAttemptsRef.current++;
    setConnectionAttempts(connectionAttemptsRef.current);
    
    // Show user-friendly error messages
    if (connectionAttemptsRef.current >= 3) {
      console.error('❌ [MCP] Failed to connect after 3 attempts. Please check:');
      console.error('   1. MCP server is running at:', MCP_SERVER_URL);
      console.error('   2. Go to Replit and click "Run" to start the server');
      console.error('   3. WebSocket port (8080) is open');
      console.error('   4. Network connectivity is stable');
      console.error('   ');
      console.error('💡 To run without MCP: Remove NEXT_PUBLIC_MCP_SERVER_URL from .env.local');
      console.error('   (AI chat will still work, but won\'t control the UI)');
    }
  }).current;

  const handleGraphUpdate = useRef((graph: any) => {
    // Log component graph updates for debugging
    console.log('📊 [Component Graph Updated]:', graph.nodes.size, 'components registered');
  }).current;

  // Log initial setup (only once to avoid spam in dev mode)
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    console.log('🚀 [Desktop.use SDK] Initializing...');
    if (shouldConnectMCP) {
      console.log('📡 [MCP Server URL]:', MCP_SERVER_URL);
      console.log('🔄 [Auto Sync Interval]: 100ms');
      console.log('💡 [Components]: All UI elements will be automatically tracked');
    } else {
      console.log('⚠️ [MCP] No server URL configured - running in local-only mode');
      console.log('💡 [Tip]: AI chat will work but won\'t control the UI');
      console.log('💡 [To enable]: Set NEXT_PUBLIC_MCP_SERVER_URL in .env.local');
    }
  }, [MCP_SERVER_URL, shouldConnectMCP]);

  // If no MCP URL, just render children without NavigationProvider
  if (!shouldConnectMCP) {
    console.log('⚠️ [MCP] No server URL configured - running without WebSocket connection');
    console.log('💡 [Tip]: Set NEXT_PUBLIC_MCP_SERVER_URL in .env.local to enable AI control');
    return <>{children}</>;
  }

  return (
    <NavigationProvider
      mcpServerUrl={MCP_SERVER_URL}
      syncInterval={100}
      onConnect={handleConnect}
      onDisconnect={handleDisconnect}
      onError={handleError}
      onGraphUpdate={handleGraphUpdate}
    >
      <>
        {/* Connection Status Indicator */}
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
            isConnected 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
            }`} />
            {isConnected ? 'Connected' : 'Connecting...'}
          </div>
        </div>
        
        {children}
      </>
    </NavigationProvider>
  );
}
