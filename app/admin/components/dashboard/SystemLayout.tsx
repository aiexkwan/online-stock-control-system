'use client';

import React from 'react';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { motion } from 'framer-motion';

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

  // Widget positions matching exact CSS for system layout
  const widgetStyles = [
    // Item 1 - Right sidebar widget (spans all 4 rows)
    { 
      gridRow: '1 / 5', 
      gridColumn: '9 / 11',
      height: 'auto',
      width: 'auto'
    },
    // Item 2 - First row left
    { 
      gridColumn: '1 / 4',
      gridRow: '1 / 2'
    },
    // Item 3 - Second row left
    { 
      gridColumn: '1 / 4',
      gridRow: '2 / 3'
    },
    // Item 4 - Third row left
    { 
      gridColumn: '1 / 4',
      gridRow: '3 / 4'
    },
    // Item 5 - First row right
    { 
      gridRow: '1 / 2',
      gridColumn: '5 / 8'
    },
    // Item 6 - Second row right
    { 
      gridRow: '2 / 3',
      gridColumn: '5 / 8'
    },
    // Item 7 - Third row right
    { 
      gridRow: '3 / 4',
      gridColumn: '5 / 8'
    },
    // Item 8 - Fourth row left
    { 
      gridColumn: '1 / 4',
      gridRow: '4 / 5'
    },
    // Item 9 - Fourth row right
    { 
      gridRow: '4 / 5',
      gridColumn: '5 / 8'
    }
  ];

  return (
    <div className="system-container" style={containerStyle}>
      {children.slice(0, 9).map((child, index) => {
        const isRightSidebar = index === 0;
        const style = widgetStyles[index];
        
        if (isRightSidebar) {
          // Right sidebar widget without glassmorphism wrapper
          return (
            <div key={`widget-${index}`} className="system-item" style={style}>
              {child}
            </div>
          );
        }

        // All other widgets with glassmorphism effect
        return (
          <motion.div
            key={`widget-${index}`}
            className="system-item"
            style={{
              ...style,
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
              overflow: 'visible',
              position: 'relative' as const,
              transition: 'all 0.3s ease',
              zIndex: 1
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
            <div style={{ position: 'relative', zIndex: 1, height: '100%', width: '100%', overflow: 'visible' }}>
              {child}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};