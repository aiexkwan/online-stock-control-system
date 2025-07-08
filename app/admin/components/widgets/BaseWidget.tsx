/**
 * BaseWidget Component
 * Base class for all dashboard widgets
 */

'use client';

import React from 'react';
import { WidgetWrapper } from '../ui/WidgetWrapper';
import { cn } from '@/lib/utils';
// Import the correct theme type instead of defining local TabType
import { TabTheme } from '../../config/theme';

interface BaseWidgetProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  theme?: TabTheme;
  className?: string;
  contentClassName?: string;
  animationDelay?: number;
  disableGlow?: boolean;
  noPadding?: boolean;
}

export function BaseWidget({
  title,
  subtitle,
  children,
  headerAction,
  theme,
  className,
  contentClassName,
  animationDelay = 0,
  disableGlow = false,
  noPadding = false,
}: BaseWidgetProps) {
  return (
    <WidgetWrapper
      title={title}
      subtitle={subtitle}
      headerAction={headerAction}
      theme={theme}
      padding={!noPadding}
      animationDelay={animationDelay}
      disableGlow={disableGlow}
      className={className}
    >
      <div className={cn('h-full w-full', 'flex flex-col', contentClassName)}>{children}</div>
    </WidgetWrapper>
  );
}

// Export common widget layouts
export const WidgetLayouts = {
  // Table + Chart layout (40% table, 60% chart)
  TableChart: ({ table, chart }: { table: React.ReactNode; chart: React.ReactNode }) => (
    <>
      <div className='mb-2 h-[40%] overflow-auto'>{table}</div>
      <div className='h-[60%] overflow-hidden'>{chart}</div>
    </>
  ),

  // Full chart layout
  FullChart: ({ children }: { children: React.ReactNode }) => (
    <div className='h-full w-full overflow-hidden'>{children}</div>
  ),

  // Full table layout
  FullTable: ({ children }: { children: React.ReactNode }) => (
    <div className='h-full w-full overflow-auto'>{children}</div>
  ),

  // Grid layout for multiple items
  Grid: ({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) => (
    <div
      className={cn(
        'grid h-full gap-3',
        cols === 2 && 'grid-cols-2',
        cols === 3 && 'grid-cols-3',
        cols === 4 && 'grid-cols-4'
      )}
    >
      {children}
    </div>
  ),
};
