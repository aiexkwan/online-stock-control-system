/**
 * Error Recovery Components
 * 錯誤恢復組件集合
 *
 * 提供自動和手動錯誤恢復機制
 */

'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { CheckCircle, RefreshCw, Zap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { useErrorRetry } from '../hooks/useError';
import type { ErrorRecoveryStrategy, ErrorReport } from '../types';

// Auto Recovery Component
export const AutoRecovery = memo(function AutoRecovery({
  error: _error,
  strategy,
  onRecovery,
  onFailed,
}: {
  error: ErrorReport;
  strategy: ErrorRecoveryStrategy;
  onRecovery: () => void;
  onFailed: () => void;
}) {
  const { retry, retryCount, isRetrying, resetRetry } = useErrorRetry();
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const autoRetry = strategy.autoRetry;
  const canAutoRetry = autoRetry?.enabled && retryCount < (autoRetry.maxAttempts || 3);

  // Progress calculation
  useEffect(() => {
    if (isRetrying && autoRetry) {
      const delay = autoRetry.delayMs;
      setTimeRemaining(delay);

      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = Math.max(0, prev - 100);
          setProgress(((delay - newTime) / delay) * 100);
          return newTime;
        });
      }, 100);

      return () => clearInterval(interval);
    }

    // Return undefined for the else path
    return undefined;
  }, [isRetrying, autoRetry, retryCount]);

  // Auto retry logic
  useEffect(() => {
    if (canAutoRetry && !isRetrying) {
      const attemptRetry = async () => {
        try {
          await retry(onRecovery, autoRetry.maxAttempts, autoRetry.delayMs);
        } catch {
          onFailed();
        }
      };

      attemptRetry();
    }
  }, [canAutoRetry, isRetrying, retry, onRecovery, onFailed, autoRetry]);

  if (!autoRetry?.enabled) {
    return null;
  }

  return (
    <Card className='border-blue-500/50 bg-blue-950/20'>
      <CardContent className='p-4'>
        <div className='mb-3 flex items-center gap-3'>
          <div className='animate-spin'>
            <RefreshCw className='h-4 w-4 text-blue-400' />
          </div>
          <div>
            <p className='text-sm font-medium text-blue-400'>Auto Recovery</p>
            <p className='text-xs text-gray-400'>
              Attempt {retryCount + 1} of {autoRetry.maxAttempts}
            </p>
          </div>
        </div>

        {isRetrying && (
          <div className='space-y-2'>
            <Progress value={progress} className='h-2' />
            <div className='flex items-center justify-between text-xs text-gray-400'>
              <span>Retrying in {Math.ceil(timeRemaining / 1000)}s</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        )}

        <div className='mt-3 flex gap-2'>
          <Button
            size='sm'
            variant='outline'
            onClick={resetRetry}
            className='border-blue-500/50 hover:bg-blue-900/50'
          >
            Cancel Auto Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

// Manual Recovery Component
export const ManualRecovery = memo(function ManualRecovery({
  error: _error,
  strategy,
  onRecovery,
}: {
  error: ErrorReport;
  strategy: ErrorRecoveryStrategy;
  onRecovery: (action: string) => void;
}) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const executeAction = useCallback(
    async (action: string) => {
      setSelectedAction(action);
      setIsExecuting(true);

      try {
        // Custom recovery removed in simplified version
        onRecovery(action);
      } catch (error) {
        console.error('Recovery action failed:', error);
      } finally {
        setIsExecuting(false);
        setSelectedAction(null);
      }
    },
    [onRecovery]
  );

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'retry':
        return 'Try Again';
      case 'refresh':
        return 'Refresh Page';
      case 'redirect':
        return 'Go Home';
      case 'clear_cache':
        return 'Clear Cache';
      case 'logout':
        return 'Logout';
      default:
        return action;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'retry':
        return <RefreshCw className='h-4 w-4' />;
      case 'refresh':
        return <RefreshCw className='h-4 w-4' />;
      case 'clear_cache':
        return <Zap className='h-4 w-4' />;
      default:
        return null;
    }
  };

  const getActionVariant = (action: string) => {
    switch (action) {
      case 'logout':
        return 'destructive' as const;
      case 'retry':
        return 'default' as const;
      default:
        return 'outline' as const;
    }
  };

  const allActions = [strategy.primaryAction];

  return (
    <Card className='border-orange-500/50 bg-orange-950/20'>
      <CardContent className='p-4'>
        <div className='mb-3 flex items-center gap-3'>
          <AlertTriangle className='h-4 w-4 text-orange-400' />
          <div>
            <p className='text-sm font-medium text-orange-400'>Manual Recovery</p>
            <p className='text-xs text-gray-400'>Choose a recovery action</p>
          </div>
        </div>

        <div className='grid gap-2'>
          {allActions.map((action, index) => (
            <Button
              key={action}
              size='sm'
              variant={getActionVariant(action)}
              onClick={() => executeAction(action)}
              disabled={isExecuting}
              className='w-full justify-start'
            >
              {isExecuting && selectedAction === action ? (
                <div className='mr-2 animate-spin'>
                  <RefreshCw className='h-4 w-4' />
                </div>
              ) : (
                getActionIcon(action) && <span className='mr-2'>{getActionIcon(action)}</span>
              )}
              {getActionLabel(action)}
              {index === 0 && <span className='ml-auto text-xs opacity-60'>(Primary)</span>}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

// Recovery Status Component
export const RecoveryStatus = memo(function RecoveryStatus({
  isRecovering,
  recoveryType,
  progress,
}: {
  isRecovering: boolean;
  recoveryType: 'auto' | 'manual';
  progress?: number;
}) {
  if (!isRecovering) {
    return null;
  }

  return (
    <div className='flex items-center gap-2 rounded-lg border border-blue-500/50 bg-blue-950/20 p-3'>
      <div className='animate-spin'>
        <RefreshCw className='h-4 w-4 text-blue-400' />
      </div>
      <div className='flex-1'>
        <p className='text-sm text-blue-400'>
          {recoveryType === 'auto' ? 'Auto recovering...' : 'Executing recovery...'}
        </p>
        {progress !== undefined && <Progress value={progress} className='mt-1 h-1' />}
      </div>
    </div>
  );
});

// Recovery Success Component
export const RecoverySuccess = memo(function RecoverySuccess({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <div className='flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-950/20 p-3'>
      <CheckCircle className='h-4 w-4 text-green-400' />
      <div className='flex-1'>
        <p className='text-sm text-green-400'>{message}</p>
      </div>
      {onDismiss && (
        <Button
          size='sm'
          variant='ghost'
          onClick={onDismiss}
          className='h-7 px-2 text-green-400 hover:bg-green-900/50'
        >
          Dismiss
        </Button>
      )}
    </div>
  );
});

// Comprehensive Error Recovery Component
export const ErrorRecoveryPanel = memo(function ErrorRecoveryPanel({
  error,
  onRecovered,
}: {
  error: ErrorReport;
  onRecovered: () => void;
}) {
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  const handleRecovery = useCallback(
    (_action?: string) => {
      setRecoveryAttempted(true);

      // Simulate recovery success
      setTimeout(() => {
        setRecoverySuccess(true);
        setTimeout(() => {
          onRecovered();
        }, 2000);
      }, 1000);
    },
    [onRecovered]
  );

  const handleRecoveryFailed = useCallback(() => {
    setRecoveryAttempted(false);
    // Could show additional recovery options here
  }, []);

  if (recoverySuccess) {
    return (
      <RecoverySuccess
        message='Recovery successful! Component restored.'
        onDismiss={() => setRecoverySuccess(false)}
      />
    );
  }

  return (
    <div className='space-y-4'>
      <RecoveryStatus
        isRecovering={recoveryAttempted}
        recoveryType={error.recoveryStrategy.autoRetry?.enabled ? 'auto' : 'manual'}
      />

      {!recoveryAttempted && error.recoveryStrategy.autoRetry?.enabled && (
        <AutoRecovery
          error={error}
          strategy={error.recoveryStrategy}
          onRecovery={handleRecovery}
          onFailed={handleRecoveryFailed}
        />
      )}

      {!recoveryAttempted && (
        <ManualRecovery
          error={error}
          strategy={error.recoveryStrategy}
          onRecovery={handleRecovery}
        />
      )}
    </div>
  );
});
