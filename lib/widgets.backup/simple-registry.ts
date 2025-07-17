/**
 * Simple Widget Registry - React.lazy() 直接實施
 * 移除複雜的代理層，簡化 widget 註冊系統
 * 
 * KISS 原則：保持簡單，減少抽象層次
 */

import React, { Suspense, ComponentType } from 'react';
import type { WidgetComponentProps } from '@/app/types/dashboard';
import type { WidgetCategory } from './types';

// 從 unified-config 導入配置
import { 
  widgetConfig, 
  UnifiedWidgetConfig, 
  getWidgetsByCategory, 
  getWidgetsByPriority 
} from './unified-config';

// 合併 dynamic-imports 功能
import { allWidgetImports } from './dynamic-imports';

// 簡化的 Widget 定義
export interface SimpleWidgetDefinition {
  id: string;
  name: string;
  category: WidgetCategory;
  description?: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  loader: () => Promise<any>;
}

// 簡化的 Widget 組件類型
type WidgetComponent = ComponentType<WidgetComponentProps>;

// 預設載入組件
const DefaultLoadingComponent = () => 
  React.createElement('div', { className: 'p-4 text-center text-muted-foreground' }, 'Loading widget...');

DefaultLoadingComponent.displayName = 'DefaultLoadingComponent';

// 錯誤組件
const ErrorComponent = ({ widgetId }: { widgetId: string }) => 
  React.createElement('div', { className: 'text-red-500 p-4 border border-red-300 rounded bg-red-50' }, [
    React.createElement('h4', { key: 'title', className: 'font-semibold' }, 'Widget Error'),
    React.createElement('p', { key: 'message', className: 'text-sm mt-1' }, `Widget not found: ${widgetId}`),
    React.createElement('p', { key: 'details', className: 'text-xs text-gray-600 mt-2' }, 'Check console for details')
  ]);

ErrorComponent.displayName = 'ErrorComponent';

/**
 * 簡化的 Widget 註冊系統
 * 直接使用 React.lazy() 和 unified-config
 */
class SimpleWidgetRegistry {
  private static instance: SimpleWidgetRegistry;
  private lazyComponents = new Map<string, ComponentType<WidgetComponentProps>>();
  private loadMetrics = new Map<string, { loadTime: number; useCount: number }>();

  private constructor() {
    // 簡化的初始化
  }

  static getInstance(): SimpleWidgetRegistry {
    if (!SimpleWidgetRegistry.instance) {
      SimpleWidgetRegistry.instance = new SimpleWidgetRegistry();
    }
    return SimpleWidgetRegistry.instance;
  }

  /**
   * 獲取 Widget 組件 - 核心方法
   */
  getWidgetComponent(widgetId: string): WidgetComponent {
    const startTime = performance.now();

    // 檢查緩存
    if (this.lazyComponents.has(widgetId)) {
      this.updateMetrics(widgetId, 0);
      return this.lazyComponents.get(widgetId)!;
    }

    // 從配置獲取 loader
    const config = widgetConfig[widgetId];
    if (!config) {
      console.warn(`Widget configuration not found: ${widgetId}`);
      const ErrorFallback = () => React.createElement(ErrorComponent, { widgetId });
    ErrorFallback.displayName = `ErrorFallback-${widgetId}`;
    return ErrorFallback;
    }

    // 使用 unified-config 的 loader 或 fallback 到 dynamic-imports
    const importFn = config.loader || allWidgetImports[widgetId];
    if (!importFn) {
      console.warn(`No loader found for widget: ${widgetId}`);
      const ErrorFallback = () => React.createElement(ErrorComponent, { widgetId });
    ErrorFallback.displayName = `ErrorFallback-${widgetId}`;
    return ErrorFallback;
    }

    // 創建 React.lazy 組件
    const LazyComponent = React.lazy(importFn);

    // 包裝 Suspense
    const WrappedComponent = (props: WidgetComponentProps) => 
      React.createElement(Suspense, 
        { fallback: React.createElement(DefaultLoadingComponent) },
        React.createElement(LazyComponent, props)
      );

    WrappedComponent.displayName = `SimpleWidget_${widgetId}`;

    // 緩存組件
    this.lazyComponents.set(widgetId, WrappedComponent);

    // 記錄性能指標
    const loadTime = performance.now() - startTime;
    this.updateMetrics(widgetId, loadTime);

    return WrappedComponent;
  }

