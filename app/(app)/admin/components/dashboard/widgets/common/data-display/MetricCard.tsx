'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
  // Basic content
  title: string;
  value: string | number;
  label?: string;
  icon?: LucideIcon;

  // Styling
  iconColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  className?: string;

  // Trend indicator
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string | number;
  trendLabel?: string;

  // Additional info
  subtitle?: string;
  dateRange?: string;
  description?: string;

  // Performance indicator
  performanceMetrics?: {
    source?: string;
    optimized?: boolean;
    fetchTime?: number;
  };

  // States
  loading?: boolean;
  error?: Error | null;
  isEditMode?: boolean;

  // Actions
  onRetry?: () => void;

  // Widget configuration
  widgetType?: string;

  // Animation
  animateOnMount?: boolean;
  animationDelay?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  label,
  icon: Icon,
  iconColor = 'from-blue-500 to-cyan-500',
  gradientFrom = 'from-blue-300',
  gradientTo = 'to-cyan-300',
  className,
  trend,
  trendValue,
  trendLabel,
  subtitle,
  dateRange,
  description,
  performanceMetrics,
  loading = false,
  error = null,
  isEditMode = false,
  onRetry,
  widgetType,
  animateOnMount = true,
  animationDelay = 0,
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className='h-4 w-4 text-green-500' />;
      case 'down':
        return <TrendingDown className='h-4 w-4 text-red-500' />;
      case 'neutral':
        return <Minus className='h-4 w-4 text-slate-400' />;
      default:
        return null;
    }
  };

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
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
        <CardHeader className='pb-3'>
          <div className='animate-pulse'>
            <div className='h-5 w-32 rounded bg-slate-700' />
          </div>
        </CardHeader>
        <CardContent>
          <div className='animate-pulse space-y-2'>
            <div className='h-10 w-24 rounded bg-slate-700' />
            <div className='h-4 w-16 rounded bg-slate-700' />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card
        className={cn(
          'border border-red-700/50 bg-slate-900/95 shadow-2xl backdrop-blur-xl',
          className
        )}
      >
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm text-red-400'>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-xs text-red-300'>{(error as { message: string }).message}</p>
        </CardContent>
      </Card>
    );
  }

  const animationProps = animateOnMount
    ? {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { duration: 0.3, delay: animationDelay },
      }
    : {};

  return (
    <motion.div {...animationProps}>
      <Card
        className={cn(
          'border border-slate-700/50 bg-slate-900/95 shadow-2xl backdrop-blur-xl',
          className
        )}
      >
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
              <span
                className={cn(
                  'bg-gradient-to-r bg-clip-text text-transparent',
                  gradientFrom,
                  gradientTo
                )}
              >
                {title}
              </span>
            </div>
            {performanceMetrics?.optimized && (
              <span className='text-xs text-blue-400'>
                ⚡ {performanceMetrics.source || 'Optimized'}
              </span>
            )}
          </CardTitle>
          {(subtitle || dateRange) && (
            <div className='mt-1 flex items-center justify-between text-xs text-slate-400'>
              {subtitle && <span>{subtitle}</span>}
              {dateRange && <span>{dateRange}</span>}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <AnimatePresence mode='wait'>
            <motion.div
              key={value}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className='text-4xl font-bold text-white'>{formatValue(value)}</div>
              {label && <p className='mt-1 text-xs text-slate-400'>{label}</p>}
            </motion.div>
          </AnimatePresence>

          {/* Trend indicator */}
          {trend && (
            <div className='mt-3 flex items-center gap-2'>
              {getTrendIcon()}
              {trendValue && (
                <span
                  className={cn(
                    'text-sm font-medium',
                    trend === 'up'
                      ? 'text-green-500'
                      : trend === 'down'
                        ? 'text-red-500'
                        : 'text-slate-400'
                  )}
                >
                  {formatValue(trendValue)}
                </span>
              )}
              {trendLabel && <span className='text-xs text-slate-400'>{trendLabel}</span>}
            </div>
          )}

          {/* Additional description */}
          {description && <p className='mt-2 text-xs text-slate-400'>{description}</p>}

          {/* Performance metrics */}
          {performanceMetrics?.fetchTime && (
            <div className='mt-3 text-xs text-slate-500'>
              Fetched in {performanceMetrics.fetchTime}ms
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Progress variant for percentage values
interface MetricCardProgressProps extends MetricCardProps {
  percentage: number;
  progressColor?: string;
}

export const MetricCardProgress: React.FC<MetricCardProgressProps> = ({
  percentage,
  progressColor = 'bg-blue-500',
  ...props
}) => {
  return (
    <MetricCard {...props}>
      <div className='mt-3 w-full'>
        <div className='h-2 w-full overflow-hidden rounded-full bg-slate-700'>
          <motion.div
            className={cn('h-full', progressColor)}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </MetricCard>
  );
};
