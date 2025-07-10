/**
 * Enhanced Widget Registry
 * 擴展現有的 LazyWidgetRegistry，添加新功能但保持向後兼容
 */

import React from 'react';
import {
  WidgetDefinition,
  WidgetRegistryItem,
  IWidgetRegistry,
  WidgetCategory,
  WidgetComponentProps,
} from './types';
import {
  widgetMapping,
  getGraphQLVersion,
  getPreloadPriority,
  getRoutePreloadWidgets,
} from './widget-mappings';
import { createDynamicWidget, preloadWidget } from './widget-loader';
import { registerStatsWidgets, preloadHighPriorityStatsWidgets } from './stats-widget-adapter';
import { registerChartsWidgets, preloadHighPriorityChartsWidgets } from './charts-widget-adapter';
import { registerListsWidgets, preloadHighPriorityListsWidgets } from './lists-widget-adapter';
import {
  registerReportsWidgets,
  preloadHighPriorityReportsWidgets,
} from './reports-widget-adapter';
import {
  registerOperationsWidgets,
  preloadHighPriorityOperationsWidgets,
} from './operations-widget-adapter';
import {
  registerAnalysisWidgets,
  preloadHighPriorityAnalysisWidgets,
} from './analysis-widget-adapter';
import {
  registerSpecialWidgets,
  preloadHighPrioritySpecialWidgets,
} from './special-widget-adapter';
import { performanceMonitor, PerformanceTimer } from './performance-monitor';

/**
 * Virtual Widget Container for performance optimization
 */
export interface VirtualContainerConfig {
  widgets: WidgetDefinition[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export class VirtualWidgetContainer {
  private visibleRange: { start: number; end: number } = { start: 0, end: 0 };
  private scrollTop: number = 0;
  private config: VirtualContainerConfig;

  constructor(config: VirtualContainerConfig) {
    this.config = {
      ...config,
      overscan: config.overscan || 2,
    };
    this.calculateVisibleRange();
  }

  updateScrollPosition(scrollTop: number): void {
    this.scrollTop = scrollTop;
    this.calculateVisibleRange();
  }

  private calculateVisibleRange(): void {
    const { itemHeight, containerHeight, widgets, overscan = 2 } = this.config;
    const startIndex = Math.floor(this.scrollTop / itemHeight);
    const endIndex = Math.ceil((this.scrollTop + containerHeight) / itemHeight);

    this.visibleRange = {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(widgets.length, endIndex + overscan),
    };
  }

  getVisibleWidgets(): WidgetDefinition[] {
    return this.config.widgets.slice(this.visibleRange.start, this.visibleRange.end);
  }

  getTotalHeight(): number {
    return this.config.widgets.length * this.config.itemHeight;
  }

  getOffsetForIndex(index: number): number {
    return index * this.config.itemHeight;
  }
}

/**
 * Grid Virtualizer for fixed grid layouts
 */
export interface GridVirtualizerConfig {
  widgets: Array<{ id: string; gridArea: string }>;
  viewportHeight: number;
  threshold?: number;
}

export class GridVirtualizer {
  private intersectionObserver: IntersectionObserver | null = null;
  private visibleWidgets = new Set<string>();
  private widgetCallbacks = new Map<string, (isVisible: boolean) => void>();

  constructor(config: GridVirtualizerConfig) {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(this.handleIntersection, {
        rootMargin: `${config.threshold || 50}px`,
        threshold: 0,
      });
    }
  }

  observeWidget(element: Element, widgetId: string, callback: (isVisible: boolean) => void): void {
    if (!this.intersectionObserver) return;

    element.setAttribute('data-widget-id', widgetId);
    this.widgetCallbacks.set(widgetId, callback);
    this.intersectionObserver.observe(element);
  }

  unobserveWidget(element: Element, widgetId: string): void {
    if (!this.intersectionObserver) return;

    this.intersectionObserver.unobserve(element);
    this.widgetCallbacks.delete(widgetId);
    this.visibleWidgets.delete(widgetId);
  }

  private handleIntersection = (entries: IntersectionObserverEntry[]): void => {
    entries.forEach(entry => {
      const widgetId = entry.target.getAttribute('data-widget-id');
      if (!widgetId) return;

      const callback = this.widgetCallbacks.get(widgetId);
      if (callback) {
        if (entry.isIntersecting) {
          this.visibleWidgets.add(widgetId);
          callback(true);
        } else {
          this.visibleWidgets.delete(widgetId);
          callback(false);
        }
      }
    });
  };

  getVisibleWidgetIds(): string[] {
    return Array.from(this.visibleWidgets);
  }

  destroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    this.visibleWidgets.clear();
    this.widgetCallbacks.clear();
  }
}

