/**
 * Simplified Widget Registry
 * 核心功能：widget 註冊、獲取、分類管理
 */

import React, { Suspense, ComponentType } from 'react';
import type { 
  WidgetDefinition, 
  IWidgetRegistry,
  WidgetCategory,
} from './types';
import type { WidgetComponentProps } from '@/app/types/dashboard';

// Define WidgetComponent type
type WidgetComponent = React.ComponentType<WidgetComponentProps>;
import { widgetMapping, getWidgetCategory } from './widget-mappings';

// Default loading component
const DefaultLoadingComponent = () => 
  React.createElement('div', { className: 'p-4 text-center text-muted-foreground' }, 'Loading widget...');

// Simple widget state manager
class WidgetStateManager {
  private storageKey = 'widget-states';
  private states = new Map<string, WidgetState>();
  
  constructor() {
    this.loadStates();
  }
  
  private loadStates() {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.entries(parsed).forEach(([id, state]) => {
          this.states.set(id, state as WidgetState);
        });
      }
    } catch (error) {
      console.error('Failed to load widget states:', error);
    }
  }
  
  private saveStates() {
    if (typeof window === 'undefined') return;
    
    try {
      const toStore = Object.fromEntries(this.states.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(toStore));
    } catch (error) {
      console.error('Failed to save widget states:', error);
    }
  }
  
  getState(widgetId: string): WidgetState | undefined {
    return this.states.get(widgetId);
  }
  
  setState(widgetId: string, state: Partial<WidgetState>) {
    const current = this.states.get(widgetId) || {};
    const updated = { ...current, ...state, id: widgetId };
    this.states.set(widgetId, updated);
    this.saveStates();
  }
  
  removeState(widgetId: string) {
    this.states.delete(widgetId);
    this.saveStates();
  }
}

/**
 * Simplified Widget Registry
 */
class SimplifiedWidgetRegistry implements IWidgetRegistry {
  private static instance: SimplifiedWidgetRegistry;
  
  private widgets = new Map<string, WidgetDefinition>();
  private stateManager = new WidgetStateManager();
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
      this.autoRegisterWidgets();
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
  
  getAllDefinitions(): WidgetDefinition[] {
    this.ensureAdaptersInitialized();
    return Array.from(this.widgets.values());
  }
  
