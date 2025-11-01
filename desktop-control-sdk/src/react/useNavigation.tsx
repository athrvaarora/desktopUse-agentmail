/**
 * useNavigation - React hook for registering components for LLM navigation
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { componentRegistry } from '../core/ComponentRegistry';
import type { RegisterComponentOptions, ComponentMetadata } from '../types';

export interface UseNavigationOptions extends Omit<RegisterComponentOptions, 'element'> {
  // State setters that LLM can call
  onOpen?: (value: boolean) => void;
  onValueChange?: (value: any) => void;
  onFocus?: () => void;
  
  // Custom action handlers
  customActions?: Record<string, (value?: any) => void>;
}

export const useNavigation = (options: UseNavigationOptions) => {
  const registeredRef = useRef(false);

  const {
    id,
    type,
    label,
    parent,
    availableActions,
    metadata = {},
    onOpen,
    onValueChange,
    onFocus,
    customActions,
  } = options;

  // Register component on mount
  useEffect(() => {
    if (registeredRef.current) return;

    const stateSetters: RegisterComponentOptions['stateSetters'] = {};
    
    if (onOpen) stateSetters.open = onOpen;
    if (onValueChange) stateSetters.value = onValueChange;
    if (onFocus) stateSetters.focus = onFocus;
    
    // Add custom actions
    if (customActions) {
      Object.assign(stateSetters, customActions);
    }

    componentRegistry.register({
      id,
      type,
      label,
      parent,
      availableActions,
      metadata,
      element: undefined, // Will be set via callback ref when DOM element mounts
      stateSetters,
    });

    registeredRef.current = true;

    console.log(`[useNavigation] Registered component: ${id}`);

    // Unregister on unmount
    return () => {
      componentRegistry.unregister(id);
      registeredRef.current = false;
    };
  }, [id, type, label, parent, JSON.stringify(availableActions), JSON.stringify(metadata)]);

  // Update state setters and custom actions when they change (avoid stale closures)
  useEffect(() => {
    if (!registeredRef.current) return;
    
    const component = componentRegistry.getComponent(id);
    if (!component) return;

    const updatedStateSetters: RegisterComponentOptions['stateSetters'] = {};
    
    if (onOpen) updatedStateSetters.open = onOpen;
    if (onValueChange) updatedStateSetters.value = onValueChange;
    if (onFocus) updatedStateSetters.focus = onFocus;
    
    // Add custom actions (these might have updated closures with fresh state)
    if (customActions) {
      Object.assign(updatedStateSetters, customActions);
    }

    // Update the component's stateSetters with fresh references
    component.stateSetters = updatedStateSetters;
  }, [id, onOpen, onValueChange, onFocus, customActions]);

  // Callback ref to update element when DOM node is attached
  // React refs (.current) don't trigger useEffect, so we need a callback ref
  const callbackRef = useCallback((node: HTMLElement | null) => {
    // Update the component registry with the DOM element
    if (node && registeredRef.current) {
      const component = componentRegistry.getComponent(id);
      if (component) {
        component.element = node;
        console.log(`[useNavigation] Updated DOM element for: ${id}`);
      }
    }
  }, [id]);

  // Update metadata when it changes
  const updateMetadata = useCallback((updates: Partial<ComponentMetadata>) => {
    const component = componentRegistry.getComponent(id);
    if (component) {
      componentRegistry.updateState(id, {
        metadata: { ...component.metadata, ...updates },
      });
    }
  }, [id]);

  // Mark as visible/hidden
  const setVisible = useCallback((visible: boolean) => {
    componentRegistry.updateState(id, { 
      state: visible ? 'visible' : 'hidden' 
    });
  }, [id]);

  // Mark as loading
  const setLoading = useCallback((loading: boolean) => {
    componentRegistry.updateState(id, { 
      state: loading ? 'loading' : 'visible' 
    });
  }, [id]);

  // Return object with ref and data attributes for spreading on DOM elements
  // Utility functions are returned separately to avoid React warnings
  const domProps = {
    ref: callbackRef,
    'data-nav-id': id,
    'data-nav-type': type,
    'data-nav-label': label,
  };

  // Add utility functions as non-enumerable properties to avoid spreading
  Object.defineProperties(domProps, {
    updateMetadata: { value: updateMetadata, enumerable: false },
    setVisible: { value: setVisible, enumerable: false },
    setLoading: { value: setLoading, enumerable: false },
  });

  return domProps as typeof domProps & {
    updateMetadata: typeof updateMetadata;
    setVisible: typeof setVisible;
    setLoading: typeof setLoading;
  };
};

/**
 * Higher-order component to wrap any component with navigation
 */
export function withNavigation<P extends object>(
  Component: React.ComponentType<P>,
  options: UseNavigationOptions
) {
  const WrappedComponent = React.forwardRef<unknown, P>((props, _ref) => {
    const { ref: navRef, ...navProps } = useNavigation(options);

    return (
      <div ref={navRef as React.Ref<HTMLDivElement>} {...navProps}>
        <Component {...props as P & JSX.IntrinsicAttributes} />
      </div>
    );
  });
  
  WrappedComponent.displayName = `withNavigation(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
}
