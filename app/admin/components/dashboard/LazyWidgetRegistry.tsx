/**
 * Lazy Widget Registry
 * 提供懶加載版本嘅 widgets
 * 擴展版本 - 支援新的 Widget 註冊系統但保持向後兼容
 */

import React, { lazy, Suspense } from 'react';
import { WidgetType, WidgetComponentProps } from '@/app/types/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { widgetRegistry } from '@/lib/widgets/enhanced-registry';
import { getRoutePreloadWidgets } from '@/lib/widgets/widget-mappings';

// Default loading skeleton
const DefaultWidgetSkeleton = () => (
  <div className="h-full w-full p-4 space-y-3">
    <Skeleton className="h-6 w-3/4 bg-slate-700" />
    <Skeleton className="h-4 w-1/2 bg-slate-700" />
    <Skeleton className="h-32 w-full bg-slate-700" />
  </div>
);

// Create lazy wrapper for a widget
export function createLazyWidget(
  importFn: () => Promise<{ default: React.ComponentType<WidgetComponentProps> } | any>,
  LoadingComponent: React.ComponentType = DefaultWidgetSkeleton
): React.ComponentType<WidgetComponentProps> {
  // Wrap import function to ensure it returns the correct format for React.lazy
  const wrappedImportFn = async (): Promise<{ default: React.ComponentType<WidgetComponentProps> }> => {
    const importedModule = await importFn();
    // Handle both default exports and named exports
    if (importedModule.default) {
      return { default: importedModule.default };
    } else if (typeof importedModule === 'function') {
      return { default: importedModule };
    } else {
      // Try to get the first exported component
      const componentName = Object.keys(importedModule).find(key => 
        typeof importedModule[key] === 'function' && key !== 'default'
      );
      if (componentName) {
        return { default: importedModule[componentName] };
      }
      throw new Error('No valid component found in module');
    }
  };
  
  const LazyComponent = lazy<React.ComponentType<WidgetComponentProps>>(wrappedImportFn);
  
  return React.memo(function LazyWidget(props: WidgetComponentProps) {
    return (
      <Suspense fallback={<LoadingComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  });
}

// Lazy loaded widgets map
export const LazyWidgets: Partial<Record<WidgetType, React.ComponentType<WidgetComponentProps>>> = {
  // Heavy widgets that benefit from lazy loading
  
  
  
  
  
};

// Component-based lazy widgets (for AdminWidgetRenderer)
export const LazyComponents: Record<string, React.ComponentType<any>> = {
  'StockDistributionChart': createLazyWidget(
    () => import('./widgets/StockDistributionChartV2')
  ),
  'StockDistributionChartV2': createLazyWidget(
    () => import('./widgets/StockDistributionChartV2')
  ),
  'StockLevelHistoryChart': createLazyWidget(
    () => import('./widgets/StockLevelHistoryChart')
  ),
  'WarehouseWorkLevelAreaChart': createLazyWidget(
    () => import('./widgets/WarehouseWorkLevelAreaChart')
  ),
  'InventoryOrderedAnalysisWidget': createLazyWidget(
    () => import('./widgets/InventoryOrderedAnalysisWidget')
  ),
  'AcoOrderProgressChart': createLazyWidget(
    () => import('./charts/AcoOrderProgressChart')
  ),
  
  // Stats widgets
  'StatsCardWidget': createLazyWidget(
    () => import('./widgets/StatsCardWidget')
  ),
  'AwaitLocationQtyWidget': createLazyWidget(
    () => import('./widgets/AwaitLocationQtyWidget')
  ),
  'YesterdayTransferCountWidget': createLazyWidget(
    () => import('./widgets/YesterdayTransferCountWidget')
  ),
  'WarehouseTransferListWidget': createLazyWidget(
    () => import('./widgets/WarehouseTransferListWidget')
  ),
  
  // Production widgets (Server Actions versions)
  'ProductionDetailsWidget': createLazyWidget(
    () => import('./widgets/ProductionDetailsWidget')
  ),
  'ProductionStatsWidget': createLazyWidget(
    () => import('./widgets/ProductionStatsWidget')
  ),
  'InjectionProductionStatsWidget': createLazyWidget(
    () => import('./widgets/InjectionProductionStatsWidget')
  ),
  'TopProductsByQuantityWidget': createLazyWidget(
    () => import('./widgets/TopProductsByQuantityWidget')
  ),
  'TopProductsDistributionWidget': createLazyWidget(
    () => import('./widgets/TopProductsDistributionWidget')
  ),
  'TopProductsChartWidget': createLazyWidget(
    () => import('./widgets/TopProductsChartWidget')
  ),
  'ProductDistributionChartWidget': createLazyWidget(
    () => import('./widgets/ProductDistributionChartWidget')
  ),
  
  // 分析類重型 widget (named exports)
  'AnalysisPagedWidget': createLazyWidget(
    () => import('./widgets/AnalysisPagedWidgetV2')
  ),
  'AnalysisPagedWidgetV2': createLazyWidget(
    () => import('./widgets/AnalysisPagedWidgetV2')
  ),
  'AnalysisExpandableCards': createLazyWidget(
    () => import('./widgets/AnalysisExpandableCards')
  ),
  
  // 報表類重型 widget (named exports)
  'ReportGeneratorWidget': createLazyWidget(
    () => import('./widgets/ReportGeneratorWithDialogWidgetV2')
  ),
  'ReportGeneratorWithDialogWidget': createLazyWidget(
    () => import('./widgets/ReportGeneratorWithDialogWidgetV2')
  ),
  
  // History widget (named export)
  'HistoryTree': createLazyWidget(
    () => import('./widgets/HistoryTreeV2')
  ),
  
  // Upload page widgets (named exports)
  'OrdersListWidget': createLazyWidget(
    () => import('./widgets/OrdersListWidgetV2')
  ),
  'OrdersListWidgetV2': createLazyWidget(
    () => import('./widgets/OrdersListWidgetV2')
  ),
  'OtherFilesListWidget': createLazyWidget(
    () => import('./widgets/OtherFilesListWidgetV2')
  ),
  'OtherFilesListWidgetV2': createLazyWidget(
    () => import('./widgets/OtherFilesListWidgetV2')
  ),
  'UploadFilesWidget': createLazyWidget(
    () => import('./widgets/UploadFilesWidget')
  ),
  'UploadOrdersWidget': createLazyWidget(
    () => import('./widgets/UploadOrdersWidgetV2')
  ),
  'UploadProductSpecWidget': createLazyWidget(
    () => import('./widgets/UploadProductSpecWidget')
  ),
  'UploadPhotoWidget': createLazyWidget(
    () => import('./widgets/UploadPhotoWidget')
  ),
  
  // Product Update widget (named export)
  'ProductUpdateWidget': createLazyWidget(
    () => import('./widgets/ProductUpdateWidget')
  ),
  
  // Supplier Update widget (named export)
  'SupplierUpdateWidget': createLazyWidget(
    () => import('./widgets/SupplierUpdateWidgetV2')
  ),
  'SupplierUpdateWidgetV2': createLazyWidget(
    () => import('./widgets/SupplierUpdateWidgetV2')
  ),
  
  // Void Pallet widget (named export)
  'VoidPalletWidget': createLazyWidget(
    () => import('./widgets/VoidPalletWidget')
  ),
  
  // Reprint Label widget (named export)
  'ReprintLabelWidget': createLazyWidget(
    () => import('./widgets/ReprintLabelWidget')
  ),
  
  // Transaction Report widget (named export)
  'TransactionReportWidget': createLazyWidget(
    () => import('./widgets/TransactionReportWidget')
  ),
  
  // GRN Report widget (named export)
  'GrnReportWidget': createLazyWidget(
    () => import('./widgets/GrnReportWidgetV2')
  ),
  'GrnReportWidgetV2': createLazyWidget(
    () => import('./widgets/GrnReportWidgetV2')
  ),
  
  // ACO Order Report widget (named export)
  'AcoOrderReportWidget': createLazyWidget(
    () => import('./widgets/AcoOrderReportWidgetV2')
  ),
  'AcoOrderReportWidgetV2': createLazyWidget(
    () => import('./widgets/AcoOrderReportWidgetV2')
  ),
  
  // Report Generator widgets
  'ReportGeneratorWithDialogWidgetV2': createLazyWidget(
    () => import('./widgets/ReportGeneratorWithDialogWidgetV2')
  ),
  
  // Order State List widget
  'OrderStateListWidgetV2': createLazyWidget(
    () => import('./widgets/OrderStateListWidgetV2')
  ),
};

// Helper to check if widget should be lazy loaded
export function shouldLazyLoad(widgetType: WidgetType): boolean {
  return widgetType in LazyWidgets;
}

// Get lazy or regular component
export function getWidgetComponent(
  widgetType: WidgetType,
  regularComponent: React.ComponentType<WidgetComponentProps>
): React.ComponentType<WidgetComponentProps> {
  return LazyWidgets[widgetType] || regularComponent;
}

// 新增：初始化增強版註冊表（向後兼容）
export async function initializeEnhancedRegistry(): Promise<void> {
  try {
    // 自動註冊所有已知的 widgets
    await widgetRegistry.autoRegisterWidgets();
    
    // 註冊現有的懶加載組件到新系統
    Object.entries(LazyComponents).forEach(([widgetId, component]) => {
      const existingDef = widgetRegistry.getDefinition(widgetId);
      if (existingDef) {
        // 更新現有定義，添加組件
        widgetRegistry.register({
          ...existingDef,
          component,
          lazyLoad: true
        });
      }
    });
    
    console.log('[LazyWidgetRegistry] Enhanced registry initialized');
  } catch (error) {
    console.error('[LazyWidgetRegistry] Failed to initialize enhanced registry:', error);
  }
}

// 新增：預加載路由相關的 widgets
export async function preloadRouteWidgets(route: string): Promise<void> {
  const widgetIds = getRoutePreloadWidgets(route);
  if (widgetIds.length > 0) {
    console.log(`[LazyWidgetRegistry] Preloading widgets for route: ${route}`);
    await widgetRegistry.preloadWidgets(widgetIds);
  }
}

// 新增：獲取組件（支援新舊系統）
export function getEnhancedWidgetComponent(
  widgetId: string,
  enableGraphQL: boolean = false
): React.ComponentType<any> | undefined {
  // 首先嘗試從新系統獲取
  const enhancedComponent = widgetRegistry.getWidgetComponent(widgetId, enableGraphQL);
  if (enhancedComponent) {
    return enhancedComponent;
  }
  
  // 回退到舊系統
  return LazyComponents[widgetId];
}

// 新增：性能監控包裝器
export function withPerformanceTracking<P extends WidgetComponentProps>(
  WidgetComponent: React.ComponentType<P>,
  widgetId: string
): React.ComponentType<P> {
  return React.memo(function TrackedWidget(props: P) {
    // Widget 使用記錄已簡化
    
    return <WidgetComponent {...props} />;
  });
}

// 新增：OptimizedWidgetLoader - 智能 widget 載入器
export class OptimizedWidgetLoader {
  private static instance: OptimizedWidgetLoader;
  private loadingQueue: Map<string, Promise<any>> = new Map();
  private loadedComponents: Map<string, React.ComponentType<any>> = new Map();
  private routeWidgetMap: Map<string, Set<string>> = new Map();
  private networkObserver: NetworkObserver | null = null;
  
  private constructor() {
    // 初始化網絡觀察器
    if (typeof window !== 'undefined' && 'connection' in navigator) {
      this.networkObserver = new NetworkObserver((status) => {
        this.adjustLoadingStrategy(status);
      });
    }
  }
  
  static getInstance(): OptimizedWidgetLoader {
    if (!OptimizedWidgetLoader.instance) {
      OptimizedWidgetLoader.instance = new OptimizedWidgetLoader();
    }
    return OptimizedWidgetLoader.instance;
  }
  
  // 基於路由的智能預加載
  async preloadForRoute(route: string): Promise<void> {
    const widgetIds = getRoutePreloadWidgets(route);
    
    // 根據網絡狀況調整預加載策略
    const networkSpeed = this.getNetworkSpeed();
    const priorityWidgets = this.prioritizeWidgets(widgetIds, networkSpeed);
    
    // 並行預加載高優先級 widgets
    const highPriorityPromises = priorityWidgets.high.map(id => 
      this.loadWidget(id, 'high')
    );
    
    await Promise.all(highPriorityPromises);
    
    // 低優先級 widgets 在空閒時加載
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        priorityWidgets.low.forEach(id => this.loadWidget(id, 'low'));
      }, { timeout: 5000 });
    } else {
      setTimeout(() => {
        priorityWidgets.low.forEach(id => this.loadWidget(id, 'low'));
      }, 1000);
    }
  }
  
  // 加載單個 widget
  private async loadWidget(
    widgetId: string, 
    priority: 'high' | 'low' = 'low'
  ): Promise<React.ComponentType<any> | undefined> {
    // 檢查是否已加載
    if (this.loadedComponents.has(widgetId)) {
      return this.loadedComponents.get(widgetId);
    }
    
    // 檢查是否正在加載
    if (this.loadingQueue.has(widgetId)) {
      return this.loadingQueue.get(widgetId);
    }
    
    // 創建加載 promise
    const loadPromise = this.performLoad(widgetId, priority);
    this.loadingQueue.set(widgetId, loadPromise);
    
    try {
      const component = await loadPromise;
      this.loadedComponents.set(widgetId, component);
      this.loadingQueue.delete(widgetId);
      return component;
    } catch (error) {
      console.error(`[OptimizedWidgetLoader] Failed to load widget ${widgetId}:`, error);
      this.loadingQueue.delete(widgetId);
      return undefined;
    }
  }
  
  // 執行實際加載
  private async performLoad(
    widgetId: string,
    priority: 'high' | 'low'
  ): Promise<React.ComponentType<any>> {
    // 使用 webpack magic comments 優化加載
    const loadFn = LazyComponents[widgetId];
    
    if (!loadFn) {
      // 嘗試從增強註冊表加載
      const definition = widgetRegistry.getDefinition(widgetId);
      if (definition?.lazyLoad && definition.component) {
        return definition.component;
      }
      throw new Error(`Widget ${widgetId} not found`);
    }
    
    return loadFn;
  }
  
  // 根據網絡狀況調整加載策略
  private adjustLoadingStrategy(networkStatus: NetworkStatus): void {
    if (networkStatus.effectiveType === '4g' && !networkStatus.saveData) {
      // 良好網絡，積極預加載
      this.aggressivePreload();
    } else if (networkStatus.effectiveType === '3g' || networkStatus.saveData) {
      // 一般網絡或省流模式，保守加載
      this.conservativeLoad();
    } else {
      // 差網絡，最小化加載
      this.minimalLoad();
    }
  }
  
  // 積極預加載策略
  private aggressivePreload(): void {
    // 預加載所有可能用到的 widgets
    Object.keys(LazyComponents).forEach(widgetId => {
      this.loadWidget(widgetId, 'low');
    });
  }
  
  // 保守加載策略
  private conservativeLoad(): void {
    // 只預加載核心 widgets
    const coreWidgets = ['StatsCardWidget', 'HistoryTree'];
    coreWidgets.forEach(widgetId => {
      this.loadWidget(widgetId, 'high');
    });
  }
  
  // 最小化加載策略
  private minimalLoad(): void {
    // 不進行任何預加載
    console.log('[OptimizedWidgetLoader] Minimal load mode - no preloading');
  }
  
  // 獲取網絡速度
  private getNetworkSpeed(): 'fast' | 'medium' | 'slow' {
    if (!this.networkObserver) return 'medium';
    
    const connection = (navigator as any).connection;
    if (!connection) return 'medium';
    
    if (connection.effectiveType === '4g' && connection.downlink > 10) {
      return 'fast';
    } else if (connection.effectiveType === '3g' || connection.downlink > 2) {
      return 'medium';
    }
    return 'slow';
  }
  
  // 根據網絡狀況優先級排序 widgets
  private prioritizeWidgets(
    widgetIds: string[], 
    networkSpeed: 'fast' | 'medium' | 'slow'
  ): { high: string[], low: string[] } {
    // 定義核心 widgets
    const coreWidgets = new Set([
      'StatsCardWidget',
      'HistoryTree'
    ]);
    
    const high: string[] = [];
    const low: string[] = [];
    
    widgetIds.forEach(id => {
      if (coreWidgets.has(id) || networkSpeed === 'fast') {
        high.push(id);
      } else {
        low.push(id);
      }
    });
    
    return { high, low };
  }
  
  // 清理緩存
  clearCache(): void {
    this.loadedComponents.clear();
    this.loadingQueue.clear();
  }
}

// 網絡狀態類型
interface NetworkStatus {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

// 網絡觀察器
class NetworkObserver {
  private callback: (status: NetworkStatus) => void;
  
  constructor(callback: (status: NetworkStatus) => void) {
    this.callback = callback;
    this.startObserving();
  }
  
  private startObserving(): void {
    const connection = (navigator as any).connection;
    if (!connection) return;
    
    // 監聽網絡變化
    connection.addEventListener('change', () => {
      this.callback(this.getStatus());
    });
    
    // 初始回調
    this.callback(this.getStatus());
  }
  
  private getStatus(): NetworkStatus {
    const connection = (navigator as any).connection;
    return {
      effectiveType: connection.effectiveType || '4g',
      downlink: connection.downlink || 10,
      rtt: connection.rtt || 100,
      saveData: connection.saveData || false
    };
  }
}

// 導出 OptimizedWidgetLoader 實例
export const optimizedWidgetLoader = OptimizedWidgetLoader.getInstance();