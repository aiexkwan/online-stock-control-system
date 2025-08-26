'use client';

import * as React from 'react';
import { DateField, DateInput as AriaDateInput, DateSegment } from 'react-aria-components';
import { cn } from '@/lib/utils';

interface DateInputProps
  extends Omit<React.ComponentPropsWithoutRef<typeof AriaDateInput>, 'children'> {
  variant?: 'default' | 'ghost';
  children?: React.ComponentPropsWithoutRef<typeof AriaDateInput>['children'];
}

const DateInput = React.forwardRef<React.ElementRef<typeof AriaDateInput>, DateInputProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <DateField className='flex'>
        <AriaDateInput
          ref={ref}
          className={cn(
            'border-input flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm',
            variant === 'ghost' && 'border-0 px-0',
            'focus-within:ring-ring focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        >
          {children ||
            (segment => (
              <DateSegment
                segment={segment}
                className={cn(
                  'rounded-sm px-0.5 tabular-nums outline-none',
                  'focus:bg-accent focus:text-accent-foreground',
                  segment.isPlaceholder && 'text-muted-foreground'
                )}
              />
            ))}
        </AriaDateInput>
      </DateField>
    );
  }
);

DateInput.displayName = 'DateInput';

export { DateInput };