/**
 * Widget State Manager for persisting widget business states
 */
export interface WidgetState {
  id: string;
  collapsed?: boolean;
  settings?: Record<string, any>;
  lastUpdated: number;
}

export class WidgetStateManager {
  private storage: Storage | null = null;
  private states = new Map<string, WidgetState>();
  private storageKey = 'widget-states-v1';

  constructor() {
    if (typeof window !== 'undefined' && window.localStorage) {
      this.storage = window.localStorage;
      this.loadStates();
    }
  }

  private loadStates(): void {
    if (!this.storage) return;

    try {
      const savedStates = this.storage.getItem(this.storageKey);
      if (savedStates) {
        const parsed = JSON.parse(savedStates);
        Object.entries(parsed).forEach(([id, state]) => {
          this.states.set(id, state as WidgetState);
        });
      }
    } catch (error) {
      console.error('[WidgetStateManager] Failed to load states:', error);
    }
  }

  saveState(widgetId: string, state: Partial<WidgetState>): void {
    const currentState = this.states.get(widgetId) || { id: widgetId, lastUpdated: 0 };
    const newState: WidgetState = {
      ...currentState,
      ...state,
      lastUpdated: Date.now(),
    };

    this.states.set(widgetId, newState);
    this.persistStates();
  }

  private persistStates(): void {
    if (!this.storage) return;

    try {
      const statesObject = Object.fromEntries(this.states);
      this.storage.setItem(this.storageKey, JSON.stringify(statesObject));
    } catch (error) {
      console.error('[WidgetStateManager] Failed to persist states:', error);
    }
  }

  getState(widgetId: string): WidgetState | undefined {
    return this.states.get(widgetId);
  }

  clearState(widgetId: string): void {
    this.states.delete(widgetId);
    this.persistStates();
  }

  clearAllStates(): void {
    this.states.clear();
    if (this.storage) {
      this.storage.removeItem(this.storageKey);
    }
  }
}

export class EnhancedWidgetRegistry implements IWidgetRegistry {
  // 內部存儲
  private definitions = new Map<string, WidgetRegistryItem>();
  private categories = new Map<WidgetCategory, Set<string>>();
  private loadingPromises = new Map<string, Promise<void>>();

  // 性能監控
  private performanceData = new Map<
    string,
    {
      loadTime: number[];
      lastUsed: number;
      useCount: number;
    }
  >();

  // Widget 狀態管理
  private stateManager: WidgetStateManager;

  // 虛擬化支援
  private gridVirtualizer: GridVirtualizer | null = null;

  // 單例模式
  private static instance: EnhancedWidgetRegistry;

  private constructor() {
    // 初始化分類索引
    const categories: WidgetCategory[] = [
      'core',
      'stats',
      'charts',
      'lists',
      'operations',
      'uploads',
      'reports',
      'analysis',
      'special',
    ];
    categories.forEach(cat => this.categories.set(cat, new Set()));

    // 初始化狀態管理器
    this.stateManager = new WidgetStateManager();
  }

  static getInstance(): EnhancedWidgetRegistry {
    if (!EnhancedWidgetRegistry.instance) {
      EnhancedWidgetRegistry.instance = new EnhancedWidgetRegistry();
    }
    return EnhancedWidgetRegistry.instance;
  }

  /**
   * 註冊 widget 定義
   */
  register(definition: WidgetDefinition): void {
    const item: WidgetRegistryItem = {
      ...definition,
      loadStatus: 'pending',
      useCount: 0,
      metadata: {
        ...definition.metadata,
        registryVersion: '2.0',
        createdAt: new Date().toISOString(),
      },
    };

    this.definitions.set(definition.id, item);

    // 更新分類索引
    const categorySet = this.categories.get(definition.category);
    if (categorySet) {
      categorySet.add(definition.id);
    }

    console.log(`[WidgetRegistry] Registered widget: ${definition.id} (${definition.category})`);
  }

