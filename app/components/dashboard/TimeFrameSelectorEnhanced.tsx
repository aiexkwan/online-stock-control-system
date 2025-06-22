/**
 * Enhanced Time Frame Selector Component with react-day-picker
 * 時間範圍選擇器 - 允許用戶自定義日期範圍
 */

'use client';

import React, { useState } from 'react';
import { CalendarIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { format, subDays, startOfDay, endOfDay, isValid } from 'date-fns';
import { DayPicker, DateRange } from 'react-day-picker';
import "react-day-picker/dist/style.css";

export interface TimeFrame {
  label: string;
  value: string;
  start: Date;
  end: Date;
}

interface TimeFrameSelectorProps {
  value: string;
  onChange: (timeFrame: TimeFrame) => void;
  className?: string;
}

const PRESET_TIME_FRAMES: TimeFrame[] = [
  {
    label: 'Today',
    value: 'today',
    start: startOfDay(new Date()),
    end: endOfDay(new Date())
  },
  {
    label: 'Yesterday',
    value: 'yesterday',
    start: startOfDay(subDays(new Date(), 1)),
    end: endOfDay(subDays(new Date(), 1))
  },
  {
    label: 'Last 7 Days',
    value: 'last7days',
    start: startOfDay(subDays(new Date(), 6)),
    end: endOfDay(new Date())
  },
  {
    label: 'Last 30 Days',
    value: 'last30days',
    start: startOfDay(subDays(new Date(), 29)),
    end: endOfDay(new Date())
  },
  {
    label: 'Last 3 Months',
    value: 'last3months',
    start: startOfDay(subDays(new Date(), 89)),
    end: endOfDay(new Date())
  },
  {
    label: 'Last 6 Months',
    value: 'last6months',
    start: startOfDay(subDays(new Date(), 179)),
    end: endOfDay(new Date())
  }
];

export const TimeFrameSelectorEnhanced: React.FC<TimeFrameSelectorProps> = ({
  value,
  onChange,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Find current selection
  const selectedFrame = PRESET_TIME_FRAMES.find(tf => tf.value === value);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    selectedFrame ? { from: selectedFrame.start, to: selectedFrame.end } : undefined
  );

  // Get display label
  const getDisplayLabel = () => {
    if (selectedFrame) {
      return selectedFrame.label;
    }
    if (dateRange?.from && dateRange?.to) {
      return `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
    }
    return 'Select dates';
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    
    if (range?.from && range?.to) {
      const customTimeFrame: TimeFrame = {
        label: `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d, yyyy')}`,
        value: 'custom',
        start: startOfDay(range.from),
        end: endOfDay(range.to)
      };
      onChange(customTimeFrame);
      setIsOpen(false);
      setShowCalendar(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2",
          "bg-slate-800/50 hover:bg-slate-700/50",
          "backdrop-blur-sm",
          "rounded-lg transition-all text-sm font-medium",
          "border border-slate-700/50 hover:border-slate-600",
          "min-w-[200px]"
        )}
      >
        <CalendarIcon className="w-4 h-4 text-gray-400" />
        <span className="text-white flex-1 text-left">{getDisplayLabel()}</span>
        <ChevronDownIcon className={cn(
          "w-4 h-4 text-gray-400 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <>
          {/* Click outside to close */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => {
              setIsOpen(false);
              setShowCalendar(false);
            }}
          />
          
          {/* Dropdown menu */}
          <div className={cn(
            "absolute right-0 top-full mt-2 bg-slate-900/95",
            "backdrop-blur-xl",
            "border border-slate-700/50 rounded-xl shadow-2xl z-20",
            "overflow-hidden",
            showCalendar ? "w-auto" : "w-64"
          )}>
            {!showCalendar ? (
              <>
                {/* Preset options */}
                <div className="p-1">
                  {PRESET_TIME_FRAMES.map((timeFrame) => (
                    <button
                      key={timeFrame.value}
                      onClick={() => {
                        onChange(timeFrame);
                        setDateRange({ from: timeFrame.start, to: timeFrame.end });
                        setIsOpen(false);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm rounded-lg",
                        "hover:bg-slate-800/50 transition-all",
                        "flex items-center justify-between group",
                        value === timeFrame.value 
                          ? "bg-blue-500/20 text-blue-400" 
                          : "text-gray-300 hover:text-white"
                      )}
                    >
                      <span>{timeFrame.label}</span>
                      {value === timeFrame.value && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Custom date range button */}
                <div className="border-t border-slate-700/50 p-1">
                  <button
                    onClick={() => setShowCalendar(true)}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm rounded-lg",
                      "hover:bg-slate-800/50 transition-all",
                      "text-gray-300 hover:text-white",
                      "flex items-center gap-2"
                    )}
                  >
                    <CalendarIcon className="w-4 h-4" />
                    <span>Custom Range...</span>
                  </button>
                </div>
                
                {/* Current selection info */}
                {dateRange?.from && dateRange?.to && (
                  <div className="px-3 py-2 border-t border-slate-700/50 text-xs text-gray-500">
                    {format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}
                  </div>
                )}
              </>
            ) : (
              /* Calendar view */
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white">Select Date Range</h3>
                  <button
                    onClick={() => setShowCalendar(false)}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Back to presets
                  </button>
                </div>
                
                <div className="rdp-dark-theme">
                  <DayPicker
                  mode="range"
                  selected={dateRange}
                  onSelect={handleRangeSelect}
                  showOutsideDays
                  numberOfMonths={2}
                  disabled={{
                    after: new Date()
                  }}
                  modifiersStyles={{
                    selected: {
                      backgroundColor: 'rgb(59, 130, 246)',
                      color: 'white'
                    },
                    range_middle: {
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      color: 'rgb(219, 234, 254)'
                    },
                    today: {
                      fontWeight: 'bold',
                      color: 'rgb(59, 130, 246)'
                    },
                    outside: {
                      color: 'rgb(107, 114, 128)'
                    },
                    disabled: {
                      color: 'rgb(75, 85, 99)'
                    }
                  }}
                  styles={{
                    months: { gap: '2rem' },
                    month: { color: 'white' },
                    caption: { color: 'white', marginBottom: '1rem' },
                    head_cell: { 
                      color: 'rgb(156, 163, 175)', 
                      fontWeight: '500',
                      fontSize: '0.875rem' 
                    },
                    nav_button: {
                      color: 'rgb(209, 213, 219)',
                      background: 'transparent',
                      borderRadius: '0.375rem'
                    },
                    day: {
                      color: 'rgb(229, 231, 235)',
                      borderRadius: '0.5rem'
                    },
                    day_button: {
                      color: 'rgb(229, 231, 235)',
                      borderRadius: '0.5rem',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer'
                    }
                  }}
                  />
                </div>
                
                {/* Quick actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      const today = new Date();
                      handleRangeSelect({ from: today, to: today });
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors text-gray-300 hover:text-white"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      handleRangeSelect({
                        from: startOfDay(subDays(new Date(), 6)),
                        to: endOfDay(new Date())
                      });
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors text-gray-300 hover:text-white"
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => {
                      handleRangeSelect({
                        from: startOfDay(subDays(new Date(), 29)),
                        to: endOfDay(new Date())
                      });
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors text-gray-300 hover:text-white"
                  >
                    Last 30 Days
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};