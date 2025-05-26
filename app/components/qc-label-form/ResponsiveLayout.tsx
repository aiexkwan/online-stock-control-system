'use client';

import React, { ReactNode } from 'react';
import { useMediaQuery } from './hooks/useMediaQuery';

interface ResponsiveLayoutProps {
  children: ReactNode;
  className?: string;
}

interface ResponsiveGridProps {
  children: ReactNode;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

interface ResponsiveContainerProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
  className?: string;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = React.memo(({
  children,
  className = ''
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');

  return (
    <div className={`
      w-full min-h-screen
      ${isMobile ? 'px-4 py-6' : isTablet ? 'px-6 py-8' : 'px-8 py-10'}
      ${className}
    `}>
      {children}
    </div>
  );
});

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = React.memo(({
  children,
  columns = { sm: 1, md: 2, lg: 2, xl: 3 },
  gap = 6,
  className = ''
}) => {
  const gridCols: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  const gapClass = `gap-${gap}`;

  return (
    <div className={`
      grid
      ${gridCols[columns.sm || 1] || 'grid-cols-1'}
      ${columns.md ? `md:${gridCols[columns.md] || 'grid-cols-1'}` : ''}
      ${columns.lg ? `lg:${gridCols[columns.lg] || 'grid-cols-1'}` : ''}
      ${columns.xl ? `xl:${gridCols[columns.xl] || 'grid-cols-1'}` : ''}
      ${gapClass}
      ${className}
    `}>
      {children}
    </div>
  );
});

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = React.memo(({
  children,
  maxWidth = 'lg',
  padding = true,
  className = ''
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full'
  };

  return (
    <div className={`
      w-full mx-auto
      ${maxWidthClasses[maxWidth]}
      ${padding ? 'px-4 sm:px-6 lg:px-8' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
});

export const ResponsiveCard: React.FC<{
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: boolean;
}> = React.memo(({
  children,
  title,
  subtitle,
  className = '',
  padding = 'md',
  shadow = true
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6 sm:p-8',
    lg: 'p-8 sm:p-10'
  };

  return (
    <div className={`
      bg-gray-800 rounded-lg border border-gray-700
      ${shadow ? 'shadow-lg hover:shadow-xl transition-shadow duration-200' : ''}
      ${paddingClasses[padding]}
      ${className}
    `}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
});

export const ResponsiveStack: React.FC<{
  children: ReactNode;
  direction?: 'vertical' | 'horizontal' | 'responsive';
  spacing?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
}> = React.memo(({
  children,
  direction = 'vertical',
  spacing = 4,
  align = 'stretch',
  className = ''
}) => {
  const directionClasses = {
    vertical: 'flex-col',
    horizontal: 'flex-row',
    responsive: 'flex-col lg:flex-row'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const spacingClass = direction === 'vertical' 
    ? `space-y-${spacing}` 
    : direction === 'horizontal'
    ? `space-x-${spacing}`
    : `space-y-${spacing} lg:space-y-0 lg:space-x-${spacing}`;

  return (
    <div className={`
      flex
      ${directionClasses[direction]}
      ${alignClasses[align]}
      ${spacingClass}
      ${className}
    `}>
      {children}
    </div>
  );
});

ResponsiveLayout.displayName = 'ResponsiveLayout';
ResponsiveGrid.displayName = 'ResponsiveGrid';
ResponsiveContainer.displayName = 'ResponsiveContainer';
ResponsiveCard.displayName = 'ResponsiveCard';
ResponsiveStack.displayName = 'ResponsiveStack';

export default ResponsiveLayout; 