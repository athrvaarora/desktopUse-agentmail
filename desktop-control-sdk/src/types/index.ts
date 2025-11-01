/**
 * Core types for Desktop Control SDK
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

export interface ComponentMetadata {
  // Visual info
  label?: string;
  placeholder?: string;
  description?: string;
  
  // Interaction info
  value?: any;
  options?: Array<{ label: string; value: any }>;
  required?: boolean;
  disabled?: boolean;
  
  // Navigation info
  opensComponent?: string;
  closesComponent?: string;
  navigatesTo?: string;
  
  // Custom data
  [key: string]: any;
}

export interface ComponentNode {
  id: string;
  type: ComponentType;
  label: string;
  state: ComponentState;
  parent?: string;
  children: string[];
  availableActions: NavigationAction[];
  metadata: ComponentMetadata;
  
  // DOM reference (internal)
  element?: HTMLElement;
  
  // React state handlers (internal)
  stateSetters?: {
    open?: (value: boolean) => void;
    value?: (value: any) => void;
    focus?: () => void;
    [key: string]: any;
  };
}

export interface NavigationGraph {
  nodes: Map<string, ComponentNode>;
  edges: Map<string, string[]>; // parent -> children
  currentPath: string[];
  visibleComponents: Set<string>;
}

export interface NavigationStep {
  componentId: string;
  action: NavigationAction;
  value?: any;
  wait?: number;
  expectedResult?: {
    opensComponent?: string;
    closesComponent?: string;
    valueEquals?: any;
  };
}

export interface NavigationPath {
  steps: NavigationStep[];
  description: string;
  estimatedDuration: number;
}

export interface NavigationResult {
  success: boolean;
  executedSteps: NavigationStep[];
  error?: string;
  finalState?: NavigationGraph;
  duration: number;
}

// For MCP integration
export interface ComponentMapForLLM {
  components: Array<{
    id: string;
    type: ComponentType;
    label: string;
    parent?: string;
    actions: NavigationAction[];
    currentState: ComponentState;
    description?: string;
    metadata?: ComponentMetadata;
  }>;
  hierarchy: Record<string, string[]>;
  currentlyVisible: string[];
}

// Registration options
export interface RegisterComponentOptions {
  id: string;
  type: ComponentType;
  label: string;
  parent?: string;
  availableActions?: NavigationAction[];
  metadata?: ComponentMetadata;
  element?: HTMLElement;
  stateSetters?: ComponentNode['stateSetters'];
}
