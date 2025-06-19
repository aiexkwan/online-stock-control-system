'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { PencilSquareIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EditDashboardButtonProps {
  isEditMode: boolean;
  onToggleEdit: () => void;
  onSaveChanges?: () => void;
  onCancelEdit?: () => void;
  onResetLayout: () => void;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function EditDashboardButton({
  isEditMode,
  onToggleEdit,
  onSaveChanges,
  onCancelEdit,
  onResetLayout,
  variant = 'outline',
  size = 'sm',
  className = ''
}: EditDashboardButtonProps) {
  if (isEditMode) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={variant} 
            size={size}
            className={`bg-orange-500/20 border-orange-400/50 hover:bg-orange-500/30 hover:border-orange-400/70 text-orange-300 hover:text-orange-200 ${className}`}
          >
            <CheckIcon className="w-4 h-4 mr-2" />
            Done Editing
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
          <DropdownMenuItem 
            onClick={onSaveChanges || onToggleEdit}
            className="text-white hover:bg-slate-700 cursor-pointer"
          >
            <CheckIcon className="w-4 h-4 mr-2" />
            Save Changes
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={onCancelEdit || onToggleEdit}
            className="text-orange-400 hover:bg-slate-700 cursor-pointer"
          >
            <XMarkIcon className="w-4 h-4 mr-2" />
            Cancel Editing
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={onResetLayout}
            className="text-red-400 hover:bg-slate-700 cursor-pointer"
          >
            <XMarkIcon className="w-4 h-4 mr-2" />
            Reset to Default
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button 
      onClick={onToggleEdit} 
      variant={variant} 
      size={size}
      className={className}
    >
      <PencilSquareIcon className="w-4 h-4 mr-2" />
      Edit Dashboard
    </Button>
  );
}