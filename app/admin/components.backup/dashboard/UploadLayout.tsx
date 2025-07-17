'use client';

import React from 'react';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { motion } from 'framer-motion';
import { useLayoutVirtualization } from '@/app/hooks/useLayoutVirtualization';

interface UploadLayoutProps {
  theme: string;
  timeFrame: TimeFrame;
  children: React.ReactNode[];
}

export const UploadLayout: React.FC<UploadLayoutProps> = ({ theme, timeFrame, children }) => {
  // Convert children to array to handle both single and multiple children
  const childrenArray = React.Children.toArray(children);

  // 使用虛擬化 hook
  const containerRef = useLayoutVirtualization({
    widgetCount: childrenArray.length,
    theme,
    threshold: 100,
  });

  // Container styles matching the upload theme grid template
  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(10, 1fr)',
    gridTemplateRows: 'repeat(4, 1fr)',
    gap: '16px',
    gridTemplateAreas: `
      "widget1 widget1 widget1 widget2 widget2 widget2 widget3 widget3 widget7 widget7" 
      "widget1 widget1 widget1 widget2 widget2 widget2 widget4 widget4 widget7 widget7" 
      "widget1 widget1 widget1 widget2 widget2 widget2 widget5 widget5 widget7 widget7" 
      "widget1 widget1 widget1 widget2 widget2 widget2 widget6 widget6 widget7 widget7"
    `,
    width: '100%',
    minHeight: '800px',
    padding: '20px',
  };

  return (
    <div ref={containerRef} className='upload-container' style={containerStyle}>
      {childrenArray.map((child, index) => {
        // Simply render all children - AdminWidgetRenderer will handle gridArea positioning
        return <div key={`widget-${index}`}>{child}</div>;
      })}
    </div>
  );
};
