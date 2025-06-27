'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PrintLabelGridProps {
  children: React.ReactNode;
  className?: string;
}

export const PrintLabelGrid: React.FC<PrintLabelGridProps> = ({
  children,
  className
}) => {
  return (
    <div 
      className={cn(
        "w-full h-screen grid grid-cols-10 grid-rows-7 gap-[10px] p-4",
        className
      )}
    >
      {children}
    </div>
  );
};

interface GridWidgetProps {
  children: React.ReactNode;
  area: 'main' | 'bottom-left' | 'bottom-right';
  className?: string;
}

export const GridWidget: React.FC<GridWidgetProps> = ({
  children,
  area,
  className
}) => {
  const areaClasses = {
    'main': 'col-start-3 col-end-9 row-start-1 row-end-4',
    'bottom-left': 'col-start-3 col-end-6 row-start-4 row-end-6',
    'bottom-right': 'col-start-6 col-end-9 row-start-4 row-end-6'
  };

  return (
    <div 
      className={cn(
        areaClasses[area],
        "bg-transparent p-6",
        className
      )}
    >
      {children}
    </div>
  );
};

PrintLabelGrid.displayName = 'PrintLabelGrid';
GridWidget.displayName = 'GridWidget';