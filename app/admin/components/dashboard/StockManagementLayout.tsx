'use client';

import React from 'react';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { motion } from 'framer-motion';

interface StockManagementLayoutProps {
  theme: string;
  timeFrame: TimeFrame;
  children: React.ReactNode[];
}

export const StockManagementLayout: React.FC<StockManagementLayoutProps> = ({ 
  theme, 
  timeFrame, 
  children 
}) => {
  // Container styles matching exact CSS for stock management page
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

  // Widget positions matching exact CSS for stock management layout
  const widgetStyles = [
    // Item 1 - Right sidebar widget
    { 
      gridRow: '1 / 9', 
      gridColumn: '9 / 11',
      height: 'auto',
      width: 'auto'
    },
    // Item 2 - Stock Type Selector (top half of left section)
    { 
      gridColumn: '1 / 6',
      gridRow: '1 / 5',
      height: 'auto',
      width: 'auto'
    },
    // Item 3 - Stock Distribution Chart (bottom half of left section)
    { 
      gridColumn: '1 / 6',
      gridRow: '5 / 9',
      height: 'auto',
      width: 'auto'
    },
    // Item 4 - Inventory Ordered Analysis (top-middle right)
    { 
      gridColumn: '6 / 9',
      gridRow: '1 / 5',
      height: 'auto',
      width: 'auto'
    },
    // Item 5 - Stock Distribution Chart (bottom right)
    { 
      gridColumn: '6 / 9',
      gridRow: '5 / 9',
      height: 'auto',
      width: 'auto'
    }
  ];

  return (
    <div className="stock-management-container" style={containerStyle}>
      {children.slice(0, 5).map((child, index) => {
        const isRightSidebar = index === 0;
        const isMainContent = index === 1 || index === 2; // Both stock selector and chart
        const style = widgetStyles[index];
        
        if (isRightSidebar) {
          // Right sidebar widget without glassmorphism wrapper
          return (
            <div key={`widget-${index}`} className="stock-management-item" style={style}>
              {child}
            </div>
          );
        }

        if (isMainContent) {
          // Main content area with subtle glassmorphism and special styling
          return (
            <motion.div
              key={`widget-${index}`}
              className="stock-management-item"
              style={{
                ...style,
                background: 'rgba(255, 255, 255, 0.01)',
                backdropFilter: 'blur(16px) saturate(160%)',
                WebkitBackdropFilter: 'blur(16px) saturate(160%)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: '24px',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.12)',
                overflow: 'hidden',
                position: 'relative' as const
              }}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.6,
                ease: [0.25, 0.1, 0.25, 1]
              }}
            >
              <div style={{ height: '100%', width: '100%' }}>
                {child}
              </div>
            </motion.div>
          );
        }

        // Stats widgets with glassmorphism effect
        return (
          <motion.div
            key={`widget-${index}`}
            className="stock-management-item"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: index * 0.08,
              ease: [0.25, 0.1, 0.25, 1]
            }}
            whileHover={{
              y: -3,
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