/**
 * Reports Button Component
 * Used to trigger the reports dashboard dialog from any page
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { ReportsDashboardDialog } from './ReportsDashboardDialog';
import { cn } from '@/lib/utils';

interface ReportsButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function ReportsButton({
  variant = 'default',
  size = 'default',
  className,
  showIcon = true,
  children,
}: ReportsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={cn(className)}
        onClick={() => setIsOpen(true)}
      >
        {showIcon && <FileText className='mr-2 h-4 w-4' />}
        {children || 'Reports'}
      </Button>

      <ReportsDashboardDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

/**
 * Reports Icon Button
 * For use in navigation bars or toolbars
 */
export function ReportsIconButton({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant='ghost'
        size='icon'
        className={cn('relative', className)}
        onClick={() => setIsOpen(true)}
        title='Report Center'
      >
        <FileText className='h-5 w-5' />
      </Button>

      <ReportsDashboardDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
