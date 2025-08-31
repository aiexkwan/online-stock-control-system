/**
 * Universal Time Range Selector Component for Admin Pages
 * 統一的時間範圍選擇器 - 點擊後直接開啟自定義日期範圍
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { format, startOfDay, endOfDay } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import { createPortal } from 'react-dom';
import { Calendar } from '../../../components/ui/calendar';
import { cn } from '../../../lib/utils';

export interface TimeFrame {
  label: string;
  value: string;
  start: Date;
  end: Date;
}

interface UniversalTimeRangeSelectorProps {
  value: TimeFrame;
  onChange: (timeFrame: TimeFrame) => void;
  className?: string;
}

export const UniversalTimeRangeSelector: React.FC<UniversalTimeRangeSelectorProps> = ({
  value,
  onChange,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>({
    from: value.start,
    to: value.end,
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Update tempDateRange when value changes
  useEffect(() => {
    setTempDateRange({
      from: value.start,
      to: value.end,
    });
  }, [value]);

  // Update dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right - 400 + window.scrollX, // 400px is approximate width of calendar
      });
    }
  }, [isOpen]);

  // Get display label
  const getDisplayLabel = () => {
    if (value.start && value.end) {
      // Check if it's the same day
      if (format(value.start, 'yyyy-MM-dd') === format(value.end, 'yyyy-MM-dd')) {
        return format(value.start, 'MMM d, yyyy');
      }
      return `${format(value.start, 'MMM d')} - ${format(value.end, 'MMM d, yyyy')}`;
    }
    return 'Select dates';
  };

  const handleApply = () => {
    if (tempDateRange?.from) {
      const endDate = tempDateRange.to || tempDateRange.from;
      const label =
        format(tempDateRange.from, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')
          ? format(tempDateRange.from, 'MMM d, yyyy')
          : `${format(tempDateRange.from, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;

      const customTimeFrame: TimeFrame = {
        label,
        value: 'custom',
        start: startOfDay(tempDateRange.from),
        end: endOfDay(endDate),
      };

      onChange(customTimeFrame);
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setTempDateRange({
      from: value.start,
      to: value.end,
    });
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-4 py-2',
          'bg-slate-800/50 hover:bg-slate-700/50',
          'backdrop-blur-sm',
          'rounded-lg text-sm font-medium transition-all',
          'border border-slate-700/50 hover:border-slate-600',
          'min-w-[240px]'
        )}
      >
        <CalendarIcon className='h-4 w-4 text-gray-400' />
        <span className='flex-1 text-left text-white'>{getDisplayLabel()}</span>
      </button>

      {isOpen &&
        typeof window !== 'undefined' &&
        createPortal(
          <>
            {/* Click outside to close */}
            <div className='fixed inset-0 z-[9998]' onClick={handleCancel} />

            {/* Calendar dropdown */}
            <div
              className={cn(
                'fixed bg-slate-900/95',
                'backdrop-blur-xl',
                'z-[9999] rounded-xl border border-slate-700/50 shadow-2xl',
                'p-4'
              )}
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: '400px',
              }}
            >
              <div className='mb-3'>
                <h3 className='text-sm font-medium text-white'>Select Date Range</h3>
              </div>

              <Calendar
                mode='range'
                selected={tempDateRange}
                onSelect={setTempDateRange}
                defaultMonth={tempDateRange?.from}
                numberOfMonths={2}
                className='bg-transparent p-0 [&_.rdp]:bg-transparent'
                classNames={{
                  months: 'flex flex-row space-x-4',
                  month: 'space-y-4',
                  caption_label: 'text-white',
                  nav: 'text-white',
                  day: cn(
                    'text-gray-300 hover:bg-slate-800/50 rounded-md',
                    'data-[selected=true]:bg-slate-700/50 data-[selected=true]:text-white'
                  ),
                  day_today: 'text-gray-100 font-bold bg-transparent',
                  day_outside: 'text-gray-600 opacity-50',
                  day_disabled: 'text-gray-600 opacity-50',
                  day_range_start: 'bg-slate-700/50 text-white',
                  day_range_end: 'bg-slate-700/50 text-white',
                  day_range_middle: 'bg-slate-700/50 text-white',
                }}
                disabled={{
                  after: new Date(),
                }}
              />

              {/* Action buttons */}
              <div className='mt-4 flex justify-end gap-2 border-t border-slate-700/50 pt-4'>
                <button
                  onClick={handleCancel}
                  className='rounded-lg bg-slate-800/50 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-slate-700/50 hover:text-white'
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  disabled={!tempDateRange?.from}
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    tempDateRange?.from
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'cursor-not-allowed bg-slate-800/50 text-gray-500'
                  )}
                >
                  Apply
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
};
