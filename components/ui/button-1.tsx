/**
 * GradientButton Component
 * Customizable gradient button with hover effects
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  width?: string;
  height?: string;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'production' | 'warehouse' | 'inventory' | 'update' | 'search';
}

const gradientVariants = {
  default: 'from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700',
  production: 'from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600',
  warehouse: 'from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600',
  inventory: 'from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600',
  update: 'from-gray-400 to-slate-500 hover:from-gray-500 hover:to-slate-600',
  search: 'from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600'
};

const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  onClick,
  width,
  height = '40px',
  disabled = false,
  className,
  variant = 'default'
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative overflow-hidden rounded-lg font-medium text-white shadow-lg transition-all duration-300',
        'transform hover:scale-105 active:scale-95',
        'before:absolute before:inset-0 before:bg-gradient-to-r before:opacity-0 before:transition-opacity before:duration-300',
        'hover:before:opacity-100',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        `bg-gradient-to-r ${gradientVariants[variant]}`,
        className
      )}
      style={{
        width: width || 'auto',
        height: height
      }}
    >
      <span className="relative z-10 px-6 py-2 flex items-center justify-center h-full">
        {children}
      </span>
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 opacity-0 hover:opacity-20 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 animate-shimmer" />
      </div>
    </button>
  );
};

export default GradientButton;

// Also export a styled version for tab buttons
export const TabGradientButton: React.FC<GradientButtonProps & { isActive?: boolean }> = ({
  isActive,
  ...props
}) => {
  return (
    <GradientButton
      {...props}
      className={cn(
        props.className,
        isActive 
          ? 'ring-2 ring-white/20 shadow-xl' 
          : 'opacity-70 hover:opacity-100'
      )}
    />
  );
};