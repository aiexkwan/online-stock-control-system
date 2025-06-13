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
  headerAction?: ReactNode;
}> = React.memo(({
  children,
  title,
  subtitle,
  className = '',
  padding = 'md',
  shadow = true,
  headerAction
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6 sm:p-8',
    lg: 'p-8 sm:p-10'
  };

  return (
    <div className={`
      relative group
      bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-blue-900/30
      backdrop-blur-xl border border-slate-600/30
      rounded-2xl overflow-hidden
      ${shadow ? 'shadow-2xl shadow-blue-900/10 hover:shadow-blue-800/20 transition-all duration-300' : ''}
      ${paddingClasses[padding]}
      ${className}
      hover:border-blue-500/30 hover:bg-gradient-to-br hover:from-slate-800/70 hover:via-slate-800/50 hover:to-blue-900/40
    `}>
      {/* 卡片內部光效 */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* 頂部邊框光效 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative z-10">
        {(title || subtitle || headerAction) && (
          <div className="mb-6">
            {(title || headerAction) && (
              <div className="flex items-center justify-between mb-2">
                {title && (
                  <h2 className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
                    {title}
                  </h2>
                )}
                {headerAction && (
                  <div className="flex-shrink-0">
                    {headerAction}
                  </div>
                )}
              </div>
            )}
            {subtitle && (
              <p className="text-sm text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
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

// Set display names for debugging
ResponsiveLayout.displayName = 'ResponsiveLayout';
ResponsiveGrid.displayName = 'ResponsiveGrid';
ResponsiveContainer.displayName = 'ResponsiveContainer';
ResponsiveCard.displayName = 'ResponsiveCard';
ResponsiveStack.displayName = 'ResponsiveStack';

export default ResponsiveLayout; 