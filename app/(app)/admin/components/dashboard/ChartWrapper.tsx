/**
 * Chart Wrapper Component
 * Provides consistent sizing for chart widgets in AI Terminal theme
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ChartWrapperProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function ChartWrapper({ children, className, title }: ChartWrapperProps) {
  return (
    <div className={cn('flex h-full flex-col', className)}>
      {title && <h3 className='mb-4 font-mono text-lg font-semibold text-emerald-400'>{title}</h3>}
      <div className='min-h-0 flex-1' style={{ height: 'calc(100% - 2rem)' }}>
        {children}
      </div>
    </div>
  );
}
