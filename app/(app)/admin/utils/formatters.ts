/**
 * Formatters utility functions
 * Common formatting functions used across admin cards
 */

import { format } from 'date-fns';

/**
 * Format file size from bytes to human readable format
 * @param bytes - Size in bytes
 * @returns Formatted string like "1.5 MB"
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format date string to yyyy-MMM-dd HH:mm format
 * @param dateString - Date string to format
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'yyyy-MMM-dd HH:mm');
  } catch {
    return dateString;
  }
};

/**
 * Format number with thousands separator
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string
 */
export const formatNumber = (value: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};