  // Component retrieval
  getComponent(widgetId: string): ComponentType<WidgetComponentProps> | null {
    this.ensureAdaptersInitialized();
    
    try {
      // Check if already loaded
      if (this.loadedComponents.has(widgetId)) {
        return this.loadedComponents.get(widgetId)!;
      }
      
      // 延遲載入 createDynamicWidget 避免循環依賴
      const { createDynamicWidget } = require('./widget-loader');
      const component = createDynamicWidget(widgetId);
      if (component) {
        this.loadedComponents.set(widgetId, component);
        return component;
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to load widget ${widgetId}:`, error);
      return null;
    }
  }
  
  getWidgetComponent(widgetId: string): WidgetComponent {
    // getComponent 已經返回懶加載組件，不需要再次包裝
    const component = this.getComponent(widgetId);
    
    if (!component) {
      // 如果找不到組件，返回錯誤組件
      const ErrorComponent = (props: WidgetComponentProps) => 
        React.createElement('div', { className: 'text-red-500 p-4' }, 
          `Widget not found: ${widgetId}`
        );
      ErrorComponent.displayName = `ErrorWidget_${widgetId}`;
      return ErrorComponent;
    }
    
    return component;
  }
  
  // Category management
  getByCategory(category: WidgetCategory): WidgetDefinition[] {
    this.ensureAdaptersInitialized();
    return this.getAllDefinitions().filter(widget => widget.category === category);
  }
  
  getWidgetsByCategory(): Record<WidgetCategory, WidgetDefinition[]> {
    this.ensureAdaptersInitialized();
    const grouped: Record<WidgetCategory, WidgetDefinition[]> = {} as any;
    
    const categories = ['stats', 'charts', 'lists', 'reports', 'operations', 'analysis', 'special'] as WidgetCategory[];
    for (const category of categories) {
      grouped[category] = this.getByCategory(category);
    }
    
    return grouped;
  }
  
  // Auto-registration from widget mappings
  private autoRegisterWidgets(): void {
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
    this.registerFromAdapters();
  }
  
  private registerFromAdapters(): void {
    // Dynamically import and register from adapters to avoid circular dependency
    try {
      // Import adapters dynamically
      import('./stats-widget-adapter').then(({ statsWidgetConfigs, registerStatsWidgets }) => {
        registerStatsWidgets();
        if (statsWidgetConfigs) {
          Object.entries(statsWidgetConfigs).forEach(([id, config]) => {
            this.register({
              id,
              name: config.title || id,
              category: config.category || 'stats',
              ...config
            });
          });
        }
      }).catch(err => console.error('Failed to load stats adapter:', err));
      
      import('./charts-widget-adapter').then(({ chartsWidgetConfigs, registerChartsWidgets }) => {
        registerChartsWidgets();
        if (chartsWidgetConfigs) {
          Object.entries(chartsWidgetConfigs).forEach(([id, config]) => {
            this.register({
              id,
              name: config.title || id,
              category: config.category || 'charts',
              ...config
            });
          });
        }
      }).catch(err => console.error('Failed to load charts adapter:', err));
      
      import('./lists-widget-adapter').then(({ listsWidgetConfigs, registerListsWidgets }) => {
        registerListsWidgets();
        if (listsWidgetConfigs) {
          Object.entries(listsWidgetConfigs).forEach(([id, config]) => {
            this.register({
              id,
              name: config.title || id,
              category: config.category || 'lists',
              ...config
            });
          });
        }
      }).catch(err => console.error('Failed to load lists adapter:', err));
      
      import('./reports-widget-adapter').then(({ reportsWidgetConfigs, registerReportsWidgets }) => {
        registerReportsWidgets();
        if (reportsWidgetConfigs) {
          Object.entries(reportsWidgetConfigs).forEach(([id, config]) => {
            this.register({
              id,
              name: config.title || id,
              category: config.category || 'reports',
              ...config
            });
          });
        }
      }).catch(err => console.error('Failed to load reports adapter:', err));
      
      import('./operations-widget-adapter').then(({ operationsWidgetConfigs, registerOperationsWidgets }) => {
        registerOperationsWidgets();
        if (operationsWidgetConfigs) {
          Object.entries(operationsWidgetConfigs).forEach(([id, config]) => {
            this.register({
              id,
              name: config.title || id,
              category: config.category || 'operations',
              ...config
            });
          });
        }
      }).catch(err => console.error('Failed to load operations adapter:', err));
      
      import('./analysis-widget-adapter').then(({ analysisWidgetConfigs, registerAnalysisWidgets }) => {
        registerAnalysisWidgets();
        if (analysisWidgetConfigs) {
          Object.entries(analysisWidgetConfigs).forEach(([id, config]) => {
            this.register({
              id,
              name: config.title || id,
              category: config.category || 'analysis',
              ...config
            });
          });
        }
      }).catch(err => console.error('Failed to load analysis adapter:', err));
      
      import('./special-widget-adapter').then(({ specialWidgetConfigs, registerSpecialWidgets }) => {
        registerSpecialWidgets();
        if (specialWidgetConfigs) {
          Object.entries(specialWidgetConfigs).forEach(([id, config]) => {
            this.register({
              id,
              name: config.title || id,
              category: config.category || 'special',
              ...config
            });
          });
        }
      }).catch(err => console.error('Failed to load special adapter:', err));
    } catch (error) {
      console.error('Error in registerFromAdapters:', error);
    }
  }
  
  // Widget state management
  getWidgetState(widgetId: string): WidgetState | undefined {
    return this.stateManager.getState(widgetId);
  }
  
  setWidgetState(widgetId: string, state: Partial<WidgetState>): void {
    this.stateManager.setState(widgetId, state);
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
  preloadWidgets(route: string): void {
    this.ensureAdaptersInitialized();
    
    // Simple implementation - preload widgets based on route
    const widgets = this.getAllDefinitions();
    
    // Preload first 5 widgets for the route (can be optimized later)
    const widgetsToPreload = widgets.slice(0, 5);
    Promise.all(
      widgetsToPreload.map(widget => this.getComponent(widget.id))
    ).catch(error => {
      console.error('Failed to preload widgets:', error);
    });
  }
}

// Smart preloader for route-based widget preloading
export const smartPreloader = {
  preloadForRoute: async (route: string) => {
    // Simple implementation - preload widgets based on route
    const registry = SimplifiedWidgetRegistry.getInstance();
    const widgets = registry.getAllDefinitions();
    
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