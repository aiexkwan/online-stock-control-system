/**
 * Component Communication Standards
 * 
 * Defines standardized interfaces and contracts for component communication
 * in the authentication system. These interfaces ensure consistent and
 * type-safe communication between components.
 */

import { AuthEvent, EventMap } from '../events/types';
import { LoginFormData, RegisterFormData, LoginUIState } from '../context/LoginContext';

// Component Communication Contract
export interface ComponentContract<TProps = any, TState = any, TEvents = any> {
  name: string;
  version: string;
  props: TProps;
  state?: TState;
  events: TEvents;
  dependencies?: string[];
  provides?: string[];
}

// Communication Channel Types
export type CommunicationChannel = 
  | 'direct-props'      // Direct prop passing
  | 'context'          // React Context
  | 'events'           // Event-driven
  | 'callback'         // Callback functions
  | 'ref'              // React refs
  | 'global-state';    // Global state management

// Communication Message Structure
export interface CommunicationMessage<T = any> {
  id: string;
  type: string;
  channel: CommunicationChannel;
  source: string;
  target?: string;
  payload: T;
  timestamp: number;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  requiresResponse?: boolean;
  correlationId?: string;
}

// Authentication Component Interfaces

// Login Form Component Interface
export interface LoginFormComponentInterface extends ComponentContract {
  name: 'LoginForm';
  props: {
    onSuccess?: (user: any) => void;
    onError?: (error: string) => void;
    initialData?: Partial<LoginFormData>;
    disabled?: boolean;
    showRememberMe?: boolean;
  };
  state: {
    formData: LoginFormData;
    isSubmitting: boolean;
    validationErrors: Record<string, string>;
    isValid: boolean;
  };
  events: {
    emits: [
      'form:submit',
      'form:change',
      'form:validate',
      'form:clear',
      'auth:login-attempt',
      'auth:login-success',
      'auth:login-error'
    ];
    listens: [
      'auth:logout',
      'form:reset',
      'validation:error-clear'
    ];
  };
}

// Register Form Component Interface
export interface RegisterFormComponentInterface extends ComponentContract {
  name: 'RegisterForm';
  props: {
    onSuccess?: (email: string) => void;
    onError?: (error: string) => void;
    initialData?: Partial<RegisterFormData>;
    disabled?: boolean;
    requireEmailVerification?: boolean;
  };
  state: {
    formData: RegisterFormData;
    isSubmitting: boolean;
    validationErrors: Record<string, string>;
    passwordStrength: number;
    isValid: boolean;
  };
  events: {
    emits: [
      'form:submit',
      'form:change',
      'form:validate',
      'auth:register-attempt',
      'auth:register-success',
      'auth:register-error',
      'password:strength-change'
    ];
    listens: [
      'form:reset',
      'validation:error-clear',
      'password:visibility-toggle'
    ];
  };
}

// Password Reset Component Interface
export interface PasswordResetComponentInterface extends ComponentContract {
  name: 'PasswordResetForm';
  props: {
    onSuccess?: (email: string) => void;
    onError?: (error: string) => void;
    disabled?: boolean;
  };
  state: {
    email: string;
    isSubmitting: boolean;
    isSuccess: boolean;
    error?: string;
  };
  events: {
    emits: [
      'form:submit',
      'auth:password-reset-attempt',
      'auth:password-reset-success',
      'auth:password-reset-error'
    ];
    listens: [
      'form:reset'
    ];
  };
}

// UI Component Interfaces

// Error Display Component Interface
export interface ErrorDisplayComponentInterface extends ComponentContract {
  name: 'ErrorDisplay';
  props: {
    error?: string;
    field?: string;
    type?: 'field' | 'form' | 'global';
    dismissible?: boolean;
    timeout?: number;
    onDismiss?: () => void;
  };
  state: {
    isVisible: boolean;
    dismissedAt?: number;
  };
  events: {
    emits: ['error:dismiss', 'error:timeout'];
    listens: ['error:show', 'error:hide', 'error:clear'];
  };
}

// Loading Indicator Component Interface
export interface LoadingIndicatorComponentInterface extends ComponentContract {
  name: 'LoadingIndicator';
  props: {
    loading: boolean;
    text?: string;
    size?: 'sm' | 'md' | 'lg';
    overlay?: boolean;
  };
  state: {
    isActive: boolean;
    startTime?: number;
  };
  events: {
    emits: ['loading:start', 'loading:stop'];
    listens: ['loading:show', 'loading:hide'];
  };
}

// Communication Protocols

// Form Communication Protocol
export interface FormCommunicationProtocol {
  // Form lifecycle events
  onFormMount: (formId: string) => void;
  onFormUnmount: (formId: string) => void;
  onFormSubmit: (formId: string, data: any) => Promise<void>;
  onFormChange: (formId: string, field: string, value: string) => void;
  onFormValidate: (formId: string, field?: string) => Promise<boolean>;
  onFormReset: (formId: string) => void;
  onFormClear: (formId: string) => void;
  
  // Field-level events
  onFieldFocus: (formId: string, field: string) => void;
  onFieldBlur: (formId: string, field: string) => void;
  onFieldChange: (formId: string, field: string, value: string) => void;
  onFieldValidate: (formId: string, field: string, value: string) => Promise<string | undefined>;
  onFieldError: (formId: string, field: string, error: string) => void;
  onFieldErrorClear: (formId: string, field: string) => void;
}

