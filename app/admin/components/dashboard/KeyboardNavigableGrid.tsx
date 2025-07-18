/**
 * KeyboardNavigableGrid Component
 * 為 Dashboard widgets 提供鍵盤導航功能
 */

'use client';

import React, { useRef, useEffect, ReactNode } from 'react';
import { useDirectionalNavigation } from '@/lib/accessibility';
import { cn } from '@/lib/utils';

interface KeyboardNavigableGridProps {
  children: ReactNode;
  className?: string;
  gridColumns?: number;
  'aria-label'?: string;
}

export function KeyboardNavigableGrid({
  children,
  className,
  gridColumns = 8, // 根據 adminDashboardLayouts 的預設網格列數
  'aria-label': ariaLabel = 'Dashboard widgets',
}: KeyboardNavigableGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 使用方向導航 hook
  const {
    currentIndex,
    moveToIndex,
  } = useDirectionalNavigation({
    containerRef,
    itemSelector: '[data-widget-focusable="true"]',
    columns: gridColumns,
    wrap: true,
  });
  
  // 添加焦點指示器
  useEffect(() => {
    const updateFocusIndicator = () => {
      const widgets = containerRef.current?.querySelectorAll('[data-widget-focusable="true"]');
      widgets?.forEach((widget, index) => {
        if (index === currentIndex) {
          widget.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
          widget.setAttribute('tabindex', '0');
        } else {
          widget.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
          widget.setAttribute('tabindex', '-1');
        }
      });
    };
    
    updateFocusIndicator();
  }, [currentIndex]);
  
  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      role="grid"
      aria-label={ariaLabel}
      id="dashboard-widgets"
    >
      {children}
    </div>
  );
}

/**
 * KeyboardNavigableWidget HOC
 * 包裝單個 widget 以支援鍵盤導航
 */
export function makeWidgetKeyboardNavigable<T extends Record<string, unknown>>(WrappedComponent: React.ComponentType<T>) {
  return React.forwardRef<HTMLDivElement, T>((props, ref) => {
    return (
      <div
        ref={ref}
        data-widget-focusable="true"
        tabIndex={-1}
        className="focus:outline-none"
        role="gridcell"
      >
        <WrappedComponent {...props} />
      </div>
    );
  });
}

export default KeyboardNavigableGrid;