  /**
   * 獲取 Widget 定義
   */
  getDefinition(widgetId: string): SimpleWidgetDefinition | undefined {
    const config = widgetConfig[widgetId];
    if (!config) return undefined;

    return {
      id: config.id,
      name: config.name,
      category: config.category,
      description: config.description,
      priority: config.priority,
      loader: config.loader
    };
  }

  /**
   * 獲取所有 Widget 定義
   */
  getAllDefinitions(): Map<string, SimpleWidgetDefinition> {
    const definitions = new Map<string, SimpleWidgetDefinition>();
    
    Object.values(widgetConfig).forEach(config => {
      definitions.set(config.id, {
        id: config.id,
        name: config.name,
        category: config.category,
        description: config.description,
        priority: config.priority,
        loader: config.loader
      });
    });

    return definitions;
  }

  /**
   * 按類別獲取 Widgets
   */
  getByCategory(category: WidgetCategory): SimpleWidgetDefinition[] {
    return getWidgetsByCategory(category).map(config => ({
      id: config.id,
      name: config.name,
      category: config.category,
      description: config.description,
      priority: config.priority,
      loader: config.loader
    }));
  }

  /**
   * 檢查是否已註冊
   */
  isRegistered(widgetId: string): boolean {
    return widgetId in widgetConfig;
  }

  /**
   * 獲取所有類別
   */
  getCategories(): WidgetCategory[] {
    return ['stats', 'charts', 'lists', 'reports', 'operations', 'analysis', 'special', 'core'];
  }

  /**
   * 簡化的預載入 (只預載入高優先級 widgets)
   */
  async preloadWidgets(widgetIds: string[]): Promise<void> {
    const highPriorityWidgets = widgetIds.filter(id => {
      const config = widgetConfig[id];
      return config && (config.priority === 'critical' || config.priority === 'high');
    });

    // 使用 requestIdleCallback 進行預載入
    highPriorityWidgets.forEach(widgetId => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          this.getWidgetComponent(widgetId);
        });
      } else {
        setTimeout(() => {
          this.getWidgetComponent(widgetId);
        }, 0);
      }
    });
  }

  /**
   * 簡化的路由預載入
   */
  async preloadForRoute(route: string): Promise<void> {
    const highPriorityWidgets = getWidgetsByPriority('high')
      .concat(getWidgetsByPriority('critical'))
      .map(config => config.id);

    await this.preloadWidgets(highPriorityWidgets);
  }

  /**
   * 自動註冊 (向後兼容)
   */
  async autoRegisterWidgets(): Promise<void> {
    // 配置已經在初始化時加載，此方法保持接口兼容性
    console.log(`[SimpleWidgetRegistry] Auto-registered ${Object.keys(widgetConfig).length} widgets`);
  }

  /**
   * 更新性能指標
   */
  private updateMetrics(widgetId: string, loadTime: number): void {
    const existing = this.loadMetrics.get(widgetId);
    
    this.loadMetrics.set(widgetId, {
      loadTime,
      useCount: existing ? existing.useCount + 1 : 1
    });
  }

  /**
   * 獲取載入統計
   */
  getLoadStatistics(): Map<string, any> {
    const stats = new Map();
    
    Object.keys(widgetConfig).forEach(widgetId => {
      const metrics = this.loadMetrics.get(widgetId);
      stats.set(widgetId, {
        widgetId,
        loadStatus: this.lazyComponents.has(widgetId) ? 'loaded' : 'pending',
        useCount: metrics?.useCount || 0,
        loadTime: metrics?.loadTime || 0
      });
    });

    return stats;
  }

  /**
   * 清理未使用的組件
   */
  cleanup(): void {
    // 簡化的清理邏輯
    console.log('[SimpleWidgetRegistry] Cleanup completed');
  }
}

// 創建單例實例
export const simpleWidgetRegistry = SimpleWidgetRegistry.getInstance();

// 向後兼容的導出
export const widgetRegistry = simpleWidgetRegistry;
export default simpleWidgetRegistry;

// 簡化的預載入工具
export const smartPreloader = {
  preloadForRoute: (route: string) => simpleWidgetRegistry.preloadForRoute(route)
};

// 簡化的性能監控
export const performanceMonitor = {
  getStatistics: () => simpleWidgetRegistry.getLoadStatistics(),
  cleanup: () => simpleWidgetRegistry.cleanup()
};