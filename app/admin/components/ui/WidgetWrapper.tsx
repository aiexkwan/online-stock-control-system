/**
 * WidgetWrapper Component
 * Standard wrapper for all dashboard widgets
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { THEME } from '../../config/theme';
import { GlowCard } from './GlowCard';

interface WidgetWrapperProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  theme?: keyof typeof THEME.colors.tabs;
  padding?: boolean;
  animationDelay?: number;
  disableGlow?: boolean;
}

export function WidgetWrapper({
  children,
  className,
  title,
  subtitle,
  headerAction,
  theme,
  padding = true,
  animationDelay = 0,
  disableGlow = false
}: WidgetWrapperProps) {
  return (
    <GlowCard
      theme={theme}
      animationDelay={animationDelay}
      disableGlow={disableGlow}
      className="w-full h-full"
    >
      <div
        className={cn(
          'widget-wrapper',
          'w-full h-full',
          'bg-[#18181C]',
          'border border-[#23232A]/40',
          'rounded-2xl',
          'shadow-xl shadow-black/20',
          'outline outline-[1.5px] outline-[rgba(100,112,140,0.10)]',
          'overflow-hidden',
          'flex flex-col',
          className
        )}
      >
        {/* Widget Header */}
        {(title || headerAction) && (
          <div className="widget-header px-4 py-3 border-b border-[#23232A]/30 flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-sm font-medium text-[#EAEAEA]">{title}</h3>
              )}
              {subtitle && (
                <p className="text-xs text-[#8E8EA0] mt-0.5">{subtitle}</p>
              )}
            </div>
            {headerAction && (
              <div className="flex items-center gap-2">
                {headerAction}
              </div>
            )}
          </div>
        )}
        
        {/* Widget Content */}
        <div className={cn(
          'widget-content flex-1',
          padding && 'p-4'
        )}>
          {children}
        </div>
      </div>
      
      {/* Inner border subtle effect */}
      <style jsx>{`
        .widget-wrapper {
          position: relative;
        }
        
        .widget-wrapper::after {
          content: '';
          position: absolute;
          inset: 1px;
          border-radius: calc(1rem - 1px);
          border: 1px solid rgba(120, 130, 150, 0.09);
          pointer-events: none;
        }
        
        .widget-header {
          background: rgba(35, 35, 42, 0.3);
          backdrop-filter: blur(10px);
        }
      `}</style>
    </GlowCard>
  );
}