// Authentication Communication Protocol
export interface AuthCommunicationProtocol {
  // Authentication events
  onLoginAttempt: (credentials: LoginFormData) => Promise<void>;
  onLoginSuccess: (user: any, redirectPath?: string) => void;
  onLoginError: (error: string, field?: string) => void;
  
  onRegisterAttempt: (data: RegisterFormData) => Promise<void>;
  onRegisterSuccess: (email: string) => void;
  onRegisterError: (error: string, field?: string) => void;
  
  onPasswordResetAttempt: (email: string) => Promise<void>;
  onPasswordResetSuccess: (email: string) => void;
  onPasswordResetError: (error: string) => void;
  
  onLogout: () => Promise<void>;
  onSessionExpired: () => void;
  onAuthStateChange: (isAuthenticated: boolean, user?: any) => void;
}

// UI Communication Protocol
export interface UICommunicationProtocol {
  // View management
  onViewChange: (from: string, to: string) => void;
  onModalOpen: (modalId: string, props?: any) => void;
  onModalClose: (modalId: string) => void;
  
  // Notifications
  onNotificationShow: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onNotificationHide: (notificationId: string) => void;
  
  // Loading states
  onLoadingStart: (operation?: string) => void;
  onLoadingStop: (operation?: string) => void;
  
  // Error handling
  onErrorShow: (error: string, context?: string) => void;
  onErrorHide: (errorId?: string) => void;
  onErrorClear: (scope?: 'field' | 'form' | 'global') => void;
}

// Component Registration and Discovery
export interface ComponentRegistry {
  // Register components
  register<T extends ComponentContract>(contract: T): void;
  unregister(name: string): void;
  
  // Discover components
  findByName(name: string): ComponentContract | undefined;
  findByCapability(capability: string): ComponentContract[];
  findDependents(name: string): ComponentContract[];
  findDependencies(name: string): ComponentContract[];
  
  // Validation
  validateContract(contract: ComponentContract): boolean;
  validateDependencies(name: string): boolean;
  
  // Events
  onComponentRegistered: (contract: ComponentContract) => void;
  onComponentUnregistered: (name: string) => void;
}

// Message Bus Interface
export interface MessageBus {
  // Publishing
  publish<T>(message: CommunicationMessage<T>): Promise<void>;
  publishAndWait<T, R>(message: CommunicationMessage<T>): Promise<R>;
  
  // Subscribing
  subscribe<T>(
    type: string,
    handler: (message: CommunicationMessage<T>) => void | Promise<void>
  ): () => void;
  
  subscribeOnce<T>(
    type: string,
    handler: (message: CommunicationMessage<T>) => void | Promise<void>
  ): () => void;
  
  // Channel management
  createChannel(name: string, type: CommunicationChannel): void;
  destroyChannel(name: string): void;
  getChannel(name: string): CommunicationChannel | undefined;
  
  // Message history and debugging
  getMessageHistory(limit?: number): CommunicationMessage[];
  clearHistory(): void;
  enableDebugMode(enabled: boolean): void;
}

// Communication Middleware
export interface CommunicationMiddleware<T = any> {
  name: string;
  priority: number;
  process(
    message: CommunicationMessage<T>,
    next: (message: CommunicationMessage<T>) => Promise<void>
  ): Promise<void>;
}

// Error Handling for Communication
export interface CommunicationError extends Error {
  code: string;
  source?: string;
  target?: string;
  originalMessage?: CommunicationMessage;
  timestamp: number;
}

// Communication Metrics
export interface CommunicationMetrics {
  messagesSent: number;
  messagesReceived: number;
  messagesProcessed: number;
  messagesFailed: number;
  averageProcessingTime: number;
  peakThroughput: number;
  channelUsage: Record<CommunicationChannel, number>;
  componentInteractions: Record<string, Record<string, number>>;
}

// Naming Conventions
export const NAMING_CONVENTIONS = {
  // Event names
  events: {
    // Format: <domain>:<action>[-<target>]
    // Examples: 'form:submit', 'auth:login-success', 'ui:modal-open'
    format: /^[a-z]+:[a-z-]+$/,
    domains: ['form', 'auth', 'ui', 'validation', 'error', 'loading'] as const,
  },
  
  // Component names
  components: {
    // Format: PascalCase
    format: /^[A-Z][A-Za-z0-9]*$/,
    suffixes: ['Form', 'Display', 'Indicator', 'Button', 'Input', 'Modal'] as const,
  },
  
  // Message types
  messages: {
    // Format: UPPER_SNAKE_CASE
    format: /^[A-Z][A-Z0-9_]*$/,
    prefixes: ['REQUEST_', 'RESPONSE_', 'EVENT_', 'NOTIFICATION_'] as const,
  },
  
  // Props and state properties
  properties: {
    // Format: camelCase
    format: /^[a-z][a-zA-Z0-9]*$/,
    booleanPrefixes: ['is', 'has', 'can', 'should', 'will'] as const,
    handlerPrefixes: ['on', 'handle'] as const,
  },
} as const;

// Type Guards
export function isComponentContract(obj: any): obj is ComponentContract {
  return obj && typeof obj.name === 'string' && typeof obj.version === 'string';
}

export function isCommunicationMessage(obj: any): obj is CommunicationMessage {
  return obj && 
    typeof obj.id === 'string' && 
    typeof obj.type === 'string' &&
    typeof obj.source === 'string' &&
    typeof obj.timestamp === 'number';
}

export function isCommunicationError(obj: any): obj is CommunicationError {
  return obj instanceof Error && 'code' in obj && 'timestamp' in obj;
}