/**
 * Widget 狀態管理類型定義
 * State management type definitions for widgets
 * 
 * 這個文件包含所有 widget 狀態管理相關的類型定義
 */

import { WidgetError, WidgetMetadata } from '../base';

/**
 * Widget 狀態接口
 * Widget state interface
 */
export interface WidgetState<T = unknown> {
  id: string;
  isLoading: boolean;
  hasError: boolean;
  error?: WidgetError | null;
  data?: T;
  metadata?: WidgetMetadata;
  refreshCount: number;
  lastUpdated?: Date | null;
  isRefreshing?: boolean;
  isCached?: boolean;
}

/**
 * Widget 狀態動作類型
 * Widget state action types
 */
export enum WidgetActionType {
  // 數據加載動作
  FETCH_START = 'FETCH_START',
  FETCH_SUCCESS = 'FETCH_SUCCESS',
  FETCH_ERROR = 'FETCH_ERROR',
  
  // 刷新動作
  REFRESH_START = 'REFRESH_START',
  REFRESH_SUCCESS = 'REFRESH_SUCCESS',
  REFRESH_ERROR = 'REFRESH_ERROR',
  
  // 狀態管理動作
  SET_DATA = 'SET_DATA',
  SET_ERROR = 'SET_ERROR',
  CLEAR_ERROR = 'CLEAR_ERROR',
  RESET_STATE = 'RESET_STATE',
  
  // 元數據動作
  UPDATE_METADATA = 'UPDATE_METADATA',
  SET_CACHED = 'SET_CACHED',
}

/**
 * Widget 狀態動作接口
 * Widget state action interface
 */
export interface WidgetAction<T = unknown> {
  type: WidgetActionType;
  payload?: {
    data?: T;
    error?: WidgetError;
    metadata?: WidgetMetadata;
    isCached?: boolean;
  };
}

/**
 * Widget 狀態管理器接口
 * Widget state manager interface
 */
export interface WidgetStateManager<T = unknown> {
  state: WidgetState<T>;
  dispatch: (action: WidgetAction<T>) => void;
  
  // 便捷方法
  setLoading: (loading: boolean) => void;
  setData: (data: T, metadata?: WidgetMetadata) => void;
  setError: (error: WidgetError) => void;
  clearError: () => void;
  reset: () => void;
  refresh: () => Promise<void>;
}

/**
 * Widget 狀態快照
 * Widget state snapshot for debugging/monitoring
 */
export interface WidgetStateSnapshot<T = unknown> {
  widgetId: string;
  timestamp: Date;
  state: WidgetState<T>;
  performanceMetrics?: {
    loadTime?: number;
    renderTime?: number;
    dataSize?: number;
  };
}

/**
 * Widget 狀態訂閱器
 * Widget state subscriber
 */
export type WidgetStateSubscriber<T = unknown> = (
  state: WidgetState<T>,
  prevState: WidgetState<T>
) => void;

/**
 * Widget 狀態存儲接口
 * Widget state store interface
 */
export interface WidgetStateStore {
  // 狀態管理
  getState<T = unknown>(widgetId: string): WidgetState<T> | undefined;
  setState<T = unknown>(widgetId: string, state: Partial<WidgetState<T>>): void;
  resetState(widgetId: string): void;
  clearAllStates(): void;
  
  // 訂閱管理
  subscribe<T = unknown>(widgetId: string, subscriber: WidgetStateSubscriber<T>): () => void;
  unsubscribe(widgetId: string, subscriber: WidgetStateSubscriber): void;
  
  // 批量操作
  batchUpdate(updates: Record<string, Partial<WidgetState>>): void;
  getSnapshot(): Record<string, WidgetStateSnapshot>;
}

/**
 * Widget 狀態持久化配置
 * Widget state persistence configuration
 */
export interface WidgetStatePersistence {
  enabled: boolean;
  storage: 'localStorage' | 'sessionStorage' | 'indexedDB';
  key: string;
  serialize?: (state: WidgetState) => string;
  deserialize?: (data: string) => WidgetState;
  ttl?: number; // Time to live in milliseconds
}

/**
 * Widget 狀態中間件
 * Widget state middleware
 */
export type WidgetStateMiddleware = (
  action: WidgetAction,
  state: WidgetState,
  next: (action: WidgetAction) => void
) => void;

/**
 * 創建初始 Widget 狀態
 * Create initial widget state
 */
