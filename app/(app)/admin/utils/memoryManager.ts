/**
 * 記憶體管理工具 - memoryManager.ts
 *
 * 職責：
 * - 監控組件記憶體使用情況
 * - 檢測記憶體洩漏模式
 * - 提供記憶體優化建議
 * - 實現記憶體使用追蹤
 */

// 記憶體監控指標
export interface MemoryMetrics {
  /** 組件名稱 */
  componentName: string;
  /** 記憶體使用量 (MB) */
  memoryUsage: number;
  /** 掛載時間戳 */
  mountTime: number;
  /** 最後更新時間戳 */
  lastUpdate: number;
  /** 渲染次數 */
  renderCount: number;
  /** 事件監聽器數量 */
  eventListeners: number;
  /** 定時器數量 */
  timers: number;
  /** Promise 數量 */
  promises: number;
}

// 記憶體追蹤項目
interface MemoryTrackingItem {
  type: 'listener' | 'timer' | 'promise' | 'subscription';
  id: string;
  componentName: string;
  createdAt: number;
  cleanup?: () => void;
}

// 記憶體洩漏警告
export interface MemoryLeakWarning {
  componentName: string;
  type: 'excessive-memory' | 'uncleaned-listeners' | 'timer-leak' | 'promise-leak';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestions: string[];
  timestamp: number;
}

