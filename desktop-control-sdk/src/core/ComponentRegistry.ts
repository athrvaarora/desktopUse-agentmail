/**
 * ComponentRegistry - Central registry for all navigable components
 * Maintains the component graph and provides query capabilities
 */

import type {
  ComponentNode,
  NavigationGraph,
  RegisterComponentOptions,
  ComponentMapForLLM,
  ComponentState,
} from '../types';

export class ComponentRegistry {
  private graph: NavigationGraph;
  private observers: Set<(graph: NavigationGraph) => void> = new Set();

  constructor() {
    this.graph = {
      nodes: new Map(),
      edges: new Map(),
      currentPath: [],
      visibleComponents: new Set(),
    };
  }

  /**
   * Register a new component in the navigation graph
   */
  register(options: RegisterComponentOptions): void {
    const {
      id,
      type,
      label,
      parent,
      availableActions = [],
      metadata = {},
      element,
      stateSetters,
    } = options;

    // Create node
    const node: ComponentNode = {
      id,
      type,
      label,
      state: 'visible',
      parent,
      children: [],
      availableActions,
      metadata,
      element,
      stateSetters,
    };

    // Add to graph
    this.graph.nodes.set(id, node);

    // Update parent-child relationships
    if (parent) {
      const parentNode = this.graph.nodes.get(parent);
      if (parentNode && !parentNode.children.includes(id)) {
        parentNode.children.push(id);
      }

      // Update edges
      const children = this.graph.edges.get(parent) || [];
      if (!children.includes(id)) {
        children.push(id);
        this.graph.edges.set(parent, children);
      }
    }

    // Mark as visible by default
    this.graph.visibleComponents.add(id);

    console.log(`[ComponentRegistry] Registered: ${id} (${type})`);
    this.notifyObservers();
  }

  /**
   * Unregister a component
   */
  unregister(id: string): void {
    const node = this.graph.nodes.get(id);
    if (!node) return;

    // Remove from parent's children
    if (node.parent) {
      const parentNode = this.graph.nodes.get(node.parent);
      if (parentNode) {
        parentNode.children = parentNode.children.filter((child) => child !== id);
      }

      // Update edges
      const children = this.graph.edges.get(node.parent) || [];
      this.graph.edges.set(
        node.parent,
        children.filter((child) => child !== id)
      );
    }

    // Remove node
    this.graph.nodes.delete(id);
    this.graph.visibleComponents.delete(id);

    console.log(`[ComponentRegistry] Unregistered: ${id}`);
    this.notifyObservers();
  }

  /**
   * Update component state
   */
  updateState(id: string, state: Partial<ComponentNode>): void {
    const node = this.graph.nodes.get(id);
    if (!node) {
      console.warn(`[ComponentRegistry] Component not found: ${id}`);
      return;
    }

    Object.assign(node, state);

    // Update visibility
    if (state.state === 'hidden') {
      this.graph.visibleComponents.delete(id);
    } else if (state.state === 'visible') {
      this.graph.visibleComponents.add(id);
    }

    this.notifyObservers();
  }

  /**
   * Get component by ID
   */
  getComponent(id: string): ComponentNode | undefined {
    return this.graph.nodes.get(id);
  }

  /**
   * Find components by criteria
   */
  findComponents(criteria: {
    type?: ComponentNode['type'];
    label?: string;
    parent?: string;
    state?: ComponentState;
  }): ComponentNode[] {
    const results: ComponentNode[] = [];

    for (const node of this.graph.nodes.values()) {
      let matches = true;

      if (criteria.type && node.type !== criteria.type) matches = false;
      if (criteria.label && !node.label.toLowerCase().includes(criteria.label.toLowerCase()))
        matches = false;
      if (criteria.parent && node.parent !== criteria.parent) matches = false;
      if (criteria.state && node.state !== criteria.state) matches = false;

      if (matches) results.push(node);
    }

    return results;
  }

  /**
   * Get all children of a component
   */
  getChildren(parentId: string): ComponentNode[] {
    const children = this.graph.edges.get(parentId) || [];
    return children.map((id) => this.graph.nodes.get(id)!).filter(Boolean);
  }

  /**
   * Get navigation path from root to component
   */
  getPathTo(componentId: string): string[] {
    const path: string[] = [];
    let current = this.graph.nodes.get(componentId);

    while (current) {
      path.unshift(current.id);
      current = current.parent ? this.graph.nodes.get(current.parent) : undefined;
    }

    return path;
  }

  /**
   * Get visible components
   */
  getVisibleComponents(): ComponentNode[] {
    return Array.from(this.graph.visibleComponents)
      .map((id) => this.graph.nodes.get(id)!)
      .filter(Boolean);
  }

  /**
   * Export graph for MCP server consumption
   */
  exportForLLM(): ComponentMapForLLM {
    const components = Array.from(this.graph.nodes.values()).map((node) => ({
      id: node.id,
      type: node.type,
      label: node.label,
      parent: node.parent,
      actions: node.availableActions,
      currentState: node.state,
      description: node.metadata.description,
      metadata: node.metadata, // Include full metadata for MCP server
    }));

    const hierarchy: Record<string, string[]> = {};
    for (const [parent, children] of this.graph.edges.entries()) {
      hierarchy[parent] = children;
    }

    return {
      components,
      hierarchy,
      currentlyVisible: Array.from(this.graph.visibleComponents),
    };
  }

  /**
   * Subscribe to graph changes
   */
  subscribe(callback: (graph: NavigationGraph) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  /**
   * Get current graph state
   */
  getGraph(): NavigationGraph {
    return this.graph;
  }

  /**
   * Clear all components (for testing/reset)
   */
  clear(): void {
    this.graph = {
      nodes: new Map(),
      edges: new Map(),
      currentPath: [],
      visibleComponents: new Set(),
    };
    this.notifyObservers();
  }

  private notifyObservers(): void {
    for (const observer of this.observers) {
      observer(this.graph);
    }
  }
}

// Singleton instance
export const componentRegistry = new ComponentRegistry();
