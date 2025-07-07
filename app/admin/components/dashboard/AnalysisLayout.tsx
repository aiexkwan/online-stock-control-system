'use client';

import React from 'react';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { useLayoutVirtualization } from '@/app/hooks/useLayoutVirtualization';

interface AnalysisLayoutProps {
  theme: string;
  timeFrame: TimeFrame;
  children: React.ReactNode[];
}

export const AnalysisLayout: React.FC<AnalysisLayoutProps> = ({ 
  theme, 
  timeFrame, 
  children 
}) => {
  // 確保 children 是數組
  const childrenArray = React.Children.toArray(children);
  
  // 使用虛擬化 hook
  const containerRef = useLayoutVirtualization({
    widgetCount: childrenArray.length,
    theme,
    threshold: 100
  });
  
  // Container styles for new layout with paged widget
  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(10, 1fr)',
    gridTemplateRows: 'repeat(8, 100px)',
    gridTemplateAreas: `
      "widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget1 widget1"
      "widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget1 widget1"
      "widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget1 widget1"
      "widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget1 widget1"
      "widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget1 widget1"
      "widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget1 widget1"
      "widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget1 widget1"
      "widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget1 widget1"
    `,
    gap: '10px 10px',
    width: '100%',
    minHeight: '800px',
    padding: '20px'
  };

  return (
    <div ref={containerRef} className="analysis-container" style={containerStyle}>
      {childrenArray}
    </div>
  );
};