/**
 * MCP Tool Definitions
 * Defines all tools available to AI agents for desktop UI control
 */

export const toolDefinitions = [
  {
    name: 'get_ui_state',
    description: `Get the current state of the desktop UI including all visible components, their hierarchy, and available actions. 
    Use this to understand what's currently on screen and what you can interact with.`,
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'find_component',
    description: `Find a component by name, type, or description. Returns matching components with their IDs and available actions.
    Use this when you need to locate a specific UI element.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Natural language description or name of the component to find',
        },
        type: {
          type: 'string',
          enum: ['button', 'input', 'modal', 'page', 'card', 'popover', 'dropdown', 'list', 'form'],
          description: 'Optional: Filter by component type',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'click_component',
    description: `Click on a button, card, or other clickable component. Use this to trigger actions like opening modals, navigating, or submitting forms.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        componentId: {
          type: 'string',
          description: 'The ID of the component to click (use find_component to get the ID)',
        },
        waitAfter: {
          type: 'number',
          description: 'Milliseconds to wait after clicking (default: 300)',
        },
      },
      required: ['componentId'],
    },
  },
  {
    name: 'type_text',
    description: `Type text into an input field or textarea. Use this to fill out forms or search boxes.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        componentId: {
          type: 'string',
          description: 'The ID of the input/textarea component',
        },
        text: {
          type: 'string',
          description: 'The text to type',
        },
      },
      required: ['componentId', 'text'],
    },
  },
  {
    name: 'clear_input',
    description: `Clear the text in an input field or textarea.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        componentId: {
          type: 'string',
          description: 'The ID of the input/textarea component to clear',
        },
      },
      required: ['componentId'],
    },
  },
  {
    name: 'open_component',
    description: `Open a modal, popover, dropdown, or other overlay component.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        componentId: {
          type: 'string',
          description: 'The ID of the component to open',
        },
      },
      required: ['componentId'],
    },
  },
  {
    name: 'close_component',
    description: `Close a modal, popover, dropdown, or other overlay component.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        componentId: {
          type: 'string',
          description: 'The ID of the component to close',
        },
      },
      required: ['componentId'],
    },
  },
  {
    name: 'scroll_to_component',
    description: `Scroll to make a component visible on the screen.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        componentId: {
          type: 'string',
          description: 'The ID of the component to scroll to',
        },
      },
      required: ['componentId'],
    },
  },
  {
    name: 'select_option',
    description: `Select an option from a dropdown or select component.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        componentId: {
          type: 'string',
          description: 'The ID of the select/dropdown component',
        },
        value: {
          type: 'string',
          description: 'The value to select',
        },
      },
      required: ['componentId', 'value'],
    },
  },
  {
    name: 'execute_custom_action',
    description: `Execute a custom action on a component. Custom actions are special component-specific actions that go beyond standard clicks/types (e.g., "openForIntegration" to directly open a modal for a specific integration). Use this for specialized component behaviors.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        componentId: {
          type: 'string',
          description: 'The ID of the component to execute the custom action on',
        },
        actionName: {
          type: 'string',
          description: 'The name of the custom action to execute (e.g., "openForIntegration")',
        },
        actionValue: {
          type: 'string',
          description: 'Optional value/parameter to pass to the custom action (e.g., integration ID)',
        },
      },
      required: ['componentId', 'actionName'],
    },
  },
  {
    name: 'execute_navigation_path',
    description: `Execute a sequence of navigation steps. Use this to perform complex multi-step interactions.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              componentId: { type: 'string' },
              action: {
                type: 'string',
                enum: ['click', 'type', 'clear', 'focus', 'open', 'close', 'scroll', 'select'],
              },
              value: { type: 'string' },
              wait: { type: 'number' },
            },
            required: ['componentId', 'action'],
          },
          description: 'Array of navigation steps to execute in sequence',
        },
        description: {
          type: 'string',
          description: 'Human-readable description of what this path does',
        },
      },
      required: ['steps', 'description'],
    },
  },
  {
    name: 'get_component_sitemap',
    description: `Generate a complete sitemap of the application's UI structure showing all pages, components, and their relationships. 
    Use this to understand the full navigation structure of the application.`,
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
];
