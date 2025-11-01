/**
 * Tool Handlers - Implements the actual logic for each MCP tool
 */

import type { ComponentInfo, UIState, ToolResult, NavigationStep } from '../types/index.js';
import type { ConnectionManager } from '../connection.js';

export class ToolHandlers {
  constructor(private connectionManager: ConnectionManager) {}

  async getUIState(): Promise<ToolResult> {
    try {
      const uiState = this.connectionManager.getCurrentUIState();
      
      if (!uiState) {
        return {
          success: false,
          message: 'No UI state available. Make sure a desktop application is connected.',
        };
      }

      return {
        success: true,
        message: `Found ${uiState.components.length} components, ${uiState.currentlyVisible.length} visible`,
        data: uiState,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get UI state',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async findComponent(params: { query: string; type?: string }): Promise<ToolResult> {
    try {
      const uiState = this.connectionManager.getCurrentUIState();
      
      if (!uiState) {
        return {
          success: false,
          message: 'No UI state available. Make sure a desktop application is connected.',
        };
      }

      const { query, type } = params;
      const queryLower = query.toLowerCase();

      let matches = uiState.components.filter((c: ComponentInfo) => {
        // Check type if specified
        if (type && c.type !== type) return false;

        // Check if query matches various fields
        return (
          c.id.toLowerCase().includes(queryLower) ||
          c.label.toLowerCase().includes(queryLower) ||
          (c.description && c.description.toLowerCase().includes(queryLower)) ||
          (c.metadata && JSON.stringify(c.metadata).toLowerCase().includes(queryLower))
        );
      });

      if (matches.length === 0) {
        return {
          success: false,
          message: `No components found matching "${query}"${type ? ` of type "${type}"` : ''}`,
        };
      }

      return {
        success: true,
        message: `Found ${matches.length} matching component(s)`,
        data: matches.map((c: ComponentInfo) => ({
          id: c.id,
          type: c.type,
          label: c.label,
          state: c.currentState,
          availableActions: c.actions,
          description: c.description,
        })),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to find component',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async clickComponent(params: { componentId: string; waitAfter?: number }): Promise<ToolResult> {
    try {
      const result = await this.connectionManager.sendAction('click', {
        componentId: params.componentId,
        waitAfter: params.waitAfter || 300,
      });

      return {
        success: result.success,
        message: result.success 
          ? `Successfully clicked ${params.componentId}` 
          : `Failed to click ${params.componentId}`,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to click component ${params.componentId}`,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async typeText(params: { componentId: string; text: string }): Promise<ToolResult> {
    try {
      const result = await this.connectionManager.sendAction('type', {
        componentId: params.componentId,
        text: params.text,
      });

      return {
        success: result.success,
        message: result.success 
          ? `Successfully typed "${params.text}" into ${params.componentId}` 
          : `Failed to type into ${params.componentId}`,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to type text into ${params.componentId}`,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async clearInput(params: { componentId: string }): Promise<ToolResult> {
    try {
      const result = await this.connectionManager.sendAction('clear', {
        componentId: params.componentId,
      });

      return {
        success: result.success,
        message: result.success 
          ? `Successfully cleared ${params.componentId}` 
          : `Failed to clear ${params.componentId}`,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to clear input ${params.componentId}`,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async openComponent(params: { componentId: string }): Promise<ToolResult> {
    try {
      const result = await this.connectionManager.sendAction('open', {
        componentId: params.componentId,
      });

      return {
        success: result.success,
        message: result.success 
          ? `Successfully opened ${params.componentId}` 
          : `Failed to open ${params.componentId}`,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to open component ${params.componentId}`,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async closeComponent(params: { componentId: string }): Promise<ToolResult> {
    try {
      const result = await this.connectionManager.sendAction('close', {
        componentId: params.componentId,
      });

      return {
        success: result.success,
        message: result.success 
          ? `Successfully closed ${params.componentId}` 
          : `Failed to close ${params.componentId}`,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to close component ${params.componentId}`,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async scrollToComponent(params: { componentId: string }): Promise<ToolResult> {
    try {
      const result = await this.connectionManager.sendAction('scroll', {
        componentId: params.componentId,
      });

      return {
        success: result.success,
        message: result.success 
          ? `Successfully scrolled to ${params.componentId}` 
          : `Failed to scroll to ${params.componentId}`,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to scroll to component ${params.componentId}`,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async selectOption(params: { componentId: string; value: string }): Promise<ToolResult> {
    try {
      const result = await this.connectionManager.sendAction('select', {
        componentId: params.componentId,
        value: params.value,
      });

      return {
        success: result.success,
        message: result.success 
          ? `Successfully selected "${params.value}" in ${params.componentId}` 
          : `Failed to select option in ${params.componentId}`,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to select option in ${params.componentId}`,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async executeCustomAction(params: { 
    componentId: string; 
    actionName: string; 
    actionValue?: string 
  }): Promise<ToolResult> {
    try {
      const result = await this.connectionManager.sendAction('custom', {
        componentId: params.componentId,
        actionName: params.actionName,
        actionValue: params.actionValue,
      });

      return {
        success: result.success,
        message: result.success
          ? `Successfully executed custom action "${params.actionName}" on ${params.componentId}`
          : `Failed to execute custom action "${params.actionName}" on ${params.componentId}`,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to execute custom action on ${params.componentId}`,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async executeNavigationPath(params: { 
    steps: NavigationStep[]; 
    description: string 
  }): Promise<ToolResult> {
    try {
      const result = await this.connectionManager.sendAction('navigation_path', {
        steps: params.steps,
        description: params.description,
      });

      return {
        success: result.success,
        message: result.success
          ? `Successfully executed navigation: ${params.description}`
          : `Failed during navigation: ${result.error || 'Unknown error'}`,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to execute navigation path',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getComponentSitemap(): Promise<ToolResult> {
    try {
      const uiState = this.connectionManager.getCurrentUIState();
      
      if (!uiState) {
        return {
          success: false,
          message: 'No UI state available. Make sure a desktop application is connected.',
        };
      }

      // Build sitemap from UI state
      const pages = uiState.components.filter((c: ComponentInfo) => c.type === 'page');
      const sitemap = {
        pages: pages.map((page: ComponentInfo) => ({
          id: page.id,
          label: page.label,
          children: this.buildHierarchy(page.id, uiState),
        })),
        totalComponents: uiState.components.length,
        componentsByType: this.getComponentTypeDistribution(uiState),
        hierarchy: uiState.hierarchy,
      };

      return {
        success: true,
        message: `Generated sitemap with ${pages.length} pages and ${uiState.components.length} total components`,
        data: sitemap,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to generate component sitemap',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private buildHierarchy(parentId: string, uiState: UIState): any[] {
    const childIds = uiState.hierarchy[parentId] || [];
    return childIds.map((childId: string) => {
      const child = uiState.components.find((c: ComponentInfo) => c.id === childId);
      if (!child) return null;

      return {
        id: child.id,
        type: child.type,
        label: child.label,
        actions: child.actions,
        children: this.buildHierarchy(child.id, uiState),
      };
    }).filter(Boolean);
  }

  private getComponentTypeDistribution(uiState: UIState): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    uiState.components.forEach((c: ComponentInfo) => {
      distribution[c.type] = (distribution[c.type] || 0) + 1;
    });

    return distribution;
  }
}
