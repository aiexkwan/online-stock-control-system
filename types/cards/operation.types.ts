/**
 * Operation Card Type Definitions
 * 為所有操作卡片組件提供統一的類型定義
 */

// 基礎操作參數類型
export interface BaseOperationParams {
  [key: string]: unknown;
}

// 基礎操作結果類型
export interface BaseOperationResult {
  success: boolean;
  message?: string;
  data?: unknown;
  [key: string]: unknown;
}

// Action 操作參數
export interface ActionOperationParams extends BaseOperationParams {
  action: string;
  targetId?: string | number;
  options?: Record<string, unknown>;
}

// Selector 操作參數
export interface SelectorOperationParams extends BaseOperationParams {
  selectedValue?: string | string[];
  selectedOption?: { value: string; label: string } | Array<{ value: string; label: string }>;
}

// Upload 操作參數
export interface UploadOperationParams extends BaseOperationParams {
  files?: File | File[];
  uploadProgress?: number;
  metadata?: Record<string, unknown>;
}

// Monitor 操作參數
export interface MonitorOperationParams extends BaseOperationParams {
  metrics?: string[];
  timeRange?: { start: Date; end: Date };
  refreshInterval?: number;
}

// 執行函數類型
export type OperationExecuteFunction<TParams = BaseOperationParams, TResult = BaseOperationResult> = 
  (params: TParams) => Promise<TResult>;

// 成功回調類型
export type OperationSuccessCallback<TResult = BaseOperationResult> = 
  (result: TResult) => void;

// 參數設置函數類型
export type SetOperationParamsFunction<TParams = BaseOperationParams> = 
  (params: TParams) => void;

// 執行包裝函數類型
export type OperationExecuteWrapper<TParams = BaseOperationParams> = 
  (params?: TParams) => Promise<void>;

// 類型守衛
export function isActionParams(params: unknown): params is ActionOperationParams {
  return (
    typeof params === 'object' &&
    params !== null &&
    'action' in params &&
    typeof (params as ActionOperationParams).action === 'string'
  );
}

export function isSelectorParams(params: unknown): params is SelectorOperationParams {
  return (
    typeof params === 'object' &&
    params !== null &&
    ('selectedValue' in params || 'selectedOption' in params)
  );
}

export function isUploadParams(params: unknown): params is UploadOperationParams {
  return (
    typeof params === 'object' &&
    params !== null &&
    'files' in params
  );
}

export function isMonitorParams(params: unknown): params is MonitorOperationParams {
  return (
    typeof params === 'object' &&
    params !== null &&
    ('metrics' in params || 'timeRange' in params || 'refreshInterval' in params)
  );
}

// 聯合類型
export type OperationParams = 
  | ActionOperationParams 
  | SelectorOperationParams 
  | UploadOperationParams 
  | MonitorOperationParams
  | BaseOperationParams;

// 特定操作結果類型
export interface ActionOperationResult extends BaseOperationResult {
  affectedCount?: number;
  timestamp?: string;
}

export interface UploadOperationResult extends BaseOperationResult {
  uploadedFiles?: Array<{
    name: string;
    size: number;
    url?: string;
  }>;
  totalSize?: number;
}

export interface MonitorOperationResult extends BaseOperationResult {
  metrics?: Record<string, number | string>;
  lastUpdated?: string;
}

export type OperationResult = 
  | ActionOperationResult
  | UploadOperationResult
  | MonitorOperationResult
  | BaseOperationResult;