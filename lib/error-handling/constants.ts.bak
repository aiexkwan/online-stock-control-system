/**
 * Unified Error Messages Constants
 * 統一錯誤訊息常量
 *
 * User-friendly error messages for consistent error handling across the application
 */

import { ErrorCategory, ErrorSeverity } from './types';

/**
 * User-friendly error messages organized by category
 */
export const ERROR_MESSAGES = {
  // Network errors
  NETWORK: {
    GENERAL: 'Connection error. Please check your network and try again.',
    TIMEOUT: 'Request timed out. Please try again.',
    OFFLINE: 'You appear to be offline. Please check your connection.',
    SERVER_UNREACHABLE: 'Unable to reach the server. Please try again later.',
    SLOW_CONNECTION: 'Your connection seems slow. This may take longer than usual.',
  },

  // Authentication errors
  AUTH: {
    UNAUTHORIZED: 'Please sign in to access this feature.',
    SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
    INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
    PERMISSION_DENIED: 'You do not have permission to access this resource.',
    TOKEN_INVALID: 'Authentication failed. Please sign in again.',
    ACCOUNT_LOCKED: 'Your account has been locked. Please contact support.',
  },

  // Validation errors
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required.',
    INVALID_FORMAT: 'Please enter a valid format.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    INVALID_DATE: 'Please enter a valid date.',
    INVALID_NUMBER: 'Please enter a valid number.',
    OUT_OF_RANGE: 'Value is outside the allowed range.',
    TOO_LONG: 'Input is too long. Please shorten it.',
    TOO_SHORT: 'Input is too short. Please add more information.',
    DUPLICATE_ENTRY: 'This entry already exists.',
  },

  // API errors
  API: {
    GENERAL: 'Unable to complete the request. Please try again.',
    FETCH_FAILED: 'Unable to load data. Please refresh the page.',
    SAVE_FAILED: 'Unable to save changes. Please try again.',
    DELETE_FAILED: 'Unable to delete. Please try again.',
    UPDATE_FAILED: 'Unable to update. Please try again.',
    RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
    MAINTENANCE: 'Service is under maintenance. Please try again later.',
  },

  // Permission errors
  PERMISSION: {
    GENERAL: 'You do not have permission to perform this action.',
    VIEW_DENIED: 'You do not have permission to view this content.',
    EDIT_DENIED: 'You do not have permission to edit this content.',
    DELETE_DENIED: 'You do not have permission to delete this content.',
    CREATE_DENIED: 'You do not have permission to create new items.',
    ADMIN_ONLY: 'This action requires administrator privileges.',
  },

  // Rendering errors
  RENDERING: {
    COMPONENT_FAILED: 'Unable to display this content. Please refresh the page.',
    CHART_FAILED: 'Unable to render chart. Please try again.',
    TABLE_FAILED: 'Unable to display table data. Please refresh.',
    WIDGET_FAILED: 'Widget failed to load. Click to retry.',
    LAZY_LOAD_FAILED: 'Failed to load component. Please refresh the page.',
  },

  // Widget-specific errors
  WIDGET: {
    STATS_LOAD_FAILED: 'Unable to load statistics. Please refresh.',
    CHART_DATA_FAILED: 'Unable to load chart data. Please try again.',
    TABLE_DATA_FAILED: 'Unable to load table data. Please refresh.',
    METRICS_UNAVAILABLE: 'Metrics temporarily unavailable.',
    REAL_TIME_DISCONNECTED: 'Real-time updates disconnected. Showing cached data.',
  },

  // General/Unknown errors
  GENERAL: {
    UNKNOWN: 'An unexpected error occurred. Please try again.',
    SOMETHING_WRONG: 'Something went wrong. Please refresh the page.',
    CONTACT_SUPPORT: 'If this problem persists, please contact support.',
    TRY_AGAIN: 'Please try again.',
    REFRESH_PAGE: 'Please refresh the page.',
  },
} as const;

/**
 * Recovery action labels
 */
export const RECOVERY_LABELS = {
  retry: 'Retry',
  refresh: 'Refresh',
  redirect: 'Go Back',
  clear_cache: 'Clear Cache',
  logout: 'Sign Out',
  manual: 'Manual Recovery',
  contact_support: 'Contact Support',
  reload_page: 'Reload Page',
} as const;

/**
 * Get user-friendly message based on error
 */
