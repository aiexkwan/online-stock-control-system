/**
 * 認證系統類型定義
 * Authentication System Type Definitions
 *
 * 提供認證相關的所有類型定義，包括表單數據、事件處理器和組件類型
 * Provides all authentication-related type definitions including form data, event handlers and component types
 */

import * as React from 'react';

// =============================================================================
// 基礎表單數據類型 / Base Form Data Types
// =============================================================================

// Local type definitions to avoid JSX dependency issues
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface BaseFormData {
  [key: string]: unknown;
}

export interface LoginFormSubmissionData extends LoginFormData {
  rememberMe?: boolean;
  twoFactorCode?: string;
}

export interface RegisterFormSubmissionData extends RegisterFormData {
  acceptTerms: boolean;
  subscribeNewsletter?: boolean;
}

export interface ResetPasswordFormData {
  email: string;
}

export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// 聯合類型用於表單提交
export type FormSubmissionData =
  | LoginFormSubmissionData
  | RegisterFormSubmissionData
  | ResetPasswordFormData
  | ChangePasswordFormData;

// =============================================================================
// 事件處理器類型 / Event Handler Types
// =============================================================================

export interface FormEventHandlerParams<T extends BaseFormData = BaseFormData> {
  data: T;
  formType: 'login' | 'register' | 'reset' | 'change';
  timestamp: Date;
  source?: string;
}

export type FormEventHandler<T extends BaseFormData = BaseFormData> = (
  params: FormEventHandlerParams<T>
) => void | Promise<void>;

export interface FieldEventHandlerParams {
  name: string;
  value: string;
  previousValue?: string;
  formType: string;
}

export type FieldEventHandler = (params: FieldEventHandlerParams) => void;

export interface ValidationEventHandlerParams {
  name: string;
  result: {
    isValid: boolean;
    error?: string;
  };
  formType: string;
}

export type ValidationEventHandler = (params: ValidationEventHandlerParams) => void;

export interface UIEventHandlerParams {
  action: string;
  payload?: Record<string, unknown>;
  timestamp: Date;
  source?: string;
}

export type UIEventHandler = (params: UIEventHandlerParams) => void;

// =============================================================================
// 組件註冊系統類型 / Component Registry System Types
// =============================================================================

export interface ComponentMetadata {
  name: string;
  version?: string;
  description?: string;
  category?: string;
  tags?: string[];
}

export interface RegisteredComponent<P = Record<string, unknown>> {
  component: React.ComponentType<P>;
  metadata?: ComponentMetadata;
  registrationTime: Date;
}

export interface ComponentRegistryOperations {
  register<P = Record<string, unknown>>(
    name: string,
    component: React.ComponentType<P>,
    metadata?: ComponentMetadata
  ): void;
  unregister(name: string): void;
  get<P = Record<string, unknown>>(name: string): RegisteredComponent<P> | undefined;
  getAll(): Record<string, RegisteredComponent>;
  has(name: string): boolean;
  clear(): void;
  list(): string[];
}

// =============================================================================
// 渲染屬性模式類型 / Render Props Pattern Types
// =============================================================================

export interface RenderPropsBase<T = Record<string, unknown>> {
  children: (props: T) => React.ReactNode;
}

export interface FormCompoundContextData {
  formType: 'login' | 'register' | 'reset' | 'change';
  isSubmitting: boolean;
  hasErrors: boolean;
  values: Record<string, string>;
  errors: Record<string, string>;
}

export interface FormRenderProps extends RenderPropsBase<FormCompoundContextData> {}

export interface FieldRenderPropsData {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
}

export interface FieldRenderProps extends RenderPropsBase<FieldRenderPropsData> {}

// =============================================================================
// 認證狀態類型 / Authentication State Types
// =============================================================================

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    preferences?: Record<string, unknown>;
  };
}

export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: AuthUser;
}

export interface AuthError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  error: AuthError | null;
}

// =============================================================================
// 認證事件類型 / Authentication Event Types
// =============================================================================

export type AuthEventType =
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'
  | 'USER_DELETED';

export interface AuthEventParams {
  type: AuthEventType;
  session: AuthSession | null;
  user: AuthUser | null;
  timestamp: Date;
}

export type AuthEventHandler = (params: AuthEventParams) => void | Promise<void>;

// =============================================================================
// 匯出便利類型 / Export Convenience Types
// =============================================================================

export type AnyFormData =
  | LoginFormSubmissionData
  | RegisterFormSubmissionData
  | ResetPasswordFormData
  | ChangePasswordFormData;
export type AnyComponentProps = Record<string, unknown>;
export type AnyEventHandler =
  | FormEventHandler
  | FieldEventHandler
  | ValidationEventHandler
  | UIEventHandler
  | AuthEventHandler;
