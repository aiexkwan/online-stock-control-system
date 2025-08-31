'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /**
   * Format string for displaying the selected date
   * @default 'PPP'
   */
  dateFormat?: string;
  /**
   * Additional props to pass to the Calendar component
   */
  calendarProps?: Omit<
    React.ComponentProps<typeof Calendar>,
    'mode' | 'selected' | 'onSelect' | 'required'
  >;
}

export const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      date,
      onDateChange,
      placeholder = 'Pick a date',
      className,
      disabled = false,
      dateFormat = 'PPP',
      calendarProps,
    },
    ref
  ) => {
    // Handle the Calendar's onSelect callback with proper type adaptation
    const handleSelect = React.useCallback(
      (selectedDate: Date | undefined) => {
        onDateChange?.(selectedDate);
      },
      [onDateChange]
    );

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant='outline'
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground',
              className
            )}
            disabled={disabled}
            aria-label={date ? `Selected date: ${format(date, dateFormat)}` : placeholder}
          >
            <CalendarIcon className='mr-2 h-4 w-4' aria-hidden='true' />
            {date ? format(date, dateFormat) : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            mode='single'
            selected={date}
            onSelect={handleSelect as any}
            initialFocus
            {...calendarProps}
          />
        </PopoverContent>
      </Popover>
    );
  }
);

DatePicker.displayName = 'DatePicker';
