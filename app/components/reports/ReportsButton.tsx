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

/**
 * Props for the ReportsButton component
 *
 * @interface ReportsButtonProps
 * @property {string} variant - Button variant style
 * @property {string} size - Button size variant
 * @property {string} className - Additional CSS classes
 * @property {boolean} showIcon - Whether to show the file text icon
 * @property {React.ReactNode} children - Button content
 */
interface ReportsButtonProps {
  readonly variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  readonly size?: 'default' | 'sm' | 'lg' | 'icon';
  readonly className?: string;
  readonly showIcon?: boolean;
  readonly children?: React.ReactNode;
}

/**
 * Reports Button Component
 *
 * @param {ReportsButtonProps} props - Component props
 * @returns {JSX.Element} Rendered reports button with dialog
 */
export function ReportsButton({
  variant = 'default',
  size = 'default',
  className,
  showIcon = true,
  children,
}: ReportsButtonProps): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);

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
 * Props for the ReportsIconButton component
 *
 * @interface ReportsIconButtonProps
 * @property {string} className - Additional CSS classes
 */
interface ReportsIconButtonProps {
  readonly className?: string;
}

/**
 * Reports Icon Button
 * For use in navigation bars or toolbars
 *
 * @param {ReportsIconButtonProps} props - Component props
 * @returns {JSX.Element} Rendered icon-only reports button with dialog
 */
export function ReportsIconButton({ className }: ReportsIconButtonProps): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);

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