  /**
   * 取消註冊 widget
   */
  unregister(widgetId: string): void {
    const definition = this.definitions.get(widgetId);
    if (definition) {
      // 從分類索引中移除
      const categorySet = this.categories.get(definition.category);
      if (categorySet) {
        categorySet.delete(widgetId);
      }

      this.definitions.delete(widgetId);
      this.loadingPromises.delete(widgetId);
      this.performanceData.delete(widgetId);

      console.log(`[WidgetRegistry] Unregistered widget: ${widgetId}`);
    }
  }

  /**
   * 獲取 widget 定義
   */
  getDefinition(widgetId: string): WidgetDefinition | undefined {
    return this.definitions.get(widgetId);
  }

  /**
   * 獲取 widget 組件（保持向後兼容）
   */
  getComponent(widgetId: string): React.ComponentType<WidgetComponentProps> | undefined {
    const definition = this.definitions.get(widgetId);
    return definition?.component;
  }

  /**
   * 獲取 widget 組件（支援 GraphQL 版本切換）
   */
  getWidgetComponent(
    widgetId: string,
    enableGraphQL: boolean
  ): React.ComponentType<WidgetComponentProps> | undefined {
    const definition = this.definitions.get(widgetId);

    if (enableGraphQL && definition?.graphqlVersion) {
      const graphqlDef = this.definitions.get(definition.graphqlVersion);
      if (graphqlDef?.component) {
        return graphqlDef.component;
      }
    }

    return definition?.component;
  }

  /**
   * 獲取所有定義
   */
  getAllDefinitions(): Map<string, WidgetDefinition> {
    return new Map(this.definitions);
  }

  /**
   * 按分類獲取 widgets
   */
  getByCategory(category: WidgetCategory): WidgetDefinition[] {
    const widgetIds = this.categories.get(category) || new Set();
    return Array.from(widgetIds)
      .map(id => this.definitions.get(id))
      .filter((def): def is WidgetDefinition => def !== undefined);
  }

  /**
   * 自動發現和註冊 widgets
   * 注意：這個方法暫時使用映射配置，未來會實現真正的自動發現
   */
  async autoRegisterWidgets(): Promise<void> {
    // Check if already registered
    if (this.definitions.size > 0) {
      console.log(`[WidgetRegistry] Already registered ${this.definitions.size} widgets`);
      return;
    }

    const startTime = performance.now();
    console.log('[WidgetRegistry] Starting auto-registration...');

    // Phase 2: 使用專門的 adapter 註冊各類 widgets
    await registerStatsWidgets();
    await registerChartsWidgets();
    await registerListsWidgets();
    await registerReportsWidgets();
    await registerOperationsWidgets();
    await registerAnalysisWidgets();
    await registerSpecialWidgets();

    // 從映射配置中註冊其他 widgets（排除已經由 adapter 註冊的）
    Object.entries(widgetMapping.categoryMap).forEach(([widgetId, category]) => {
      // 跳過已經註冊的 widgets
      if (this.definitions.has(widgetId)) {
        return;
      }

      const definition: WidgetDefinition = {
        id: widgetId,
        name: this.humanizeName(widgetId),
        category,
        lazyLoad: true,
        preloadPriority: getPreloadPriority(widgetId),
        graphqlVersion: getGraphQLVersion(widgetId),
        component: createDynamicWidget(widgetId), // 創建懶加載組件
        metadata: {
          autoRegistered: true,
        },
      };

      this.register(definition);
    });

    const endTime = performance.now();
    console.log(
      `[WidgetRegistry] Auto-registration completed: ${this.definitions.size} widgets in ${(endTime - startTime).toFixed(2)}ms`
    );

    // 預加載高優先級 widgets
    await Promise.all([
      preloadHighPriorityStatsWidgets(),
      preloadHighPriorityChartsWidgets(),
      preloadHighPriorityListsWidgets(),
      preloadHighPriorityReportsWidgets(),
      preloadHighPriorityOperationsWidgets(),
      preloadHighPriorityAnalysisWidgets(),
      preloadHighPrioritySpecialWidgets(),
    ]);
  }

  /**
   * 按分類獲取 widgets
   */
  getWidgetsByCategory(): Record<WidgetCategory, WidgetDefinition[]> {
    const result: Record<WidgetCategory, WidgetDefinition[]> = {} as any;

    this.categories.forEach((widgetIds, category) => {
      result[category] = Array.from(widgetIds)
        .map(id => this.definitions.get(id))
        .filter((def): def is WidgetDefinition => def !== undefined);
    });

    return result;
  }

