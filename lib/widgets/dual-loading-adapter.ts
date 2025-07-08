/**
 * Dual Loading Adapter
 * 實施雙重加載機制，支援新舊系統並存
 */

import React from 'react';
import { WidgetComponentProps } from './types';
import { widgetRegistry } from './enhanced-registry';
import { dualRunVerifier, VerificationResult } from './dual-run-verification';
import { isDevelopment } from '@/lib/utils/env';

// Feature flag 控制新系統啟用
const ENABLE_WIDGET_REGISTRY_V2 = process.env.NEXT_PUBLIC_ENABLE_WIDGET_REGISTRY_V2 === 'true';

// 雙重加載配置
export interface DualLoadingConfig {
  enableV2: boolean;
  enableGraphQL: boolean;
  fallbackToLegacy: boolean;
  performanceMode: 'aggressive' | 'balanced' | 'conservative';
  enableVerification: boolean;
  verificationSampleRate: number; // 0-1, percentage of requests to verify
}

// 默認配置
const defaultConfig: DualLoadingConfig = {
  enableV2: ENABLE_WIDGET_REGISTRY_V2,
  enableGraphQL: process.env.NEXT_PUBLIC_ENABLE_GRAPHQL === 'true',
  fallbackToLegacy: true,
  performanceMode: 'balanced',
  enableVerification: isDevelopment(), // 開發環境默認開啟
  verificationSampleRate: 0.1 // 默認驗證 10% 的請求
};

// 全局配置
let globalConfig = { ...defaultConfig };

/**
 * 配置雙重加載系統
 */
export function configureDualLoading(config: Partial<DualLoadingConfig>): void {
  globalConfig = { ...globalConfig, ...config };
  console.log('[DualLoading] Configuration updated:', globalConfig);
}

/**
 * 獲取當前配置
 */
export function getDualLoadingConfig(): DualLoadingConfig {
  return { ...globalConfig };
}

/**
 * 雙重加載器 - 智能選擇新舊系統
 */
export class DualLoadingAdapter {
  private legacyComponents: Map<string, React.ComponentType<any>>;
  private loadingCache = new Map<string, Promise<React.ComponentType<any>>>();
  private verificationResults: VerificationResult[] = [];
  
  constructor() {
    this.legacyComponents = new Map();
  }
  
  /**
   * 註冊舊系統組件（用於向後兼容）
   */
  registerLegacyComponent(
    widgetId: string, 
    component: React.ComponentType<any>
  ): void {
    this.legacyComponents.set(widgetId, component);
    // 同時註冊到驗證器
    dualRunVerifier.registerLegacyComponent(widgetId, component);
  }
  
  /**
   * 註冊多個舊系統組件
   */
  registerLegacyComponents(
    components: Record<string, React.ComponentType<any>>
  ): void {
    Object.entries(components).forEach(([id, component]) => {
      this.registerLegacyComponent(id, component);
    });
  }
  
  /**
   * 獲取 widget 組件（智能選擇）
   */
  async getComponent(
    widgetId: string,
    options?: {
      preferV2?: boolean;
      enableGraphQL?: boolean;
      skipVerification?: boolean;
      props?: WidgetComponentProps; // 用於驗證的 props
    }
  ): Promise<React.ComponentType<WidgetComponentProps> | null> {
    const config = getDualLoadingConfig();
    const useV2 = options?.preferV2 ?? config.enableV2;
    const useGraphQL = options?.enableGraphQL ?? config.enableGraphQL;
    
    console.log(`[DualLoading] Loading widget: ${widgetId} (V2: ${useV2}, GraphQL: ${useGraphQL})`);
    
    // 檢查緩存
    const cacheKey = `${widgetId}_${useV2}_${useGraphQL}`;
    const cached = this.loadingCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    // 創建加載 promise
    const loadPromise = this.loadComponent(widgetId, useV2, useGraphQL) as Promise<React.ComponentType<any>>;
    this.loadingCache.set(cacheKey, loadPromise);
    
    // 決定是否需要運行驗證
    if (config.enableVerification && 
        !options?.skipVerification && 
        options?.props &&
        this.shouldRunVerification()) {
      // 異步運行驗證，不阻塞主流程
      this.runVerificationAsync(widgetId, options.props);
    }
    
    return loadPromise;
  }
  
