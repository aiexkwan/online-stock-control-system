/**
 * Performance Monitor - Main Entry Point
 * 
 * 重新導出 SimplePerformanceMonitor 的功能以保持向後兼容性
 */

export * from './SimplePerformanceMonitor';
export { SimplePerformanceMonitor as PerformanceMonitor } from './SimplePerformanceMonitor';

// 創建默認實例
import { SimplePerformanceMonitor } from './SimplePerformanceMonitor';
export const performanceMonitor = SimplePerformanceMonitor.getInstance();

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