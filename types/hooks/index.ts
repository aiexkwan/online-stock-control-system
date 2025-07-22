/**
 * Hooks Types Index
 * Re-exports all hook-related type definitions
 */

// Auth hook types
export type { AuthState, UserRole } from './auth';

// Performance tracking types
export type {
  PerformanceMetrics,
  ABTestConfiguration,
  PerformanceContext,
  RealtimeMetrics,
  UseWidgetPerformanceTrackingOptions,
  ErrorSeverity,
  ErrorType,
  ErrorMetrics,
  UseWidgetPerformanceTrackingResult,
  ReportType,
  ExportFormat,
  UsePerformanceReportsResult,
  UseRealtimePerformanceMonitorResult,
} from './performance-tracking';
