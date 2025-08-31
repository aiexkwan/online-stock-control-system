'use client';

import { forwardRef } from 'react';
import type { HTMLAttributes, MouseEvent, ReactNode } from 'react';
import { mobileConfig, cn, handleMobileTap } from '@/lib/mobile-config';

interface MobileCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  interactive?: boolean;
  padding?: boolean;
}

export const MobileCard = forwardRef<HTMLDivElement, MobileCardProps>(
  ({ children, onClick, className, interactive = false, padding = true, ...rest }, ref) => {
    const isClickable = interactive || !!onClick;

    const handleClick = onClick
      ? (event: MouseEvent<HTMLDivElement>) => {
          event.preventDefault();
          const tapHandler = handleMobileTap(onClick);
          tapHandler();
        }
      : undefined;

    return (
      <div
        ref={ref}
        className={cn(
          mobileConfig.components.card.base,
          isClickable && mobileConfig.components.card.interactive,
          padding && mobileConfig.components.card.padding,
          className
        )}
        onClick={handleClick}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : -1}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

MobileCard.displayName = 'MobileCard';
