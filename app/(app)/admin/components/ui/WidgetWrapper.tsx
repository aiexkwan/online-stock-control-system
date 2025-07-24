/**
 * WidgetWrapper Component
 * Standard wrapper for all dashboard widgets
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { THEME } from '../../config/theme';
import { SpotlightCard } from './SpotlightCard';

interface WidgetWrapperProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  theme?: keyof typeof THEME.colors.tabs;
  padding?: boolean;
  animationDelay?: number;
  disableSpotlight?: boolean;
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
  disableSpotlight = false,
}: WidgetWrapperProps) {
  return (
    <SpotlightCard
      theme={theme}
      animationDelay={animationDelay}
      disableSpotlight={disableSpotlight}
      className='h-full w-full'
    >
      <div
        className={cn(
          'widget-wrapper',
          'h-full w-full',
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
          <div className='widget-header flex items-center justify-between border-b border-[#23232A]/30 px-4 py-3'>
            <div>
              {title && <h3 className='text-sm font-medium text-[#ffffff]'>{title}</h3>}
              {subtitle && <p className='mt-0.5 text-xs text-[#8E8EA0]'>{subtitle}</p>}
            </div>
            {headerAction && <div className='flex items-center gap-2'>{headerAction}</div>}
          </div>
        )}

        {/* Widget Content */}
        <div className={cn('widget-content flex-1', padding && 'p-4')}>{children}</div>
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
    </SpotlightCard>
  );
}
