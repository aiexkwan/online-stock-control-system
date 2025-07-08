'use client';

import * as React from 'react';
import { toast as sonnerToast } from 'sonner';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const toast = React.useCallback(({ title, description, variant }: Omit<Toast, 'id'>) => {
    if (variant === 'destructive') {
      sonnerToast.error(title || 'Error', {
        description,
      });
    } else {
      sonnerToast.success(title || 'Success', {
        description,
      });
    }
  }, []);

  return { toast };
}
