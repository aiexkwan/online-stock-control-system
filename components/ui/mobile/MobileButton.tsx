'use client';

import React from 'react';
import { getMobileButtonClass, handleMobileTap, cn } from '@/lib/mobile-config';

interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function MobileButton({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  className,
  onClick,
  disabled,
  children,
  ...props
}: MobileButtonProps) {
  const handleClick = onClick ? handleMobileTap(onClick as () => void) : undefined;

  return (
    <button
      className={cn(
        getMobileButtonClass(variant, size),
        fullWidth && 'w-full',
        loading && 'opacity-70 cursor-not-allowed',
        className
      )}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}