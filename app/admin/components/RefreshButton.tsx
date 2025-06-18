/**
 * Refresh Button for Admin Dashboard
 * Triggers manual refresh of all widgets
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useAdminRefresh } from '../contexts/AdminRefreshContext';
import { toast } from 'sonner';

interface RefreshButtonProps {
  variant?: 'outline' | 'default' | 'secondary' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function RefreshButton({ variant = 'outline', size = 'sm', className = '' }: RefreshButtonProps) {
  const { triggerRefresh } = useAdminRefresh();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      triggerRefresh();
      toast.success('Dashboard refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh dashboard');
    } finally {
      // Add a small delay to show the animation
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`${className} flex items-center gap-2`}
    >
      <ArrowPathIcon 
        className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
      />
      <span className="hidden sm:inline">Refresh</span>
    </Button>
  );
}