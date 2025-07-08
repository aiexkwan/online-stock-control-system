/**
 * Common types and utilities for dashboard widgets
 * 統一的 dashboard widget 類型和工具函數
 *
 * This file consolidates commonly used types and imports across all widgets
 * to reduce code duplication and improve maintainability.
 */

// Re-export commonly used types
export type { WidgetComponentProps } from '@/app/types/dashboard';

// Re-export commonly used UI components and utilities
export { cn } from '@/lib/utils';
export { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
export { Button } from '@/components/ui/button';
export { Skeleton } from '@/components/ui/skeleton';

// Re-export animation components
export { motion, AnimatePresence } from 'framer-motion';

// Common React hooks
export { useState, useEffect, useCallback, useMemo } from 'react';

// Common icons
export {
  RefreshCw,
  Download,
  Upload,
  ChevronRight,
  ChevronDown,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  X,
} from 'lucide-react';

// Common toast utility
export { toast } from 'sonner';

// Date utilities
export { format, isValid, parseISO, startOfDay, endOfDay, subDays, addDays } from 'date-fns';

/**
 * Common widget configuration interface
 * 通用 widget 配置接口
 */
export interface BaseWidgetConfig {
  id: string;
  title: string;
  description?: string;
  refreshInterval?: number;
  showRefreshButton?: boolean;
  showDownloadButton?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Common widget state interface
 * 通用 widget 狀態接口
 */
export interface BaseWidgetState {
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  data: any;
}

/**
 * Common widget error types
 * 通用 widget 錯誤類型
 */
export type WidgetError = 'NETWORK_ERROR' | 'DATA_ERROR' | 'PERMISSION_ERROR' | 'UNKNOWN_ERROR';

/**
 * Widget size mappings for consistent layouts
 * Widget 大小映射，確保一致的佈局
 */
export const WIDGET_SIZE_CLASSES = {
  sm: 'col-span-1 row-span-1',
  md: 'col-span-2 row-span-1',
  lg: 'col-span-3 row-span-2',
  xl: 'col-span-4 row-span-2',
} as const;

/**
 * Common animation variants for widgets
 * Widget 通用動畫變體
 */
export const WIDGET_ANIMATION_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

/**
 * Common transition configuration
 * 通用過渡動畫配置
 */
export const WIDGET_TRANSITION = {
  duration: 0.3,
  ease: 'easeInOut',
};
