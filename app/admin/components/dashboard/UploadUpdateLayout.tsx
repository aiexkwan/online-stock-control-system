'use client';

import React from 'react';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { useLayoutVirtualization } from '@/app/hooks/useLayoutVirtualization';

interface UploadUpdateLayoutProps {
  theme: string;
  timeFrame: TimeFrame;
  children: React.ReactNode[];
}

export const UploadUpdateLayout: React.FC<UploadUpdateLayoutProps> = ({
  theme,
  timeFrame,
  children,
}) => {
  // Convert children to array to handle both single and multiple children
  const childrenArray = React.Children.toArray(children);

  // 使用虛擬化 hook
  const containerRef = useLayoutVirtualization({
    widgetCount: childrenArray.length,
    theme,
    threshold: 100,
  });

  // Container styles matching exact CSS for upload/update pages
  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(10, 1fr)',
    gridTemplateRows: theme === 'update' ? 'repeat(8, 100px)' : 'repeat(8, 100px)',
    gap: '10px 10px',
    gridAutoColumns: 'auto',
    justifyItems: 'stretch',
    width: '100%',
    minHeight: '800px',
    padding: '20px',
  };

  // Use different container class based on theme
  const containerClass = theme === 'upload' ? 'upload-container' : 'update-container';

  return (
    <div ref={containerRef} className={containerClass} style={containerStyle}>
      {childrenArray}
    </div>
  );
};
