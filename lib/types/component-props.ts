/**
 * 組件屬性類型定義
 * Component Props Type Definitions
 *
 * 提供組件相關的所有類型定義，包括PDF處理、Progress Bar、事件處理器等
 * Provides all component-related type definitions including PDF processing, Progress Bar, event handlers, etc.
 */

import React from 'react';

// =============================================================================
// PDF 相關類型 / PDF Related Types
// =============================================================================

export interface PdfGenerationOptions {
  format?: 'A4' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  quality?: 'low' | 'medium' | 'high';
  compression?: boolean;
  watermark?: string;
}

export interface PdfStreamingState {
  isStreaming: boolean;
  progress: number;
  currentPage?: number;
  totalPages?: number;
  error?: string;
}

export interface PdfGenerationResult {
  success: boolean;
  data?: Blob | ArrayBuffer;
  url?: string;
  error?: string;
  metadata?: {
    size: number;
    pages: number;
    generationTime: number;
  };
}

export interface StreamingPdfConfig {
  chunkSize: number;
  maxRetries: number;
  timeoutMs: number;
  enableProgress: boolean;
}

export type PdfGenerationCallback = (result: PdfGenerationResult) => void;
export type PdfProgressCallback = (progress: number, currentPage?: number) => void;
export type PdfErrorCallback = (error: string) => void;

// =============================================================================
// Progress Bar 類型 / Progress Bar Types
// =============================================================================

export interface ProgressBarState {
  value: number;
  max: number;
  status: 'idle' | 'loading' | 'success' | 'error' | 'warning';
  message?: string;
  showPercentage: boolean;
}

export interface ProgressBarAnimation {
  duration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  delay?: number;
}

export interface ProgressBarTheme {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  height: number;
}

export interface ProgressBarEvents {
  onComplete?: () => void;
  onError?: (error: string) => void;
  onProgress?: (value: number) => void;
  onReset?: () => void;
}

// =============================================================================
// 事件處理器類型 / Event Handler Types
// =============================================================================

export interface EventHandlerContext {
  source: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ComponentEventData {
  type: string;
  payload: Record<string, unknown>;
  context: EventHandlerContext;
}

export type ComponentEventHandler = (data: ComponentEventData) => void | Promise<void>;

export interface EventListenerOptions {
  once?: boolean;
  passive?: boolean;
  signal?: AbortSignal;
}

// =============================================================================
// 資源管理類型 / Resource Management Types
// =============================================================================

export interface ResourceHandle {
  id: string;
  type: 'timer' | 'interval' | 'listener' | 'subscription' | 'connection';
  cleanup: () => void;
  metadata?: Record<string, unknown>;
}

export interface ResourceCleanupConfig {
  autoCleanup: boolean;
  cleanupDelay: number;
  maxResources: number;
  trackLeaks: boolean;
}

export type ResourceCleanupCallback = (resource: ResourceHandle) => void;

// =============================================================================
// 表單和輸入類型 / Form and Input Types
// =============================================================================

export interface InputValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export interface FormFieldState {
  value: unknown;
  isDirty: boolean;
  isTouched: boolean;
  isValidating: boolean;
  validation: InputValidationResult;
}

export interface FormState {
  fields: Record<string, FormFieldState>;
  isSubmitting: boolean;
  isValid: boolean;
  hasChanges: boolean;
}

export type FormFieldValidator = (
  value: unknown
) => InputValidationResult | Promise<InputValidationResult>;
export type FormSubmitHandler = (data: Record<string, unknown>) => void | Promise<void>;

// =============================================================================
// API 和網絡類型 / API and Network Types
// =============================================================================

export interface ApiRequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    statusCode?: number;
  };
  meta?: {
    requestId: string;
    timestamp: Date;
    duration: number;
  };
}

export type ApiRequestHandler<T = unknown> = (config: ApiRequestConfig) => Promise<ApiResponse<T>>;

// =============================================================================
// 性能監控類型 / Performance Monitoring Types
// =============================================================================

export interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  entryType: string;
  metadata?: Record<string, unknown>;
}

export interface ComponentPerformanceMetrics {
  renderTime: number;
  mountTime?: number;
  updateCount: number;
  errorCount: number;
  memoryUsage?: number;
  renderCount?: number;
  averageRenderTime?: number;
  batchEfficiency?: number;
  updatesPerSecond?: number;
  totalUpdates?: number;
  batchedUpdates?: number;
  skippedUpdates?: number;
  averageDelay?: number;
  lastMeasurement?: number;
}

export type PerformanceObserverCallback = (entries: PerformanceEntry[]) => void;

// =============================================================================
// GRN 特定組件類型 / GRN-specific Component Types
// =============================================================================

export interface GrnItemData {
  productCode: string;
  description: string;
  quantity: number;
  weight?: number;
  supplier?: string;
  location?: string;
}

export interface GrnFormData {
  grnNumber: string;
  supplier: string;
  items: GrnItemData[];
  notes?: string;
  signature?: string;
}

export interface GrnValidationContext {
  allowDuplicates: boolean;
  requireSignature: boolean;
  maxItems: number;
  validationRules: Record<string, FormFieldValidator>;
}

// =============================================================================
// 通用工具類型 / Generic Utility Types
// =============================================================================

export type ComponentProps<T = Record<string, unknown>> = T & {
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
};

export type EventCallbackFunction<T = unknown> = (data: T) => void | Promise<void>;

export type AsyncComponentState<T = unknown> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

// =============================================================================
// 匯出便利類型 / Export Convenience Types
// =============================================================================

export type AnyComponentEvent = ComponentEventData;
export type AnyResourceHandle = ResourceHandle;
export type AnyApiResponse = ApiResponse<unknown>;
export type AnyFormData = Record<string, unknown>;
