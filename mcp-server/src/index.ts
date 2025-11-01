#!/usr/bin/env node

/**
 * Desktop MCP Server
 * Model Context Protocol server for controlling desktop applications
 */

// Load environment variables from .env file
import { config } from 'dotenv';
config();

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { ConnectionManager } from './connection.js';
import { ToolHandlers } from './handlers/tools.js';
import { HTTPServer } from './http-server.js';
import { toolDefinitions } from './tools.js';

const WEBSOCKET_PORT = parseInt(process.env.WEBSOCKET_PORT || '8080', 10);
const HTTP_PORT = parseInt(process.env.HTTP_PORT || '3001', 10);
const SERVER_NAME = 'desktop-ui-control';
const SERVER_VERSION = '1.0.0';

async function main() {
  console.error('[Desktop.use] Starting server...');
  console.error('[Desktop.use] WebSocket Port:', WEBSOCKET_PORT);
  console.error('[Desktop.use] HTTP Port:', HTTP_PORT);

  // Initialize WebSocket server for browser connections
  const connectionManager = new ConnectionManager(WEBSOCKET_PORT);
  await connectionManager.start();

  // Initialize tool handlers
  const toolHandlers = new ToolHandlers(connectionManager);

  // Initialize HTTP server for chat API
  const httpServer = new HTTPServer(connectionManager, toolHandlers);
  await httpServer.start();

  // Create MCP server
  const server = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error('[MCP] Listing tools...');
    return {
      tools: toolDefinitions,
    };
  });

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    console.error(`[MCP] Executing tool: ${name}`, args);

    try {
      let result;

      switch (name) {
        case 'get_ui_state':
          result = await toolHandlers.getUIState();
          break;
        case 'find_component':
          result = await toolHandlers.findComponent(args as any);
          break;
        case 'click_component':
          result = await toolHandlers.clickComponent(args as any);
          break;
        case 'type_text':
          result = await toolHandlers.typeText(args as any);
          break;
        case 'clear_input':
          result = await toolHandlers.clearInput(args as any);
          break;
        case 'open_component':
          result = await toolHandlers.openComponent(args as any);
          break;
        case 'close_component':
          result = await toolHandlers.closeComponent(args as any);
          break;
        case 'scroll_to_component':
          result = await toolHandlers.scrollToComponent(args as any);
          break;
        case 'select_option':
          result = await toolHandlers.selectOption(args as any);
          break;
        case 'execute_custom_action':
          result = await toolHandlers.executeCustomAction(args as any);
          break;
        case 'execute_navigation_path':
          result = await toolHandlers.executeNavigationPath(args as any);
          break;
        case 'get_component_sitemap':
          result = await toolHandlers.getComponentSitemap();
          break;
        default:
          result = {
            success: false,
            message: `Unknown tool: ${name}`,
          };
      }

      console.error(`[MCP] Tool result:`, result);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error(`[MCP] Tool execution error:`, error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: 'Tool execution failed',
              error: error instanceof Error ? error.message : String(error),
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  });

  // Register resource list handler
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    console.error('[MCP] Listing resources...');
    return {
      resources: [
        {
          uri: 'desktop://ui-state',
          name: 'Current UI State',
          description: 'Real-time state of the connected desktop application UI',
          mimeType: 'application/json',
        },
        {
          uri: 'desktop://connection-status',
          name: 'Connection Status',
          description: 'Status of desktop application connections',
          mimeType: 'application/json',
        },
      ],
    };
  });

  // Register resource read handler
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    console.error(`[MCP] Reading resource: ${uri}`);

    if (uri === 'desktop://ui-state') {
      const uiState = connectionManager.getCurrentUIState();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(uiState || { message: 'No UI state available' }, null, 2),
          },
        ],
      };
    }

    if (uri === 'desktop://connection-status') {
      const status = connectionManager.getConnectionStatus();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(status, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown resource: ${uri}`);
  });

  // Start MCP server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[MCP] Server ready!');
  console.error(`[MCP] WebSocket listening on port ${WEBSOCKET_PORT}`);
  console.error('[MCP] Waiting for desktop application connections...');

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.error('[Desktop.use] Shutting down...');
    httpServer.stop();
    connectionManager.stop();
    await server.close();
    process.exit(0);
  });

  console.error('[Desktop.use] Server ready!');
  console.error('[Desktop.use] 🌐 Chat API: http://localhost:' + HTTP_PORT + '/api/chat');
  console.error('[Desktop.use] 🔌 WebSocket: ws://localhost:' + WEBSOCKET_PORT);
  console.error('[Desktop.use] ✅ Ready for browser connections...');
}

main().catch((error) => {
  console.error('[MCP] Fatal error:', error);
  process.exit(1);
});
