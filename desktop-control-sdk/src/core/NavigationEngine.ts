/**
 * NavigationEngine - Executes navigation actions on components
 * Handles clicking, typing, scrolling, etc.
 */

import type {
  NavigationAction,
  NavigationStep,
  NavigationPath,
  NavigationResult,
  ComponentNode,
} from '../types';
import { componentRegistry } from './ComponentRegistry';

export class NavigationEngine {
  private isExecuting = false;
  private executionHistory: NavigationStep[] = [];

  /**
   * Execute a single navigation step
   */
  async executeStep(step: NavigationStep): Promise<boolean> {
    const { componentId, action, value, wait = 300 } = step;

    console.log(`[NavigationEngine] Executing: ${action} on ${componentId}`, value);

    const component = componentRegistry.getComponent(componentId);
    if (!component) {
      console.error(`[NavigationEngine] Component not found: ${componentId}`);
      return false;
    }

    try {
      // Execute the action
      const success = await this.performAction(component, action, value);

      if (success) {
        // Wait for UI to update
        await this.sleep(wait);

        // Update component state if needed
        if (step.expectedResult) {
          await this.verifyExpectedResult(step.expectedResult);
        }

        this.executionHistory.push(step);
      }

      return success;
    } catch (error) {
      console.error(`[NavigationEngine] Error executing step:`, error);
      return false;
    }
  }

  /**
   * Execute a navigation path (multiple steps)
   */
  async executePath(path: NavigationPath): Promise<NavigationResult> {
    if (this.isExecuting) {
      throw new Error('Navigation already in progress');
    }

    this.isExecuting = true;
    const startTime = Date.now();
    const executedSteps: NavigationStep[] = [];

    console.log(`[NavigationEngine] Starting navigation:`, path.description);

    try {
      for (const step of path.steps) {
        const success = await this.executeStep(step);

        if (!success) {
          return {
            success: false,
            executedSteps,
            error: `Failed to execute step: ${step.action} on ${step.componentId}`,
            duration: Date.now() - startTime,
          };
        }

        executedSteps.push(step);
      }

      return {
        success: true,
        executedSteps,
        finalState: componentRegistry.getGraph(),
        duration: Date.now() - startTime,
      };
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Perform an action on a component
   */
  private async performAction(
    component: ComponentNode,
    action: NavigationAction,
    value?: any
  ): Promise<boolean> {
    switch (action) {
      case 'click':
        return this.performClick(component);

      case 'type':
        return this.performType(component, value);

      case 'clear':
        return this.performClear(component);

      case 'focus':
        return this.performFocus(component);

      case 'blur':
        return this.performBlur(component);

      case 'scroll':
        return this.performScroll(component, value);

      case 'open':
        return this.performOpen(component);

      case 'close':
        return this.performClose(component);

      case 'select':
        return this.performSelect(component, value);

      case 'toggle':
        return this.performToggle(component);

      case 'hover':
        return this.performHover(component);

      case 'submit':
        return this.performSubmit(component);

      default:
        // Try custom actions before failing
        if (component.stateSetters && typeof component.stateSetters[action] === 'function') {
          console.log(`[NavigationEngine] Executing custom action: ${action} on ${component.id}`);
          try {
            const result = component.stateSetters[action](value);
            if (result instanceof Promise) {
              await result;
            }
            return true;
          } catch (error) {
            console.error(`[NavigationEngine] Custom action ${action} failed:`, error);
            return false;
          }
        }
        
        console.warn(`[NavigationEngine] Unknown action: ${action}`);
        return false;
    }
  }

  /**
   * Click on a component
   */
  private performClick(component: ComponentNode): boolean {
    const { element, stateSetters } = component;

    // For buttons, prefer DOM click to ensure proper event handling
    if (element && component.type !== 'popover' && component.type !== 'modal') {
      element.click();
      console.log(`[NavigationEngine] Clicked DOM element: ${component.id}`);
      return true;
    }

    // For popover/modal, use state setter
    if ((component.type === 'popover' || component.type === 'modal') && stateSetters?.open) {
      console.log(`[NavigationEngine] Using state setter for ${component.type}: ${component.id}`);
      stateSetters.open(true);
      return true;
    }

    // Fallback to state setter
    if (!element && stateSetters?.open) {
      stateSetters.open(true);
      console.log(`[NavigationEngine] Triggered open via state setter: ${component.id}`);
      return true;
    }

    console.warn(`[NavigationEngine] No click handler found for ${component.id}`);
    return false;
  }

  /**
   * Type text into an input/textarea
   */
  private performType(component: ComponentNode, text: string): boolean {
    const { element, stateSetters } = component;

    // If component has a state setter for value
    if (stateSetters?.value) {
      stateSetters.value(text);
      console.log(`[NavigationEngine] Set value via state setter: "${text}"`);
      return true;
    }

    // Otherwise, set value on DOM element
    if (element && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
      element.value = text;
      
      // Trigger React onChange event
      const event = new Event('input', { bubbles: true });
      element.dispatchEvent(event);
      
      console.log(`[NavigationEngine] Typed into DOM element: "${text}"`);
      return true;
    }

    console.warn(`[NavigationEngine] Cannot type into ${component.id}`);
    return false;
  }

  /**
   * Clear an input
   */
  private performClear(component: ComponentNode): boolean {
    return this.performType(component, '');
  }

  /**
   * Focus on a component
   */
  private performFocus(component: ComponentNode): boolean {
    const { element, stateSetters } = component;

    if (stateSetters?.focus) {
      stateSetters.focus();
      return true;
    }

    if (element && element instanceof HTMLElement) {
      element.focus();
      componentRegistry.updateState(component.id, { state: 'focused' });
      return true;
    }

    return false;
  }

  /**
   * Blur (unfocus) a component
   */
  private performBlur(component: ComponentNode): boolean {
    const { element } = component;

    if (element && element instanceof HTMLElement) {
      element.blur();
      componentRegistry.updateState(component.id, { state: 'visible' });
      return true;
    }

    return false;
  }

  /**
   * Scroll to a component
   */
  private performScroll(component: ComponentNode, options?: ScrollIntoViewOptions): boolean {
    const { element } = component;

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        ...options,
      });
      return true;
    }

