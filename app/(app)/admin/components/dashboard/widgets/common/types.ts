/**
 * Common types and utilities for dashboard widgets
 * 統一的 dashboard widget 類型和工具函數
 *
 * This file consolidates commonly used types and imports across all widgets
 * to reduce code duplication and improve maintainability.
 */

import { DatabaseRecord } from '@/types/database/tables';

// Re-export commonly used types (已遷移到 @/types/components/dashboard)
export type {
  WidgetComponentProps,
  BaseWidgetConfig,
  BaseWidgetState,
  WidgetErrorType,
} from '@/types/components/dashboard';

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

// Widget 配置和狀態類型已遷移到 @/types/components/dashboard

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
