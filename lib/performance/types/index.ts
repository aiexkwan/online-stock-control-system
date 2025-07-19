/**
 * Performance Monitoring Types
 * 性能監控系統類型定義
 * 
 * 統一所有性能監控相關的 TypeScript 類型定義
 */

// 基本性能指標接口
export interface SimpleMetric {
  name: string;
  value: number;
  timestamp: number;
  category: string;
}

// 簡化的統計數據接口
export interface SimpleStats {
  avg: number;
  max: number;
  min: number;
  count: number;
  total: number;
  mean: number; // 添加 mean 屬性作為 avg 的別名
  stdDev: number; // 添加標準差計算
}

// 簡化的配置接口
export interface SimpleConfig {
  enabled: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  maxMetrics: number;
  thresholds: {
    loadTime: number;
    renderTime: number;
    memoryUsage: number;
  };
}

// 警報接口
export interface PerformanceAlert {
  type: 'warning' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  category: string;
}

// 性能 API 類型定義
export interface PerformanceMemoryInfo {
  readonly usedJSHeapSize: number;
  readonly totalJSHeapSize: number;
  readonly jsHeapSizeLimit: number;
}

export interface PerformanceWithMemory extends Performance {
  readonly memory?: PerformanceMemoryInfo;
}

export interface WindowWithPerformance extends Window {
  readonly performance: PerformanceWithMemory;
}

// Console 類型定義
export interface ConsoleWithLevels {
  error: (message?: string, ...optionalParams: unknown[]) => void;
  warn: (message?: string, ...optionalParams: unknown[]) => void;
  info: (message?: string, ...optionalParams: unknown[]) => void;
  debug: (message?: string, ...optionalParams: unknown[]) => void;
}

// 性能摘要類型
export interface PerformanceSummary {
  totalMetrics: number;
  categories: string[];
  alertCount: number;
  activeCategories: string[];
  recentAlerts: number;
  memoryUsage: number;
}

// 性能導出數據類型
export interface PerformanceExportData {
  metrics: Record<string, SimpleMetric[]>;
  alerts: PerformanceAlert[];
  summary: PerformanceSummary;
}

// 性能監控報告類型
export interface PerformanceMonitorReport extends PerformanceSummary {
  timestamp: string;
}

// Hook 返回結果類型
export interface StopMonitoringResult {
  success: boolean;
  duration: number;
  finalReport: PerformanceMonitorReport;
  metricsCount: number;
}

// 性能測量選項
export interface PerformanceMeasureOptions {
  category?: string;
  tags?: Record<string, string>;
  threshold?: number;
}

// 性能計時器狀態
export interface PerformanceTimerState {
  startTime: number;
  renderStartTime?: number;
  dataFetchStartTime?: number;
  endTime?: number;
}

// 性能監控選項
export interface PerformanceMonitorOptions {
  autoStart?: boolean;
  reportInterval?: number;
  onAlert?: (alert: PerformanceAlert) => void;
  enabledCategories?: string[];
  maxMetricsPerCategory?: number;
}

// 兼容性類型 (向後兼容舊系統)
export interface LegacyPerformanceMetric {
  name: string;
  category: 'render' | 'api' | 'database' | 'component' | 'general';
  value: number;
  metadata?: Record<string, unknown>;
}

// 導出所有類型的統一接口
export interface PerformanceTypes {
  SimpleMetric: SimpleMetric;
  SimpleStats: SimpleStats;
  SimpleConfig: SimpleConfig;
  PerformanceAlert: PerformanceAlert;
  PerformanceSummary: PerformanceSummary;
  PerformanceExportData: PerformanceExportData;
  PerformanceMonitorReport: PerformanceMonitorReport;
  StopMonitoringResult: StopMonitoringResult;
  PerformanceMemoryInfo: PerformanceMemoryInfo;
  PerformanceWithMemory: PerformanceWithMemory;
  WindowWithPerformance: WindowWithPerformance;
  ConsoleWithLevels: ConsoleWithLevels;
}

// 類型守衛函數
export function isPerformanceAlert(obj: unknown): obj is PerformanceAlert {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'type' in obj &&
    'message' in obj &&
    'metric' in obj &&
    'value' in obj &&
    'threshold' in obj &&
    'timestamp' in obj &&
    'category' in obj
  );
}

export function isSimpleMetric(obj: unknown): obj is SimpleMetric {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    'value' in obj &&
    'timestamp' in obj &&
    'category' in obj
  );
}

export function isPerformanceSummary(obj: unknown): obj is PerformanceSummary {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'totalMetrics' in obj &&
    'categories' in obj &&
    'alertCount' in obj &&
    'activeCategories' in obj &&
    'recentAlerts' in obj &&
    'memoryUsage' in obj
  );
}