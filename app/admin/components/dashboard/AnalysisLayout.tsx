'use client';

import React from 'react';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { useLayoutVirtualization } from '@/app/hooks/useLayoutVirtualization';

interface AnalysisLayoutProps {
  theme: string;
  timeFrame: TimeFrame;
  children: React.ReactNode[];
}

export const AnalysisLayout: React.FC<AnalysisLayoutProps> = ({ theme, timeFrame, children }) => {
  // 確保 children 是數組
  const childrenArray = React.Children.toArray(children);

  // 使用虛擬化 hook
  const containerRef = useLayoutVirtualization({
    widgetCount: childrenArray.length,
    theme,
    threshold: 100,
  });

  // 讓 CSS 類別處理所有佈局，不需要 inline styles
  return (
    <div ref={containerRef} className='analysis-container'>
      {childrenArray}
    </div>
  );
};
