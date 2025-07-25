'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, RefreshCw, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ChartSkeleton } from './ChartSkeleton';

export interface ChartContainerProps {
  // Basic configuration
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };

  // States
  loading?: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;

  // Chart configuration
  height?: string | number;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;

  // Features
  onRefresh?: () => void;
  refreshing?: boolean;

  // Metadata for analytics
  metadata?: Record<string, unknown>;

  // Performance metrics
  performanceMetrics?: {
    source?: string;
    fetchTime?: number;
    optimized?: boolean;
  };

  // Statistics summary
  stats?: Array<{
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
    className?: string;
  }>;

  // Content
  children: React.ReactNode;

  // Widget type for specific styling
  widgetType?: string;

  // Chart type for skeleton
  chartType?: 'bar' | 'line' | 'area' | 'pie' | 'treemap' | 'heatmap' | 'scatter';
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'from-blue-500 to-cyan-500',
  dateRange,
  loading = false,
  error = null,
  isEmpty = false,
  emptyMessage = 'No data available',
  onRetry,
  height = 300,
  showHeader = true,
  showFooter = false,
  className,
  onRefresh,
  refreshing = false,
  metadata,
  performanceMetrics,
  stats,
  children,
  widgetType,
  chartType = 'bar',
}) => {
  // Format date range for display
  const formatDateRange = () => {
    if (!dateRange) return null;
    return `From ${format(dateRange.start, 'MMM d')} to ${format(dateRange.end, 'MMM d')}`;
  };

  // Loading state
  if (loading) {
    return (
      <Card
        className={cn(
          'border border-slate-700/50 bg-slate-900/95 shadow-2xl backdrop-blur-xl',
          className
        )}
      >
        {showHeader && (
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                {Icon && (
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r',
                      iconColor
                    )}
                  >
                    <Icon className='h-5 w-5 text-white' />
                  </div>
                )}
                <span>{title}</span>
              </div>
            </CardTitle>
            {subtitle && <p className='text-xs text-slate-400'>{subtitle}</p>}
          </CardHeader>
        )}
        <CardContent>
          <ChartSkeleton type={chartType} height='md' showHeader={false} />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card
        className={cn(
          'border border-slate-700/50 bg-slate-900/95 shadow-2xl backdrop-blur-xl',
          className
        )}
      >
        {showHeader && (
          <CardHeader className='pb-3'>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className='flex flex-col items-center justify-center py-8'>
            <AlertCircle className='mb-2 h-12 w-12 text-red-500' />
            <p className='mb-2 text-sm text-red-400'>Error loading chart</p>
            <p className='mb-4 text-xs text-slate-500'>{(error as { message: string }).message}</p>
            {onRetry && (
              <Button variant='outline' size='sm' onClick={onRetry}>
                <RefreshCw className='mr-2 h-4 w-4' />
                Try again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <Card
        className={cn(
          'border border-slate-700/50 bg-slate-900/95 shadow-2xl backdrop-blur-xl',
          className
        )}
      >
        <CardContent className='flex items-center justify-center p-8' style={{ height }}>
          <div className='text-center'>
            <div className='mx-auto mb-2 h-12 w-12 text-slate-400'>
              <svg fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1}
                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
            </div>
            <p className='text-sm text-slate-400'>{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'border border-slate-700/50 bg-slate-900/95 shadow-2xl backdrop-blur-xl',
        className
      )}
    >
      {showHeader && (
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              {Icon && (
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r',
                    iconColor
                  )}
                >
                  <Icon className='h-5 w-5 text-white' />
                </div>
              )}
              <span>{title}</span>
            </div>
            <div className='flex items-center gap-2'>
              {performanceMetrics?.optimized && (
                <span className='text-xs text-blue-400'>
                  ⚡ {performanceMetrics.source || 'Optimized'}
                </span>
              )}
              {onRefresh && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={onRefresh}
                  disabled={refreshing}
                  className='h-7 px-2'
                >
                  {refreshing ? (
                    <div className='h-1 w-8 rounded-full bg-slate-400 opacity-75' />
                  ) : (
                    <RefreshCw className='h-4 w-4' />
                  )}
                </Button>
              )}
            </div>
          </CardTitle>
          {(subtitle || dateRange) && (
            <div className='mt-1 flex items-center justify-between text-xs text-slate-400'>
              {subtitle && <span>{subtitle}</span>}
              {dateRange && <span>{formatDateRange()}</span>}
            </div>
          )}
        </CardHeader>
      )}

      <CardContent className='p-3'>
        {/* Chart content */}
        <div
          className='relative w-full'
          style={{ height: typeof height === 'number' ? `${height}px` : height }}
        >
          {children}
        </div>

        {/* Statistics footer */}
        {showFooter && stats && stats.length > 0 && (
          <motion.div
            className='mt-4 grid gap-2 border-t border-slate-700 pt-3'
            style={{
              gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)`,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {stats.map((stat, index) => (
              <div key={index} className={cn('text-center', stat.className)}>
                <p className='text-xs text-slate-400'>{stat.label}</p>
                <p
                  className={cn(
                    'text-sm font-medium',
                    stat.trend === 'up'
                      ? 'text-green-400'
                      : stat.trend === 'down'
                        ? 'text-red-400'
                        : 'text-white'
                  )}
                >
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Performance metrics */}
        {performanceMetrics?.fetchTime && (
          <div className='mt-2 text-xs text-slate-500'>
            Chart loaded in {performanceMetrics.fetchTime}ms
          </div>
        )}
      </CardContent>
    </Card>
  );
};
