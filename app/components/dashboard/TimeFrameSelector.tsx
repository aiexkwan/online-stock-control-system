/**
 * Time Frame Selector Component
 * 時間範圍選擇器 - 最多可查看最近兩個月
 */

'use client';

import React, { useState } from 'react';
import { CalendarIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

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

const TIME_FRAMES: TimeFrame[] = [
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
    label: 'Last 3 Days',
    value: 'last3days',
    start: startOfDay(subDays(new Date(), 2)),
    end: endOfDay(new Date())
  },
  {
    label: 'Last 7 Days',
    value: 'last7days',
    start: startOfDay(subDays(new Date(), 6)),
    end: endOfDay(new Date())
  },
  {
    label: 'Last 14 Days',
    value: 'last14days',
    start: startOfDay(subDays(new Date(), 13)),
    end: endOfDay(new Date())
  },
  {
    label: 'Last 30 Days',
    value: 'last30days',
    start: startOfDay(subDays(new Date(), 29)),
    end: endOfDay(new Date())
  },
  {
    label: 'Last 2 Months',
    value: 'last2months',
    start: startOfDay(subDays(new Date(), 59)),
    end: endOfDay(new Date())
  }
];

export const TimeFrameSelector: React.FC<TimeFrameSelectorProps> = ({
  value,
  onChange,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedFrame = TIME_FRAMES.find(tf => tf.value === value) || TIME_FRAMES[0];

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700",
          "rounded-lg transition-colors text-sm font-medium",
          "border border-slate-700"
        )}
      >
        <CalendarIcon className="w-4 h-4 text-gray-400" />
        <span className="text-white">{selectedFrame.label}</span>
        <ChevronDownIcon className={cn(
          "w-4 h-4 text-gray-400 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <>
          {/* 點擊外部關閉 */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* 下拉菜單 */}
          <div className={cn(
            "absolute right-0 top-full mt-2 w-48 bg-slate-900",
            "border border-slate-700 rounded-lg shadow-xl z-20",
            "overflow-hidden"
          )}>
            {TIME_FRAMES.map((timeFrame) => (
              <button
                key={timeFrame.value}
                onClick={() => {
                  onChange(timeFrame);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-4 py-2 text-left text-sm",
                  "hover:bg-slate-800 transition-colors",
                  "flex items-center justify-between",
                  value === timeFrame.value 
                    ? "bg-slate-800 text-blue-400" 
                    : "text-gray-300"
                )}
              >
                <span>{timeFrame.label}</span>
                {value === timeFrame.value && (
                  <div className="w-2 h-2 bg-blue-400 rounded-full" />
                )}
              </button>
            ))}
            
            {/* 日期範圍提示 */}
            <div className="px-4 py-2 border-t border-slate-700 text-xs text-gray-500">
              {format(selectedFrame.start, 'MMM d')} - {format(selectedFrame.end, 'MMM d, yyyy')}
            </div>
          </div>
        </>
      )}
    </div>
  );
};