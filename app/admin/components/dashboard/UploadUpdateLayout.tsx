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
    gridTemplateRows: '250px 250px 250px 250px',
    gap: '10px 10px',
    gridAutoColumns: 'auto',
    justifyItems: 'stretch',
    width: '100%',
    minHeight: '800px',
    padding: '20px'
  };

  // Widget positions based on theme
  const uploadWidgetStyles = [
    // Widget 1 - History Tree (far right) - index 0
    { 
      gridColumn: '9 / 11',
      gridRow: '1 / 5',
      height: 'auto',
      width: 'auto'
    },
    // Widget 2 - Orders List (left) - index 1
    { 
      gridColumn: '1 / 4',
      gridRow: '1 / 5',
      height: 'auto',
      width: 'auto'
    },
    // Widget 3 - Other Files List (center-left) - index 2
    { 
      gridColumn: '4 / 7',
      gridRow: '1 / 5',
      height: 'auto',
      width: 'auto'
    },
    // Widget 4 - Upload Files (top right) - index 3
    { 
      gridColumn: '7 / 9',
      gridRow: '1 / 2',
      height: 'auto',
      width: 'auto'
    },
    // Widget 5 - Upload Orders (right middle-top) - index 4
    { 
      gridColumn: '7 / 9',
      gridRow: '2 / 3',
      height: 'auto',
      width: 'auto'
    },
    // Widget 6 - Upload Product Spec (right middle-bottom) - index 5
    { 
      gridColumn: '7 / 9',
      gridRow: '3 / 4',
      height: 'auto',
      width: 'auto'
    },
    // Widget 7 - Upload Photo (bottom right) - index 6
    { 
      gridColumn: '7 / 9',
      gridRow: '4 / 5',
      height: 'auto',
      width: 'auto'
    }
  ];

  const updateWidgetStyles = [
    // Widget 1 - History Tree (right sidebar)
    { 
      gridColumn: '9 / 11',
      gridRow: '1 / 5',
      height: 'auto',
      width: 'auto'
    },
    // Widget 2 - Product Update (top left)
    { 
      gridColumn: '1 / 4',
      gridRow: '1 / 3',
      height: 'auto',
      width: 'auto'
    },
    // Widget 3 - Supplier Update (bottom left)
    { 
      gridColumn: '1 / 4',
      gridRow: '3 / 5',
      height: 'auto',
      width: 'auto'
    },
    // Widget 4 - Void Pallet (center)
    { 
      gridColumn: '4 / 9',
      gridRow: '1 / 4',
      height: 'auto',
      width: 'auto'
    },
    // Widget 5 - Pending Updates (bottom center)
    { 
      gridColumn: '4 / 9',
      gridRow: '4 / 5',
      height: 'auto',
      width: 'auto'
    }
  ];

  // Select widget styles based on theme
  const widgetStyles = theme === 'upload' ? uploadWidgetStyles : updateWidgetStyles;

  return (
    <div className="upload-update-container" style={containerStyle}>
      {children.map((child, index) => {
        // Get the widget style, fallback to default if out of bounds
        const style = widgetStyles[index] || { gridColumn: '1 / 2', gridRow: '1 / 2', height: 'auto', width: 'auto' };
        
        // Determine widget type based on theme and index
        const isUploadTheme = theme === 'upload';
        const isRightSidebar = (isUploadTheme && index === 0) || (!isUploadTheme && index === 0);
        const isMainContent = isUploadTheme ? (index === 1 || index === 2) : (index === 1 || index === 2);
        const isVoidPallet = !isUploadTheme && index === 3;
        const isStatsWidget = (isUploadTheme && (index === 3 || index === 4 || index === 5 || index === 6)) || (!isUploadTheme && index === 4);
        
        if (isRightSidebar) {
          // Right sidebar widget without glassmorphism wrapper
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

        // Void Pallet widget - render with medium glassmorphism
        if (isVoidPallet) {
          return (
            <motion.div
              key={`widget-${index}`}
              className="upload-update-item"
              style={{
                ...style,
                background: 'rgba(255, 255, 255, 0.015)',
                backdropFilter: 'blur(16px) saturate(160%)',
                WebkitBackdropFilter: 'blur(16px) saturate(160%)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: '20px',
                boxShadow: '0 6px 28px 0 rgba(31, 38, 135, 0.12)',
                overflow: 'hidden',
                position: 'relative' as const
              }}
              initial={{ opacity: 0, scale: 0.97 }}
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

        // Stats widget with stronger glassmorphism effect
        if (isStatsWidget) {
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
        }

        // Default rendering
        return (
          <div key={`widget-${index}`} className="upload-update-item" style={style}>
            {child}
          </div>
        );
      })}
    </div>
  );
};