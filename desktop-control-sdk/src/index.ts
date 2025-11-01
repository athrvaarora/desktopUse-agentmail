/**
 * @roxy/desktop-control-sdk
 * TypeScript SDK for building AI-controlled desktop applications
 */

// Core exports
export { componentRegistry, ComponentRegistry } from './core/ComponentRegistry';
export { navigationEngine, NavigationEngine } from './core/NavigationEngine';
export { MCPConnection } from './core/MCPConnection';

// React exports
export { NavigationProvider, useNavigationContext } from './react/NavigationProvider';
export type { NavigationProviderProps } from './react/NavigationProvider';
export { useNavigation, withNavigation } from './react/useNavigation';
export type { UseNavigationOptions } from './react/useNavigation';

// Type exports
export type {
  ComponentType,
  ComponentState,
  NavigationAction,
  ComponentMetadata,
  ComponentNode,
  NavigationGraph,
  RegisterComponentOptions,
  NavigationStep,
  NavigationPath,
  NavigationResult,
  ComponentMapForLLM,
} from './types';