  /**
   * 獲取加載統計
   */
  getLoadStatistics(): Map<string, WidgetRegistryItem> {
    // 添加性能數據到返回結果
    const stats = new Map<string, WidgetRegistryItem>();

    this.definitions.forEach((definition, widgetId) => {
      const perfData = this.performanceData.get(widgetId);
      if (perfData) {
        const avgLoadTime =
          perfData.loadTime.length > 0
            ? perfData.loadTime.reduce((a, b) => a + b, 0) / perfData.loadTime.length
            : 0;

        stats.set(widgetId, {
          ...definition,
          loadTime: avgLoadTime,
          lastUsed: perfData.lastUsed,
          useCount: perfData.useCount,
        });
      } else {
        stats.set(widgetId, definition);
      }
    });

    return stats;
  }

  /**
   * 預加載 widgets
   */
  async preloadWidgets(widgetIds: string[]): Promise<void> {
    console.log(`[WidgetRegistry] Preloading ${widgetIds.length} widgets...`);

    const promises = widgetIds.map(async widgetId => {
      const definition = this.definitions.get(widgetId);
      if (!definition || !definition.lazyLoad) {
        return;
      }

      // 檢查是否已經在加載中
      const existingPromise = this.loadingPromises.get(widgetId);
      if (existingPromise) {
        return existingPromise;
      }

      // 創建加載 promise
      const loadPromise = this.loadWidget(widgetId);
      this.loadingPromises.set(widgetId, loadPromise);

      try {
        await loadPromise;
        console.log(`[WidgetRegistry] Preloaded: ${widgetId}`);
      } catch (error) {
        console.error(`[WidgetRegistry] Failed to preload ${widgetId}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * 內部方法：加載 widget
   */
  private async loadWidget(widgetId: string): Promise<void> {
    const startTime = performance.now();
    const definition = this.definitions.get(widgetId);

    if (!definition) {
      throw new Error(`Widget not found: ${widgetId}`);
    }

    // 使用性能監控器
    const timer = performanceMonitor.startMonitoring(widgetId, 'v2');

    try {
      // 更新狀態
      definition.loadStatus = 'loading';

      // 使用真正的動態加載
      await preloadWidget(widgetId);

      // 更新狀態和性能數據
      definition.loadStatus = 'loaded';
      const loadTime = performance.now() - startTime;

      // 記錄性能數據
      if (!this.performanceData.has(widgetId)) {
        this.performanceData.set(widgetId, {
          loadTime: [],
          lastUsed: Date.now(),
          useCount: 0,
        });
      }

      const perfData = this.performanceData.get(widgetId)!;
      perfData.loadTime.push(loadTime);
      if (perfData.loadTime.length > 10) {
        perfData.loadTime.shift(); // 只保留最近 10 次的加載時間
      }

      // 完成性能監控
      timer.complete({
        route: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        sessionId: this.getSessionId(),
        userId: undefined, // 可以從 auth context 獲取
      });
    } catch (error) {
      definition.loadStatus = 'error';
      definition.loadError = error as Error;
      throw error;
    } finally {
      this.loadingPromises.delete(widgetId);
    }
  }

  /**
   * 獲取或創建 session ID
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server';

    let sessionId = sessionStorage.getItem('widget-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('widget-session-id', sessionId);
    }
    return sessionId;
  }

  /**
   * 內部方法：人性化名稱
   */
  private humanizeName(widgetId: string): string {
    return widgetId
      .replace(/Widget$/, '')
      .replace(/GraphQL$/, ' (GraphQL)')
      .replace(/([A-Z])/g, ' $1')
      .trim();
  }

  /**
   * 記錄 widget 使用
   */
  recordUsage(widgetId: string): void {
    const perfData = this.performanceData.get(widgetId);
    if (perfData) {
      perfData.lastUsed = Date.now();
      perfData.useCount++;
    } else {
      this.performanceData.set(widgetId, {
        loadTime: [],
        lastUsed: Date.now(),
        useCount: 1,
      });
    }
  }

  /**
   * Widget 狀態管理接口
   */
  getWidgetState(widgetId: string): WidgetState | undefined {
    return this.stateManager.getState(widgetId);
  }

  saveWidgetState(widgetId: string, state: Partial<WidgetState>): void {
    this.stateManager.saveState(widgetId, state);
  }

  clearWidgetState(widgetId: string): void {
    this.stateManager.clearState(widgetId);
  }

  /**
   * 虛擬化支援接口
   */
  createVirtualContainer(config: VirtualContainerConfig): VirtualWidgetContainer {
    return new VirtualWidgetContainer(config);
  }

  createGridVirtualizer(config: GridVirtualizerConfig): GridVirtualizer {
    if (this.gridVirtualizer) {
      this.gridVirtualizer.destroy();
    }
    this.gridVirtualizer = new GridVirtualizer(config);
    return this.gridVirtualizer;
  }

  getGridVirtualizer(): GridVirtualizer | null {
    return this.gridVirtualizer;
  }

  /**
   * 開始監控 Widget 性能
   */
  startWidgetMonitoring(widgetId: string, variant: 'v2' | 'legacy' = 'v2'): PerformanceTimer {
    return performanceMonitor.startMonitoring(widgetId, variant);
  }

  /**
   * 獲取 Widget 性能報告
   */
  getWidgetPerformanceReport(widgetId: string, timeRange?: { start: Date; end: Date }) {
    return performanceMonitor.getWidgetReport(widgetId, timeRange);
  }

  /**
   * 獲取實時性能數據
   */
  getRealtimePerformance() {
    return performanceMonitor.getRealtimeMetrics();
  }

  /**
   * 性能監控增強
   */
  getPerformanceReport(): {
    totalWidgets: number;
    loadedWidgets: number;
    averageLoadTime: number;
    topUsedWidgets: Array<{ id: string; useCount: number; avgLoadTime: number }>;
  } {
    let totalLoadTime = 0;
    let totalLoadCount = 0;
    const widgetStats: Array<{ id: string; useCount: number; avgLoadTime: number }> = [];

    this.performanceData.forEach((data, widgetId) => {
      const avgLoadTime =
        data.loadTime.length > 0
          ? data.loadTime.reduce((a, b) => a + b, 0) / data.loadTime.length
          : 0;

      totalLoadTime += avgLoadTime * data.loadTime.length;
      totalLoadCount += data.loadTime.length;

      widgetStats.push({
        id: widgetId,
        useCount: data.useCount,
        avgLoadTime,
      });
    });

    const loadedWidgets = Array.from(this.definitions.values()).filter(
      def => def.loadStatus === 'loaded'
    ).length;

    return {
      totalWidgets: this.definitions.size,
      loadedWidgets,
      averageLoadTime: totalLoadCount > 0 ? totalLoadTime / totalLoadCount : 0,
      topUsedWidgets: widgetStats.sort((a, b) => b.useCount - a.useCount).slice(0, 10),
    };
  }

  /**
   * 清理和銷毀
   */
  destroy(): void {
    if (this.gridVirtualizer) {
      this.gridVirtualizer.destroy();
      this.gridVirtualizer = null;
    }
    this.loadingPromises.clear();
    this.performanceData.clear();
    // 注意：不清理 definitions 和 categories，因為它們可能需要保留
  }
}

// 導出單例實例
export const widgetRegistry = EnhancedWidgetRegistry.getInstance();

// 新增：RoutePredictor - 路由預測器
export class RoutePredictor {
  private static instance: RoutePredictor;
  private routeHistory: string[] = [];
  private transitionMatrix: Map<string, Map<string, number>> = new Map();
  private predictionConfidence: number = 0.7;
  private maxHistoryLength: number = 50;

  private constructor() {
    this.loadHistory();
  }

  static getInstance(): RoutePredictor {
    if (!RoutePredictor.instance) {
      RoutePredictor.instance = new RoutePredictor();
    }
    return RoutePredictor.instance;
  }

  // 記錄路由訪問
  recordNavigation(route: string): void {
    // 更新歷史記錄
    this.routeHistory.push(route);
    if (this.routeHistory.length > this.maxHistoryLength) {
      this.routeHistory.shift();
    }

    // 更新轉換矩陣
    if (this.routeHistory.length >= 2) {
      const prevRoute = this.routeHistory[this.routeHistory.length - 2];
      this.updateTransitionMatrix(prevRoute, route);
    }

    // 保存到 localStorage
    this.saveHistory();
  }

  // 預測下一個可能的路由
  predictNextRoutes(currentRoute: string, limit: number = 3): string[] {
    const transitions = this.transitionMatrix.get(currentRoute);
    if (!transitions || transitions.size === 0) {
      // 如果沒有歷史數據，返回常見路由
      return this.getCommonRoutes(limit);
    }

    // 計算概率並排序
    const predictions = Array.from(transitions.entries())
      .map(([route, count]) => {
        const total = Array.from(transitions.values()).reduce((sum, c) => sum + c, 0);
        return { route, probability: count / total };
      })
      .filter(p => p.probability >= this.predictionConfidence)
      .sort((a, b) => b.probability - a.probability)
      .slice(0, limit)
      .map(p => p.route);

    return predictions.length > 0 ? predictions : this.getCommonRoutes(limit);
  }

  // 更新轉換矩陣
  private updateTransitionMatrix(from: string, to: string): void {
    if (!this.transitionMatrix.has(from)) {
      this.transitionMatrix.set(from, new Map());
    }

    const transitions = this.transitionMatrix.get(from)!;
    const currentCount = transitions.get(to) || 0;
    transitions.set(to, currentCount + 1);
  }

  // 獲取常見路由
  private getCommonRoutes(limit: number): string[] {
    const routeCounts = new Map<string, number>();

    this.routeHistory.forEach(route => {
      routeCounts.set(route, (routeCounts.get(route) || 0) + 1);
    });

    return Array.from(routeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([route]) => route);
  }

  // 從 localStorage 加載歷史
  private loadHistory(): void {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('route-predictor-history');
      if (saved) {
        const data = JSON.parse(saved);
        this.routeHistory = data.history || [];
        this.transitionMatrix = new Map(
          data.transitions?.map(([key, value]: [string, [string, number][]]) => [
            key,
            new Map(value),
          ]) || []
        );
      }
    } catch (error) {
      console.error('[RoutePredictor] Failed to load history:', error);
    }
  }

  // 保存歷史到 localStorage
  private saveHistory(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        history: this.routeHistory.slice(-20), // 只保存最近 20 條
        transitions: Array.from(this.transitionMatrix.entries()).map(([key, value]) => [
          key,
          Array.from(value.entries()),
        ]),
      };
      localStorage.setItem('route-predictor-history', JSON.stringify(data));
    } catch (error) {
      console.error('[RoutePredictor] Failed to save history:', error);
    }
  }

  // 清理歷史數據
  clearHistory(): void {
    this.routeHistory = [];
    this.transitionMatrix.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('route-predictor-history');
    }
  }
}

// 新增：SmartPreloader - 智能預加載器
export class SmartPreloader {
  private static instance: SmartPreloader;
  private preloadQueue: PriorityQueue<PreloadTask> = new PriorityQueue();
  private activePreloads: Map<string, Promise<void>> = new Map();
  private resourceTimings: Map<string, number> = new Map();
  private routePredictor: RoutePredictor;
  private monitor: typeof performanceMonitor;

  private constructor() {
    this.routePredictor = RoutePredictor.getInstance();
    this.monitor = performanceMonitor;
    this.startPreloadWorker();
  }

  static getInstance(): SmartPreloader {
    if (!SmartPreloader.instance) {
      SmartPreloader.instance = new SmartPreloader();
    }
    return SmartPreloader.instance;
  }

  // 基於路由預測的預加載
  async preloadForRoute(currentRoute: string): Promise<void> {
    // 記錄當前路由
    this.routePredictor.recordNavigation(currentRoute);

    // 獲取預測的下一個路由
    const predictedRoutes = this.routePredictor.predictNextRoutes(currentRoute);

    // 為每個預測路由創建預加載任務
    predictedRoutes.forEach((route, index) => {
      const widgets = getRoutePreloadWidgets(route);
      const priority = this.calculatePriority(route, index);

      widgets.forEach(widgetId => {
        this.schedulePreload({
          widgetId,
          route,
          priority,
          timestamp: Date.now(),
        });
      });
    });
  }

  // 調度預加載任務
  private schedulePreload(task: PreloadTask): void {
    // 檢查是否已在隊列或正在加載
    if (this.activePreloads.has(task.widgetId)) {
      return;
    }

    // 根據優先級添加到隊列
    this.preloadQueue.enqueue(task, task.priority);
  }

  // 啟動預加載工作器
  private startPreloadWorker(): void {
    if (typeof window === 'undefined') return;

    const processQueue = async () => {
      if (this.preloadQueue.isEmpty() || this.activePreloads.size >= 3) {
        // 隊列為空或並行加載達到上限
        return;
      }

      const task = this.preloadQueue.dequeue();
      if (!task) return;

      // 開始預加載
      const startTime = performance.now();
      const preloadPromise = this.performPreload(task);

      this.activePreloads.set(task.widgetId, preloadPromise);

      try {
        await preloadPromise;
        const loadTime = performance.now() - startTime;
        this.resourceTimings.set(task.widgetId, loadTime);

        // 記錄性能數據 - 使用正確的方法
        console.log(`[SmartPreloader] Preloaded ${task.widgetId} in ${loadTime.toFixed(2)}ms`, {
          route: task.route,
          priority: task.priority,
        });
      } catch (error) {
        console.error(`[SmartPreloader] Failed to preload ${task.widgetId}:`, error);
      } finally {
        this.activePreloads.delete(task.widgetId);
      }
    };

    // 使用 requestIdleCallback 在空閒時處理隊列
    const scheduleWork = () => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(
          deadline => {
            while (deadline.timeRemaining() > 0 && !this.preloadQueue.isEmpty()) {
              processQueue();
            }
            scheduleWork();
          },
          { timeout: 2000 }
        );
      } else {
        // Fallback to setTimeout
        setTimeout(() => {
          processQueue();
          scheduleWork();
        }, 100);
      }
    };

    scheduleWork();
  }

  // 執行預加載
  private async performPreload(task: PreloadTask): Promise<void> {
    const definition = widgetRegistry.getDefinition(task.widgetId);

    if (definition?.lazyLoad && (definition as any).loadComponent) {
      // 使用 webpack prefetch/preload hints
      const link = document.createElement('link');
      link.rel = task.priority > 0.8 ? 'preload' : 'prefetch';
      link.as = 'script';

      // 觸發組件加載
      await (definition as any).loadComponent();
    }

    // 使用 widget registry 的預加載功能
    await widgetRegistry.preloadWidgets([task.widgetId]);
  }

  // 計算優先級
  private calculatePriority(route: string, predictionIndex: number): number {
    // 基礎優先級根據預測排序
    let priority = 1 - predictionIndex * 0.2;

    // 根據歷史加載時間調整
    const avgLoadTime = this.getAverageLoadTime(route);
    if (avgLoadTime > 1000) {
      // 慢加載的 widget 提高優先級
      priority += 0.1;
    }

    // 根據用戶行為模式調整
    const timeOfDay = new Date().getHours();
    if (timeOfDay >= 9 && timeOfDay <= 17) {
      // 工作時間提高業務相關 widget 優先級
      if (route.includes('analysis') || route.includes('warehouse')) {
        priority += 0.15;
      }
    }

    return Math.min(1, Math.max(0, priority));
  }

  // 獲取平均加載時間
  private getAverageLoadTime(route: string): number {
    const widgets = getRoutePreloadWidgets(route);
    const timings = widgets
      .map(id => this.resourceTimings.get(id))
      .filter((t): t is number => t !== undefined);

    if (timings.length === 0) return 0;
    return timings.reduce((sum, t) => sum + t, 0) / timings.length;
  }

  // 清理緩存和隊列
  clearCache(): void {
    this.preloadQueue = new PriorityQueue();
    this.activePreloads.clear();
    this.resourceTimings.clear();
  }
}

// 預加載任務接口
interface PreloadTask {
  widgetId: string;
  route: string;
  priority: number;
  timestamp: number;
}

// 優先級隊列實現
class PriorityQueue<T> {
  private items: Array<{ element: T; priority: number }> = [];

  enqueue(element: T, priority: number): void {
    const queueElement = { element, priority };
    let added = false;

    for (let i = 0; i < this.items.length; i++) {
      if (queueElement.priority > this.items[i].priority) {
        this.items.splice(i, 0, queueElement);
        added = true;
        break;
      }
    }

    if (!added) {
      this.items.push(queueElement);
    }
  }

  dequeue(): T | undefined {
    return this.items.shift()?.element;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
}

// 導出其他單例實例
export const routePredictor = RoutePredictor.getInstance();
export const smartPreloader = SmartPreloader.getInstance();
