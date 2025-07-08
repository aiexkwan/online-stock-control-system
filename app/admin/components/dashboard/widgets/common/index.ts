/**
 * Common dashboard widgets - unified exports
 * 統一的 dashboard widgets 導出
 *
 * Import everything you need for dashboard widgets from this single file:
 *
 * @example
 * ```typescript
 * import {
 *   WidgetComponentProps,
 *   Card,
 *   CardContent,
 *   motion,
 *   useState,
 *   formatNumber,
 *   ErrorHandler
 * } from '../common';
 * ```
 */

// Export all types and utilities
export * from './types';
export * from './imports';

// Export commonly used widget configurations
export const COMMON_WIDGET_CONFIGS = {
  DEFAULT_REFRESH_INTERVAL: 30000, // 30 seconds
  DEFAULT_ANIMATION_DURATION: 300,
  DEFAULT_ERROR_RETRY_ATTEMPTS: 3,
  DEFAULT_SKELETON_ROWS: 3,
} as const;

// Export commonly used class name combinations
export const COMMON_WIDGET_CLASSES = {
  card: 'bg-background border border-border rounded-lg shadow-sm',
  cardHeader: 'flex flex-row items-center justify-between space-y-0 pb-2',
  cardTitle: 'text-sm font-medium',
  cardContent: 'pt-4',
  loading: 'animate-pulse',
  error: 'text-destructive text-sm',
  success: 'text-green-600 text-sm',
  muted: 'text-muted-foreground text-xs',
} as const;
