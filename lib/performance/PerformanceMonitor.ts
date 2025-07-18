/**
 * Performance Monitor - Enhanced Main Entry Point
 * 
 * 整合 Web Vitals 監控和性能預算管理功能
 */

export * from './SimplePerformanceMonitor';
export * from './WebVitalsCollector';
export * from './PerformanceBudgetManager';

export { SimplePerformanceMonitor as PerformanceMonitor } from './SimplePerformanceMonitor';

// 創建默認實例
import { SimplePerformanceMonitor } from './SimplePerformanceMonitor';
import { getWebVitalsCollector, initializeWebVitals } from './WebVitalsCollector';
import { PerformanceBudgetManager } from './PerformanceBudgetManager';

export const performanceMonitor = SimplePerformanceMonitor.getInstance();
export const webVitalsCollector = getWebVitalsCollector();

// 創建預算管理器實例
let budgetManager: PerformanceBudgetManager | null = null;

/**
 * 獲取性能預算管理器
 */
export function getBudgetManager(): PerformanceBudgetManager {
  if (!budgetManager) {
    budgetManager = new PerformanceBudgetManager(webVitalsCollector, performanceMonitor);
  }
  return budgetManager;
}

/**
 * 初始化完整的性能監控系統
 */
export function initializePerformanceMonitoring(): void {
  // 初始化 Web Vitals 收集
  initializeWebVitals();
  
  // 初始化預算管理器
  getBudgetManager();
  
  console.log('[PerformanceMonitor] Enhanced monitoring system initialized');
}

// 導出類型
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: string;
}

export interface PerformanceAlert {
  type: 'warning' | 'critical';
  message: string;
  timestamp: number;
  metric?: PerformanceMetric;
}

// 便利函數
export const initPerformanceMonitoring = initializePerformanceMonitoring; 