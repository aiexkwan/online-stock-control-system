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
  WidgetComponentProps 
} from './types';
import { widgetMapping, getGraphQLVersion, getPreloadPriority } from './widget-mappings';
import { createLazyWidget, preloadWidget } from './widget-loader';
import { registerStatsWidgets, preloadHighPriorityStatsWidgets } from './stats-widget-adapter';
import { registerChartsWidgets, preloadHighPriorityChartsWidgets } from './charts-widget-adapter';
import { registerListsWidgets, preloadHighPriorityListsWidgets } from './lists-widget-adapter';
import { registerReportsWidgets, preloadHighPriorityReportsWidgets } from './reports-widget-adapter';
import { registerOperationsWidgets, preloadHighPriorityOperationsWidgets } from './operations-widget-adapter';
import { registerAnalysisWidgets, preloadHighPriorityAnalysisWidgets } from './analysis-widget-adapter';

export class EnhancedWidgetRegistry implements IWidgetRegistry {
  // 內部存儲
  private definitions = new Map<string, WidgetRegistryItem>();
  private categories = new Map<WidgetCategory, Set<string>>();
  private loadingPromises = new Map<string, Promise<void>>();
  
  // 性能監控
  private performanceData = new Map<string, {
    loadTime: number[];
    lastUsed: number;
    useCount: number;
  }>();
  
  // 單例模式
  private static instance: EnhancedWidgetRegistry;
  
  private constructor() {
    // 初始化分類索引
    const categories: WidgetCategory[] = [
      'core', 'stats', 'charts', 'lists', 
      'operations', 'uploads', 'reports', 'analysis', 'special'
    ];
    categories.forEach(cat => this.categories.set(cat, new Set()));
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
      }
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
        component: createLazyWidget(widgetId), // 創建懶加載組件
        metadata: {
          autoRegistered: true,
        }
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
      preloadHighPriorityAnalysisWidgets()
    ]);
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
        const avgLoadTime = perfData.loadTime.length > 0
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
    
    const promises = widgetIds.map(async (widgetId) => {
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
          useCount: 0
        });
      }
      
      const perfData = this.performanceData.get(widgetId)!;
      perfData.loadTime.push(loadTime);
      if (perfData.loadTime.length > 10) {
        perfData.loadTime.shift(); // 只保留最近 10 次的加載時間
      }
      
    } catch (error) {
      definition.loadStatus = 'error';
      definition.loadError = error as Error;
      throw error;
    } finally {
      this.loadingPromises.delete(widgetId);
    }
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
        useCount: 1
      });
    }
  }
}

// 導出單例實例
export const widgetRegistry = EnhancedWidgetRegistry.getInstance();