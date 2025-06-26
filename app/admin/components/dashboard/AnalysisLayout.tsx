'use client';

import React from 'react';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { motion } from 'framer-motion';

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
  // Container styles for new layout with paged widget
  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
    gridTemplateRows: '100px 100px 100px 100px 100px 100px 100px 100px',
    gap: '10px 10px',
    gridAutoColumns: 'auto',
    justifyItems: 'stretch',
    width: '100%',
    minHeight: '800px',
    padding: '20px'
  };

  // Widget positions for new layout
  const widgetStyles = [
    // Item 1 - History Tree (right sidebar) - unchanged
    { 
      gridRow: '1 / 9', 
      gridColumn: '9 / 11',
      height: 'auto',
      width: 'auto'
    },
    // Item 2 - Large paged widget (takes space of previous 4 widgets)
    { 
      gridRow: '1 / 9',
      gridColumn: '1 / 9'
    }
  ];

  return (
    <div className="analysis-container" style={containerStyle}>
      {children.slice(0, 2).map((child, index) => {
        const isHistoryTree = index === 0;
        const style = widgetStyles[index];
        
        if (isHistoryTree) {
          // History Tree without glassmorphism wrapper
          return (
            <div key={`widget-${index}`} className="analysis-item" style={style}>
              {child}
            </div>
          );
        }

        // Paged widget - remove wrapper as new widget has its own styling
        return (
          <div key={`widget-${index}`} className="analysis-item" style={style}>
            {child}
          </div>
        );
      })}
    </div>
  );
};