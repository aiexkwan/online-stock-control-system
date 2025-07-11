'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  LucideIcon,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T = any> {
  key: string;
  header: string;
  icon?: LucideIcon;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, item: T, index: number) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T = any> {
  // Data
  data: T[];
  columns: DataTableColumn<T>[];
  keyField?: string;
  
  // Header
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  
  // States
  loading?: boolean;
  error?: Error | null;
  empty?: boolean;
  emptyMessage?: string;
  emptyIcon?: LucideIcon;
  
  // Pagination
  pagination?: {
    enabled: boolean;
    pageSize?: number;
    loadMore?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
    loadingMore?: boolean;
    totalCount?: number;
    remainingCount?: number;
  };
  
  // Features
  onRowClick?: (item: T, index: number) => void;
  onRefresh?: () => void;
  showRefreshButton?: boolean;
  
  // Styling
  className?: string;
  rowClassName?: string | ((item: T, index: number) => string);
  headerClassName?: string;
  animate?: boolean;
  
  // Performance
  performanceMetrics?: {
    source?: string;
    fetchTime?: number;
    optimized?: boolean;
  };
  
  // Connection status
  connectionStatus?: {
    type: 'graphql' | 'realtime' | 'polling' | 'offline';
    label?: string;
  };
}

export function DataTable<T = any>({
  data = [],
  columns = [],
  keyField = 'id',
  title,
  subtitle,
  icon: Icon,
  iconColor = 'from-blue-500 to-cyan-500',
  loading = false,
  error = null,
  empty = false,
  emptyMessage = 'No data available',
  emptyIcon: EmptyIcon = AlertCircle,
  pagination,
  onRowClick,
  onRefresh,
  showRefreshButton = true,
  className,
  rowClassName,
  headerClassName,
  animate = true,
  performanceMetrics,
  connectionStatus,
}: DataTableProps<T>) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  const getRowKey = (item: T, index: number): string => {
    if (keyField && typeof item === 'object' && item !== null && keyField in item) {
      return String((item as any)[keyField]);
    }
    return String(index);
  };

  const getRowClassName = (item: T, index: number): string => {
    const baseClass = 'rounded-lg bg-black/20 p-2 hover:bg-white/10 transition-colors cursor-pointer';
    if (typeof rowClassName === 'function') {
      return cn(baseClass, rowClassName(item, index));
    }
    return cn(baseClass, rowClassName);
  };

  // Loading state
  if (loading && data.length === 0) {
    return (
      <Card className={cn('border border-slate-700/50 bg-slate-900/95 shadow-2xl backdrop-blur-xl', className)}>
        {title && (
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {Icon && (
                  <div className={cn('h-8 w-8 rounded-lg bg-gradient-to-r flex items-center justify-center', iconColor)}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                )}
                <span>{title}</span>
              </div>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-white/10" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error && !data.length) {
    return (
      <Card className={cn('border border-slate-700/50 bg-slate-900/95 shadow-2xl backdrop-blur-xl', className)}>
        {title && (
          <CardHeader className="pb-3">
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="mb-2 h-12 w-12 text-red-500" />
            <p className="mb-2 text-sm text-red-400">Error loading data</p>
            <p className="mb-4 text-xs text-slate-500">{error.message}</p>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Try again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if ((empty || data.length === 0) && !loading) {
    return (
      <Card className={cn('border border-slate-700/50 bg-slate-900/95 shadow-2xl backdrop-blur-xl', className)}>
        {title && (
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {Icon && (
                  <div className={cn('h-8 w-8 rounded-lg bg-gradient-to-r flex items-center justify-center', iconColor)}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                )}
                <span>{title}</span>
              </div>
              {showRefreshButton && onRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <EmptyIcon className="mb-2 h-12 w-12 text-slate-600" />
            <p className="text-sm text-slate-500">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border border-slate-700/50 bg-slate-900/95 shadow-2xl backdrop-blur-xl', className)}>
      {title && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {Icon && (
                <div className={cn('h-8 w-8 rounded-lg bg-gradient-to-r flex items-center justify-center', iconColor)}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              )}
              <span>{title}</span>
              {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
            </div>
            <div className="flex items-center gap-2">
              {connectionStatus && (
                <span className="text-xs text-slate-400">
                  {connectionStatus.label || connectionStatus.type}
                </span>
              )}
              {performanceMetrics?.optimized && (
                <span className="text-xs text-blue-400">
                  ⚡ {performanceMetrics.source || 'Optimized'}
                </span>
              )}
              {showRefreshButton && onRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing || loading}
                >
                  <RefreshCw className={cn('h-4 w-4', (isRefreshing || loading) && 'animate-spin')} />
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent className="p-3">
        {/* Column headers */}
        {columns.length > 0 && (
          <div className={cn('mb-2 border-b border-slate-700 pb-2', headerClassName)}>
            <div className={`grid grid-cols-${columns.length} gap-2 px-2 text-xs font-medium text-slate-400`}>
              {columns.map((column) => (
                <div
                  key={column.key}
                  className={cn(
                    'flex items-center gap-1',
                    column.align === 'center' && 'justify-center',
                    column.align === 'right' && 'justify-end',
                    column.className
                  )}
                  style={{ width: column.width }}
                >
                  {column.icon && <column.icon className="h-3 w-3" />}
                  <span>{column.header}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data rows */}
        <div className="space-y-1 overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {data.map((item, index) => {
              const rowKey = getRowKey(item, index);
              const rowClass = getRowClassName(item, index);

              return (
                <motion.div
                  key={rowKey}
                  initial={animate ? { opacity: 0, x: -20 } : false}
                  animate={animate ? { opacity: 1, x: 0 } : false}
                  exit={animate ? { opacity: 0, x: 20 } : false}
                  transition={animate ? { delay: index * 0.02 } : false}
                  className={rowClass}
                  onClick={() => onRowClick?.(item, index)}
                >
                  <div className={`grid grid-cols-${columns.length} items-center gap-2 text-sm`}>
                    {columns.map((column) => {
                      const value = (item as any)[column.key];
                      const content = column.render
                        ? column.render(value, item, index)
                        : value;

                      return (
                        <div
                          key={column.key}
                          className={cn(
                            'truncate',
                            column.align === 'center' && 'text-center',
                            column.align === 'right' && 'text-right',
                            column.className
                          )}
                          style={{ width: column.width }}
                        >
                          {content}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Pagination / Load More */}
        {pagination?.enabled && (
          <div className="mt-3 border-t border-slate-700 pt-3">
            {pagination.loadMore && pagination.hasMore && (
              <motion.button
                onClick={pagination.onLoadMore}
                disabled={pagination.loadingMore}
                className="w-full py-2 text-sm text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {pagination.loadingMore ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading more...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1">
                    <ChevronDown className="h-4 w-4" />
                    Load more
                    {pagination.remainingCount && ` (${pagination.remainingCount} remaining)`}
                  </span>
                )}
              </motion.button>
            )}
            
            {pagination.totalCount && (
              <div className="text-center text-xs text-slate-400">
                Showing {data.length} of {pagination.totalCount} items
              </div>
            )}
          </div>
        )}

        {/* Performance metrics */}
        {performanceMetrics?.fetchTime && (
          <div className="mt-2 text-xs text-slate-500">
            Loaded in {performanceMetrics.fetchTime}ms
          </div>
        )}
      </CardContent>
    </Card>
  );
}