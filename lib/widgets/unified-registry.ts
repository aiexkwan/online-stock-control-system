/**
 * Unified Widget Registry
 * 統一的 Widget 註冊系統 - 取代雙重註冊系統
 *
 * 合併 LazyWidgetRegistry 和 enhanced-registry 的功能：
 * - 網絡感知預加載 (來自 LazyWidgetRegistry)
 * - 性能監控 (來自 LazyWidgetRegistry)
 * - 分類管理 (來自 enhanced-registry)
 * - 統一配置 (來自 widget-config.ts)
 * - 直接 React.lazy() 映射 (移除過度抽象)
 */

import React, { Suspense, ComponentType } from 'react';
import type {
  WidgetDefinition,
  IWidgetRegistry,
  WidgetCategory,
  WidgetRegistryItem,
} from './types';
import type { WidgetComponentProps } from '@/types/components/dashboard';
import { getWidgetImport } from './dynamic-imports';
import {
  UNIFIED_WIDGET_CONFIG,
  UnifiedWidgetConfig,
  toWidgetDefinition,
  getWidgetsByCategory,
  getWidgetsByPriority,
} from './unified-widget-config';

// 定義 WidgetComponent 類型
type WidgetComponent = React.ComponentType<WidgetComponentProps>;

// 移除預加載策略 - 簡化系統

// 簡化的性能監控接口
interface WidgetMetrics {
  widgetId: string;
  loadTime: number;
  useCount: number;
  lastUsed: number;
}

// Default loading component
const DefaultLoadingComponent = () =>
  React.createElement(
    'div',
    { className: 'p-4 text-center text-muted-foreground' },
    'Loading widget...'
  );

// 統一的 Widget 註冊系統
class UnifiedWidgetRegistry implements IWidgetRegistry {
  private static instance: UnifiedWidgetRegistry;

  private widgets = new Map<string, WidgetDefinition>();
  private loadedComponents = new Map<string, ComponentType<WidgetComponentProps>>();
  private widgetMetrics = new Map<string, WidgetMetrics>();
  private initialized = false;

  // 預加載策略已移除 - 簡化系統

  private constructor() {
    // 簡化的構造函數
  }

  static getInstance(): UnifiedWidgetRegistry {
    if (!UnifiedWidgetRegistry.instance) {
      UnifiedWidgetRegistry.instance = new UnifiedWidgetRegistry();
    }
    return UnifiedWidgetRegistry.instance;
  }

  // 確保初始化
  private ensureInitialized(): void {
    if (this.initialized) return;

    this.initializeFromConfig();
    this.initialized = true;
  }

  // 從統一配置初始化所有 widgets
  private initializeFromConfig(): void {
    Object.values(UNIFIED_WIDGET_CONFIG).forEach(config => {
      const definition = toWidgetDefinition(config);
      this.widgets.set(config.id, definition as WidgetDefinition);
    });
  }

  // 核心註冊函數
  register(widget: WidgetDefinition): void {
    this.widgets.set(widget.id, widget);
  }

  unregister(widgetId: string): void {
    this.widgets.delete(widgetId);
    this.loadedComponents.delete(widgetId);
    this.widgetMetrics.delete(widgetId);
  }

  getDefinition(widgetId: string): WidgetDefinition | undefined {
    this.ensureInitialized();
    return this.widgets.get(widgetId);
  }

  getAllDefinitions(): Map<string, WidgetDefinition> {
    this.ensureInitialized();
    return new Map(this.widgets);
  }

  // 組件獲取 (簡化的性能監控，支援 UniversalStatsWidget)
  getComponent(widgetId: string): ComponentType<WidgetComponentProps> | undefined {
    this.ensureInitialized();

    const startTime = performance.now();

    try {
      // 檢查是否已加載
      if (this.loadedComponents.has(widgetId)) {
        this.updateWidgetMetrics(widgetId, 0);
        return this.loadedComponents.get(widgetId)!;
      }

      // Universal Widget 邏輯已移除 (v2.0.4)

      // 獲取動態導入函數
      const importFn = getWidgetImport(widgetId);
      if (!importFn) {
        console.warn(`No import function found for widget: ${widgetId}`);
        return undefined;
      }

      // 直接使用 React.lazy - 移除中間層
      const LazyComponent = React.lazy(importFn);

      // 包裝 Suspense (保持原有功能) - 策略 4: 類型安全的組件包裝
      const WrappedComponent = (props: WidgetComponentProps) =>
        React.createElement(
          Suspense,
          { fallback: React.createElement(DefaultLoadingComponent) },
          React.createElement(LazyComponent as React.ComponentType<WidgetComponentProps>, props)
        );

      WrappedComponent.displayName = `UnifiedWidget_${widgetId}`;

      // 緩存組件
      this.loadedComponents.set(widgetId, WrappedComponent);

      // 記錄性能指標
      const loadTime = performance.now() - startTime;
      this.updateWidgetMetrics(widgetId, loadTime);

      return WrappedComponent;
    } catch (error) {
      console.error(`Failed to load widget ${widgetId}:`, error);
      return undefined;
    }
  }