    return false;
  }

  /**
   * Open a popover/modal/dialog
   */
  private performOpen(component: ComponentNode): boolean {
    return this.performClick(component);
  }

  /**
   * Close a popover/modal/dialog
   */
  private performClose(component: ComponentNode): boolean {
    const { stateSetters } = component;

    if (stateSetters?.open) {
      stateSetters.open(false);
      return true;
    }

    // Look for close button
    const closeButton = componentRegistry.findComponents({
      parent: component.id,
      label: 'close',
    })[0];

    if (closeButton) {
      return this.performClick(closeButton);
    }

    return false;
  }

  /**
   * Select an option from a dropdown/select
   */
  private performSelect(component: ComponentNode, value: any): boolean {
    const { element, stateSetters } = component;

    if (stateSetters?.value) {
      stateSetters.value(value);
      return true;
    }

    if (element && element instanceof HTMLSelectElement) {
      element.value = value;
      const event = new Event('change', { bubbles: true });
      element.dispatchEvent(event);
      return true;
    }

    return false;
  }

  /**
   * Toggle a checkbox/switch
   */
  private performToggle(component: ComponentNode): boolean {
    const { element, stateSetters, metadata } = component;

    if (stateSetters?.value) {
      const currentValue = metadata.value || false;
      stateSetters.value(!currentValue);
      return true;
    }

    if (element && element instanceof HTMLInputElement && element.type === 'checkbox') {
      element.checked = !element.checked;
      const event = new Event('change', { bubbles: true });
      element.dispatchEvent(event);
      return true;
    }

    return false;
  }

  /**
   * Hover over a component
   */
  private performHover(component: ComponentNode): boolean {
    const { element } = component;

    if (element) {
      const event = new MouseEvent('mouseenter', { bubbles: true });
      element.dispatchEvent(event);
      return true;
    }

    return false;
  }

  /**
   * Submit a form
   */
  private performSubmit(component: ComponentNode): boolean {
    const { element } = component;

    if (element && element instanceof HTMLFormElement) {
      element.submit();
      return true;
    }

    // Look for submit button
    const submitButton = componentRegistry.findComponents({
      parent: component.id,
      type: 'button',
    }).find((btn) => btn.metadata.type === 'submit');

    if (submitButton) {
      return this.performClick(submitButton);
    }

    return false;
  }

  /**
   * Verify expected result after action
   */
  private async verifyExpectedResult(expected: NavigationStep['expectedResult']): Promise<void> {
    if (!expected) return;
    // React components manage their own state
  }

  /**
   * Get execution history
   */
  getHistory(): NavigationStep[] {
    return [...this.executionHistory];
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.executionHistory = [];
  }

  /**
   * Utility: Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const navigationEngine = new NavigationEngine();
