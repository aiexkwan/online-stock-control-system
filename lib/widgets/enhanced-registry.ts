/**
 * Simplified Widget Registry
 * 核心功能：widget 註冊、獲取、分類管理
 */

import React, { Suspense, ComponentType } from 'react';
import type { 
  WidgetDefinition, 
  IWidgetRegistry,
  WidgetCategory,
  WidgetRegistryItem,
} from './types';
import type { WidgetComponentProps } from '@/app/types/dashboard';
import { createDynamicWidget } from './widget-loader';

// Define WidgetComponent type
type WidgetComponent = React.ComponentType<WidgetComponentProps>;
import { widgetMapping, getWidgetCategory } from './widget-mappings';

// All adapter imports are now dynamic to avoid circular dependencies

// Default loading component
const DefaultLoadingComponent = () => 
  React.createElement('div', { className: 'p-4 text-center text-muted-foreground' }, 'Loading widget...');


/**
 * Simplified Widget Registry
 */
class SimplifiedWidgetRegistry implements IWidgetRegistry {
  private static instance: SimplifiedWidgetRegistry;
  
  private widgets = new Map<string, WidgetDefinition>();
  private loadedComponents = new Map<string, ComponentType<WidgetComponentProps>>();
  private adaptersInitialized = false;
  
  private constructor() {
    // Don't call autoRegisterWidgets in constructor to avoid circular dependency
    // Will be called lazily when needed
  }
  
  static getInstance(): SimplifiedWidgetRegistry {
    if (!SimplifiedWidgetRegistry.instance) {
      SimplifiedWidgetRegistry.instance = new SimplifiedWidgetRegistry();
    }
    return SimplifiedWidgetRegistry.instance;
  }
  
  // Lazy initialization of adapters
  private ensureAdaptersInitialized(): void {
    if (this.adaptersInitialized) return;
    
    try {
      // Call autoRegisterWidgets synchronously since ensureAdaptersInitialized is not async
      // The Promise will be handled internally
      this.autoRegisterWidgets().catch(error => {
        console.error('Failed to auto-register widgets:', error);
      });
      this.adaptersInitialized = true;
    } catch (error) {
      console.error('Failed to initialize widget adapters:', error);
    }
  }
  
  // Core registration functions
  register(widget: WidgetDefinition): void {
    this.widgets.set(widget.id, widget);
  }
  
  unregister(widgetId: string): void {
    this.widgets.delete(widgetId);
    this.loadedComponents.delete(widgetId);
  }
  
  getDefinition(widgetId: string): WidgetDefinition | undefined {
    this.ensureAdaptersInitialized();
    return this.widgets.get(widgetId);
  }
  
  getAllDefinitions(): Map<string, WidgetDefinition> {
    this.ensureAdaptersInitialized();
    return new Map(this.widgets);
  }
  
  // Component retrieval
  getComponent(widgetId: string): ComponentType<WidgetComponentProps> | undefined {
    this.ensureAdaptersInitialized();
    
    try {
      // Check if already loaded
      if (this.loadedComponents.has(widgetId)) {
        return this.loadedComponents.get(widgetId)!;
      }
      
      // Use static import instead of dynamic require
      const component = createDynamicWidget(widgetId);
      if (component) {
        this.loadedComponents.set(widgetId, component);
        return component;
      }
      
      return undefined;
    } catch (error) {
      console.error(`Failed to load widget ${widgetId}:`, error);
      return undefined;
    }
  }
  
  getWidgetComponent(widgetId: string, enableGraphQL: boolean = false): WidgetComponent {
    // 直接返回組件，避免雙重包裝
    const component = this.getComponent(widgetId);
    
    if (!component) {
      // 如果找不到組件，返回錯誤組件但不包裝懶加載
      const ErrorComponent = (props: WidgetComponentProps) => 
        React.createElement('div', { 
          className: 'text-red-500 p-4 border border-red-300 rounded bg-red-50' 
        }, [
          React.createElement('h4', { key: 'title', className: 'font-semibold' }, 'Widget Loading Error'),
          React.createElement('p', { key: 'message', className: 'text-sm mt-1' }, `Widget not found: ${widgetId}`),
          React.createElement('p', { key: 'hint', className: 'text-xs text-gray-600 mt-2' }, 'Check console for details')
        ]);
      ErrorComponent.displayName = `ErrorWidget_${widgetId}`;
      return ErrorComponent;
    }
    
    return component;
  }
  
