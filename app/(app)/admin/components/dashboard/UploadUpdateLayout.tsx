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

  // 不需要 inline styles，因為 CSS 已經定義了完整的 grid-template-areas
  // 讓 CSS 類別處理所有佈局
  const containerClass = theme === 'upload' ? 'upload-container' : 'update-container';

  return (
    <div ref={containerRef} className={containerClass}>
      {childrenArray}
    </div>
  );
};
