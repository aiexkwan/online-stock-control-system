/**
 * Logger Sanitizer Module
 *
 * Provides data sanitization functionality for logging sensitive information.
 * This module ensures that sensitive data like passwords, API keys, and tokens
 * are properly redacted before being logged.
 */

import {
  LogLevel,
  LogEntry,
  LogContext,
  LogError,
  SanitizedLogEntry,
  SanitizationConfig,
  LogSanitizer,
  AnyLogData,
} from '@/lib/types/security-monitoring';

// List of sensitive field names that should be redacted
const SENSITIVE_FIELDS = [
  'password',
  'passwd',
  'pass',
  'secret',
  'token',
  'apikey',
  'api_key',
  'apiKey',
  'auth',
  'authorization',
  'cookie',
  'session',
  'csrf',
  'private',
  'ssn',
  'credit_card',
  'creditCard',
  'card_number',
  'cardNumber',
  'cvv',
  'cvc',
];

// Check if a field name is sensitive (case-insensitive)
function isSensitiveField(fieldName: string): boolean {
  const lowerField = fieldName.toLowerCase();
  return SENSITIVE_FIELDS.some(sensitive => lowerField.includes(sensitive.toLowerCase()));
}

/**
 * Sanitizes data by redacting sensitive information
 * @param data - The data to sanitize (can be any type)
 * @param maxDepth - Maximum depth for nested object traversal (default: 10)
 * @returns Sanitized copy of the data
 */
export function sanitizeData(data: unknown, maxDepth: number = 10): unknown {
  // Handle null and undefined
  if (data === null) return null;
  if (data === undefined) return undefined;

  // Handle primitives
  if (typeof data !== 'object') {
    return data;
  }

  // Prevent infinite recursion with circular references
  if (maxDepth <= 0) {
    return '[MAX_DEPTH_REACHED]';
  }

  // Handle circular references using WeakSet
  const seen = new WeakSet();

  function sanitizeRecursive(obj: unknown, depth: number): unknown {
    // Check for circular reference
    if (obj && typeof obj === 'object') {
      if (seen.has(obj)) {
        return '[CIRCULAR_REFERENCE]';
      }
      seen.add(obj);
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeRecursive(item, depth - 1));
    }

    // Handle objects
    if (obj && typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(obj)) {
        // Check if the key is sensitive
        if (isSensitiveField(key)) {
          sanitized[key] = '[REDACTED]';
        } else if (value === null) {
          sanitized[key] = null;
        } else if (value === undefined) {
          sanitized[key] = undefined;
        } else if (typeof value === 'object' && depth > 0) {
          // Recursively sanitize nested objects
          sanitized[key] = sanitizeRecursive(value, depth - 1);
        } else {
          sanitized[key] = value;
        }
      }

      return sanitized;
    }

    return obj;
  }

  try {
    return sanitizeRecursive(data, maxDepth);
  } catch (error) {
    // If sanitization fails, return a safe fallback
    return '[SANITIZATION_ERROR]';
  }
}

/**
 * Sanitizes an error object for logging
 * @param error - The error to sanitize
 * @returns Sanitized error object
 */
export function sanitizeError(error: Error | unknown): Record<string, unknown> | null {
  if (!error) return null;

  const sanitized: Record<string, unknown> = {
    name: (error as Error)?.name || 'Error',
    message: (error as Error)?.message || 'Unknown error',
  };

  if ((error as Error)?.stack) {
    // Redact any sensitive information from stack traces
    const stack = (error as Error)?.stack;
    sanitized.stack = stack
      .split('\n')
      .map((line: string) => {
        // Redact potential sensitive paths or values
        return line.replace(/\/api\/[^/]+/g, '/api/[REDACTED]');
      })
      .join('\n');
  }

  // Sanitize any additional properties
  const additionalProps = { ...(error as Record<string, unknown>) };
  delete (additionalProps as { name?: unknown }).name;
  delete (additionalProps as { message?: unknown }).message;
  delete (additionalProps as { stack?: unknown }).stack;

  if (Object.keys(additionalProps).length > 0) {
    sanitized.details = sanitizeData(additionalProps);
  }

  return sanitized;
}

/**
 * Creates a sanitized log entry
 * @param level - Log level (info, warn, error, debug)
 * @param message - Log message
 * @param data - Additional data to log
 * @returns Sanitized log entry
 */
export function createSanitizedLogEntry(
  level: LogLevel,
  message: string,
  data?: AnyLogData
): { level: LogLevel; message: string; timestamp: string; data?: Record<string, unknown> } {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    data: data ? sanitizeData(data) as Record<string, unknown> : undefined,
  };
}
