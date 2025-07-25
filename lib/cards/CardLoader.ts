/**
 * Card Loader - 智能載入系統
 * 負責 Card 組件的動態載入、預載入和性能優化
 * 
 * @module CardLoader
 * @version 1.0.0
 */

import { lazy, ComponentType } from 'react';
import { CardDefinition, CardManifest, CardComponent } from './types';
import { CardRegistry } from './CardRegistry';

interface LoadedCard {
  component: ComponentType<any>;
  manifest: CardManifest;
  loadTime: number;
}

interface CardLoaderConfig {
  preloadDelay?: number;
  enablePrefetch?: boolean;
  enableCache?: boolean;
  maxCacheSize?: number;
}

/**
 * Card 載入管理器
 * 實現智能載入策略，包括路由級代碼分割、預載入和性能監控
 */
export class CardLoader {
  private static cache = new Map<string, LoadedCard>();
  private static loadingPromises = new Map<string, Promise<LoadedCard>>();
  private static config: CardLoaderConfig = {
    preloadDelay: 0,
    enablePrefetch: true,
    enableCache: true,
    maxCacheSize: 50,
  };

  /**
   * 配置載入器
   */
  static configure(config: Partial<CardLoaderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 路由級別代碼分割
   * 預載入特定路由所需的所有 Cards
   */
  static async loadForRoute(route: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      // 獲取路由對應的佈局配置
      const layout = await this.getLayoutForRoute(route);
      
      // 提取所需的 Card 類型
      const cardTypes = this.extractCardTypes(layout);
      
      // 並行載入所有 Cards
      await Promise.all(
        cardTypes.map(type => this.loadCard(type))
      );
      
      const loadTime = performance.now() - startTime;
      console.debug(`[CardLoader] Route ${route} loaded in ${loadTime.toFixed(2)}ms`);
    } catch (error) {
      console.error(`[CardLoader] Failed to load route ${route}:`, error);
      throw error;
    }
  }

  /**
   * 載入單個 Card
   * 支援緩存和並發控制
   */
  static async loadCard(type: string): Promise<LoadedCard> {
    // 檢查緩存
    if (this.config.enableCache && this.cache.has(type)) {
      return this.cache.get(type)!;
    }

    // 檢查是否已在載入中
    if (this.loadingPromises.has(type)) {
      return this.loadingPromises.get(type)!;
    }

    // 開始載入
    const loadPromise = this.performLoad(type);
    this.loadingPromises.set(type, loadPromise);

    try {
      const result = await loadPromise;
      
      // 加入緩存
      if (this.config.enableCache) {
        this.addToCache(type, result);
      }
      
      return result;
    } finally {
      this.loadingPromises.delete(type);
    }
  }

  /**
   * 執行實際的載入操作
   */
  private static async performLoad(type: string): Promise<LoadedCard> {
    const startTime = performance.now();

    try {
      // 載入 manifest
      const manifest = await this.loadManifest(type);
      
      // 根據優先級決定載入策略
      const component = manifest.performance?.preloadPriority === 'high'
        ? await this.loadImmediately(type)
        : await this.loadLazy(type);
      
      const loadTime = performance.now() - startTime;
      
      // 檢查性能預算
      if (manifest.performance?.maxRenderTime && loadTime > manifest.performance.maxRenderTime) {
        console.warn(
          `[CardLoader] Card ${type} exceeded load time budget: ${loadTime.toFixed(2)}ms > ${manifest.performance.maxRenderTime}ms`
        );
      }

      return {
        component,
        manifest,
        loadTime,
      };
    } catch (error) {
      console.error(`[CardLoader] Failed to load card ${type}:`, error);
      throw error;
    }
  }

  /**
   * 載入 Card manifest
   */
  private static async loadManifest(type: string): Promise<CardManifest> {
    const definition = CardRegistry.get(type);
    
    if (!definition) {
      throw new Error(`Card type "${type}" not found in registry`);
    }

    return definition.manifest;
  }

  /**
   * 立即載入 Card 組件
   */
  private static async loadImmediately(type: string): Promise<ComponentType<any>> {
    const module = await this.getCardImport(type);
    return module.default || module;
  }

