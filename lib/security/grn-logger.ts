/**
 * GRN-Specific Logger Module
 *
 * Extends the logger-sanitizer to provide GRN-specific sanitization
 * for sensitive data like supplier codes, product codes, clock numbers,
 * and API responses.
 */

import { sanitizeData, sanitizeError, createSanitizedLogEntry } from './logger-sanitizer';
import {
  LogLevel,
  LogEntry,
  LogContext,
  AnyLogData,
  SanitizedLogEntry,
} from '@/lib/types/security-monitoring';

// Extended list of sensitive fields for GRN operations
const GRN_SENSITIVE_FIELDS = [
  // Authentication & User Data
  'clockNumber',
  'clock_number',
  'userId',
  'user_id',
  'email',
  'operator',
  'receivedBy',

  // Supplier Information
  'supplierCode',
  'supplier_code',
  'materialSupplier',
  'supplierInfo',

  // Product Information
  'productCode',
  'product_code',
  'productInfo',

  // GRN Specific Data
  'grnNumber',
  'grn_number',
  'grnnumber', // Handle different casing variations
  'palletNumber',
  'pallet_number',
  'palletNum',
  'series',
  'seriesNum',

  // Weight & Quantity Data (may contain business-sensitive information)
  'grossWeight',
  'gross_weight',
  'netWeight',
  'net_weight',
  'quantity',

  // API & Database Responses
  'apiResponse',
  'api_response',
  'databaseResponse',
  'db_response',
  'supabaseResponse',

  // PDF and File Data
  'pdfUrl',
  'pdf_url',
  'pdfBlob',
  'fileUrl',
  'file_url',
];

// Patterns to redact from strings (regex patterns)
// Order matters - more specific patterns should come first
const GRN_REDACTION_PATTERNS = [
  // GRN numbers (e.g., GRN-2024-001) - MUST come before general product code pattern
  { pattern: /\bGRN[-]\d{4}[-]\d{3,6}\b/gi, replacement: '[GRN_NUMBER]' },

  // Clock numbers (e.g., C12345, 12345)
  { pattern: /\b[Cc]\d{4,6}\b/g, replacement: '[CLOCK_NUMBER]' },

  // Pallet numbers (e.g., PAL-12345, P followed by 6-10 digits specifically)
  { pattern: /\b(PAL|pal)[-]?\d{5,10}\b/g, replacement: '[PALLET_NUMBER]' },
  { pattern: /\bP\d{6,10}\b/g, replacement: '[PALLET_NUMBER]' },

  // Supplier codes (e.g., SUP-12345, S12345 - but not just 'S')
  { pattern: /\b(SUP|sup)[-]?\d{4,8}\b/g, replacement: '[SUPPLIER_CODE]' },
  { pattern: /\bS\d{4,8}\b/g, replacement: '[SUPPLIER_CODE]' },

  // Product codes (various formats - but more specific to avoid false positives)
  { pattern: /\b(PROD|prod)[-]?\d{4,8}\b/g, replacement: '[PRODUCT_CODE]' },
  { pattern: /\bP[-]\d{4,8}\b/g, replacement: '[PRODUCT_CODE]' },
  { pattern: /\b[A-Z]{3,4}[-]\d{4,8}\b/g, replacement: '[PRODUCT_CODE]' },

  // Email addresses
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL]' },

  // UUIDs
  {
    pattern: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
    replacement: '[UUID]',
  },
];

/**
 * Check if a field name is GRN-sensitive (case-insensitive)
 */
function isGrnSensitiveField(fieldName: string): boolean {
  const lowerField = fieldName.toLowerCase();
  return GRN_SENSITIVE_FIELDS.some(sensitive => {
    const lowerSensitive = sensitive.toLowerCase();
    // Check exact match first
    if (lowerField === lowerSensitive) return true;
    // Then check with underscores replaced (for camelCase matching)
    const normalizedSensitive = lowerSensitive.replace(/_/g, '');
    const normalizedField = lowerField.replace(/_/g, '');
    return normalizedField.includes(normalizedSensitive);
  });
}

/**
 * Apply GRN-specific redaction patterns to strings
 */
