/**
 * Unified Loading Button Component
 * 統一嘅按鈕 loading 狀態
 */

'use client';

import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading = false,
  loadingText,
  children,
  disabled,
  className,
  ...props
}) => {
  return (
    <Button disabled={isLoading || disabled} className={cn(className)} {...props}>
      {isLoading ? (
        <>
          <div className='mr-2 h-1 w-4 bg-current rounded-full opacity-75' />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  );
};
