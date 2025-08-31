'use client';

import * as React from 'react';
import { toast as sonnerToast, type ExternalToast } from 'sonner';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'success' | 'info' | 'warning' | 'error' | 'loading';
}

export type ToastInput = Omit<Toast, 'id'>;

export interface UseToastReturn {
  toast: (input: ToastInput) => string | number;
}

export function useToast(): UseToastReturn {
  const toast = React.useCallback(
    ({ title, description, variant = 'default', action }: ToastInput): string | number => {
      const toastOptions: ExternalToast = {
        description,
        action,
      };

      const message =
        title || (variant === 'destructive' || variant === 'error' ? 'Error' : 'Success');

      switch (variant) {
        case 'destructive':
        case 'error':
          return sonnerToast.error(message, toastOptions);
        case 'success':
          return sonnerToast.success(message, toastOptions);
        case 'info':
          return sonnerToast.info(message, toastOptions);
        case 'warning':
          return sonnerToast.warning(message, toastOptions);
        case 'loading':
          return sonnerToast.loading(message, toastOptions);
        case 'default':
        default:
          return sonnerToast(message, toastOptions);
      }
    },
    []
  );

  return { toast };
}
