'use client';

import React, { useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface TimeFrame {
  start: Date;
  end: Date;
}

export interface DateRangeFilterProps {
  dateRange?: TimeFrame;
  defaultRange?: 'yesterday' | 'today' | 'week' | 'month' | 'custom';
  onDateRangeChange?: (range: TimeFrame) => void;
  showQuickOptions?: boolean;
  className?: string;
  format?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

// Utility functions for date ranges
export const getYesterdayRange = (): TimeFrame => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setHours(23, 59, 59, 999);
  
  return {
    start: yesterday,
    end: endOfYesterday,
  };
};

export const getTodayRange = (): TimeFrame => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const now = new Date();
  
  return {
    start: today,
    end: now,
  };
};

export const getWeekRange = (): TimeFrame => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  return {
    start: startOfWeek,
    end: new Date(),
  };
};

export const getMonthRange = (): TimeFrame => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  return {
    start: startOfMonth,
    end: new Date(),
  };
};

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  dateRange,
  defaultRange = 'yesterday',
  onDateRangeChange,
  showQuickOptions = true,
  className,
  format: dateFormat = 'MMM d',
  size = 'md',
  variant = 'outline',
}) => {
  // Calculate initial date range
  const initialRange = useMemo(() => {
    if (dateRange) return dateRange;
    
    switch (defaultRange) {
      case 'yesterday':
        return getYesterdayRange();
      case 'today':
        return getTodayRange();
      case 'week':
        return getWeekRange();
      case 'month':
        return getMonthRange();
      default:
        return getYesterdayRange();
    }
  }, [dateRange, defaultRange]);

  // Format date range for display
  const displayText = useMemo(() => {
    if (!initialRange) return 'Select date range';
    
    const startStr = format(initialRange.start, dateFormat);
    const endStr = format(initialRange.end, dateFormat);
    
    if (startStr === endStr) {
      return startStr;
    }
    
    return `${startStr} - ${endStr}`;
  }, [initialRange, dateFormat]);

  // Quick option handlers
  const handleQuickOption = useCallback((range: TimeFrame) => {
    onDateRangeChange?.(range);
  }, [onDateRangeChange]);

  const sizeClasses = {
    sm: 'h-7 px-2 text-xs',
    md: 'h-9 px-3 text-sm',
    lg: 'h-11 px-4 text-base',
  };

  if (!showQuickOptions) {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn('flex items-center gap-2', className)}
      >
        <Calendar className="h-4 w-4" />
        <span>{displayText}</span>
      </Button>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900/50 p-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuickOption(getYesterdayRange())}
          className={cn(
            'h-7 px-2 text-xs',
            dateRange === undefined && defaultRange === 'yesterday' && 'bg-slate-700'
          )}
        >
          Yesterday
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuickOption(getTodayRange())}
          className={cn(
            'h-7 px-2 text-xs',
            dateRange === undefined && defaultRange === 'today' && 'bg-slate-700'
          )}
        >
          Today
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuickOption(getWeekRange())}
          className={cn(
            'h-7 px-2 text-xs',
            dateRange === undefined && defaultRange === 'week' && 'bg-slate-700'
          )}
        >
          Week
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuickOption(getMonthRange())}
          className={cn(
            'h-7 px-2 text-xs',
            dateRange === undefined && defaultRange === 'month' && 'bg-slate-700'
          )}
        >
          Month
        </Button>
      </div>
      
      <div className="text-xs text-slate-400">
        {displayText}
      </div>
    </div>
  );
};

// Custom hook for widget date range management
export const useWidgetDateRange = (
  timeFrame?: TimeFrame,
  defaultRange: 'yesterday' | 'today' | 'week' | 'month' = 'yesterday'
): TimeFrame => {
  return useMemo(() => {
    if (timeFrame) {
      return timeFrame;
    }
    
    switch (defaultRange) {
      case 'yesterday':
        return getYesterdayRange();
      case 'today':
        return getTodayRange();
      case 'week':
        return getWeekRange();
      case 'month':
        return getMonthRange();
      default:
        return getYesterdayRange();
    }
  }, [timeFrame, defaultRange]);
};