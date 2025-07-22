'use client';

import React from 'react';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { motion } from 'framer-motion';
import { useLayoutVirtualization } from '@/app/hooks/useLayoutVirtualization';
import { adminDashboardLayouts } from './adminDashboardLayouts';
import '../../styles/custom-layout.css';

interface CustomThemeLayoutProps {
  theme: string;
  timeFrame: TimeFrame;
  children: React.ReactNode[];
}

export const CustomThemeLayout: React.FC<CustomThemeLayoutProps> = ({
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

  // Get the layout configuration from adminDashboardLayouts - 使用統一配置
  const layout = adminDashboardLayouts[theme];
  const layoutConfig = layout || adminDashboardLayouts['operations-monitoring']; // Fallback

  // Container styles with dynamic grid template - 使用統一配置
  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(14, 1fr)', // 修正為 14 列
    gridTemplateRows: 'repeat(10, minmax(80px, auto))', // 修正為 10 行
    gap: '16px',
    gridTemplateAreas: layoutConfig.gridTemplate,
    width: '100%',
    minHeight: '900px',
    padding: '20px',
  };

  // Widget positions matching exact CSS
  const widgetStyles = [
    // Item 1 - Right sidebar widget
    {
      gridRow: '1 / 9',
      gridColumn: '9 / 11',
      height: 'auto',
      width: 'auto',
    },
    // Item 2 - Stats widget
    {
      gridArea: '1 / 1 / 2 / 2',
      gridColumn: '1 / 3',
      gridRow: '1 / 3',
      height: 'auto',
      width: 'auto',
    },
    // Item 3 - Stats widget
    {
      gridArea: '1 / 3 / 2 / 4',
      gridColumn: '3 / 5',
      gridRow: '1 / 3',
      height: 'auto',
      width: 'auto',
    },
    // Item 4 - Stats widget
    {
      gridArea: '1 / 5 / 2 / 6',
      gridColumn: '5 / 7',
      gridRow: '1 / 3',
      height: 'auto',
      width: 'auto',
    },
    // Item 5 - Stats widget
    {
      gridArea: '1 / 7 / 2 / 8',
      gridColumn: '7 / 9',
      gridRow: '1 / 3',
      height: 'auto',
      width: 'auto',
    },
    // Item 6 - Chart widget
    {
      gridArea: '3 / 1 / 4 / 2',
      gridColumn: '1 / 4',
      gridRow: '3 / 6',
      height: 'auto',
      width: 'auto',
    },
    // Item 7 - Chart widget
    {
      gridArea: '3 / 4 / 4 / 5',
      gridColumn: '4 / 7',
      gridRow: '3 / 6',
      height: 'auto',
      width: 'auto',
    },
    // Item 8 - Chart/Stats widget
    {
      gridArea: '3 / 7 / 4 / 8',
      gridColumn: '7 / 9',
      gridRow: '3 / 6',
      height: 'auto',
      width: 'auto',
    },
    // Item 9 - Table widget
    {
      gridArea: '6 / 1 / 7 / 2',
      gridColumn: '1 / 5',
      gridRow: '6 / 9',
      height: 'auto',
      width: 'auto',
    },
    // Item 10 - Table/Chart widget
    {
      gridArea: '6 / 5 / 7 / 6',
      gridRow: '6 / 9',
      gridColumn: '5 / 9',
      height: 'auto',
      width: 'auto',
    },
  ];

  return (
    <div ref={containerRef} className='custom-theme-container' style={containerStyle}>
      {childrenArray}
    </div>
  );
};