function applyGrnRedactionPatterns(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  let redactedValue = value;
  for (const { pattern, replacement } of GRN_REDACTION_PATTERNS) {
    redactedValue = redactedValue.replace(pattern, replacement);
  }

  return redactedValue;
}

/**
 * Enhanced sanitization for GRN data
 */
export function sanitizeGrnData(data: unknown, maxDepth: number = 10): unknown {
  // Handle null and undefined
  if (data === null) return null;
  if (data === undefined) return undefined;

  // Handle strings with pattern redaction
  if (typeof data === 'string') {
    return applyGrnRedactionPatterns(data);
  }

  // Handle primitives
  if (typeof data !== 'object') {
    return data;
  }

  // Prevent infinite recursion with circular references
  if (maxDepth <= 0) {
    return '[MAX_DEPTH_REACHED]';
  }

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
        // Check if the key is GRN-sensitive
        if (isGrnSensitiveField(key)) {
          // Special handling for certain fields
          if (key.toLowerCase().includes('weight') || key.toLowerCase().includes('quantity')) {
            // Keep numeric values but redact if string
            sanitized[key] = typeof value === 'number' ? value : '[REDACTED]';
          } else {
            sanitized[key] = '[REDACTED]';
          }
        } else if (value === null) {
          sanitized[key] = null;
        } else if (value === undefined) {
          sanitized[key] = undefined;
        } else if (typeof value === 'string') {
          // Apply redaction patterns to string values
          sanitized[key] = applyGrnRedactionPatterns(value);
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
 * GRN Logger class with automatic sanitization
 */
export class GrnLogger {
  private isDevelopment: boolean;
  private component: string;

  constructor(component: string) {
    this.component = component;
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  /**
   * Log info level message with sanitized data
   */
  info(message: string, data?: AnyLogData): void {
    if (!this.isDevelopment && !this.shouldLogInProduction('info')) {
      return;
    }

    const sanitizedData = data ? sanitizeGrnData(data) : undefined;
    const logEntry = createSanitizedLogEntry('info' as any, message, {
      component: this.component,
      ...(sanitizedData || {}),
    });

    console.log(`[${this.component}]`, message, sanitizedData || '');
  }

  /**
   * Log warning level message with sanitized data
   */
  warn(message: string, data?: AnyLogData): void {
    const sanitizedData = data ? sanitizeGrnData(data) : undefined;
    const logEntry = createSanitizedLogEntry('warn' as any, message, {
      component: this.component,
      ...(sanitizedData || {}),
    });

    console.warn(`[${this.component}]`, message, sanitizedData || '');
  }

  /**
   * Log error level message with sanitized data
   */
  error(message: string, error?: unknown, additionalData?: AnyLogData): void {
    const sanitizedError = error ? sanitizeError(error) : undefined;
    const sanitizedData = additionalData ? sanitizeGrnData(additionalData) : undefined;

    const logEntry = createSanitizedLogEntry('error' as any, message, {
      component: this.component,
      error: sanitizedError,
      ...(sanitizedData || {}),
    });

    console.error(`[${this.component}]`, message, sanitizedError || '', sanitizedData || '');
  }

  /**
   * Log debug level message with sanitized data (dev only)
   */
  debug(message: string, data?: AnyLogData): void {
    if (!this.isDevelopment) {
      return;
    }

    const sanitizedData = data ? sanitizeGrnData(data) : undefined;
    const logEntry = createSanitizedLogEntry('debug' as any, message, {
      component: this.component,
      ...(sanitizedData || {}),
    });

    console.log(`[${this.component}] [DEBUG]`, message, sanitizedData || '');
  }

  /**
   * Determine if we should log in production based on level
   */
  private shouldLogInProduction(level: string): boolean {
    // In production, only log warnings and errors
    return level === 'warn' || level === 'error';
  }

  /**
   * Create a child logger with additional context
   */
  child(subComponent: string): GrnLogger {
    return new GrnLogger(`${this.component}.${subComponent}`);
  }
}

/**
 * Factory function to create a GRN logger instance
 */
export function createGrnLogger(component: string): GrnLogger {
  return new GrnLogger(component);
}

/**
 * Default export for convenience
 */
const GrnLoggerService = {
  createLogger: createGrnLogger,
  sanitizeData: sanitizeGrnData,
  GrnLogger,
};

export default GrnLoggerService;
