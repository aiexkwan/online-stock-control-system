/**
 * Performance Tracking Hook Type Definitions
 * Types for widget performance monitoring hooks
 */

// Basic performance metrics
export interface PerformanceMetrics {
  loadTime?: number;
  renderTime?: number;
  dataFetchTime?: number;
  errorCount?: number;
}

// A/B Test configuration
export interface ABTestConfiguration {
  testId: string;
  variant: 'control' | 'test';
}

// Performance context
export interface PerformanceContext {
  route?: string;
  sessionId?: string;
  userId?: string | undefined;
}

// Realtime metrics for widget monitoring
export interface RealtimeMetrics {
  widget?: {
    id: string;
    loadTime: number;
    renderTime: number;
    errorRate: number;
    sampleSize: number;
  };
  global?: unknown;
}

// Hook options interface
export interface UseWidgetPerformanceTrackingOptions {
  widgetId: string;
  variant?: 'v2' | 'legacy';
  enableAutoTracking?: boolean;
  abTest?: ABTestConfiguration;
  customMetrics?: Record<string, unknown>;
}

// Error metrics severity
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorType = 'runtime' | 'data-fetch' | 'render' | 'load';

// Error metrics interface
export interface ErrorMetrics {
  widgetId: string;
  timestamp: number;
  errorType: ErrorType;
  errorMessage: string;
  errorStack?: string;
  severity: ErrorSeverity;
  userImpact: number;
  context: PerformanceContext;
}

// Hook result interface
export interface UseWidgetPerformanceTrackingResult {
  // Performance tracking
  startTracking: () => void;
  stopTracking: () => void;
  trackRender: () => void;
  trackDataFetch: (fetchFn: () => Promise<unknown>) => Promise<unknown>;

  // Error tracking
  trackError: (error: Error, errorType?: ErrorType) => void;

  // Metrics
  getMetrics: () => PerformanceMetrics;

  // A/B testing
  isTestVariant: boolean;
  trackConversion: (conversionType: string) => void;
}

// Performance report generation types
export type ReportType = 'daily' | 'weekly' | 'monthly';
export type ExportFormat = 'json' | 'csv';

// Performance reports hook result
export interface UsePerformanceReportsResult {
  generateReport: (type: ReportType, customRange?: { start: Date; end: Date }) => unknown;
  getABTestResults: (testId: string) => unknown;
  exportPerformanceData: (format?: ExportFormat) => unknown;
  detectAnomalies: (widgetId: string, sensitivity?: number) => unknown;
}

// Realtime monitoring result
export interface UseRealtimePerformanceMonitorResult {
  metrics: RealtimeMetrics | null;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
}
