/**
 * Enhanced Widget Types - Phase 6B 漸進式重構
 * 統一 Widget 類型系統，提供類型安全的動態導入
 */

import { ComponentType, ReactNode } from 'react';

// =============================================================================
// 基礎 Widget 類型定義
// =============================================================================

/**
 * Widget 優先級
 */
export type WidgetPriority = 'critical' | 'high' | 'normal' | 'low';

/**
 * Widget 類別
 */
export type WidgetCategory = 'analytics' | 'operations' | 'reports' | 'special' | 'system';

/**
 * Widget 數據源類型
 */
export type WidgetDataSource = 'rest-api' | 'graphql' | 'server-action' | 'static' | 'none';

/**
 * Widget 載入狀態
 */
export type WidgetLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error' | 'timeout';

// =============================================================================
// Widget 配置接口
// =============================================================================

/**
 * 基礎 Widget 配置
 */
export interface BaseWidgetConfig {
  id: string;
  name: string;
  category: WidgetCategory;
  description: string;
  dataSource: WidgetDataSource;
  priority: WidgetPriority;
  editable?: boolean;
  minSize?: {
    width: number;
    height: number;
  };
}

/**
 * Widget 元數據
 */
export interface WidgetMetadata {
  preloadPriority?: number;
  configurable?: boolean;
  exportable?: boolean;
  supportedFeatures?: string[];
  customSettings?: Record<string, unknown>;
}

/**
 * 完整 Widget 配置
 */
export interface EnhancedWidgetConfig extends BaseWidgetConfig {
  metadata?: WidgetMetadata;
}

// =============================================================================
// Widget Props 類型系統
// =============================================================================

/**
 * 基礎 Widget Props
 */
export interface BaseWidgetProps {
  widgetId: string;
  isEditMode?: boolean;
  timeFrame?: {
    start: Date;
    end: Date;
  };
}

/**
 * 批量查詢模式 Props
 */
export interface BatchQueryWidgetProps extends BaseWidgetProps {
  mode: 'batch-query';
}

/**
 * 傳統模式 Widget Props
 */
export interface TraditionalWidgetProps extends BaseWidgetProps {
  mode: 'traditional';
  widget: {
    id: string;
    type: string;
    title: string;
    config: Record<string, unknown>;
  };
}

/**
 * 特殊模式 Widget Props
 */
export interface SpecialWidgetProps extends BaseWidgetProps {
  mode: 'special';
  customProps: Record<string, unknown>;
}

/**
 * 統一 Widget Props 聯合類型
 */
export type UnifiedWidgetProps =
  | BatchQueryWidgetProps
  | TraditionalWidgetProps
  | SpecialWidgetProps;

// =============================================================================
// 動態導入類型定義
// =============================================================================

/**
 * Widget 組件導入結果
 */
export interface WidgetImportResult {
  default: ComponentType<any>; // 支援所有可能的 widget prop 類型
}

/**
 * Widget 加載器配置
 */
export interface WidgetLoaderConfig {
  cacheExpiration: number;
  maxCacheSize: number;
  retryCount: number;
  retryDelay: number;
  enablePreloading: boolean;
  enablePerformanceMonitoring: boolean;
}

/**
 * Widget 性能指標
 */
export interface WidgetPerformanceMetrics {
  widgetId: string;
  loadStartTime: number;
  loadEndTime: number;
  loadDuration: number;
  fromCache: boolean;
  retryCount: number;
  status: 'success' | 'error' | 'timeout';
}

// =============================================================================
// 錯誤類型定義
// =============================================================================

/**
 * Widget 驗證錯誤
 */
export interface WidgetValidationError extends Error {
  name: 'WidgetValidationError';
  widgetId: string;
}

/**
 * Widget 載入錯誤
 */
export interface WidgetLoadingError extends Error {
  name: 'WidgetLoadingError';
  widgetId: string;
  cause?: Error;
}

/**
 * Widget 註冊錯誤
 */
export interface WidgetRegistrationError extends Error {
  name: 'WidgetRegistrationError';
  widgetId: string;
}

/**
 * Widget 錯誤聯合類型
 */
export type WidgetError = WidgetValidationError | WidgetLoadingError | WidgetRegistrationError;

// =============================================================================
// 類型守衛函數
// =============================================================================

/**
 * 檢查是否為批量查詢 Props
 */
export function isBatchQueryProps(props: unknown): props is BatchQueryWidgetProps {
  return (
    props !== null &&
    typeof props === 'object' &&
    'mode' in props &&
    props.mode === 'batch-query' &&
    'widgetId' in props &&
    typeof props.widgetId === 'string'
  );
}

/**
 * 檢查是否為傳統模式 Props
 */
export function isTraditionalProps(props: unknown): props is TraditionalWidgetProps {
  return (
    props !== null &&
    typeof props === 'object' &&
    'mode' in props &&
    props.mode === 'traditional' &&
    'widgetId' in props &&
    typeof props.widgetId === 'string' &&
    'widget' in props &&
    props.widget !== null &&
    typeof props.widget === 'object'
  );
}

/**
 * 檢查是否為特殊模式 Props
 */
export function isSpecialProps(props: unknown): props is SpecialWidgetProps {
  return (
    props !== null &&
    typeof props === 'object' &&
    'mode' in props &&
    props.mode === 'special' &&
    'widgetId' in props &&
    typeof props.widgetId === 'string' &&
    'customProps' in props &&
    props.customProps !== null &&
    typeof props.customProps === 'object'
  );
}

/**
 * 檢查是否為有效的 Widget 配置
 */
export function isValidWidgetConfig(config: unknown): config is EnhancedWidgetConfig {
  return (
    config !== null &&
    typeof config === 'object' &&
    'id' in config &&
    typeof config.id === 'string' &&
    'name' in config &&
    typeof config.name === 'string' &&
    'category' in config &&
    typeof config.category === 'string' &&
    'dataSource' in config &&
    typeof config.dataSource === 'string'
  );
}

// =============================================================================
// 類型安全工具函數
// =============================================================================

/**
 * 類型安全的字串轉換
 */
export function safeString(value: unknown, defaultValue = ''): string {
  if (value === null || value === undefined) return defaultValue;
  return String(value);
}

/**
 * 類型安全的數字轉換
 */
export function safeNumber(value: unknown, defaultValue = 0): number {
  if (value === null || value === undefined) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * 類型安全的布林值轉換
 */
export function safeBoolean(value: unknown, defaultValue = false): boolean {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  }
  if (typeof value === 'number') return value !== 0;
  return defaultValue;
}

/**
 * 檢查是否為有效對象
 */
export function isValidObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * 類型安全的對象屬性取得
 */
export function safeObjectProperty<T>(obj: unknown, key: string, defaultValue: T): T {
  if (!isValidObject(obj)) return defaultValue;
  const value = obj[key];
  return value === undefined ? defaultValue : (value as T);
}

// =============================================================================
// 導出所有類型
// =============================================================================

// All types are exported above with individual export statements
