/**
 * Compound Component Types
 *
 * Type definitions for compound component patterns in the login system.
 * These types enable flexible composition while maintaining type safety.
 */

import * as React from 'react';
// import { LoginFormData, RegisterFormData } from '../../context/LoginContext'; // TODO: Remove if not used

// 本地類型定義以替代缺少的導入
export interface AnyComponentProps {
  [key: string]: unknown;
}

export interface RenderPropsBase<TContext = unknown> {
  children?: React.ReactNode | ((context: TContext) => React.ReactNode);
}

// Base compound component props
export interface BaseCompoundProps {
  children?: React.ReactNode;
  className?: string;
  id?: string;
}

// Form compound component context with generic support
export interface FormCompoundContext<
  TFormData extends Record<string, unknown> = Record<string, string>,
> {
  formType: 'login' | 'register' | 'reset' | 'change';
  isSubmitting: boolean;
  hasErrors: boolean;
  onFieldChange: (field: string, value: string) => void;
  onSubmit: (data: TFormData) => Promise<void>;
  onClear: () => void;
}

// Field compound component props
export interface FieldCompoundProps extends BaseCompoundProps {
  name: string;
  label?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  validate?: (value: string) => string | undefined;
}

// Input compound component props
export interface InputCompoundProps extends Omit<FieldCompoundProps, 'children'> {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  showPasswordToggle?: boolean;
  onPasswordToggle?: () => void;
  passwordVisible?: boolean;
}

// Button compound component props
export interface ButtonCompoundProps extends BaseCompoundProps {
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'link';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  href?: string;
}

// Layout compound component props
export interface LayoutCompoundProps extends BaseCompoundProps {
  orientation?: 'vertical' | 'horizontal';
  spacing?: 'sm' | 'md' | 'lg';
  align?: 'start' | 'center' | 'end';
  justify?: 'start' | 'center' | 'end' | 'between';
}

// Error display compound component props
export interface ErrorDisplayProps extends BaseCompoundProps {
  error?: string;
  field?: string;
  type?: 'field' | 'form' | 'global';
}

// Loading indicator compound component props
export interface LoadingIndicatorProps extends BaseCompoundProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  inline?: boolean;
}

// Compound component composition utilities
export type CompoundComponentType<_T, _U = {}> = React.FC<_T> & _U;

export interface WithCompoundComponents<_T> {
  displayName?: string;
  [key: string]: React.ComponentType<AnyComponentProps> | string | undefined;
}

// Form field validation result
export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
}

// Form validation context
export interface FormValidationContext {
  validateField: (name: string, value: string) => FieldValidationResult;
  clearFieldError: (name: string) => void;
  getFieldError: (name: string) => string | undefined;
  hasFieldError: (name: string) => boolean;
}

// Theme context for styling consistency
export interface ThemeContext {
  colors: {
    primary: string;
    secondary: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    background: {
      primary: string;
      secondary: string;
      accent: string;
    };
    border: {
      default: string;
      focus: string;
      error: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

// Component state management
export interface ComponentState {
  id: string;
  type: string;
  isVisible: boolean;
  isEnabled: boolean;
  hasError: boolean;
  isDirty: boolean;
  isTouched: boolean;
}

// Event handler types for compound components
// 本地事件處理器類型定義
export type FormEventHandler = (event: React.FormEvent) => void;
export type FieldEventHandler = (name: string, value: string) => void;
export type ValidationEventHandler = (name: string, result: FieldValidationResult) => void;
export type UIEventHandler = (event: React.SyntheticEvent) => void;

// 組件註冊表類型
export interface ComponentRegistry {
  register: (name: string, component: React.ComponentType<any>) => void;
  unregister: (name: string) => void;
  get<P = Record<string, unknown>>(
    name: string
  ): import('../../../../../lib/types/auth-system').RegisteredComponent<P> | undefined;
}

export interface FormRenderProps extends RenderPropsBase<FormCompoundContext> {}
export interface FieldRenderProps
  extends RenderPropsBase<{
    value: string;
    onChange: (value: string) => void;
    error?: string;
    isValid: boolean;
  }> {}

// Animation and transition props
export interface TransitionProps {
  appear?: boolean;
  enter?: boolean;
  exit?: boolean;
  duration?: number;
  delay?: number;
  easing?: string;
}

// Accessibility props
export interface A11yProps {
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: boolean;
  'aria-relevant'?: string;
  tabIndex?: number;
}