  // Category management
  getByCategory(category: WidgetCategory): WidgetDefinition[] {
    this.ensureAdaptersInitialized();
    return Array.from(this.getAllDefinitions().values()).filter(widget => widget.category === category);
  }
  
  
  // Auto-registration from widget mappings
  async autoRegisterWidgets(): Promise<void> {
    // Register all widgets from mappings (basic registration for widgets not in adapters)
    Object.entries(widgetMapping.categoryMap || {}).forEach(([id, category]) => {
      // Only register if not already registered by adapters
      if (!this.widgets.has(id)) {
        this.register({
          id,
          name: id,
          category: category || 'stats',
          description: `${id} widget`,
          lazyLoad: true,
          component: undefined // 延遲創建組件
        });
      }
    });
    
    // Register from adapters
    await this.registerFromAdapters();
  }
  
  private async registerFromAdapters(): Promise<void> {
    // Stats widgets
    try {
      const statsAdapter = await import('./stats-widget-adapter');
      if (statsAdapter.registerStatsWidgets) {
        await statsAdapter.registerStatsWidgets(this);
      }
    } catch (err) {
      console.error('Failed to load stats adapter:', err);
    }

    // Charts widgets
    try {
      const chartsAdapter = await import('./charts-widget-adapter');
      if (chartsAdapter.registerChartsWidgets) {
        await chartsAdapter.registerChartsWidgets(this);
      }
    } catch (err) {
      console.error('Failed to load charts adapter:', err);
    }

    // Lists widgets
    try {
      const listsAdapter = await import('./lists-widget-adapter');
      if (listsAdapter.registerListsWidgets) {
        await listsAdapter.registerListsWidgets(this);
      }
    } catch (err) {
      console.error('Failed to load lists adapter:', err);
    }

    // Reports widgets
    try {
      const reportsAdapter = await import('./reports-widget-adapter');
      if (reportsAdapter.registerReportsWidgets) {
        await reportsAdapter.registerReportsWidgets(this);
      }
    } catch (err) {
      console.error('Failed to load reports adapter:', err);
    }

    // Operations widgets
    try {
      const operationsAdapter = await import('./operations-widget-adapter');
      if (operationsAdapter.registerOperationsWidgets) {
        await operationsAdapter.registerOperationsWidgets(this);
      }
    } catch (err) {
      console.error('Failed to load operations adapter:', err);
    }

    // Analysis widgets
    try {
      const analysisAdapter = await import('./analysis-widget-adapter');
      if (analysisAdapter.registerAnalysisWidgets) {
        await analysisAdapter.registerAnalysisWidgets(this);
      }
    } catch (err) {
      console.error('Failed to load analysis adapter:', err);
    }

    // Special widgets
    try {
      const specialAdapter = await import('./special-widget-adapter');
      if (specialAdapter.registerSpecialWidgets) {
        await specialAdapter.registerSpecialWidgets(this);
      }
    } catch (err) {
      console.error('Failed to load special adapter:', err);
    }
  }
  
  
  // Utility functions
  isRegistered(widgetId: string): boolean {
    this.ensureAdaptersInitialized();
    return this.widgets.has(widgetId);
  }
  
  getCategories(): WidgetCategory[] {
    return ['stats', 'charts', 'lists', 'reports', 'operations', 'analysis', 'special'] as WidgetCategory[];
  }
  
  // Add preloadWidgets method that was missing
  async preloadWidgets(widgetIds: string[]): Promise<void> {
    this.ensureAdaptersInitialized();
    
    // Preload specified widgets
    await Promise.all(
      widgetIds.map(widgetId => this.getComponent(widgetId))
    ).catch(error => {
      console.error('Failed to preload widgets:', error);
    });
  }
  
  // Get load statistics
  getLoadStatistics(): Map<string, WidgetRegistryItem> {
    this.ensureAdaptersInitialized();
    const stats = new Map<string, WidgetRegistryItem>();
    
    this.widgets.forEach((widget, id) => {
      stats.set(id, {
        ...widget,
        loadStatus: this.loadedComponents.has(id) ? 'loaded' : 'pending',
        useCount: 0,
        lastUsed: Date.now()
      });
    });
    
    return stats;
  }
}

// Smart preloader for route-based widget preloading
export const smartPreloader = {
  preloadForRoute: async (route: string) => {
    // Simple implementation - preload widgets based on route
    const registry = SimplifiedWidgetRegistry.getInstance();
    const widgetsMap = registry.getAllDefinitions();
    const widgets = Array.from(widgetsMap.values());
    
    // Preload first 5 widgets for the route (can be optimized later)
    const widgetsToPreload = widgets.slice(0, 5);
    await Promise.all(
      widgetsToPreload.map(widget => registry.getComponent(widget.id))
    );
  }
};

// Export singleton instance
export const widgetRegistry = SimplifiedWidgetRegistry.getInstance();
export default widgetRegistry;