'use client';

import React from 'react';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { motion } from 'framer-motion';

interface UploadUpdateLayoutProps {
  theme: string;
  timeFrame: TimeFrame;
  children: React.ReactNode[];
}

export const UploadUpdateLayout: React.FC<UploadUpdateLayoutProps> = ({ 
  theme, 
  timeFrame, 
  children 
}) => {
  // Container styles matching exact CSS for upload/update pages
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

  // Widget positions matching exact CSS for upload/update layout
  const widgetStyles = [
    // Item 1 - History Tree (right sidebar)
    { 
      gridRow: '1 / 9', 
      gridColumn: '9 / 11',
      height: 'auto',
      width: 'auto'
    },
    // Item 2 - Main content area (left)
    { 
      gridArea: '1 / 1 / 2 / 2',
      gridColumn: '1 / 4',
      gridRow: '1 / 9',
      height: 'auto',
      width: 'auto'
    },
    // Item 3 - Secondary content area (center)
    { 
      gridArea: '1 / 5 / 2 / 6',
      gridColumn: '4 / 7',
      gridRow: '1 / 9',
      height: 'auto',
      width: 'auto'
    },
    // Item 4 - Stats/Info widget (top right)
    { 
      gridArea: '1 / 7 / 2 / 8',
      gridColumn: '7 / 9',
      gridRow: '1 / 3',
      height: 'auto',
      width: 'auto'
    },
    // Item 5 - Stats/Info widget (mid-top right)
    { 
      gridArea: '3 / 7 / 4 / 8',
      gridColumn: '7 / 9',
      gridRow: '3 / 5',
      height: 'auto',
      width: 'auto'
    },
    // Item 6 - Stats/Info widget (mid-bottom right)
    { 
      gridArea: '5 / 7 / 6 / 8',
      gridColumn: '7 / 9',
      gridRow: '5 / 7',
      height: 'auto',
      width: 'auto'
    },
    // Item 7 - Stats/Info widget (bottom right)
    { 
      gridArea: '7 / 7 / 8 / 8',
      gridColumn: '7 / 9',
      gridRow: '7 / 9',
      height: 'auto',
      width: 'auto'
    }
  ];

  return (
    <div className="upload-update-container" style={containerStyle}>
      {children.slice(0, 7).map((child, index) => {
        const isHistoryTree = index === 0;
        const isMainContent = index === 1 || index === 2;
        const style = widgetStyles[index];
        
        if (isHistoryTree) {
          // History Tree without glassmorphism wrapper
          return (
            <div key={`widget-${index}`} className="upload-update-item" style={style}>
              {child}
            </div>
          );
        }

        if (isMainContent) {
          // Main content areas with subtle glassmorphism
          return (
            <motion.div
              key={`widget-${index}`}
              className="upload-update-item"
              style={{
                ...style,
                background: 'rgba(255, 255, 255, 0.01)',
                backdropFilter: 'blur(12px) saturate(150%)',
                WebkitBackdropFilter: 'blur(12px) saturate(150%)',
                border: '1px solid rgba(255, 255, 255, 0.03)',
                borderRadius: '20px',
                boxShadow: '0 4px 24px 0 rgba(31, 38, 135, 0.1)',
                overflow: 'hidden',
                position: 'relative' as const
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.25, 0.1, 0.25, 1]
              }}
            >
              <div style={{ height: '100%', width: '100%' }}>
                {child}
              </div>
            </motion.div>
          );
        }

        // For upload widgets (index 3-6), render without glassmorphism wrapper
        if (index >= 3 && index <= 6) {
          return (
            <div key={`widget-${index}`} className="upload-update-item" style={style}>
              {child}
            </div>
          );
        }

        // Stats widgets with stronger glassmorphism effect
        return (
          <motion.div
            key={`widget-${index}`}
            className="upload-update-item"
            style={{
              ...style,
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
              overflow: 'hidden',
              position: 'relative' as const,
              transition: 'all 0.3s ease'
            }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.6,
              delay: index * 0.05,
              ease: [0.25, 0.1, 0.25, 1]
            }}
            whileHover={{
              y: -2,
              boxShadow: '0 12px 48px 0 rgba(31, 38, 135, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.04)'
            }}
          >
            {/* Gradient overlay */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%)',
                pointerEvents: 'none',
                zIndex: 0
              }}
            />
            <div style={{ position: 'relative', zIndex: 1, height: '100%', width: '100%' }}>
              {child}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};