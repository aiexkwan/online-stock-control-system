/**
 * Error Notification Manager
 * 錯誤通知管理器
 *
 * 統一管理錯誤通知顯示、Toast、對話框和橫幅
 */

'use client';

import React, { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useError } from '../ErrorContext';
import { AlertTriangle, AlertCircle, Info, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ErrorReport, ErrorSeverity, ErrorNotificationType } from '../types';

// Notification Configuration
const NOTIFICATION_CONFIG = {
  critical: {
    duration: 0, // Persistent
    showRecovery: true,
    icon: AlertTriangle,
    className: 'border-red-500 bg-red-950 text-red-100',
  },
  high: {
    duration: 8000,
    showRecovery: true,
    icon: AlertCircle,
    className: 'border-orange-500 bg-orange-950 text-orange-100',
  },
  medium: {
    duration: 5000,
    showRecovery: false,
    icon: AlertTriangle,
    className: 'border-yellow-500 bg-yellow-950 text-yellow-100',
  },
  low: {
    duration: 3000,
    showRecovery: false,
    icon: Info,
    className: 'border-blue-500 bg-blue-950 text-blue-100',
  },
} as const;

// Toast Error Component
function ToastErrorContent({
  error,
  onRetry,
  onDismiss,
}: {
  error: ErrorReport;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  const config = NOTIFICATION_CONFIG[error.severity];
  const Icon = config.icon;

  return (
    <div className='flex items-start gap-3 p-1'>
      <Icon className='mt-1 h-5 w-5 flex-shrink-0' />
      <div className='min-w-0 flex-1'>
        <p className='text-sm font-medium'>{error.userMessage}</p>
        {error.context.component && (
          <p className='mt-1 text-xs opacity-80'>in {error.context.component}</p>
        )}
        {config.showRecovery && onRetry && (
          <div className='mt-2 flex gap-2'>
            <Button size='sm' variant='secondary' onClick={onRetry} className='h-6 px-2 text-xs'>
              Retry
            </Button>
          </div>
        )}
      </div>
      {onDismiss && (
        <Button size='sm' variant='ghost' onClick={onDismiss} className='h-6 w-6 flex-shrink-0 p-0'>
          <X className='h-4 w-4' />
        </Button>
      )}
    </div>
  );
}

// Toast Success Component
function ToastSuccessContent({ message, description }: { message: string; description?: string }) {
  return (
    <div className='flex items-start gap-3 p-1'>
      <CheckCircle className='mt-1 h-5 w-5 flex-shrink-0 text-green-500' />
      <div className='min-w-0 flex-1'>
        <p className='text-sm font-medium'>{message}</p>
        {description && <p className='mt-1 text-xs opacity-80'>{description}</p>}
      </div>
    </div>
  );
}

// Banner Notification Component
function BannerNotification({
  errors,
  onDismiss,
  onRetryAll,
}: {
  errors: ErrorReport[];
  onDismiss: () => void;
  onRetryAll: () => void;
}) {
  const criticalErrors = errors.filter(e => e.severity === 'critical');
  const highErrors = errors.filter(e => e.severity === 'high');

  if (errors.length === 0) return null;

  const severity =
    criticalErrors.length > 0 ? 'critical' : highErrors.length > 0 ? 'high' : 'medium';
  const config = NOTIFICATION_CONFIG[severity];
  const Icon = config.icon;

  return (
    <div className={`fixed left-0 right-0 top-0 z-50 ${config.className} border-b`}>
      <div className='container mx-auto px-4 py-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Icon className='h-5 w-5 flex-shrink-0' />
            <div>
              <p className='font-medium'>
                {criticalErrors.length > 0
                  ? `${criticalErrors.length} critical error${criticalErrors.length > 1 ? 's' : ''} occurred`
                  : `${errors.length} error${errors.length > 1 ? 's' : ''} occurred`}
              </p>
              <p className='text-sm opacity-80'>Some features may not work properly</p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Button size='sm' variant='secondary' onClick={onRetryAll} className='h-8 px-3'>
              Retry All
            </Button>
            <Button size='sm' variant='ghost' onClick={onDismiss} className='h-8 w-8 p-0'>
              <X className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Error Notification Manager
export function ErrorNotificationManager() {
  const { errorState, resolveError, clearAllErrors } = useError();

  // Get unresolved errors
  const unresolvedErrors = useMemo(() => {
    return Array.from(errorState.errors.values()).filter(error => !error.resolved);
  }, [errorState.errors]);

  // Track displayed notifications to avoid duplicates
  const [displayedToasts, setDisplayedToasts] = React.useState(new Set<string>());
  const [showBanner, setShowBanner] = React.useState(false);

  // Handle toast notifications
  useEffect(() => {
    unresolvedErrors.forEach(error => {
      // Skip if already displayed
      if (displayedToasts.has(error.id)) return;

      const config = NOTIFICATION_CONFIG[error.severity];

      // Show toast for non-banner notifications
      if (error.severity !== 'critical') {
        const toastId = toast.custom(
          t => (
            <ToastErrorContent
              error={error}
              onRetry={() => {
                // Trigger retry logic here
                toast.dismiss(t);
                setDisplayedToasts(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(error.id);
                  return newSet;
                });
              }}
              onDismiss={() => {
                toast.dismiss(t);
                resolveError(error.id);
              }}
            />
          ),
          {
            duration: config.duration,
            className: config.className,
            position: 'top-right',
          }
        );

        // Mark as displayed
        setDisplayedToasts(prev => new Set(prev).add(error.id));

        // Auto-resolve after duration if not persistent
        if (config.duration > 0) {
          setTimeout(() => {
            resolveError(error.id);
          }, config.duration);
        }
      }
    });
  }, [unresolvedErrors, displayedToasts, resolveError]);

  // Handle banner for critical errors
  useEffect(() => {
    const criticalErrors = unresolvedErrors.filter(e => e.severity === 'critical');
    setShowBanner(criticalErrors.length > 0);
  }, [unresolvedErrors]);

  // Handle success notifications
  const handleSuccessNotification = React.useCallback((message: string, description?: string) => {
    toast.custom(() => <ToastSuccessContent message={message} description={description} />, {
      duration: 3000,
      className: 'border-green-500 bg-green-950 text-green-100',
      position: 'top-right',
    });
  }, []);

  // Handle warning notifications
  const handleWarningNotification = React.useCallback((message: string, description?: string) => {
    toast.custom(
      () => (
        <div className='flex items-start gap-3 p-1'>
          <AlertTriangle className='mt-1 h-5 w-5 flex-shrink-0 text-yellow-500' />
          <div className='min-w-0 flex-1'>
            <p className='text-sm font-medium'>{message}</p>
            {description && <p className='mt-1 text-xs opacity-80'>{description}</p>}
          </div>
        </div>
      ),
      {
        duration: 4000,
        className: 'border-yellow-500 bg-yellow-950 text-yellow-100',
        position: 'top-right',
      }
    );
  }, []);

  // Handle info notifications
  const handleInfoNotification = React.useCallback((message: string, description?: string) => {
    toast.custom(
      () => (
        <div className='flex items-start gap-3 p-1'>
          <Info className='mt-1 h-5 w-5 flex-shrink-0 text-blue-500' />
          <div className='min-w-0 flex-1'>
            <p className='text-sm font-medium'>{message}</p>
            {description && <p className='mt-1 text-xs opacity-80'>{description}</p>}
          </div>
        </div>
      ),
      {
        duration: 3000,
        className: 'border-blue-500 bg-blue-950 text-blue-100',
        position: 'top-right',
      }
    );
  }, []);

  // Retry all errors
  const handleRetryAll = React.useCallback(() => {
    // This would trigger retry logic for all errors
    setDisplayedToasts(new Set());
    setShowBanner(false);
    window.location.reload(); // Simple retry for now
  }, []);

  // Dismiss banner
  const handleDismissBanner = React.useCallback(() => {
    setShowBanner(false);
    // Resolve all critical errors
    unresolvedErrors
      .filter(e => e.severity === 'critical')
      .forEach(error => resolveError(error.id));
  }, [unresolvedErrors, resolveError]);

  return (
    <>
      {/* Banner for critical errors */}
      {showBanner && (
        <BannerNotification
          errors={unresolvedErrors.filter(e => e.severity === 'critical')}
          onDismiss={handleDismissBanner}
          onRetryAll={handleRetryAll}
        />
      )}
    </>
  );
}

// Export notification helpers
export const errorNotifications = {
  success: (message: string, description?: string) => {
    toast.custom(() => <ToastSuccessContent message={message} description={description} />, {
      duration: 3000,
      className: 'border-green-500 bg-green-950 text-green-100',
    });
  },

  warning: (message: string, description?: string) => {
    toast.custom(
      () => (
        <div className='flex items-start gap-3 p-1'>
          <AlertTriangle className='mt-1 h-5 w-5 flex-shrink-0 text-yellow-500' />
          <div className='min-w-0 flex-1'>
            <p className='text-sm font-medium'>{message}</p>
            {description && <p className='mt-1 text-xs opacity-80'>{description}</p>}
          </div>
        </div>
      ),
      {
        duration: 4000,
        className: 'border-yellow-500 bg-yellow-950 text-yellow-100',
      }
    );
  },

  info: (message: string, description?: string) => {
    toast.custom(
      () => (
        <div className='flex items-start gap-3 p-1'>
          <Info className='mt-1 h-5 w-5 flex-shrink-0 text-blue-500' />
          <div className='min-w-0 flex-1'>
            <p className='text-sm font-medium'>{message}</p>
            {description && <p className='mt-1 text-xs opacity-80'>{description}</p>}
          </div>
        </div>
      ),
      {
        duration: 3000,
        className: 'border-blue-500 bg-blue-950 text-blue-100',
      }
    );
  },
};
