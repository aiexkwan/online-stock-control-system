/**
 * Utility functions index
 * Re-exports utility functions from this directory
 */

// Core utility functions
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Main utility function for class names (commonly used as cn)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export individual utility modules
export * from './admin-cards-migration';
export * from './dynamic-import-handler';
export * from './env';
export * from './error-handling';
export * from './exceljs-dynamic';
export * from './exceljs-migration-helper';
export * from './request-deduplicator';
export * from './safe-number';
export * from './string-similarity';
export * from './todo-scanner';
export * from './withDynamicImportErrorHandler';

// Explicitly handle conflicting exports
export { getUserIdFromEmail as getUserIdFromEmailServer } from './getUserId';
export { getUserIdFromEmail as getUserIdFromEmailClient } from './getUserIdClient';

// Default export for backward compatibility
const utils = {
  cn,
};

export default utils;
