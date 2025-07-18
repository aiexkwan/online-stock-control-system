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

export type SkeletonType = 
  | 'default'      // Default rows skeleton
  | 'timeline'     // Timeline with circles and bars
  | 'chart-bar'    // Bar chart skeleton
  | 'chart-pie'    // Pie/circular chart skeleton
  | 'chart-area'   // Area chart skeleton
  | 'list'         // List rows skeleton
  | 'stats'        // Stats card skeleton
  | 'table'        // Table skeleton
  | 'spinner'      // Simple spinner
  | 'custom';      // Custom skeleton

export interface WidgetSkeletonProps {
  /** Type of skeleton to display */
  type?: SkeletonType;
  /** Number of skeleton rows to display (for default/list/table types) */
  rows?: number;
  /** Additional CSS classes */
  className?: string;
  /** Show header skeleton */
  showHeader?: boolean;
  /** Custom skeleton content */
  children?: React.ReactNode;
  /** Height for chart skeletons */
  height?: number;
  /** Number of columns for table skeleton */
  columns?: number;
}

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';
export type ErrorDisplay = 'inline' | 'full' | 'compact';

export interface WidgetErrorProps {
  /** Error message to display */
  message?: string;
  /** Error severity level */
  severity?: ErrorSeverity;
  /** Display mode */
  display?: ErrorDisplay;
  /** Error code for tracking */
  code?: string;
  /** Retry callback function */
  onRetry?: () => void;
  /** Additional action buttons */
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  }>;
  /** Additional CSS classes */
  className?: string;
  /** Show detailed error in development */
  error?: Error | null;
  /** Custom error icon */
  icon?: React.ReactNode;
  /** Hide icon completely */
  hideIcon?: boolean;
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
 * 提供統一的加載動畫效果，支持多種骨架類型
 */
