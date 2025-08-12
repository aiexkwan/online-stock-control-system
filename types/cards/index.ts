/**
 * Card Component Type Definitions
 * 統一管理所有卡片組件的類型定義
 */

// Re-export analysis types
export * from './analysis.types';

// Re-export operation types
export * from './operation.types';

// Re-export report types
export * from './report.types';

// Common card types
export interface BaseCardProps {
  className?: string;
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  error?: Error | null;
  isEditMode?: boolean;
}

// Card actions
export interface CardAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'danger';
}

// Card state
export interface CardState<T = unknown> {
  data: T;
  loading: boolean;
  error: Error | null;
  isExpanded?: boolean;
  selectedItems?: string[];
}

// Card callbacks
export interface CardCallbacks<T = unknown> {
  onDataChange?: (data: T) => void;
  onError?: (error: Error) => void;
  onRefresh?: () => void | Promise<void>;
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void | Promise<void>;
}

// Export format options
export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json';

// Sort configuration
export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

// Filter operator
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'between';