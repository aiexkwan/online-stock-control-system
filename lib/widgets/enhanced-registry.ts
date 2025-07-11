/**
 * Simplified Widget Registry
 * 核心功能：widget 註冊、獲取、分類管理
 */

import React, { Suspense, ComponentType } from 'react';
import type { 
  WidgetDefinition, 
  WidgetRegistry as IWidgetRegistry, 
  WidgetCategory,
  WidgetComponent,
  WidgetState,
} from './types';
import type { WidgetComponentProps } from '@/app/types/dashboard';
import { widgetMappings, widgetCategories } from './widget-mappings';
import { loadWidget } from './widget-loader';
import { statsWidgetAdapter } from './stats-widget-adapter';
import { chartsWidgetAdapter } from './charts-widget-adapter';
import { listsWidgetAdapter } from './lists-widget-adapter';
import { reportsWidgetAdapter } from './reports-widget-adapter';
import { operationsWidgetAdapter } from './operations-widget-adapter';
import { analysisWidgetAdapter } from './analysis-widget-adapter';
import { specialWidgetAdapter } from './special-widget-adapter';

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
  
  private constructor() {
    this.autoRegisterWidgets();
  }
  
  static getInstance(): SimplifiedWidgetRegistry {
    if (!SimplifiedWidgetRegistry.instance) {
      SimplifiedWidgetRegistry.instance = new SimplifiedWidgetRegistry();
    }
    return SimplifiedWidgetRegistry.instance;
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
    return this.widgets.get(widgetId);
  }
  
  getAllDefinitions(): WidgetDefinition[] {
    return Array.from(this.widgets.values());
  }
  
  // Component retrieval
  async getComponent(widgetId: string): Promise<ComponentType<WidgetComponentProps> | null> {
    try {
      // Check if already loaded
      if (this.loadedComponents.has(widgetId)) {
        return this.loadedComponents.get(widgetId)!;
      }
      
      // Load widget dynamically
      const module = await loadWidget(widgetId);
      if (module?.default) {
        this.loadedComponents.set(widgetId, module.default);
        return module.default;
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to load widget ${widgetId}:`, error);
      return null;
    }
  }
  
  getWidgetComponent(widgetId: string): WidgetComponent {
    const LazyComponent = React.lazy(async () => {
      const component = await this.getComponent(widgetId);
      return { default: component || DefaultLoadingComponent };
    });
    
    return (props: WidgetComponentProps) => 
      React.createElement(Suspense, { fallback: React.createElement(DefaultLoadingComponent) },
        React.createElement(LazyComponent, props)
      );
  }
  
  // Category management
  getByCategory(category: WidgetCategory): WidgetDefinition[] {
    return this.getAllDefinitions().filter(widget => widget.category === category);
  }
  
  getWidgetsByCategory(): Record<WidgetCategory, WidgetDefinition[]> {
    const grouped: Record<WidgetCategory, WidgetDefinition[]> = {} as any;
    
    for (const category of widgetCategories) {
      grouped[category] = this.getByCategory(category);
    }
    
    return grouped;
  }
  
  // Auto-registration from widget mappings
  private autoRegisterWidgets(): void {
    // Register all widgets from mappings
    Object.entries(widgetMappings).forEach(([id, config]) => {
      this.register({
        id,
        title: config.title || id,
        category: config.category || 'stats',
        description: config.description,
        config: config.defaultConfig || {},
        ...config
      });
    });
    
    // Register from adapters
    this.registerFromAdapters();
  }
  
  private registerFromAdapters(): void {
    // Each adapter can register its widgets
    const adapters = [
      statsWidgetAdapter,
      chartsWidgetAdapter,
      listsWidgetAdapter,
      reportsWidgetAdapter,
      operationsWidgetAdapter,
      analysisWidgetAdapter,
      specialWidgetAdapter,
    ];
    
    adapters.forEach(adapter => {
      if (adapter.registerWidgets) {
        adapter.registerWidgets(this);
      }
    });
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
    return this.widgets.has(widgetId);
  }
  
  getCategories(): WidgetCategory[] {
    return widgetCategories;
  }
}

// Export singleton instance
export const widgetRegistry = SimplifiedWidgetRegistry.getInstance();
export default widgetRegistry;