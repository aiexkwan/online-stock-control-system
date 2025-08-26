/**
 * Event Types for Login System
 * 
 * Defines all event types and their payload structures for the login
 * system's event-driven architecture. This enables loose coupling
 * between components while maintaining type safety.
 */

import { LoginFormData, RegisterFormData, LoginUIState } from '../context/LoginContext';

// Base event interface
export interface BaseEvent<T = any> {
  type: string;
  payload: T;
  timestamp: number;
  source?: string;
}

// Authentication Events
export interface LoginAttemptEvent extends BaseEvent<{ email: string; password: string }> {
  type: 'LOGIN_ATTEMPT';
}

export interface LoginSuccessEvent extends BaseEvent<{ email: string; user: any; redirectPath?: string }> {
  type: 'LOGIN_SUCCESS';
}

export interface LoginErrorEvent extends BaseEvent<{ error: string; field?: string }> {
  type: 'LOGIN_ERROR';
}

export interface RegisterAttemptEvent extends BaseEvent<RegisterFormData> {
  type: 'REGISTER_ATTEMPT';
}

export interface RegisterSuccessEvent extends BaseEvent<{ email: string }> {
  type: 'REGISTER_SUCCESS';
}

export interface RegisterErrorEvent extends BaseEvent<{ error: string; field?: string }> {
  type: 'REGISTER_ERROR';
}

export interface PasswordResetAttemptEvent extends BaseEvent<{ email: string }> {
  type: 'PASSWORD_RESET_ATTEMPT';
}

export interface PasswordResetSuccessEvent extends BaseEvent<{ email: string }> {
  type: 'PASSWORD_RESET_SUCCESS';
}

export interface PasswordResetErrorEvent extends BaseEvent<{ error: string }> {
  type: 'PASSWORD_RESET_ERROR';
}

// Form Events
export interface FormFieldChangeEvent extends BaseEvent<{ field: string; value: string; formType: 'login' | 'register' | 'reset' | 'change' }> {
  type: 'FORM_FIELD_CHANGE';
}

export interface FormValidationEvent extends BaseEvent<{ field: string; isValid: boolean; error?: string }> {
  type: 'FORM_VALIDATION';
}

export interface FormSubmitEvent extends BaseEvent<{ formType: 'login' | 'register' | 'reset' | 'change'; data: any }> {
  type: 'FORM_SUBMIT';
}

export interface FormClearEvent extends BaseEvent<{ formType?: 'login' | 'register' | 'all' }> {
  type: 'FORM_CLEAR';
}

// UI Events
export interface ViewChangeEvent extends BaseEvent<{ from: LoginUIState['currentView']; to: LoginUIState['currentView'] }> {
  type: 'VIEW_CHANGE';
}

export interface PasswordVisibilityToggleEvent extends BaseEvent<{ field: 'password' | 'confirmPassword'; visible: boolean }> {
  type: 'PASSWORD_VISIBILITY_TOGGLE';
}

export interface ConfirmationShowEvent extends BaseEvent<{ message: string; type: 'success' | 'error' | 'info' }> {
  type: 'CONFIRMATION_SHOW';
}

export interface ConfirmationHideEvent extends BaseEvent<{}> {
  type: 'CONFIRMATION_HIDE';
}

// System Events
export interface ErrorClearEvent extends BaseEvent<{ scope?: 'field' | 'form' | 'all'; field?: string }> {
  type: 'ERROR_CLEAR';
}

export interface StateResetEvent extends BaseEvent<{ scope: 'forms' | 'ui' | 'errors' | 'all' }> {
  type: 'STATE_RESET';
}

export interface LoadingStateEvent extends BaseEvent<{ loading: boolean; operation?: string }> {
  type: 'LOADING_STATE';
}

