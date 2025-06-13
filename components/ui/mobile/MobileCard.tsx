'use client';

import React from 'react';
import { mobileConfig, cn, handleMobileTap } from '@/lib/mobile-config';

interface MobileCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  interactive?: boolean;
  padding?: boolean;
}

export function MobileCard({
  children,
  onClick,
  className,
  interactive = false,
  padding = true,
}: MobileCardProps) {
  const isClickable = interactive || !!onClick;
  const handleClick = onClick ? handleMobileTap(onClick) : undefined;

  return (
    <div
      className={cn(
        mobileConfig.components.card.base,
        isClickable && mobileConfig.components.card.interactive,
        padding && mobileConfig.components.card.padding,
        className
      )}
      onClick={handleClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {children}
    </div>
  );
}