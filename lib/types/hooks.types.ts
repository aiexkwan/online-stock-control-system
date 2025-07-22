/**
 * 統一 Hook 類型定義
 * Phase 3.2 Stage 2 - TypeScript 遷移標準化接口
 * 
 * @description 提供標準化的 Hook 類型模式，確保整個系統的一致性
 * @author Phase 3.2 專家協作團隊
 * @date 2025-07-21
 */

/**
 * 基礎 Hook 返回類型模式
 * 所有數據獲取類 Hook 應該遵循此模式
 */
export interface BaseHookReturn<TData, TError = Error> {
  /** 數據內容 */
  data: TData | null;
  /** 加載狀態 */
  loading: boolean;
  /** 錯誤信息 */
  error: TError | null;
  /** 重新獲取數據的函數 */
  refetch?: () => void | Promise<void>;
  /** 數據是否正在驗證中 */
  isValidating?: boolean;
}

/**
 * API Hook 通用選項
 * 用於配置 API 調用行為
 */
export interface ApiHookOptions<TParams = unknown> {
  /** 是否啟用自動獲取 */
  enabled?: boolean;
  /** API 請求參數 */
  params?: TParams;
  /** 成功回調 */
  onSuccess?: (data: unknown) => void;
  /** 錯誤回調 */
  onError?: (error: Error) => void;
  /** 重試次數 */
  retryCount?: number;
  /** 重試延遲（毫秒） */
  retryDelay?: number;
  /** 緩存時間（毫秒） */
  cacheTime?: number;
  /** 是否在窗口聚焦時重新獲取 */
  refetchOnFocus?: boolean;
  /** 是否在重新連接時重新獲取 */
  refetchOnReconnect?: boolean;
}

/**
 * 分頁 Hook 返回類型
 * 用於處理分頁數據的 Hook
 */
export interface PaginatedHookReturn<TData, TError = Error> extends BaseHookReturn<TData[], TError> {
  /** 當前頁碼 */
  page: number;
  /** 每頁數量 */
  pageSize: number;
  /** 總數據量 */
  totalCount: number;
  /** 總頁數 */
  totalPages: number;
  /** 是否有下一頁 */
  hasNextPage: boolean;
  /** 是否有上一頁 */
  hasPreviousPage: boolean;
  /** 跳轉到指定頁 */
  goToPage: (page: number) => void;
  /** 下一頁 */
  nextPage: () => void;
  /** 上一頁 */
  previousPage: () => void;
  /** 設置每頁數量 */
  setPageSize: (size: number) => void;
}

/**
 * 表單 Hook 返回類型
 * 用於處理表單狀態的 Hook
 */
export interface FormHookReturn<TValues, TErrors = Record<string, string>> {
  /** 表單值 */
  values: TValues;
  /** 表單錯誤 */
  errors: TErrors;
  /** 是否已修改 */
  isDirty: boolean;
  /** 是否正在提交 */
  isSubmitting: boolean;
  /** 是否有效 */
  isValid: boolean;
  /** 設置字段值 */
  setValue: <K extends keyof TValues>(field: K, value: TValues[K]) => void;
  /** 設置多個字段值 */
  setValues: (values: Partial<TValues>) => void;
  /** 設置字段錯誤 */
  setError: (field: keyof TValues, error: string) => void;
  /** 清除錯誤 */
  clearErrors: () => void;
  /** 重置表單 */
  reset: () => void;
  /** 提交表單 */
  submit: () => Promise<void>;
}

/**
 * 實時數據 Hook 返回類型
 * 用於處理實時更新數據的 Hook
 */
export interface RealtimeHookReturn<TData, TError = Error> extends BaseHookReturn<TData, TError> {
  /** 連接狀態 */
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  /** 最後更新時間 */
  lastUpdated: Date | null;
  /** 訂閱狀態 */
  isSubscribed: boolean;
  /** 手動連接 */
  connect: () => void;
  /** 手動斷開 */
  disconnect: () => void;
}

/**
 * 文件上傳 Hook 返回類型
 * 用於處理文件上傳的 Hook
 */
export interface FileUploadHookReturn {
  /** 上傳進度 (0-100) */
  progress: number;
  /** 是否正在上傳 */
  isUploading: boolean;
  /** 上傳錯誤 */
  error: Error | null;
  /** 已上傳的文件列表 */
  uploadedFiles: Array<{
    id: string;
    name: string;
    size: number;
    url: string;
    uploadedAt: Date;
  }>;
  /** 上傳文件 */
  upload: (file: File | File[]) => Promise<void>;
  /** 取消上傳 */
  cancel: () => void;
  /** 移除已上傳的文件 */
  remove: (fileId: string) => Promise<void>;
}

/**
 * 通用狀態 Hook 返回類型
 * 用於簡單狀態管理的 Hook
 */
export interface StateHookReturn<TState> {
  /** 當前狀態 */
  state: TState;
  /** 設置狀態 */
  setState: (state: TState | ((prev: TState) => TState)) => void;
  /** 重置到初始狀態 */
  reset: () => void;
}

/**
 * 權限檢查 Hook 返回類型
 */
export interface PermissionHookReturn {
  /** 是否有權限 */
  hasPermission: boolean;
  /** 是否正在檢查 */
  isChecking: boolean;
  /** 用戶角色 */
  userRole: string | null;
  /** 權限列表 */
  permissions: string[];
  /** 檢查特定權限 */
  check: (permission: string) => boolean;
}

/**
 * 搜索 Hook 返回類型
 */
export interface SearchHookReturn<TResult> extends BaseHookReturn<TResult[], Error> {
  /** 搜索關鍵詞 */
  searchTerm: string;
  /** 設置搜索關鍵詞 */
  setSearchTerm: (term: string) => void;
  /** 搜索建議 */
  suggestions: string[];
  /** 是否正在搜索 */
  isSearching: boolean;
  /** 清除搜索 */
  clearSearch: () => void;
  /** 搜索歷史 */
  searchHistory: string[];
}

/**
 * Hook 錯誤類型定義
 */
export interface HookError extends Error {
  /** 錯誤代碼 */
  code?: string;
  /** HTTP 狀態碼 */
  statusCode?: number;
  /** 詳細錯誤信息 */
  details?: unknown;
  /** 錯誤發生時間 */
  timestamp?: Date;
  /** 重試次數 */
  retryCount?: number;
}