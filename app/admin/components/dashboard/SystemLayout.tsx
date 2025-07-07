'use client';

import React from 'react';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { useLayoutVirtualization } from '@/app/hooks/useLayoutVirtualization';

interface SystemLayoutProps {
  theme: string;
  timeFrame: TimeFrame;
  children: React.ReactNode[];
}

export const SystemLayout: React.FC<SystemLayoutProps> = ({ 
  theme, 
  timeFrame, 
  children 
}) => {
  // Convert children to array to handle both single and multiple children
  const childrenArray = React.Children.toArray(children);
  
  // 使用虛擬化 hook
  const containerRef = useLayoutVirtualization({
    widgetCount: childrenArray.length,
    theme,
    threshold: 100
  });
  
  // Container styles matching exact CSS for system page
  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
    gridTemplateRows: '150px 150px 150px 150px',
    gap: '10px 10px',
    gridAutoColumns: 'auto',
    justifyItems: 'stretch',
    width: '100%',
    minHeight: '620px',
    padding: '20px'
  };

  return (
    <div ref={containerRef} className="system-container" style={containerStyle}>
      {childrenArray}
    </div>
  );
};