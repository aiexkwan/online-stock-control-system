/**
 * Compound Component Types
 *
 * Type definitions for compound component patterns in the login system.
 * These types enable flexible composition while maintaining type safety.
 */

import React from 'react';
import { LoginFormData, RegisterFormData } from '../../context/LoginContext';
import {
  FormSubmissionData,
  FormEventHandler,
  UIEventHandler,
  ComponentRegistryOperations,
  AnyComponentProps,
  RenderPropsBase,
} from '@/lib/types/auth-system';

// Base compound component props
export interface BaseCompoundProps {
  children?: React.ReactNode;
  className?: string;
  id?: string;
}

// Form compound component context
export interface FormCompoundContext {
  formType: 'login' | 'register' | 'reset' | 'change';
  isSubmitting: boolean;
  hasErrors: boolean;
  onFieldChange: (field: string, value: string) => void;
  onSubmit: (data: any) => Promise<void>;
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
export type CompoundComponentType<T, U = {}> = React.FC<T> & U;

export interface WithCompoundComponents<T> {
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
// Re-export from auth-system types
export type { FormEventHandler } from '@/lib/types/auth-system';
export type FieldEventHandler = (name: string, value: string) => void;
export type ValidationEventHandler = (name: string, result: FieldValidationResult) => void;
// Re-export from auth-system types
export type { UIEventHandler } from '@/lib/types/auth-system';

// Compound component registry for dynamic composition
// Re-export from auth-system types
export type { ComponentRegistryOperations as ComponentRegistry } from '@/lib/types/auth-system';

// Render props patterns
// Re-export from auth-system types
export type { RenderPropsBase } from '@/lib/types/auth-system';

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
