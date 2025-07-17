/**
 * Enhanced Widget Registry - Migrated to Unified System
 * 核心功能：widget 註冊、獲取、分類管理
 * 
 * 重新導向到統一註冊系統以保持向後兼容性
 */

import React, { Suspense, ComponentType } from 'react';
import type { 
  WidgetDefinition, 
  IWidgetRegistry,
  WidgetCategory,
  WidgetRegistryItem,
} from './types';
import type { WidgetComponentProps } from '@/app/types/dashboard';
import { unifiedWidgetRegistry } from './unified-registry';

// Define WidgetComponent type
type WidgetComponent = React.ComponentType<WidgetComponentProps>;

// Default loading component
const DefaultLoadingComponent = () => 
  React.createElement('div', { className: 'p-4 text-center text-muted-foreground' }, 'Loading widget...');

/**
 * Enhanced Widget Registry - 重新導向到統一系統
 * 保持向後兼容性，但實際使用 UnifiedWidgetRegistry
 */
class SimplifiedWidgetRegistry implements IWidgetRegistry {
  private static instance: SimplifiedWidgetRegistry;
  
  private constructor() {
    // 使用統一註冊系統
  }
  
  static getInstance(): SimplifiedWidgetRegistry {
    if (!SimplifiedWidgetRegistry.instance) {
      SimplifiedWidgetRegistry.instance = new SimplifiedWidgetRegistry();
    }
    return SimplifiedWidgetRegistry.instance;
  }
  
  // Core registration functions - 代理到統一註冊系統
  register(widget: WidgetDefinition): void {
    return unifiedWidgetRegistry.register(widget);
  }
  
  unregister(widgetId: string): void {
    return unifiedWidgetRegistry.unregister(widgetId);
  }
  
  getDefinition(widgetId: string): WidgetDefinition | undefined {
    return unifiedWidgetRegistry.getDefinition(widgetId);
  }
  
  getAllDefinitions(): Map<string, WidgetDefinition> {
    return unifiedWidgetRegistry.getAllDefinitions();
  }
  
  // Component retrieval - 代理到統一註冊系統
  getComponent(widgetId: string): ComponentType<WidgetComponentProps> | undefined {
    return unifiedWidgetRegistry.getComponent(widgetId);
  }
  
  getWidgetComponent(widgetId: string, enableGraphQL: boolean = false): WidgetComponent {
    return unifiedWidgetRegistry.getWidgetComponent(widgetId, enableGraphQL);
  }
  
  // Category management - 代理到統一註冊系統
  getByCategory(category: WidgetCategory): WidgetDefinition[] {
    return unifiedWidgetRegistry.getByCategory(category);
  }
  
  
  // Utility functions - 代理到統一註冊系統
  isRegistered(widgetId: string): boolean {
    return unifiedWidgetRegistry.isRegistered(widgetId);
  }
  
  getCategories(): WidgetCategory[] {
    return unifiedWidgetRegistry.getCategories();
  }
  
  // Preload widgets - 代理到統一註冊系統
  async preloadWidgets(widgetIds: string[]): Promise<void> {
    return unifiedWidgetRegistry.preloadWidgets(widgetIds);
  }
  
  // Get load statistics - 代理到統一註冊系統
  getLoadStatistics(): Map<string, WidgetRegistryItem> {
    return unifiedWidgetRegistry.getLoadStatistics();
  }

  // 自動註冊方法 - 代理到統一註冊系統
  async autoRegisterWidgets(): Promise<void> {
    return unifiedWidgetRegistry.autoRegisterWidgets();
  }
}

// Smart preloader for route-based widget preloading - 代理到統一註冊系統
export const smartPreloader = {
  preloadForRoute: async (route: string) => {
    return unifiedWidgetRegistry.preloadForRoute(route);
  }
};

// Export singleton instance - 保持向後兼容性
export const widgetRegistry = SimplifiedWidgetRegistry.getInstance();
export default widgetRegistry;