  /**
   * 懶載入 Card 組件
   */
  private static async loadLazy(type: string): Promise<ComponentType<any>> {
    return lazy(() => this.getCardImport(type));
  }

  /**
   * 獲取 Card 的動態導入
   */
  private static async getCardImport(type: string): Promise<any> {
    // 使用新的 imports 系統
    const { getCardImport, CardImportOptimizer } = await import('./imports');
    
    const importFn = getCardImport(type);
    
    if (!importFn) {
      throw new Error(`No import mapping found for card type "${type}"`);
    }

    // 記錄使用統計
    CardImportOptimizer.recordUsage(type);

    return importFn();
  }

  /**
   * 預載入機制
   * 在瀏覽器空閒時預載入 Cards
   */
  static async prefetch(types: string[]): Promise<void> {
    if (!this.config.enablePrefetch) {
      return;
    }

    // 使用新的 imports 系統進行優化預載入
    const { preloadCards, CardImportOptimizer } = await import('./imports');
    
    // 獲取優化的預載入順序
    const optimizedOrder = CardImportOptimizer.getSuggestedPreloadOrder();
    const typesToPreload = types.length > 0 ? types : optimizedOrder;

    // 使用 requestIdleCallback 進行預載入
    if ('requestIdleCallback' in window) {
      requestIdleCallback(async () => {
        try {
          await preloadCards(typesToPreload);
          console.debug(`[CardLoader] Prefetched ${typesToPreload.length} cards`);
        } catch (error) {
          console.debug(`[CardLoader] Prefetch failed:`, error);
        }
      });
    } else {
      // 降級方案：使用 setTimeout
      setTimeout(async () => {
        try {
          await preloadCards(typesToPreload);
        } catch (error) {
          console.debug(`[CardLoader] Prefetch failed:`, error);
        }
      }, this.config.preloadDelay);
    }
  }

  /**
   * 獲取路由對應的佈局配置
   * TODO: 實際實現應該從路由配置或 API 獲取
   */
  private static async getLayoutForRoute(route: string): Promise<any> {
    // 模擬實現，實際應從路由配置獲取
    const routeLayouts: Record<string, string[]> = {
      '/admin': ['stats', 'chart', 'table'],
      '/admin/analytics': ['chart', 'stats'],
      '/admin/operations': ['table', 'list', 'upload'],
    };

    return routeLayouts[route] || [];
  }

  /**
   * 從佈局配置中提取 Card 類型
   */
  private static extractCardTypes(layout: any): string[] {
    if (Array.isArray(layout)) {
      return layout;
    }

    // 處理更複雜的佈局結構
    const types: string[] = [];
    
    const extract = (obj: any) => {
      if (obj?.type) {
        types.push(obj.type);
      }
      if (obj?.children) {
        if (Array.isArray(obj.children)) {
          obj.children.forEach(extract);
        } else {
          extract(obj.children);
        }
      }
    };

    extract(layout);
    return [...new Set(types)]; // 去重
  }

  /**
   * 加入緩存並管理緩存大小
   */
  private static addToCache(type: string, card: LoadedCard): void {
    this.cache.set(type, card);

    // 檢查緩存大小
    if (this.cache.size > this.config.maxCacheSize!) {
      // 移除最早的項目 (FIFO)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * 清除緩存
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * 獲取載入統計
   */
  static getStats(): {
    cachedCards: number;
    loadingCards: number;
    averageLoadTime: number;
  } {
    const loadTimes = Array.from(this.cache.values()).map(card => card.loadTime);
    const averageLoadTime = loadTimes.length > 0
      ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length
      : 0;

    return {
      cachedCards: this.cache.size,
      loadingCards: this.loadingPromises.size,
      averageLoadTime,
    };
  }
}

// 導出便捷方法
export const loadCard = (type: string) => CardLoader.loadCard(type);
export const loadForRoute = (route: string) => CardLoader.loadForRoute(route);
export const prefetchCards = (types: string[]) => CardLoader.prefetch(types);