class MemoryManager {
  private static instance: MemoryManager;
  private metrics = new Map<string, MemoryMetrics>();
  private trackingItems = new Map<string, MemoryTrackingItem>();
  private warnings: MemoryLeakWarning[] = [];
  private cleanupCallbacks = new Map<string, (() => void)[]>();
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development';
    this.startGlobalMonitoring();
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * 註冊組件記憶體監控
   */
  registerComponent(componentName: string): string {
    if (!this.isEnabled) return '';

    const componentId = `${componentName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const initialMetrics: MemoryMetrics = {
      componentName,
      memoryUsage: this.getCurrentMemoryUsage(),
      mountTime: Date.now(),
      lastUpdate: Date.now(),
      renderCount: 0,
      eventListeners: 0,
      timers: 0,
      promises: 0,
    };

    this.metrics.set(componentId, initialMetrics);
    this.cleanupCallbacks.set(componentId, []);

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Memory tracking started for ${componentName} (${componentId})`);
    }

    return componentId;
  }

  /**
   * 更新組件記憶體指標
   */
  updateMetrics(componentId: string, updates: Partial<MemoryMetrics>): void {
    if (!this.isEnabled || !componentId) return;

    const currentMetrics = this.metrics.get(componentId);
    if (!currentMetrics) return;

    const updatedMetrics = {
      ...currentMetrics,
      ...updates,
      lastUpdate: Date.now(),
    };

    this.metrics.set(componentId, updatedMetrics);
    this.checkForMemoryLeaks(componentId, updatedMetrics);
  }

  /**
   * 追蹤記憶體項目（事件監聽器、定時器等）
   */
  trackMemoryItem(
    componentId: string,
    type: MemoryTrackingItem['type'],
    itemId: string,
    cleanup?: () => void
  ): void {
    if (!this.isEnabled || !componentId) return;

    const trackingId = `${componentId}_${type}_${itemId}`;
    const trackingItem: MemoryTrackingItem = {
      type,
      id: itemId,
      componentName: this.metrics.get(componentId)?.componentName || 'Unknown',
      createdAt: Date.now(),
      cleanup,
    };

    this.trackingItems.set(trackingId, trackingItem);

    // 更新組件指標
    const metrics = this.metrics.get(componentId);
    if (metrics) {
      const updatedMetrics = { ...metrics };

      switch (type) {
        case 'listener':
          updatedMetrics.eventListeners++;
          break;
        case 'timer':
          updatedMetrics.timers++;
          break;
        case 'promise':
          updatedMetrics.promises++;
          break;
      }

      this.updateMetrics(componentId, updatedMetrics);
    }
  }

  /**
   * 移除記憶體項目追蹤
   */
  untrackMemoryItem(componentId: string, type: MemoryTrackingItem['type'], itemId: string): void {
    if (!this.isEnabled || !componentId) return;

    const trackingId = `${componentId}_${type}_${itemId}`;
    const trackingItem = this.trackingItems.get(trackingId);

    if (trackingItem?.cleanup) {
      try {
        trackingItem.cleanup();
      } catch (error) {
        console.warn(`Failed to cleanup ${type} ${itemId}:`, error);
      }
    }

    this.trackingItems.delete(trackingId);

    // 更新組件指標
    const metrics = this.metrics.get(componentId);
    if (metrics) {
      const updatedMetrics = { ...metrics };

      switch (type) {
        case 'listener':
          updatedMetrics.eventListeners = Math.max(0, updatedMetrics.eventListeners - 1);
          break;
        case 'timer':
          updatedMetrics.timers = Math.max(0, updatedMetrics.timers - 1);
          break;
        case 'promise':
          updatedMetrics.promises = Math.max(0, updatedMetrics.promises - 1);
          break;
      }

      this.updateMetrics(componentId, updatedMetrics);
    }
  }

  /**
   * 註冊清理回調
   */
  registerCleanupCallback(componentId: string, cleanup: () => void): void {
    if (!this.isEnabled || !componentId) return;

    const callbacks = this.cleanupCallbacks.get(componentId) || [];
    callbacks.push(cleanup);
    this.cleanupCallbacks.set(componentId, callbacks);
  }

  /**
   * 清理組件記憶體
   */
  cleanupComponent(componentId: string): void {
    if (!this.isEnabled || !componentId) return;

    const metrics = this.metrics.get(componentId);
    if (!metrics) return;

    // 執行所有清理回調
    const callbacks = this.cleanupCallbacks.get(componentId) || [];
    callbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn(`Cleanup callback failed for ${metrics.componentName}:`, error);
      }
    });

    // 清理所有追蹤項目
    Array.from(this.trackingItems.keys())
      .filter(trackingId => trackingId.startsWith(componentId))
      .forEach(trackingId => {
        const trackingItem = this.trackingItems.get(trackingId);
        if (trackingItem?.cleanup) {
          try {
            trackingItem.cleanup();
          } catch (error) {
            console.warn(`Failed to cleanup tracking item ${trackingId}:`, error);
          }
        }
        this.trackingItems.delete(trackingId);
      });

    // 移除記錄
    this.metrics.delete(componentId);
    this.cleanupCallbacks.delete(componentId);

    if (process.env.NODE_ENV === 'development') {
      console.log(`🧹 Memory cleanup completed for ${metrics.componentName} (${componentId})`);
    }
  }

  /**
   * 檢測記憶體洩漏
   */
  private checkForMemoryLeaks(componentId: string, metrics: MemoryMetrics): void {
    const warnings: MemoryLeakWarning[] = [];

    // 檢測過度記憶體使用
    if (metrics.memoryUsage > 50) {
      // 50MB 閾值
      warnings.push({
        componentName: metrics.componentName,
        type: 'excessive-memory',
        severity: metrics.memoryUsage > 100 ? 'critical' : 'high',
        description: `Component is using ${metrics.memoryUsage}MB of memory`,
        suggestions: [
          'Check for large objects or arrays that can be optimized',
          'Consider implementing virtualization for large lists',
          'Review memo and callback dependencies',
        ],
        timestamp: Date.now(),
      });
    }

    // 檢測未清理的事件監聽器
    if (metrics.eventListeners > 10) {
      warnings.push({
        componentName: metrics.componentName,
        type: 'uncleaned-listeners',
        severity: metrics.eventListeners > 20 ? 'high' : 'medium',
        description: `Component has ${metrics.eventListeners} active event listeners`,
        suggestions: [
          'Ensure all event listeners are removed in useEffect cleanup',
          'Use AbortController for better event management',
          'Consider using custom hooks for event management',
        ],
        timestamp: Date.now(),
      });
    }

    // 檢測定時器洩漏
    if (metrics.timers > 5) {
      warnings.push({
        componentName: metrics.componentName,
        type: 'timer-leak',
        severity: metrics.timers > 10 ? 'high' : 'medium',
        description: `Component has ${metrics.timers} active timers`,
        suggestions: [
          'Clear all intervals and timeouts in useEffect cleanup',
          'Use AbortController to cancel async operations',
          'Consider using a custom hook for timer management',
        ],
        timestamp: Date.now(),
      });
    }

    // 檢測Promise洩漏
    if (metrics.promises > 10) {
      warnings.push({
        componentName: metrics.componentName,
        type: 'promise-leak',
        severity: metrics.promises > 20 ? 'high' : 'medium',
        description: `Component has ${metrics.promises} pending promises`,
        suggestions: [
          'Implement proper promise cancellation',
          'Use AbortController for fetch requests',
          'Check for unresolved promises in async operations',
        ],
        timestamp: Date.now(),
      });
    }

    // 添加警告到列表
    warnings.forEach(warning => this.addWarning(warning));
  }

  /**
   * 添加記憶體洩漏警告
   */
  private addWarning(warning: MemoryLeakWarning): void {
    this.warnings.push(warning);

    // 只保留最近100個警告
    if (this.warnings.length > 100) {
      this.warnings = this.warnings.slice(-100);
    }

    if (process.env.NODE_ENV === 'development') {
      const emoji = {
        low: '💛',
        medium: '🧡',
        high: '❤️',
        critical: '🚨',
      }[warning.severity];

      console.warn(
        `${emoji} Memory Warning [${warning.severity.toUpperCase()}]: ${warning.componentName} - ${warning.description}`
      );

      if (warning.suggestions.length > 0) {
        console.log('💡 Suggestions:', warning.suggestions);
      }
    }
  }

  /**
   * 獲取當前記憶體使用量
   */
  private getCurrentMemoryUsage(): number {
    if (
      typeof window !== 'undefined' &&
      'performance' in window &&
      'memory' in window.performance
    ) {
      // @ts-ignore
      return Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }

  /**
   * 啟動全局記憶體監控
   */
  private startGlobalMonitoring(): void {
    if (!this.isEnabled || typeof window === 'undefined') return;

    // 監控頁面可見性變化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.performGlobalCleanup();
      }
    });

    // 監控頁面卸載
    window.addEventListener('beforeunload', () => {
      this.performGlobalCleanup();
    });

    // 定期記憶體檢查
    setInterval(() => {
      this.performMemoryCheck();
    }, 30000); // 30秒檢查一次
  }

  /**
   * 執行全局清理
   */
  private performGlobalCleanup(): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 Performing global memory cleanup...');
    }

    // 清理過期的追蹤項目
    const now = Date.now();
    const expireTime = 5 * 60 * 1000; // 5分鐘

    Array.from(this.trackingItems.entries()).forEach(([trackingId, item]) => {
      if (now - item.createdAt > expireTime) {
        if (item.cleanup) {
          try {
            item.cleanup();
          } catch (error) {
            console.warn(`Global cleanup failed for ${trackingId}:`, error);
          }
        }
        this.trackingItems.delete(trackingId);
      }
    });
  }

  /**
   * 執行記憶體檢查
   */
  private performMemoryCheck(): void {
    const currentMemory = this.getCurrentMemoryUsage();

    if (currentMemory > 100) {
      // 100MB 閾值
      console.warn(`🚨 High memory usage detected: ${currentMemory}MB`);

      // 觸發垃圾回收建議
      if (window.gc) {
        window.gc();
      }
    }
  }

  /**
   * 獲取記憶體統計報告
   */
  getMemoryReport(): {
    totalComponents: number;
    totalMemoryUsage: number;
    warnings: MemoryLeakWarning[];
    componentSummary: Array<{
      name: string;
      memoryUsage: number;
      age: number;
      renderCount: number;
      activeTracking: number;
    }>;
  } {
    const componentSummary = Array.from(this.metrics.values()).map(metrics => ({
      name: metrics.componentName,
      memoryUsage: metrics.memoryUsage,
      age: Date.now() - metrics.mountTime,
      renderCount: metrics.renderCount,
      activeTracking: metrics.eventListeners + metrics.timers + metrics.promises,
    }));

    return {
      totalComponents: this.metrics.size,
      totalMemoryUsage: componentSummary.reduce((sum, comp) => sum + comp.memoryUsage, 0),
      warnings: [...this.warnings],
      componentSummary,
    };
  }

  /**
   * 清除所有記憶體追蹤
   */
  clearAll(): void {
    Array.from(this.metrics.keys()).forEach(componentId => {
      this.cleanupComponent(componentId);
    });

    this.metrics.clear();
    this.trackingItems.clear();
    this.warnings.length = 0;
    this.cleanupCallbacks.clear();
  }
}

// 單例導出
export const memoryManager = MemoryManager.getInstance();

// 全局類型聲明
declare global {
  interface Window {
    gc?: () => void;
    __MEMORY_MANAGER__?: MemoryManager;
  }
}

// 在開發環境中暴露到 window 對象
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.__MEMORY_MANAGER__ = memoryManager;
}
