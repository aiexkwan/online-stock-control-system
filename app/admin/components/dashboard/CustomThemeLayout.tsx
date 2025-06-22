'use client';

import React from 'react';
import { TimeFrame } from '@/app/components/dashboard/TimeFrameSelector';
import { motion } from 'framer-motion';
import '../../styles/custom-layout.css';

interface CustomThemeLayoutProps {
  theme: string;
  timeFrame: TimeFrame;
  children: React.ReactNode[];
}

export const CustomThemeLayout: React.FC<CustomThemeLayoutProps> = ({ 
  theme, 
  timeFrame, 
  children 
}) => {
  // Container styles matching exact CSS
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

  // Widget positions matching exact CSS
  const widgetStyles = [
    // Item 1 - History Tree (right sidebar)
    { 
      gridRow: '1 / 9', 
      gridColumn: '9 / 11',
      height: 'auto',
      width: 'auto'
    },
    // Item 2 - Stats widget
    { 
      gridArea: '1 / 1 / 2 / 2',
      gridColumn: '1 / 3',
      gridRow: '1 / 3',
      height: 'auto',
      width: 'auto'
    },
    // Item 3 - Stats widget
    { 
      gridArea: '1 / 3 / 2 / 4',
      gridColumn: '3 / 5',
      gridRow: '1 / 3',
      height: 'auto',
      width: 'auto'
    },
    // Item 4 - Stats widget
    { 
      gridArea: '1 / 5 / 2 / 6',
      gridColumn: '5 / 7',
      gridRow: '1 / 3',
      height: 'auto',
      width: 'auto'
    },
    // Item 5 - Stats widget
    { 
      gridArea: '1 / 7 / 2 / 8',
      gridColumn: '7 / 9',
      gridRow: '1 / 3',
      height: 'auto',
      width: 'auto'
    },
    // Item 6 - Chart widget
    { 
      gridArea: '3 / 1 / 4 / 2',
      gridColumn: '1 / 4',
      gridRow: '3 / 6',
      height: 'auto',
      width: 'auto'
    },
    // Item 7 - Chart widget
    { 
      gridArea: '3 / 4 / 4 / 5',
      gridColumn: '4 / 7',
      gridRow: '3 / 6',
      height: 'auto',
      width: 'auto'
    },
    // Item 8 - Chart/Stats widget
    { 
      gridArea: '3 / 7 / 4 / 8',
      gridColumn: '7 / 9',
      gridRow: '3 / 6',
      height: 'auto',
      width: 'auto'
    },
    // Item 9 - Table widget
    { 
      gridArea: '6 / 1 / 7 / 2',
      gridColumn: '1 / 5',
      gridRow: '6 / 9',
      height: 'auto',
      width: 'auto'
    },
    // Item 10 - Table/Chart widget
    { 
      gridArea: '6 / 5 / 7 / 6',
      gridRow: '6 / 9',
      gridColumn: '5 / 9',
      height: 'auto',
      width: 'auto'
    }
  ];

  return (
    <div className="custom-theme-container">
      {children.slice(0, 10).map((child, index) => {
        const isHistoryTree = index === 0;
        
        if (isHistoryTree) {
          // History Tree without glassmorphism wrapper
          return (
            <div key={`widget-${index}`} className="custom-theme-item">
              {child}
            </div>
          );
        }

        // Other widgets with glassmorphism effect
        return (
          <motion.div
            key={`widget-${index}`}
            className="custom-theme-item"
            style={{
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
              delay: index * 0.05,
              ease: [0.25, 0.1, 0.25, 1]
            }}
            whileHover={{
              y: -4,
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