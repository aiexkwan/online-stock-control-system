/**
 * TabButton Component
 * Navigation tab button using GradientButton
 */

'use client';

import React from 'react';
import { TabGradientButton } from '@/components/ui/button-1';
import { cn } from '@/lib/utils';

interface TabButtonProps {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  isActive: boolean;
  onClick: () => void;
  variant: 'production' | 'warehouse' | 'inventory' | 'update' | 'search';
}

export function TabButton({
  id,
  name,
  icon: Icon,
  isActive,
  onClick,
  variant
}: TabButtonProps) {
  return (
    <TabGradientButton
      onClick={onClick}
      variant={variant}
      isActive={isActive}
      width="100%"
      height="48px"
      className={cn(
        'justify-start',
        'transition-all duration-300',
        isActive && 'shadow-2xl'
      )}
    >
      <div className="flex items-center gap-3 w-full px-2">
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="font-medium text-sm">{name}</span>
      </div>
    </TabGradientButton>
  );
}