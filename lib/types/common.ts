/**
 * 通用類型定義
 * 為系統中常見的類型模式提供統一的類型定義
 */

import { User } from '@supabase/supabase-js';

/**
 * 通用回調函數類型
 */
export type GenericCallback<T = unknown, R = void> = (data: T) => R;
export type AsyncGenericCallback<T = unknown, R = void> = (data: T) => Promise<R>;

/**
 * 事件處理器類型
 */
export type EventHandler<T = Event> = (event: T) => void;
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

/**
 * 表單數據類型
 */
export interface FormDataBase {
  [key: string]: unknown;
}

/**
 * 用戶相關類型 (基於 Supabase _User 擴展)
 */
export interface App_User {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    department?: string;
    position?: string;
    [key: string]: unknown;
  };
  app_metadata?: {
    provider?: string;
    role?: string;
    [key: string]: unknown;
  };
}

/**
 * API 響應類型
 */
export interface ApiResponseBase<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * 組件 Props 基礎類型
 */
export interface ComponentPropsBase {
  className?: string;
  id?: string;
  'data-testid'?: string;
}

/**
 * 事件驅動系統類型
 */
export type EventPayload = Record<string, unknown>;

/**
 * Modal 相關類型
 */
export interface ModalProps extends ComponentPropsBase {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  [key: string]: unknown;
}

/**
 * 表單驗證相關類型
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
};

/**
 * 組件生命週期事件類型
 */
export interface ComponentLifecycleEvents {
  onMount?: () => void;
  onUnmount?: () => void;
  onUpdate?: (prevProps?: unknown, prevState?: unknown) => void;
}

/**
 * 通用錯誤類型
 */
export interface AppError extends Error {
  code?: string;
  source?: string;
  timestamp?: number;
  context?: unknown;
}

/**
 * 時間相關類型
 */
export type Timestamp = number;
export type ISODateString = string;

/**
 * 優先級類型
 */
export type Priority = 'low' | 'normal' | 'high' | 'critical';

/**
 * 狀態類型
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * 尺寸類型
 */
export type Size = 'sm' | 'md' | 'lg' | 'xl';

/**
 * 主題色彩類型
 */
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

/**
 * 類型守護工具類型
 */
export type TypeGuard<T> = (value: unknown) => value is T;

/**
 * 深度可選類型
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 深度必需類型
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * 排除函數的類型
 */
export type NonFunction<T> = T extends (...args: unknown[]) => unknown ? never : T;

/**
 * 只包含函數的類型
 */
export type OnlyFunctions<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? T[K] : never;
};

/**
 * 序列化安全類型 (排除函數、Symbol、undefined)
 */
export type Serializable<T> = T extends string | number | boolean | null
  ? T
  : T extends Array<infer U>
    ? Array<Serializable<U>>
    : T extends object
      ? {
          [K in keyof T]: T[K] extends (...args: unknown[]) => unknown
            ? never
            : T[K] extends symbol | undefined
              ? never
              : Serializable<T[K]>;
        }
      : never;