  /**
   * 內部方法：加載組件
   */
  private async loadComponent(
    widgetId: string,
    useV2: boolean,
    useGraphQL: boolean
  ): Promise<React.ComponentType<WidgetComponentProps> | null> {
    try {
      // 嘗試從新系統加載
      if (useV2) {
        const v2Component = widgetRegistry.getWidgetComponent(widgetId, useGraphQL);
        if (v2Component) {
          console.log(`[DualLoading] Loaded from V2 registry: ${widgetId}`);
          widgetRegistry.recordUsage(widgetId);
          return v2Component;
        }
      }
      
      // 回退到舊系統
      if (globalConfig.fallbackToLegacy) {
        const legacyComponent = this.legacyComponents.get(widgetId);
        if (legacyComponent) {
          console.log(`[DualLoading] Loaded from legacy system: ${widgetId}`);
          return legacyComponent;
        }
      }
      
      console.warn(`[DualLoading] Widget not found: ${widgetId}`);
      return null;
      
    } catch (error) {
      console.error(`[DualLoading] Failed to load widget ${widgetId}:`, error);
      
      // 錯誤時嘗試回退
      if (globalConfig.fallbackToLegacy) {
        const legacyComponent = this.legacyComponents.get(widgetId);
        if (legacyComponent) {
          console.log(`[DualLoading] Fallback to legacy after error: ${widgetId}`);
          return legacyComponent;
        }
      }
      
      throw error;
    }
  }
  
  /**
   * 批量預加載 widgets
   */
  async preloadWidgets(
    widgetIds: string[],
    options?: {
      preferV2?: boolean;
      enableGraphQL?: boolean;
    }
  ): Promise<void> {
    const config = getDualLoadingConfig();
    const useV2 = options?.preferV2 ?? config.enableV2;
    
    if (useV2) {
      // 使用新系統的預加載
      await widgetRegistry.preloadWidgets(widgetIds);
    }
    
    // 同時預熱舊系統組件（如果需要）
    if (config.performanceMode === 'aggressive') {
      widgetIds.forEach(id => {
        this.getComponent(id, options);
      });
    }
  }
  
  /**
   * 獲取加載統計
   */
  getLoadingStats(): {
    v2Loaded: number;
    legacyLoaded: number;
    cacheHits: number;
    totalRequests: number;
  } {
    const v2Stats = widgetRegistry.getLoadStatistics();
    const v2Loaded = Array.from(v2Stats.values()).filter(
      item => item.loadStatus === 'loaded'
    ).length;
    
    return {
      v2Loaded,
      legacyLoaded: this.legacyComponents.size,
      cacheHits: this.loadingCache.size,
      totalRequests: v2Loaded + this.legacyComponents.size
    };
  }
  
  /**
   * 清除緩存
   */
  clearCache(): void {
    this.loadingCache.clear();
    console.log('[DualLoading] Cache cleared');
  }
  
  /**
   * A/B 測試支援
   */
  shouldUseV2(widgetId: string, userId?: string): boolean {
    const config = getDualLoadingConfig();
    
    // 如果全局啟用 V2，直接返回 true
    if (config.enableV2) {
      return true;
    }
    
    // 可以基於用戶 ID 或其他條件進行 A/B 測試
    if (userId) {
      // 簡單的哈希分組（示例）
      const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return hash % 100 < 50; // 50% 用戶使用 V2
    }
    
    return false;
  }
  
  /**
   * 決定是否運行驗證（基於採樣率）
   */
  private shouldRunVerification(): boolean {
    const config = getDualLoadingConfig();
    return Math.random() < config.verificationSampleRate;
  }
  
  /**
   * 異步運行驗證
   */
  private async runVerificationAsync(
    widgetId: string, 
    props: WidgetComponentProps
  ): Promise<void> {
    try {
      console.log(`[DualLoading] Running verification for ${widgetId}`);
      const result = await dualRunVerifier.verifyWidget(widgetId, props);
      
      // 記錄結果
      this.verificationResults.push(result);
      if (this.verificationResults.length > 1000) {
        this.verificationResults.shift(); // 保持最多 1000 條記錄
      }
      
      // 如果發現問題，記錄詳細信息
      if (!result.success && result.discrepancies && result.discrepancies.length > 0) {
        console.warn(`[DualLoading] Verification failed for ${widgetId}:`, {
          discrepancies: result.discrepancies,
          performanceDiff: `${result.newSystemTime - result.oldSystemTime}ms`
        });
      }
    } catch (error) {
      console.error(`[DualLoading] Verification error for ${widgetId}:`, error);
    }
  }
  
  /**
   * 手動運行驗證
   */
  async verifyWidget(
    widgetId: string,
    props: WidgetComponentProps
  ): Promise<VerificationResult> {
    return dualRunVerifier.verifyWidget(widgetId, props);
  }
  
  /**
   * 獲取驗證報告
   */
  getVerificationReport() {
    return dualRunVerifier.getVerificationReport();
  }
  
  /**
   * 獲取最近的驗證結果
   */
  getRecentVerificationResults(limit: number = 100): VerificationResult[] {
    return this.verificationResults.slice(-limit);
  }
}

// 導出單例實例
export const dualLoadingAdapter = new DualLoadingAdapter();

// 性能監控 hook
export function useDualLoadingPerformance() {
  const [stats, setStats] = React.useState(dualLoadingAdapter.getLoadingStats());
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats(dualLoadingAdapter.getLoadingStats());
    }, 5000); // 每 5 秒更新一次
    
    return () => clearInterval(interval);
  }, []);
  
  return stats;
}