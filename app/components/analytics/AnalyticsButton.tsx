/**
 * Analytics Button Component
 * Triggers the Analytics Dashboard Dialog
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';
import { useAnalyticsDashboard } from './useAnalyticsDashboard';

interface AnalyticsButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function AnalyticsButton({
  variant = 'default',
  size = 'default',
  className,
}: AnalyticsButtonProps) {
  const { openDashboard } = useAnalyticsDashboard();

  return (
    <Button variant={variant} size={size} onClick={openDashboard} className={className}>
      <BarChart3 className='mr-2 h-4 w-4' />
      Analytics
    </Button>
  );
}
