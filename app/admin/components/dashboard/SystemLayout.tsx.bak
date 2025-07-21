'use client';

import React from 'react';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { useLayoutVirtualization } from '@/app/hooks/useLayoutVirtualization';

interface SystemLayoutProps {
  theme: string;
  timeFrame: TimeFrame;
  children: React.ReactNode[];
}

export const SystemLayout: React.FC<SystemLayoutProps> = ({ theme, timeFrame, children }) => {
  // Convert children to array to handle both single and multiple children
  const childrenArray = React.Children.toArray(children);

  // 使用虛擬化 hook
  const containerRef = useLayoutVirtualization({
    widgetCount: childrenArray.length,
    theme,
    threshold: 100,
  });

  // 讓 CSS 類別處理所有佈局，不需要 inline styles
  return (
    <div ref={containerRef} className='system-container'>
      {childrenArray}
    </div>
  );
};