// Union type of all events
export type AuthEvent =
  | LoginAttemptEvent
  | LoginSuccessEvent
  | LoginErrorEvent
  | RegisterAttemptEvent
  | RegisterSuccessEvent
  | RegisterErrorEvent
  | PasswordResetAttemptEvent
  | PasswordResetSuccessEvent
  | PasswordResetErrorEvent
  | FormFieldChangeEvent
  | FormValidationEvent
  | FormSubmitEvent
  | FormClearEvent
  | ViewChangeEvent
  | PasswordVisibilityToggleEvent
  | ConfirmationShowEvent
  | ConfirmationHideEvent
  | ErrorClearEvent
  | StateResetEvent
  | LoadingStateEvent;

// Event listener callback type
export type EventListener<T extends AuthEvent = AuthEvent> = (event: T) => void | Promise<void>;

// Event map for type-safe event listening
export interface EventMap {
  'LOGIN_ATTEMPT': LoginAttemptEvent;
  'LOGIN_SUCCESS': LoginSuccessEvent;
  'LOGIN_ERROR': LoginErrorEvent;
  'REGISTER_ATTEMPT': RegisterAttemptEvent;
  'REGISTER_SUCCESS': RegisterSuccessEvent;
  'REGISTER_ERROR': RegisterErrorEvent;
  'PASSWORD_RESET_ATTEMPT': PasswordResetAttemptEvent;
  'PASSWORD_RESET_SUCCESS': PasswordResetSuccessEvent;
  'PASSWORD_RESET_ERROR': PasswordResetErrorEvent;
  'FORM_FIELD_CHANGE': FormFieldChangeEvent;
  'FORM_VALIDATION': FormValidationEvent;
  'FORM_SUBMIT': FormSubmitEvent;
  'FORM_CLEAR': FormClearEvent;
  'VIEW_CHANGE': ViewChangeEvent;
  'PASSWORD_VISIBILITY_TOGGLE': PasswordVisibilityToggleEvent;
  'CONFIRMATION_SHOW': ConfirmationShowEvent;
  'CONFIRMATION_HIDE': ConfirmationHideEvent;
  'ERROR_CLEAR': ErrorClearEvent;
  'STATE_RESET': StateResetEvent;
  'LOADING_STATE': LoadingStateEvent;
}

// Event names as constant enum for better IntelliSense
export const EVENT_TYPES = {
  // Authentication
  LOGIN_ATTEMPT: 'LOGIN_ATTEMPT' as const,
  LOGIN_SUCCESS: 'LOGIN_SUCCESS' as const,
  LOGIN_ERROR: 'LOGIN_ERROR' as const,
  REGISTER_ATTEMPT: 'REGISTER_ATTEMPT' as const,
  REGISTER_SUCCESS: 'REGISTER_SUCCESS' as const,
  REGISTER_ERROR: 'REGISTER_ERROR' as const,
  PASSWORD_RESET_ATTEMPT: 'PASSWORD_RESET_ATTEMPT' as const,
  PASSWORD_RESET_SUCCESS: 'PASSWORD_RESET_SUCCESS' as const,
  PASSWORD_RESET_ERROR: 'PASSWORD_RESET_ERROR' as const,
  
  // Forms
  FORM_FIELD_CHANGE: 'FORM_FIELD_CHANGE' as const,
  FORM_VALIDATION: 'FORM_VALIDATION' as const,
  FORM_SUBMIT: 'FORM_SUBMIT' as const,
  FORM_CLEAR: 'FORM_CLEAR' as const,
  
  // UI
  VIEW_CHANGE: 'VIEW_CHANGE' as const,
  PASSWORD_VISIBILITY_TOGGLE: 'PASSWORD_VISIBILITY_TOGGLE' as const,
  CONFIRMATION_SHOW: 'CONFIRMATION_SHOW' as const,
  CONFIRMATION_HIDE: 'CONFIRMATION_HIDE' as const,
  
  // System
  ERROR_CLEAR: 'ERROR_CLEAR' as const,
  STATE_RESET: 'STATE_RESET' as const,
  LOADING_STATE: 'LOADING_STATE' as const,
} as const;