'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface OperationalWrapperProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'card' | 'section' | 'highlight';
  glow?: boolean;
  title?: string;
  titleIcon?: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * Unified wrapper component for operational pages
 * Provides consistent border styling without affecting layout
 */
export function OperationalWrapper({
  children,
  className,
  variant = 'default',
  glow = false,
  title,
  titleIcon,
  actions
}: OperationalWrapperProps) {
  // If only applying border style to existing Card components
  if (!title && !actions) {
    // Return children with just border classes applied
    return (
      <div className={cn(
        'operational-border',
        `operational-${variant}`,
        glow && 'operational-glow',
        className
      )}>
        {children}
      </div>
    );
  }

  // Full wrapper mode (only when title/actions are provided)
  const borderStyles = {
    default: 'border-slate-700/50',
    card: 'border-slate-700/50',
    section: 'border-slate-600/30',
    highlight: 'border-blue-500/30'
  };

  const backgroundStyles = {
    default: 'bg-slate-800/50',
    card: 'bg-slate-800/50',
    section: 'bg-slate-700/30',
    highlight: 'bg-slate-800/70'
  };

  const glowStyles = glow ? 'shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20' : '';

  return (
    <div
      className={cn(
        'relative rounded-xl border backdrop-blur-sm transition-all duration-300',
        borderStyles[variant],
        backgroundStyles[variant],
        glowStyles,
        className
      )}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-slate-700/30 px-6 py-4">
          {title && (
            <div className="flex items-center gap-2 text-slate-200">
              {titleIcon}
              <h3 className="text-lg font-semibold">{title}</h3>
            </div>
          )}
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}

      <div className="relative">
        {children}
      </div>

      {variant === 'highlight' && (
        <>
          <div className="absolute top-0 left-0 h-8 w-8 border-l-2 border-t-2 border-blue-500/50 rounded-tl-xl" />
          <div className="absolute bottom-0 right-0 h-8 w-8 border-r-2 border-b-2 border-blue-500/50 rounded-br-xl" />
        </>
      )}
    </div>
  );
}

/**
 * Specialized wrapper for grid-based operational layouts
 */
export function OperationalGrid({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      'grid gap-4 lg:gap-6',
      className
    )}>
      {children}
    </div>
  );
}