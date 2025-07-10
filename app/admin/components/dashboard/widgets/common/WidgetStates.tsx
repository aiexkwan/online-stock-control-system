/**
 * WidgetStates - 通用 Widget 狀態組件
 * 提供統一的加載、錯誤、空狀態顯示
 * 減少 widget 重複代碼
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, RefreshCw, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ================================
// Types
// ================================

export interface WidgetSkeletonProps {
  /** Number of skeleton rows to display */
  rows?: number;
  /** Additional CSS classes */
  className?: string;
  /** Show header skeleton */
  showHeader?: boolean;
  /** Custom skeleton content */
  children?: React.ReactNode;
}

export interface WidgetErrorProps {
  /** Error message to display */
  message?: string;
  /** Retry callback function */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Show detailed error in development */
  error?: Error | null;
  /** Custom error icon */
  icon?: React.ReactNode;
}

export interface WidgetEmptyProps {
  /** Empty state message */
  message?: string;
  /** Additional description */
  description?: string;
  /** Action button configuration */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Additional CSS classes */
  className?: string;
  /** Custom empty icon */
  icon?: React.ReactNode;
}

export interface WidgetLoadingOverlayProps {
  /** Show overlay */
  isLoading: boolean;
  /** Loading message */
  message?: string;
  /** Additional CSS classes */
  className?: string;
  /** Blur background */
  blur?: boolean;
}

// ================================
// Components
// ================================

/**
 * WidgetSkeleton - 加載骨架屏
 * 提供統一的加載動畫效果
 */
export const WidgetSkeleton = React.memo(function WidgetSkeleton({
  rows = 3,
  className,
  showHeader = false,
  children,
}: WidgetSkeletonProps) {
  if (children) {
    return (
      <div className={cn('animate-pulse', className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {showHeader && (
        <div className='mb-4 space-y-2'>
          <div className='h-4 w-32 rounded bg-slate-700' />
          <div className='h-3 w-24 rounded bg-slate-700/70' />
        </div>
      )}
      
      {Array.from({ length: rows }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className='space-y-2'
        >
          <div className='flex items-center justify-between'>
            <div className='flex-1 space-y-1'>
              <div className='h-4 w-3/4 rounded bg-slate-700' />
              <div className='h-3 w-1/2 rounded bg-slate-700/70' />
            </div>
            <div className='h-8 w-8 rounded-full bg-slate-700' />
          </div>
        </motion.div>
      ))}
    </div>
  );
});

/**
 * WidgetError - 錯誤狀態顯示
 * 提供統一的錯誤處理 UI
 */
export const WidgetError = React.memo(function WidgetError({
  message = 'Something went wrong',
  onRetry,
  className,
  error,
  icon,
}: WidgetErrorProps) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      <div className='mb-4 rounded-full bg-red-900/20 p-3'>
        {icon || <AlertCircle className='h-8 w-8 text-red-400' />}
      </div>
      
      <h3 className='mb-2 text-base font-semibold text-red-400'>
        {message}
      </h3>
      
      {isDev && error && (
        <p className='mb-4 max-w-sm font-mono text-xs text-gray-500'>
          {error.message}
        </p>
      )}
      
      {onRetry && (
        <Button
          onClick={onRetry}
          size='sm'
          variant='outline'
          className='border-red-800 hover:bg-red-900/20'
        >
          <RefreshCw className='mr-2 h-3 w-3' />
          Try Again
        </Button>
      )}
    </motion.div>
  );
});

/**
 * WidgetEmpty - 空狀態顯示
 * 提供友好的空數據提示
 */
export const WidgetEmpty = React.memo(function WidgetEmpty({
  message = 'No data available',
  description,
  action,
  className,
  icon,
}: WidgetEmptyProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      <div className='mb-4 rounded-full bg-slate-800/50 p-3'>
        {icon || <Database className='h-8 w-8 text-slate-400' />}
      </div>
      
      <h3 className='mb-2 text-base font-medium text-slate-300'>
        {message}
      </h3>
      
      {description && (
        <p className='mb-4 max-w-sm text-sm text-slate-500'>
          {description}
        </p>
      )}
      
      {action && (
        <Button
          onClick={action.onClick}
          size='sm'
          variant='secondary'
          className='hover:bg-slate-800'
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
});

/**
 * WidgetLoadingOverlay - 加載遮罩層
 * 用於異步操作時的覆蓋層
 */
export const WidgetLoadingOverlay = React.memo(function WidgetLoadingOverlay({
  isLoading,
  message = 'Loading...',
  className,
  blur = true,
}: WidgetLoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            'absolute inset-0 z-50 flex items-center justify-center rounded-lg',
            blur && 'backdrop-blur-sm',
            'bg-slate-900/60',
            className
          )}
        >
          <div className='flex flex-col items-center space-y-3'>
            <div className='relative'>
              <div className='h-12 w-12 rounded-full border-4 border-slate-700' />
              <div className='absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent border-t-cyan-400' />
            </div>
            <p className='text-sm font-medium text-slate-300'>{message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// ================================
// Composite States
// ================================

/**
 * WidgetStateWrapper - 統一狀態處理包裝組件
 * 根據狀態自動顯示對應的 UI
 */
export interface WidgetStateWrapperProps {
  loading?: boolean;
  error?: Error | string | null;
  empty?: boolean;
  onRetry?: () => void;
  emptyMessage?: string;
  emptyDescription?: string;
  errorMessage?: string;
  skeletonRows?: number;
  showHeaderSkeleton?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const WidgetStateWrapper = React.memo(function WidgetStateWrapper({
  loading = false,
  error = null,
  empty = false,
  onRetry,
  emptyMessage,
  emptyDescription,
  errorMessage,
  skeletonRows = 3,
  showHeaderSkeleton = false,
  children,
  className,
}: WidgetStateWrapperProps) {
  // Loading state
  if (loading) {
    return (
      <div className={className}>
        <WidgetSkeleton rows={skeletonRows} showHeader={showHeaderSkeleton} />
      </div>
    );
  }

  // Error state
  if (error) {
    const message = errorMessage || (typeof error === 'string' ? error : error.message);
    return (
      <div className={className}>
        <WidgetError
          message={message}
          error={error instanceof Error ? error : null}
          onRetry={onRetry}
        />
      </div>
    );
  }

  // Empty state
  if (empty) {
    return (
      <div className={className}>
        <WidgetEmpty
          message={emptyMessage}
          description={emptyDescription}
        />
      </div>
    );
  }

  // Normal content
  return <>{children}</>;
});

// ================================
// Export all components
// ================================

export default {
  Skeleton: WidgetSkeleton,
  Error: WidgetError,
  Empty: WidgetEmpty,
  LoadingOverlay: WidgetLoadingOverlay,
  StateWrapper: WidgetStateWrapper,
};