export function createInitialWidgetState<T = unknown>(
  widgetId: string,
  initialData?: T
): WidgetState<T> {
  return {
    id: widgetId,
    isLoading: false,
    hasError: false,
    error: null,
    data: initialData,
    metadata: {},
    refreshCount: 0,
    lastUpdated: null,
    isRefreshing: false,
    isCached: false,
  };
}

/**
 * Widget 狀態 reducer
 * Widget state reducer function
 */
export function widgetStateReducer<T = unknown>(
  state: WidgetState<T>,
  action: WidgetAction<T>
): WidgetState<T> {
  switch (action.type) {
    case WidgetActionType.FETCH_START:
      return {
        ...state,
        isLoading: true,
        hasError: false,
        error: null,
      };
      
    case WidgetActionType.FETCH_SUCCESS:
      return {
        ...state,
        isLoading: false,
        hasError: false,
        error: null,
        data: action.payload?.data,
        metadata: action.payload?.metadata || state.metadata,
        lastUpdated: new Date(),
        isCached: action.payload?.isCached || false,
      };
      
    case WidgetActionType.FETCH_ERROR:
      return {
        ...state,
        isLoading: false,
        hasError: true,
        error: action.payload?.error || null,
      };
      
    case WidgetActionType.REFRESH_START:
      return {
        ...state,
        isRefreshing: true,
        hasError: false,
        error: null,
      };
      
    case WidgetActionType.REFRESH_SUCCESS:
      return {
        ...state,
        isRefreshing: false,
        hasError: false,
        error: null,
        data: action.payload?.data,
        metadata: action.payload?.metadata || state.metadata,
        lastUpdated: new Date(),
        refreshCount: state.refreshCount + 1,
        isCached: false,
      };
      
    case WidgetActionType.REFRESH_ERROR:
      return {
        ...state,
        isRefreshing: false,
        hasError: true,
        error: action.payload?.error || null,
      };
      
    case WidgetActionType.SET_DATA:
      return {
        ...state,
        data: action.payload?.data,
        metadata: action.payload?.metadata || state.metadata,
        lastUpdated: new Date(),
      };
      
    case WidgetActionType.SET_ERROR:
      return {
        ...state,
        hasError: true,
        error: action.payload?.error || null,
      };
      
    case WidgetActionType.CLEAR_ERROR:
      return {
        ...state,
        hasError: false,
        error: null,
      };
      
    case WidgetActionType.RESET_STATE:
      return createInitialWidgetState(state.id);
      
    case WidgetActionType.UPDATE_METADATA:
      return {
        ...state,
        metadata: {
          ...state.metadata,
          ...action.payload?.metadata,
        },
      };
      
    case WidgetActionType.SET_CACHED:
      return {
        ...state,
        isCached: action.payload?.isCached || false,
      };
      
    default:
      return state;
  }
}

/**
 * 類型保護函數
 * Type guard functions
 */
export function isWidgetState(state: unknown): state is WidgetState {
  if (!state || typeof state !== 'object') return false;
  
  const widgetState = state as Record<string, unknown>;
  return (
    typeof widgetState.id === 'string' &&
    typeof widgetState.isLoading === 'boolean' &&
    typeof widgetState.hasError === 'boolean' &&
    typeof widgetState.refreshCount === 'number'
  );
}

export function isWidgetAction(action: unknown): action is WidgetAction {
  if (!action || typeof action !== 'object') return false;
  
  const widgetAction = action as Record<string, unknown>;
  return (
    typeof widgetAction.type === 'string' &&
    Object.values(WidgetActionType).includes(widgetAction.type as WidgetActionType)
  );
}

/**
 * 狀態選擇器
 * State selectors
 */
export const widgetStateSelectors = {
  isReady: <T>(state: WidgetState<T>): boolean => 
    !state.isLoading && !state.hasError && state.data !== undefined,
    
  isStale: <T>(state: WidgetState<T>, maxAge: number): boolean => {
    if (!state.lastUpdated) return true;
    const age = Date.now() - state.lastUpdated.getTime();
    return age > maxAge;
  },
  
  hasData: <T>(state: WidgetState<T>): boolean => 
    state.data !== undefined && state.data !== null,
    
  getError: <T>(state: WidgetState<T>): WidgetError | null => 
    state.error || null,
    
  getMetadata: <T>(state: WidgetState<T>): WidgetMetadata => 
    state.metadata || {},
};