  // 簡化的性能監控
  private updateWidgetMetrics(widgetId: string, loadTime: number): void {
    const existing = this.widgetMetrics.get(widgetId);

    this.widgetMetrics.set(widgetId, {
      widgetId,
      loadTime,
      useCount: existing ? existing.useCount + 1 : 1,
      lastUsed: Date.now(),
    });
  }

  // Widget 組件獲取 (統一接口)
  getWidgetComponent(widgetId: string, enableGraphQL: boolean = false): WidgetComponent {
    const component = this.getComponent(widgetId);

    if (!component) {
      // 錯誤組件
      const ErrorComponent = (props: WidgetComponentProps) =>
        React.createElement(
          'div',
          {
            className: 'text-red-500 p-4 border border-red-300 rounded bg-red-50',
          },
          [
            React.createElement(
              'h4',
              { key: 'title', className: 'font-semibold' },
              'Widget Loading Error'
            ),
            React.createElement(
              'p',
              { key: 'message', className: 'text-sm mt-1' },
              `Widget not found: ${widgetId}`
            ),
            React.createElement(
              'p',
              { key: 'hint', className: 'text-xs text-gray-600 mt-2' },
              'Check console for details'
            ),
          ]
        );
      ErrorComponent.displayName = `ErrorWidget_${widgetId}`;
      return ErrorComponent;
    }

    return component;
  }

  // 分類管理 (來自 enhanced-registry)
  getByCategory(category: WidgetCategory): WidgetDefinition[] {
    this.ensureInitialized();
    return getWidgetsByCategory(category).map(
      config => toWidgetDefinition(config) as WidgetDefinition
    );
  }

  // 簡化的預加載
  async preloadWidgets(widgetIds: string[]): Promise<void> {
    this.ensureInitialized();

    // 按優先級排序
    const sortedWidgets = this.prioritizeWidgets(widgetIds);

    for (const widgetId of sortedWidgets) {
      if (this.shouldPreload(widgetId)) {
        try {
          // 使用 requestIdleCallback 或 setTimeout 進行預加載
          if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            window.requestIdleCallback(() => {
              this.getComponent(widgetId);
            });
          } else {
            setTimeout(() => {
              this.getComponent(widgetId);
            }, 0);
          }
        } catch (error) {
          console.warn(`Failed to preload widget ${widgetId}:`, error);
        }
      }
    }
  }

  private prioritizeWidgets(widgetIds: string[]): string[] {
    return widgetIds.sort((a, b) => {
      const configA = UNIFIED_WIDGET_CONFIG[a];
      const configB = UNIFIED_WIDGET_CONFIG[b];

      if (!configA || !configB) return 0;

      return configB.preloadPriority - configA.preloadPriority;
    });
  }

  private shouldPreload(widgetId: string): boolean {
    // 簡化為只預加載高優先級 widgets
    const config = UNIFIED_WIDGET_CONFIG[widgetId];
    return config ? config.preloadPriority >= 8 : false;
  }

  // 簡化的路由預加載
  async preloadForRoute(route: string): Promise<void> {
    this.ensureInitialized();

    // 根據路由獲取高優先級 widgets
    const highPriorityWidgets = getWidgetsByPriority(7).map(config => config.id);

    // 使用簡化的預加載
    await this.preloadWidgets(highPriorityWidgets);
  }

  // 實用函數
  isRegistered(widgetId: string): boolean {
    this.ensureInitialized();
    return this.widgets.has(widgetId);
  }

  getCategories(): WidgetCategory[] {
    return [
      'stats',
      'charts',
      'lists',
      'reports',
      'operations',
      'analysis',
      'special',
      'core',
    ] as WidgetCategory[];
  }

  // 簡化的性能統計
  getPerformanceMetrics(): Map<string, WidgetMetrics> {
    return new Map(this.widgetMetrics);
  }

  // 簡化的加載統計
  getLoadStatistics(): Map<string, WidgetRegistryItem> {
    this.ensureInitialized();
    const stats = new Map<string, WidgetRegistryItem>();

    this.widgets.forEach((widget, id) => {
      const metrics = this.widgetMetrics.get(id);
      stats.set(id, {
        ...widget,
        loadStatus: this.loadedComponents.has(id) ? 'loaded' : 'pending',
        useCount: metrics?.useCount || 0,
        lastUsed: metrics?.lastUsed || Date.now(),
      });
    });

    return stats;
  }
}

// 導出統一實例
export const unifiedWidgetRegistry = UnifiedWidgetRegistry.getInstance();
export default unifiedWidgetRegistry;

// 向後兼容性
export const widgetRegistry = unifiedWidgetRegistry;

// 簡化的性能監控工具
export const performanceMonitor = {
  getMetrics: () => unifiedWidgetRegistry.getPerformanceMetrics(),
  getStatistics: () => unifiedWidgetRegistry.getLoadStatistics(),
};
