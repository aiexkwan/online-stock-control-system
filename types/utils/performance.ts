/**
 * Performance Testing Types - Centralized
 * 統一管理性能測試相關類型定義
 */

export interface PerformanceTestResult {
  testName: string;
  duration: number;
  requestCount: number;
  avgRequestTime: number;
  maxRequestTime: number;
  minRequestTime: number;
  networkBytes?: number;
  cacheHitRate?: number;
  timestamp: Date;
}

export interface ComparisonResult {
  concurrentQuery: PerformanceTestResult;
  individualQueries: PerformanceTestResult;
  improvement: {
    timeSaved: number;
    timeSavedPercentage: number;
    requestsReduced: number;
    requestsReducedPercentage: number;
  };
}

export interface PerformanceTestConfig {
  widgetIds?: string[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  iterations?: number;
  delay?: number;
}

export interface PerformanceStats {
  summary: Record<string, unknown>;
  batchQueryStats: unknown;
  individualQueryStats: unknown;
  recentAlerts: Array<{
    type: 'warning' | 'critical';
    message: string;
    metric: string;
    value: number;
    threshold: number;
    timestamp: number;
    category: string;
  }>;
}

export interface BatchTestResult {
  comparison: ComparisonResult;
  report: string;
  stats: PerformanceStats;
}

// Legacy types for compatibility
export interface PerformanceResult {
  id: string;
  name: string;
  duration: number;
  status: 'success' | 'warning' | 'error';
  metadata?: Record<string, unknown>;
}

export interface PerformanceReport {
  timestamp: number;
  results: PerformanceResult[];
  summary: {
    total: number;
    success: number;
    warning: number;
    error: number;
    averageDuration: number;
  };
}

export interface PerformanceComparison {
  improved: PerformanceResult[];
  degraded: PerformanceResult[];
  unchanged: PerformanceResult[];
}

export type PerformanceStatus = 'success' | 'warning' | 'error' | 'pending';

export interface PerformanceSummary {
  totalTests: number;
  successRate: number;
  averageTime: number;
  criticalIssues: number;
}
