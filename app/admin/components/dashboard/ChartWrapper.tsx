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
    <div className={cn("flex flex-col h-full", className)}>
      {title && (
        <h3 className="text-emerald-400 font-semibold font-mono text-lg mb-4">
          {title}
        </h3>
      )}
      <div className="flex-1 min-h-0" style={{ height: 'calc(100% - 2rem)' }}>
        {children}
      </div>
    </div>
  );
}