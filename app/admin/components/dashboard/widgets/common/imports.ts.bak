/**
 * Common imports for dashboard widgets
 * 統一的 dashboard widget 導入
 *
 * This file provides a single point of import for commonly used dependencies
 * across all dashboard widgets to reduce duplication.
 */

// Re-export everything from types
export * from './types';

// Widget state components
export * from './WidgetStates';
export { default as WidgetStates } from './WidgetStates';

// Error handling
export { ErrorHandler } from '@/app/components/qc-label-form/services/ErrorHandler';

// Dashboard API (client-safe version)
export { createDashboardAPIClient as createDashboardAPI } from '@/lib/api/admin/DashboardAPI.client';

// Chart components - REMOVED: Barrel export causes bundle bloat
// Import recharts components directly in your widgets for better tree shaking:
// import { BarChart, Bar, XAxis, YAxis } from 'recharts';
//
// This improves tree shaking and reduces bundle size by ~300-400KB
//
// Example usage in widgets:
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer
// } from 'recharts';

// Form components (for widgets with forms)
// Form components - temporarily commented out until form UI is available
// export {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from '@/components/ui/form';

export { Input } from '@/components/ui/input';
export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
export { Badge } from '@/components/ui/badge';
export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Form validation
export { useForm } from 'react-hook-form';
export { zodResolver } from '@hookform/resolvers/zod';
export { z } from 'zod';

/**
 * Common utility functions for widgets
 * Widget 通用工具函數
 */

/**
 * Format number with locale-specific formatting
 */
export const formatNumber = (num: number, options?: Intl.NumberFormatOptions) => {
  return new Intl.NumberFormat('en-US', options).format(num);
};

/**
 * Format currency values
 */
export const formatCurrency = (amount: number, currency = 'USD') => {
  return formatNumber(amount, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  });
};

/**
 * Format percentage values
 */
export const formatPercentage = (value: number, decimals = 1) => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

/**
 * Generate colors for charts
 */
export const generateChartColors = (count: number) => {
  const colors = [
    '#3b82f6',
    '#ef4444',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#06b6d4',
    '#84cc16',
    '#f97316',
    '#ec4899',
    '#6366f1',
  ];

  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
};

/**
 * Debounce function for widget refresh
 */
export const debounce = <T extends (...args: Record<string, unknown>[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