export function getUserFriendlyMessage(
  error: Error,
  category?: ErrorCategory,
  fallback?: string
): string {
  const message = error.message.toLowerCase();

  // Network errors
  if (category === 'network' || message.includes('network') || message.includes('fetch')) {
    if (message.includes('timeout')) return ERROR_MESSAGES.NETWORK.TIMEOUT;
    if (message.includes('offline')) return ERROR_MESSAGES.NETWORK.OFFLINE;
    return ERROR_MESSAGES.NETWORK.GENERAL;
  }

  // Auth errors
  if (category === 'auth' || message.includes('auth') || message.includes('unauthorized')) {
    if (message.includes('expired')) return ERROR_MESSAGES.AUTH.SESSION_EXPIRED;
    if (message.includes('unauthorized') || message.includes('401'))
      return ERROR_MESSAGES.AUTH.UNAUTHORIZED;
    if (message.includes('forbidden') || message.includes('403'))
      return ERROR_MESSAGES.AUTH.PERMISSION_DENIED;
    return ERROR_MESSAGES.AUTH.TOKEN_INVALID;
  }

  // Validation errors
  if (category === 'validation' || message.includes('validation') || message.includes('invalid')) {
    if (message.includes('required')) return ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
    if (message.includes('email')) return ERROR_MESSAGES.VALIDATION.INVALID_EMAIL;
    if (message.includes('date')) return ERROR_MESSAGES.VALIDATION.INVALID_DATE;
    if (message.includes('number')) return ERROR_MESSAGES.VALIDATION.INVALID_NUMBER;
    return ERROR_MESSAGES.VALIDATION.INVALID_FORMAT;
  }

  // API errors
  if (category === 'api' || message.includes('api') || message.includes('request')) {
    if (message.includes('rate')) return ERROR_MESSAGES.API.RATE_LIMITED;
    if (message.includes('maintenance')) return ERROR_MESSAGES.API.MAINTENANCE;
    if (message.includes('save')) return ERROR_MESSAGES.API.SAVE_FAILED;
    if (message.includes('delete')) return ERROR_MESSAGES.API.DELETE_FAILED;
    if (message.includes('update')) return ERROR_MESSAGES.API.UPDATE_FAILED;
    return ERROR_MESSAGES.API.GENERAL;
  }

  // Permission errors
  if (category === 'permission' || message.includes('permission') || message.includes('denied')) {
    if (message.includes('view')) return ERROR_MESSAGES.PERMISSION.VIEW_DENIED;
    if (message.includes('edit')) return ERROR_MESSAGES.PERMISSION.EDIT_DENIED;
    if (message.includes('delete')) return ERROR_MESSAGES.PERMISSION.DELETE_DENIED;
    if (message.includes('create')) return ERROR_MESSAGES.PERMISSION.CREATE_DENIED;
    return ERROR_MESSAGES.PERMISSION.GENERAL;
  }

  // Rendering errors
  if (category === 'rendering' || message.includes('render') || message.includes('component')) {
    if (message.includes('chart')) return ERROR_MESSAGES.RENDERING.CHART_FAILED;
    if (message.includes('table')) return ERROR_MESSAGES.RENDERING.TABLE_FAILED;
    if (message.includes('widget')) return ERROR_MESSAGES.RENDERING.WIDGET_FAILED;
    return ERROR_MESSAGES.RENDERING.COMPONENT_FAILED;
  }

  // Return fallback or generic message
  return fallback || ERROR_MESSAGES.GENERAL.UNKNOWN;
}

/**
 * Get severity-based styling
 */
export const ERROR_SEVERITY_STYLES = {
  low: {
    backgroundColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-600',
  },
  medium: {
    backgroundColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-800',
    iconColor: 'text-orange-600',
  },
  high: {
    backgroundColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-600',
  },
  critical: {
    backgroundColor: 'bg-red-100',
    borderColor: 'border-red-300',
    textColor: 'text-red-900',
    iconColor: 'text-red-700',
  },
} as const;

/**
 * Error display duration based on severity (in milliseconds)
 */
export const ERROR_DISPLAY_DURATION: Record<ErrorSeverity, number> = {
  low: 3000,
  medium: 5000,
  high: 8000,
  critical: 0, // Don't auto-hide critical errors
} as const;

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  shouldRetry: (error: Error, attemptNumber: number) => {
    // Don't retry auth errors
    if (error.message.toLowerCase().includes('auth')) return false;

    // Don't retry validation errors
    if (error.message.toLowerCase().includes('validation')) return false;

    // Retry network and timeout errors
    if (
      error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('timeout') ||
      error.message.toLowerCase().includes('fetch')
    ) {
      return attemptNumber < 3;
    }

    return attemptNumber < 2;
  },
} as const;
