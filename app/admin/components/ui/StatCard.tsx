/**
 * StatCard Component
 * Compact statistical display card for 1×1 grid size
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { THEME } from '../../config/theme';
import { WidgetWrapper } from './WidgetWrapper';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  compareText?: string;
  theme?: keyof typeof THEME.colors.tabs;
  animationDelay?: number;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  compareText,
  theme,
  animationDelay = 0,
  className
}: StatCardProps) {
  const themeColors = theme ? THEME.colors.tabs[theme] : null;
  
  return (
    <WidgetWrapper
      theme={theme}
      animationDelay={animationDelay}
      padding={false}
      className={cn('stat-card', className)}
    >
      <div className="p-4 h-full flex flex-col">
        {/* Header with icon */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xs font-medium text-[#8E8EA0] uppercase tracking-wider">
              {title}
            </h3>
          </div>
          {icon && (
            <div 
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                themeColors 
                  ? `bg-gradient-to-br from-[${themeColors.primary}] to-[${themeColors.secondary}]`
                  : "bg-[#22222A]"
              )}
              style={themeColors ? {
                background: `linear-gradient(135deg, ${themeColors.primary}20, ${themeColors.secondary}20)`
              } : undefined}
            >
              <div className="w-5 h-5 text-[#EAEAEA]">
                {icon}
              </div>
            </div>
          )}
        </div>
        
        {/* Main value */}
        <div className="flex-1 flex flex-col justify-center">
          <motion.div
            className="text-2xl font-bold text-[#EAEAEA] tracking-tight"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              delay: animationDelay + 0.2,
              type: "spring",
              stiffness: 200
            }}
          >
            {value}
          </motion.div>
          
          {subtitle && (
            <p className="text-xs text-[#8E8EA0] mt-1">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Footer with trend or compare text */}
        {(trend || compareText) && (
          <div className="mt-3 pt-3 border-t border-[#23232A]/30">
            {trend && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8E8EA0]">
                  {compareText || 'vs yesterday'}
                </span>
                <div className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  trend.isPositive ? "text-green-400" : "text-red-400"
                )}>
                  <span className="text-sm">
                    {trend.isPositive ? "↑" : "↓"}
                  </span>
                  <span>{Math.abs(trend.value)}%</span>
                </div>
              </div>
            )}
            {!trend && compareText && (
              <p className="text-xs text-[#8E8EA0] text-center">
                {compareText}
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Gradient overlay for themed cards */}
      {themeColors && (
        <style jsx>{`
          .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(
              90deg,
              transparent,
              ${themeColors.primary},
              ${themeColors.secondary},
              transparent
            );
            opacity: 0.6;
          }
        `}</style>
      )}
    </WidgetWrapper>
  );
}