export const WidgetSkeleton = React.memo(function WidgetSkeleton({
  type = 'default',
  rows = 3,
  className,
  showHeader = false,
  children,
  height = 200,
  columns = 4,
}: WidgetSkeletonProps) {
  // Custom skeleton
  if (children || type === 'custom') {
    return (
      <div className={cn('animate-pulse', className)}>
        {children}
      </div>
    );
  }

  // Spinner skeleton
  if (type === 'spinner') {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <Loader2 className='h-8 w-8 animate-spin text-slate-500' />
      </div>
    );
  }

  // Timeline skeleton (for HistoryTreeV2)
  if (type === 'timeline') {
    return (
      <div className={cn('space-y-4', className)}>
        {showHeader && (
          <div className='mb-4 space-y-2'>
            <div className='h-4 w-32 rounded bg-slate-700' />
            <div className='h-3 w-24 rounded bg-slate-700/70' />
          </div>
        )}
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className='flex items-start gap-4 animate-pulse'>
            <div className='relative flex-shrink-0'>
              <div className='h-8 w-8 rounded-full bg-slate-700' />
              {index < rows - 1 && (
                <div className='absolute left-4 top-8 h-12 w-0.5 bg-slate-700' />
              )}
            </div>
            <div className='flex-1 space-y-2 pt-1'>
              <div className='h-4 w-3/4 rounded bg-slate-700' />
              <div className='h-3 w-1/2 rounded bg-slate-700/70' />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Bar chart skeleton
  if (type === 'chart-bar') {
    return (
      <div className={cn('space-y-3', className)}>
        {showHeader && (
          <div className='mb-4 space-y-2'>
            <div className='h-4 w-32 rounded bg-slate-700' />
            <div className='h-3 w-24 rounded bg-slate-700/70' />
          </div>
        )}
        <div className='flex items-end justify-between gap-2' style={{ height }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className='flex-1 rounded-t bg-slate-700 animate-pulse'
              style={{
                height: `${Math.random() * 60 + 40}%`,
                animationDelay: `${index * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Pie/circular chart skeleton
  if (type === 'chart-pie') {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        {showHeader && (
          <div className='absolute top-4 left-4 space-y-2'>
            <div className='h-4 w-32 rounded bg-slate-700' />
            <div className='h-3 w-24 rounded bg-slate-700/70' />
          </div>
        )}
        <div 
          className='rounded-full bg-slate-700 animate-pulse'
          style={{ width: height, height }}
        />
      </div>
    );
  }

  // Area chart skeleton
  if (type === 'chart-area') {
    return (
      <div className={cn('space-y-3', className)}>
        {showHeader && (
          <div className='mb-4 space-y-2'>
            <div className='h-4 w-32 rounded bg-slate-700' />
            <div className='h-3 w-24 rounded bg-slate-700/70' />
          </div>
        )}
        <div 
          className='w-full rounded bg-slate-700 animate-pulse'
          style={{ height }}
        />
      </div>
    );
  }

  // Stats card skeleton
  if (type === 'stats') {
    return (
      <div className={cn('space-y-3', className)}>
        <div className='space-y-2'>
          <div className='h-3 w-20 rounded bg-slate-700/70' />
          <div className='h-8 w-32 rounded bg-slate-700' />
          <div className='h-3 w-24 rounded bg-slate-700/50' />
        </div>
      </div>
    );
  }

  // Table skeleton
  if (type === 'table') {
    return (
      <div className={cn('space-y-3', className)}>
        {showHeader && (
          <div className='mb-4 space-y-2'>
            <div className='h-4 w-32 rounded bg-slate-700' />
            <div className='h-3 w-24 rounded bg-slate-700/70' />
          </div>
        )}
        {/* Table header */}
        <div className='flex gap-4 pb-3 border-b border-slate-700'>
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className='flex-1'>
              <div className='h-4 w-full rounded bg-slate-700' />
            </div>
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className='flex gap-4 py-2'>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className='flex-1'>
                <div className='h-4 w-full rounded bg-slate-700/70' />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // List skeleton
  if (type === 'list') {
    return (
      <div className={cn('space-y-3', className)}>
        {showHeader && (
          <div className='mb-4 space-y-2'>
            <div className='h-4 w-32 rounded bg-slate-700' />
            <div className='h-3 w-24 rounded bg-slate-700/70' />
          </div>
        )}
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className='flex items-center gap-3 p-3 rounded-lg bg-slate-800/30'>
            <div className='h-10 w-10 rounded bg-slate-700' />
            <div className='flex-1 space-y-2'>
              <div className='h-4 w-3/4 rounded bg-slate-700' />
              <div className='h-3 w-1/2 rounded bg-slate-700/70' />
            </div>
            <div className='h-4 w-16 rounded bg-slate-700' />
          </div>
        ))}
      </div>
    );
  }

  // Default skeleton (original behavior)
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
 * 提供統一的錯誤處理 UI，支持多種嚴重程度和顯示模式
 */
export const WidgetError = React.memo(function WidgetError({
  message = 'Something went wrong',
  severity = 'error',
  display = 'full',
  code,
  onRetry,
  actions,
  className,
  error,
  icon,
  hideIcon = false,
}: WidgetErrorProps) {
  const isDev = process.env.NODE_ENV === 'development';

  // Get severity-based styles
  const severityStyles = {
    info: {
      bg: 'bg-blue-900/20',
      text: 'text-blue-400',
      border: 'border-blue-800',
      hover: 'hover:bg-blue-900/20',
    },
    warning: {
      bg: 'bg-yellow-900/20',
      text: 'text-yellow-400',
      border: 'border-yellow-800',
      hover: 'hover:bg-yellow-900/20',
    },
    error: {
      bg: 'bg-red-900/20',
      text: 'text-red-400',
      border: 'border-red-800',
      hover: 'hover:bg-red-900/20',
    },
    critical: {
      bg: 'bg-red-900/30',
      text: 'text-red-300',
      border: 'border-red-700',
      hover: 'hover:bg-red-900/30',
    },
  };

  const styles = severityStyles[severity as keyof typeof severityStyles];

  // Get default icon based on severity
  const defaultIcon = severity === 'info' 
    ? <AlertCircle className='h-8 w-8' />
    : <AlertCircle className='h-8 w-8' />;

  // Compact display mode
  if (display === 'compact') {
    return (
      <div className={cn('flex items-center gap-2 p-2', className)}>
        {!hideIcon && (
          <div className={cn(styles.text)}>
            {icon || <AlertCircle className='h-4 w-4' />}
          </div>
        )}
        <span className={cn('text-sm', styles.text)}>{message}</span>
        {onRetry && (
          <Button
            onClick={onRetry}
            size='sm'
            variant='ghost'
            className='h-6 px-2'
          >
            <RefreshCw className='h-3 w-3' />
          </Button>
        )}
      </div>
    );
  }

  // Inline display mode
  if (display === 'inline') {
    return (
      <div className={cn('rounded-lg p-4', styles.bg, className)}>
        <div className='flex items-start gap-3'>
          {!hideIcon && (
            <div className={cn('flex-shrink-0', styles.text)}>
              {icon || <AlertCircle className='h-5 w-5' />}
            </div>
          )}
          <div className='flex-1'>
            <div className='flex items-center gap-2'>
              <h4 className={cn('text-sm font-medium', styles.text)}>
                {message}
              </h4>
              {code && (
                <span className='text-xs text-gray-500'>({code})</span>
              )}
            </div>
            {isDev && error && (
              <p className='mt-1 font-mono text-xs text-gray-500'>
                {(error as { message: string }).message}
              </p>
            )}
            {(onRetry || actions) && (
              <div className='mt-3 flex gap-2'>
                {onRetry && (
                  <Button
                    onClick={onRetry}
                    size='sm'
                    variant='outline'
                    className={cn(styles.border, styles.hover)}
                  >
                    <RefreshCw className='mr-2 h-3 w-3' />
                    Try Again
                  </Button>
                )}
                {actions?.map((action, index) => (
                  <Button
                    key={index}
                    onClick={action.onClick}
                    size='sm'
                    variant={action.variant === 'primary' ? 'default' : (action.variant || 'outline')}
                    className={cn(
                      action.variant === 'primary' ? '' : styles.border,
                      action.variant === 'primary' ? '' : styles.hover
                    )}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full display mode (default)
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
      {!hideIcon && (
        <div className={cn('mb-4 rounded-full p-3', styles.bg)}>
          <div className={styles.text}>
            {icon || defaultIcon}
          </div>
        </div>
      )}
      
      <h3 className={cn('mb-2 text-base font-semibold', styles.text)}>
        {message}
      </h3>

      {code && (
        <p className='mb-2 text-sm text-gray-500'>
          Error Code: {code}
        </p>
      )}
      
      {isDev && error && (
        <p className='mb-4 max-w-sm font-mono text-xs text-gray-500'>
          {(error as { message: string }).message}
        </p>
      )}
      
      {(onRetry || actions) && (
        <div className='flex gap-2'>
          {onRetry && (
            <Button
              onClick={onRetry}
              size='sm'
              variant='outline'
              className={cn(styles.border, styles.hover)}
            >
              <RefreshCw className='mr-2 h-3 w-3' />
              Try Again
            </Button>
          )}
          {actions?.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              size='sm'
              variant={action.variant === 'primary' ? 'default' : (action.variant || 'outline')}
              className={cn(
                action.variant === 'primary' ? '' : styles.border,
                action.variant === 'primary' ? '' : styles.hover
              )}
            >
              {action.label}
            </Button>
          ))}
        </div>
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
  skeletonType?: SkeletonType;
  skeletonRows?: number;
  skeletonHeight?: number;
  skeletonColumns?: number;
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
  skeletonType = 'default',
  skeletonRows = 3,
  skeletonHeight,
  skeletonColumns,
  showHeaderSkeleton = false,
  children,
  className,
}: WidgetStateWrapperProps) {
  // Loading state
  if (loading) {
    return (
      <div className={className}>
        <WidgetSkeleton 
          type={skeletonType}
          rows={skeletonRows} 
          height={skeletonHeight}
          columns={skeletonColumns}
          showHeader={showHeaderSkeleton} 
        />
      </div>
    );
  }

  // Error state
  if (error) {
    const message = errorMessage || (typeof error === 'string' ? error : (error as { message: string }).message);
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
// Unified Suspense Fallback Component
// ================================

export interface WidgetSuspenseFallbackProps {
  /** Type of widget being loaded */
  type?: 'default' | 'stats' | 'chart' | 'table' | 'list';
  /** Additional CSS classes */
  className?: string;
  /** Height for the fallback */
  height?: string;
}

/**
 * WidgetSuspenseFallback - 統一的 Suspense fallback 組件
 * 提供一致的 loading 狀態，減少重複代碼
 */
export const WidgetSuspenseFallback = React.memo(function WidgetSuspenseFallback({
  type = 'default',
  className,
  height = 'h-full'
}: WidgetSuspenseFallbackProps) {
  const baseClasses = `${height} w-full animate-pulse bg-slate-800/50 rounded-lg flex items-center justify-center`;
  
  // Stats widget fallback
  if (type === 'stats') {
    return (
      <div className={`${baseClasses} ${className || ''}`}>
        <div className="p-4 space-y-3 w-full">
          <div className="h-4 w-24 bg-slate-700/60 rounded"></div>
          <div className="h-8 w-32 bg-slate-700/60 rounded"></div>
          <div className="h-3 w-20 bg-slate-700/40 rounded"></div>
        </div>
      </div>
    );
  }
  
  // Chart widget fallback
  if (type === 'chart') {
    return (
      <div className={`${baseClasses} ${className || ''}`}>
        <div className="p-4 space-y-3 w-full">
          <div className="h-4 w-32 bg-slate-700/60 rounded mb-4"></div>
          <div className="h-32 w-full bg-slate-700/40 rounded"></div>
        </div>
      </div>
    );
  }
  
  // Table widget fallback
  if (type === 'table') {
    return (
      <div className={`${baseClasses} ${className || ''}`}>
        <div className="p-4 space-y-2 w-full">
          <div className="h-4 w-32 bg-slate-700/60 rounded mb-3"></div>
          {[1, 2, 3].map((i: Record<string, unknown>) => (
            <div key={i} className="h-6 w-full bg-slate-700/40 rounded"></div>
          ))}
        </div>
      </div>
    );
  }
  
  // List widget fallback
  if (type === 'list') {
    return (
      <div className={`${baseClasses} ${className || ''}`}>
        <div className="p-4 space-y-3 w-full">
          <div className="h-4 w-32 bg-slate-700/60 rounded mb-3"></div>
          {[1, 2, 3].map((i: Record<string, unknown>) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 bg-slate-700/60 rounded"></div>
              <div className="flex-1 space-y-1">
                <div className="h-4 w-3/4 bg-slate-700/40 rounded"></div>
                <div className="h-3 w-1/2 bg-slate-700/30 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Default fallback
  return (
    <div className={`${baseClasses} ${className || ''}`}>
      <div className="flex items-center justify-center">
        <div className="relative">
          <div className="h-8 w-8 rounded-full border-2 border-slate-700" />
          <div className="absolute inset-0 h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-slate-400" />
        </div>
      </div>
    </div>
  );
});

// ================================
// Export all components
// ================================

const WidgetStates = {
  Skeleton: WidgetSkeleton,
  Error: WidgetError,
  Empty: WidgetEmpty,
  LoadingOverlay: WidgetLoadingOverlay,
  StateWrapper: WidgetStateWrapper,
  SuspenseFallback: WidgetSuspenseFallback,
};

export default WidgetStates;