/**
 * Performance Monitoring Module
 *
 * 提供系統性能監控功能
 */

// 主要導出
export * from './PerformanceMonitor';
export * from './hooks/usePerformanceMonitor';
export { PerformanceDashboard } from './components/PerformanceDashboardSimple';

// 便捷導出
export { performanceMonitor } from './PerformanceMonitor';

// PDF Performance Optimization Modules
export { PDFPerformanceMonitor, pdfPerformanceMonitor } from './pdf-performance-monitor';
export { PDFCacheOptimizer, pdfCacheOptimizer } from './pdf-cache-optimizer';
export { PDFRequestBatcher, pdfRequestBatcher } from './pdf-request-batcher';

// PDF Performance Types
export type {
  PerformanceMetrics,
  TimeSeriesData,
  RequestMetadata,
  PerformanceThresholds,
} from './pdf-performance-monitor';

export type { PDFCacheEntry, CacheStatistics, CacheConfig } from './pdf-cache-optimizer';

export type { BatchRequest, BatchConfig, BatchStatistics } from './pdf-request-batcher';
