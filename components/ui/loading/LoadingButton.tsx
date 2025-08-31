/**
 * Unified Loading Button Component
 * 統一嘅按鈕 loading 狀態
 */

'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LoadingButtonProps extends Omit<ButtonProps, 'loading' | 'loadingText'> {
  isLoading?: boolean;
  loadingText?: string;
  children?: React.ReactNode;
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
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  );
};
