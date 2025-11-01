/**
 * Type definitions for Desktop MCP Server
 */

export type ComponentType = 
  | 'page'
  | 'popover'
  | 'modal'
  | 'dialog'
  | 'button'
  | 'input'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'toggle'
  | 'card'
  | 'tab'
  | 'accordion'
  | 'menu'
  | 'dropdown'
  | 'list'
  | 'form';

export type ComponentState = 
  | 'visible'
  | 'hidden'
  | 'disabled'
  | 'loading'
  | 'error'
  | 'focused';

export type NavigationAction = 
  | 'click'
  | 'type'
  | 'clear'
  | 'focus'
  | 'blur'
  | 'scroll'
  | 'open'
  | 'close'
  | 'select'
  | 'toggle'
  | 'hover'
  | 'submit';

export interface ComponentInfo {
  id: string;
  type: ComponentType;
  label: string;
  parent?: string;
  actions: NavigationAction[];
  currentState: ComponentState;
  description?: string;
  metadata?: Record<string, any>;
}

export interface UIState {
  components: ComponentInfo[];
  hierarchy: Record<string, string[]>;
  currentlyVisible: string[];
  timestamp: number;
}

export interface ToolResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface NavigationStep {
  componentId: string;
  action: NavigationAction;
  value?: any;
  wait?: number;
}

export interface WebSocketMessage {
  type: 'ui_state' | 'action_request' | 'action_result' | 'error' | 'heartbeat';
  data: any;
}

export interface ClientConnection {
  id: string;
  connected: boolean;
  lastHeartbeat: number;
  uiState?: UIState;
}
