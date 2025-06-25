'use client';

import React, { useState, useCallback, useMemo } from 'react';
import './Folder3DOptimized.css';

interface Folder3DOptimizedProps {
  color?: string;
  size?: number;
  icon?: React.ReactNode;
  onClick?: () => void;
  label?: string;
  description?: string;
  enablePerformanceMode?: boolean;
}

export const Folder3DOptimized: React.FC<Folder3DOptimizedProps> = ({
  color = '#70a1ff',
  size = 1,
  icon,
  onClick,
  label,
  description,
  enablePerformanceMode = true
}) => {
  // Memoize click handler to prevent recreating on each render
  const handleClick = useCallback(() => {
    if (onClick) onClick();
  }, [onClick]);

  // Memoize style object to prevent recreation
  const folderStyle = useMemo(() => ({
    '--folder-color': color,
    '--folder-back-color': `color-mix(in srgb, ${color} 85%, black)`,
    transform: `scale(${size})`
  } as React.CSSProperties), [color, size]);

  // Memoize icon element
  const iconElement = useMemo(() => {
    if (!icon) return null;
    return React.cloneElement(icon as React.ReactElement, { 
      className: 'w-6 h-6 text-gray-600' 
    });
  }, [icon]);

  return (
    <div className="folder-container flex flex-col items-center justify-center">
      <div 
        className={`folder ${enablePerformanceMode ? 'performance-mode' : ''}`}
        style={folderStyle}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={label || 'Folder'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <div className="folder__back">
          <div className="paper" data-paper="1">
            {iconElement}
          </div>
          <div className="paper" data-paper="2"></div>
          <div className="paper" data-paper="3"></div>
          <div className="folder__front"></div>
        </div>
      </div>
      
      {label && (
        <h3 className="text-sm font-medium text-slate-200 mt-4">{label}</h3>
      )}
      
      {description && (
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      )}
    </div>
  );
};

// Performance monitoring component for development
export const Folder3DPerformanceMonitor: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'paint' || entry.entryType === 'layout-shift') {
          console.log(`[Folder3D Performance] ${entry.name}: ${entry.startTime}ms`);
        }
      }
    });

    observer.observe({ entryTypes: ['paint', 'layout-shift'] });

    return () => observer.disconnect();
  }, []);

  return <>{children}</>;
};