/**
 * HTTP Server for Desktop.use Chat API
 * Provides a simple /api/chat endpoint that users can call from their UI
 * Handles Claude API integration + tool execution via WebSocket to browser
 */

import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import type { Server as HTTPServerType } from 'http';
import type { ConnectionManager } from './connection.js';
import type { ToolHandlers } from './handlers/tools.js';

const HTTP_PORT = parseInt(process.env.HTTP_PORT || '3001', 10);

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  sessionId?: string;
}

export class HTTPServer {
  private app: express.Application;
  private anthropic: Anthropic;
  private server: HTTPServerType | null = null;

  constructor(
    private connectionManager: ConnectionManager,
    private toolHandlers: ToolHandlers
  ) {
    this.app = express();
    
    // Initialize Anthropic client
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn('[HTTP] Warning: ANTHROPIC_API_KEY not set. Chat endpoint will return errors.');
    }
    this.anthropic = new Anthropic({ apiKey: apiKey || 'dummy' });

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // CORS - allow all origins (users can call from their domains)
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    this.app.use(express.json());

    // Request logging
    this.app.use((req, _res, next) => {
      console.log(`[HTTP] ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (_req, res) => {
      const status = this.connectionManager.getConnectionStatus();
      res.json({
        status: 'ok',
        websocket: status,
        timestamp: Date.now()
      });
    });

    // Main chat endpoint
    this.app.post('/api/chat', async (req, res) => {
      try {
        await this.handleChatRequest(req, res);
      } catch (error) {
        console.error('[HTTP] Chat error:', error);
        res.status(500).json({
          message: 'Internal server error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Get UI state (for debugging)
    this.app.get('/api/ui-state', async (_req, res) => {
      try {
        const result = await this.toolHandlers.getUIState();
        res.json(result);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // 404 handler
    this.app.use((_req, res) => {
      res.status(404).json({ error: 'Not found' });
    });
  }

  private async handleChatRequest(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    const { messages, sessionId }: ChatRequest = req.body;

    if (!messages || messages.length === 0) {
      res.status(400).json({ error: 'No messages provided' });
      return;
    }

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      res.json({
        message: '⚠️ Claude API key not configured on server. Please set ANTHROPIC_API_KEY environment variable on Replit.\n\nFor now, I can help you understand the demo, but I cannot control the UI without the API key.'
      });
      return;
    }

    // Check if any browser is connected
    const status = this.connectionManager.getConnectionStatus();
    if (!status.connected) {
      res.json({
        message: '⚠️ No browser connected. Please make sure:\n1. Your app is running with desktopuse-sdk installed\n2. NavigationProvider is wrapping your app\n3. WebSocket connection to this server is established\n\nRefresh your app and try again.'
      });
      return;
    }

    console.log(`[HTTP] Chat request from session: ${sessionId || 'anonymous'}`);
    console.log(`[HTTP] Message history: ${messages.length} messages`);

    try {
      // Convert to Anthropic format
      const anthropicMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // System prompt
      const systemPrompt = this.buildSystemPrompt();

      // Agentic loop - call Claude, execute tools, repeat until done
      let finalResponse = '';
      let currentMessages = [...anthropicMessages];
      let maxIterations = 25; // Prevent infinite loops - increased for complex multi-step tasks
      const executionSteps: Array<{step: number, tool: string, input: any, result: any}> = [];
      let stepCounter = 0;

      while (maxIterations > 0) {
        maxIterations--;

        console.log('[HTTP] Calling Claude API...');
        const response = await this.anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          system: systemPrompt,
          messages: currentMessages,
          tools: this.getToolDefinitions()
        });

        // Extract text and tool uses from response
        let hasToolUse = false;
        const toolResults: any[] = [];

        for (const content of response.content) {
          if (content.type === 'text') {
            finalResponse += content.text;
          } else if (content.type === 'tool_use') {
            hasToolUse = true;
            const toolName = content.name;
            const toolInput = content.input;
            stepCounter++;

            console.log(`[HTTP] Executing tool: ${toolName}`, toolInput);

            // Execute tool via ToolHandlers (which use WebSocket to browser)
            const result = await this.executeTool(toolName, toolInput);

            console.log(`[HTTP] Tool result:`, result);

            // Track execution step
            executionSteps.push({
              step: stepCounter,
              tool: toolName,
              input: toolInput,
              result: result
            });

            // Store result to feed back to Claude
            toolResults.push({
              type: 'tool_result',
              tool_use_id: content.id,
              content: JSON.stringify(result, null, 2)
            });
          }
        }

        // If no tools were used, we're done
        if (!hasToolUse) {
          break;
        }

        // Feed tool results back to Claude
        currentMessages.push({
          role: 'assistant',
          content: response.content as any
        });

        currentMessages.push({
          role: 'user',
          content: toolResults as any
        });

        console.log('[HTTP] Feeding tool results back to Claude...');
      }

      if (maxIterations === 0) {
        console.warn('[HTTP] Max iterations reached in agentic loop');
        finalResponse += '\n\n⚠️ Task too complex, stopped after 25 tool executions.';
      }

      if (!finalResponse) {
        finalResponse = 'I understand. How can I help you?';
      }

      // Append execution steps summary if tools were used
      if (executionSteps.length > 0) {
        finalResponse += '\n\n**Steps executed:**';
        for (const step of executionSteps) {
          const success = step.result.success ? '✓' : '✗';
          const toolName = step.tool.replace(/_/g, ' ');
          
          // Format input concisely
          let inputStr = '';
          if (step.tool === 'get_ui_state' || step.tool === 'get_component_sitemap') {
            inputStr = '';
          } else if (step.tool === 'click_component' || step.tool === 'find_component') {
            inputStr = step.input.componentId || step.input.query || '';
          } else if (step.tool === 'type_text') {
            inputStr = `"${step.input.text}" → ${step.input.componentId}`;
          } else if (step.tool === 'execute_custom_action') {
            inputStr = `${step.input.actionName}(${step.input.actionValue || ''}) → ${step.input.componentId}`;
          } else {
            inputStr = JSON.stringify(step.input);
          }

          finalResponse += `\n${step.step}. ${success} ${toolName}${inputStr ? ': ' + inputStr : ''}`;
        }
      }

      res.json({ message: finalResponse });

    } catch (error: any) {
      console.error('[HTTP] Error in chat:', error);

      if (error?.status === 401) {
        res.json({
          message: '⚠️ Invalid Claude API key. Please check ANTHROPIC_API_KEY on Replit.'
        });
      } else {
        res.json({
          message: '❌ Sorry, I encountered an error. Please try again.',
          error: error.message
        });
      }
    }
  }

  private async executeTool(toolName: string, input: any): Promise<any> {
    switch (toolName) {
      case 'get_ui_state':
        return await this.toolHandlers.getUIState();

      case 'find_component':
        return await this.toolHandlers.findComponent(input);

      case 'click_component':
        return await this.toolHandlers.clickComponent(input);

      case 'type_text':
        return await this.toolHandlers.typeText(input);

      case 'clear_input':
        return await this.toolHandlers.clearInput(input);

      case 'open_component':
        return await this.toolHandlers.openComponent(input);

      case 'close_component':
        return await this.toolHandlers.closeComponent(input);

      case 'scroll_to_component':
        return await this.toolHandlers.scrollToComponent(input);

      case 'select_option':
        return await this.toolHandlers.selectOption(input);

      case 'execute_custom_action':
        return await this.toolHandlers.executeCustomAction(input);

      case 'execute_navigation_path':
        return await this.toolHandlers.executeNavigationPath(input);

      case 'get_component_sitemap':
        return await this.toolHandlers.getComponentSitemap();

      default:
        return {
          success: false,
          message: `Unknown tool: ${toolName}`
        };
    }
  }

  private getToolDefinitions(): Anthropic.Tool[] {
    return [
      {
        name: 'get_ui_state',
        description: 'Get the current state of the UI including all visible components, their hierarchy, and available actions.',
        input_schema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'find_component',
        description: 'Find a component by name, type, or description.',
        input_schema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Natural language description or name of the component to find'
            },
            type: {
              type: 'string',
              enum: ['button', 'input', 'modal', 'page', 'card', 'popover', 'dropdown', 'list', 'form', 'slider', 'toggle', 'select', 'textarea', 'dialog'],
              description: 'Optional: Filter by component type'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'click_component',
        description: 'Click on a button, card, or other clickable component.',
        input_schema: {
          type: 'object',
          properties: {
            componentId: {
              type: 'string',
              description: 'The ID of the component to click'
            }
          },
          required: ['componentId']
        }
      },
      {
        name: 'type_text',
        description: 'Type text into an input field or textarea.',
        input_schema: {
          type: 'object',
          properties: {
            componentId: {
              type: 'string',
              description: 'The ID of the input/textarea component'
            },
            text: {
              type: 'string',
              description: 'The text to type'
            }
          },
          required: ['componentId', 'text']
        }
      },
      {
        name: 'execute_custom_action',
        description: 'Execute a custom action on a component (e.g., setValue, increase, decrease for sliders).',
        input_schema: {
          type: 'object',
          properties: {
            componentId: {
              type: 'string',
              description: 'The ID of the component'
            },
            actionName: {
              type: 'string',
              description: 'The name of the custom action'
            },
            actionValue: {
              type: 'string',
              description: 'Optional value for the action'
            }
          },
          required: ['componentId', 'actionName']
        }
      },
      {
        name: 'get_component_sitemap',
        description: 'Get a complete sitemap of the UI structure.',
        input_schema: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    ];
  }

  private buildSystemPrompt(): string {
    return `You are an AI assistant that controls web applications via the Desktop.use SDK.

**RESPONSE FORMAT**: Be concise and professional. Show only the final result unless explicitly asked for details.
- For successful actions: Brief confirmation (1-2 sentences)
- For failed actions: Explain what went wrong and what you tried
- When asked for "steps": Show numbered list of tool calls with results

**Available Actions**:
1. get_ui_state - Discover available components
2. find_component - Search for specific components
3. click_component - Click buttons/interactive elements
4. type_text - Type into inputs/textareas
5. execute_custom_action - Component-specific actions (setValue, navigate, etc.)

**Workflow Rules**:
1. ALWAYS call get_ui_state or find_component FIRST to discover components
2. THEN execute actions using the discovered component IDs
3. For navigation buttons (nav-item-*): If click fails, use execute_custom_action with actionName: "navigate"
4. For sliders: Use execute_custom_action with actionName: "setValue"

**Important**: Try alternative approaches when actions fail. Don't give up after one attempt.

Example: "navigate to input page"
- Call get_ui_state → find nav-item-input
- Try click_component → if fails, use execute_custom_action(nav-item-input, "navigate")
- Confirm: "✓ Navigated to input page"`;
  }

  start(): Promise<HTTPServerType> {
    return new Promise((resolve) => {
      this.server = this.app.listen(HTTP_PORT, () => {
        console.log(`[HTTP] Server listening on port ${HTTP_PORT}`);
        console.log(`[HTTP] Chat endpoint: http://localhost:${HTTP_PORT}/api/chat`);
        console.log(`[HTTP] Health check: http://localhost:${HTTP_PORT}/health`);
        
        // Increase timeout for complex multi-step operations (default is 2 minutes)
        if (this.server) {
          this.server.timeout = 180000; // 3 minutes for complex photo editing workflows
          this.server.keepAliveTimeout = 185000; // Slightly higher than timeout
          console.log('[HTTP] Server timeout set to 3 minutes for multi-step operations');
        }
        
        resolve(this.server!);
      });
    });
  }

  getServer(): HTTPServerType | null {
    return this.server;
  }

  stop(): void {
    if (this.server) {
      this.server.close();
      console.log('[HTTP] Server stopped');
    }
  }
}
