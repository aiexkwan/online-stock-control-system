'use client';

import React from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Wifi,
  Shield,
  Database,
  Package,
  RotateCcw,
  ArrowLeftRight,
  Loader2,
} from 'lucide-react';
import { OperationCard } from '@/lib/card-system/EnhancedGlassmorphicCard';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getCardTheme, cardTextStyles, cardStatusColors } from '@/lib/card-system/theme';
import { cn } from '@/lib/utils';

// Types for error severity and categories
type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';
type ErrorCategory = 'network' | 'auth' | 'validation' | 'business' | 'system' | 'unknown';

interface StockTransferError extends Error {
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  code?: string;
  recoverable?: boolean;
  userMessage?: string;
}

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: StockTransferError;
  isRecovering: boolean;
  retryCount: number;
}

// Error analysis utility
const analyzeError = (error: Error): StockTransferError => {
  const message = error.message.toLowerCase();

  // Network errors
  if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
    return {
      ...error,
      category: 'network',
      severity: 'medium',
      code: 'NETWORK_ERROR',
      recoverable: true,
      userMessage: 'Network connection issue. Please check your connection and try again.',
    };
  }

  // Authentication errors
  if (
    message.includes('unauthorized') ||
    message.includes('clock number') ||
    message.includes('permission')
  ) {
    return {
      ...error,
      category: 'auth',
      severity: 'high',
      code: 'AUTH_ERROR',
      recoverable: true,
      userMessage: 'Authentication failed. Please verify your clock number.',
    };
  }

  // Validation errors
  if (message.includes('invalid') || message.includes('not found') || message.includes('pallet')) {
    return {
      ...error,
      category: 'validation',
      severity: 'medium',
      code: 'VALIDATION_ERROR',
      recoverable: true,
      userMessage: 'Invalid input detected. Please check the pallet number and try again.',
    };
  }

  // Business logic errors
  if (
    message.includes('voided') ||
    message.includes('already at location') ||
    message.includes('illegal')
  ) {
    return {
      ...error,
      category: 'business',
      severity: 'low',
      code: 'BUSINESS_ERROR',
      recoverable: true,
      userMessage: 'Transfer not allowed due to business rules.',
    };
  }

  // System errors
  if (message.includes('memory') || message.includes('system') || message.includes('crash')) {
    return {
      ...error,
      category: 'system',
      severity: 'critical',
      code: 'SYSTEM_ERROR',
      recoverable: false,
      userMessage: 'System error occurred. Please contact IT support.',
    };
  }

  // Default unknown error
  return {
    ...error,
    category: 'unknown',
    severity: 'high',
    code: 'UNKNOWN_ERROR',
    recoverable: true,
    userMessage: 'An unexpected error occurred. Please try again.',
  };
};

// Error theme configuration
const getErrorTheme = (category: ErrorCategory, severity: ErrorSeverity) => {
  const baseThemes = {
    critical: {
      bg: 'bg-red-950/20',
      border: 'border-red-500/50',
      text: 'text-red-400',
      glow: 'shadow-lg shadow-red-500/20',
      button: 'bg-red-600 hover:bg-red-700 border-red-500',
      icon: 'text-red-500',
    },
    high: {
      bg: 'bg-orange-950/20',
      border: 'border-orange-500/50',
      text: 'text-orange-400',
      glow: 'shadow-lg shadow-orange-500/20',
      button: 'bg-orange-600 hover:bg-orange-700 border-orange-500',
      icon: 'text-orange-500',
    },
    medium: {
      bg: 'bg-yellow-950/20',
      border: 'border-yellow-500/50',
      text: 'text-yellow-400',
      glow: 'shadow-lg shadow-yellow-500/20',
      button: 'bg-yellow-600 hover:bg-yellow-700 border-yellow-500',
      icon: 'text-yellow-500',
    },
    low: {
      bg: 'bg-blue-950/20',
      border: 'border-blue-500/50',
      text: 'text-blue-400',
      glow: 'shadow-lg shadow-blue-500/20',
      button: 'bg-blue-600 hover:bg-blue-700 border-blue-500',
      icon: 'text-blue-500',
    },
  };

  return baseThemes[severity] || baseThemes.medium;
};

// Get category icon
const getCategoryIcon = (category: ErrorCategory) => {
  switch (category) {
    case 'network':
      return Wifi;
    case 'auth':
      return Shield;
    case 'validation':
      return Package;
    case 'business':
      return AlertTriangle;
    case 'system':
      return Database;
    default:
      return AlertTriangle;
  }
};

// Loading skeleton component
const ErrorLoadingSkeleton: React.FC = () => {
  return (
    <div className='h-full'>
      <OperationCard
        variant='glass'
        isHoverable={false}
        borderGlow={false}
        className='h-full border-slate-700/50'
        padding='small'
      >
        <div className='flex h-full animate-pulse flex-col'>
          {/* Header skeleton */}
          <div className='border-b border-slate-700/50 bg-slate-800/50 p-4'>
            <div className='flex items-center gap-2'>
              <div className='h-6 w-6 rounded bg-slate-700/50'></div>
              <div className='h-6 w-32 rounded bg-slate-700/50'></div>
            </div>
            <div className='mt-2 h-4 w-48 rounded bg-slate-700/50'></div>
          </div>

          {/* Content skeleton */}
          <div className='flex-1 space-y-4 p-4'>
            <div className='space-y-3'>
              <div className='h-4 w-24 rounded bg-slate-700/50'></div>
              <div className='h-20 w-full rounded bg-slate-700/50'></div>
            </div>
            <div className='space-y-2'>
              <div className='h-10 w-full rounded bg-slate-700/50'></div>
              <div className='h-10 w-32 rounded bg-slate-700/50'></div>
            </div>
          </div>
        </div>
      </OperationCard>
    </div>
  );
};

// Main error UI component
const StockTransferErrorUI: React.FC<{
  error: StockTransferError;
  onRetry: () => void;
  onReset: () => void;
  onGoHome: () => void;
  isRecovering: boolean;
  retryCount: number;
}> = ({ error, onRetry, onReset, onGoHome, isRecovering, retryCount }) => {
  const theme = getErrorTheme(error.category || 'unknown', error.severity || 'medium');
  const IconComponent = getCategoryIcon(error.category || 'unknown');

  // Get user-friendly title based on category and severity
  const getErrorTitle = () => {
    if (error.severity === 'critical') return 'Critical System Error';
    if (error.category === 'network') return 'Connection Problem';
    if (error.category === 'auth') return 'Authentication Required';
    if (error.category === 'validation') return 'Input Validation Error';
    if (error.category === 'business') return 'Transfer Validation';
    return 'Stock Transfer Error';
  };

  // Show recovery loading state
  if (isRecovering) {
    return (
      <div className='h-full'>
        <OperationCard
          variant='glass'
          isHoverable={false}
          borderGlow={false}
          className={`h-full ${theme.border} ${theme.glow}`}
          padding='small'
        >
          <div className='flex h-full flex-col'>
            {/* Header */}
            <div
              className={`border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-700 p-4`}
            >
              <div className='flex items-center gap-2'>
                <Loader2 className='h-6 w-6 animate-spin text-blue-400' />
                <h2 className={cn('text-xl', cardTextStyles.title)}>Recovering...</h2>
              </div>
              <p className='text-sm text-slate-300'>
                Attempting to restore stock transfer functionality
              </p>
            </div>

            {/* Recovery content */}
            <div className='flex flex-1 items-center justify-center p-6'>
              <div className='space-y-4 text-center'>
                <div className='flex justify-center'>
                  <div className='relative'>
                    <div className='h-16 w-16 rounded-full border-4 border-blue-500/30'></div>
                    <div className='absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent'></div>
                  </div>
                </div>
                <div>
                  <p className='text-lg font-medium text-white'>Please wait...</p>
                  <p className='text-sm text-slate-400'>
                    {retryCount > 0 && `Retry attempt ${retryCount}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </OperationCard>
      </div>
    );
  }

  return (
    <div className='h-full'>
      <OperationCard
        variant='glass'
        isHoverable={false}
        borderGlow={false}
        className={`h-full ${theme.border} ${theme.glow}`}
        padding='small'
      >
        <div className='flex h-full flex-col'>
          {/* Error Header */}
          <div className={`border-b ${theme.border} p-4 ${theme.bg}`}>
            <div className='flex items-center gap-3'>
              <div className={`rounded-full p-2 ${theme.bg}`}>
                <IconComponent className={`h-6 w-6 ${theme.icon}`} />
              </div>
              <div>
                <h2 className={cn('text-xl font-semibold', theme.text)}>{getErrorTitle()}</h2>
                <p className='text-sm text-slate-300'>Stock transfer functionality affected</p>
              </div>
            </div>
          </div>

          {/* Error Content */}
          <div className='flex-1 space-y-4 p-4'>
            {/* User Message */}
            <Alert className={`${theme.border} ${theme.bg}`}>
              <AlertTriangle className={`h-4 w-4 ${theme.icon}`} />
              <AlertDescription className={`${theme.text} font-medium`}>
                {error.userMessage || error.message}
              </AlertDescription>
            </Alert>

            {/* Error Details */}
            <div className='space-y-3'>
              <div className='grid grid-cols-2 gap-2 text-sm'>
                <div className='space-y-1'>
                  <span className='text-slate-500'>Error Code:</span>
                  <span className={`block font-mono ${theme.text}`}>{error.code || 'UNKNOWN'}</span>
                </div>
                <div className='space-y-1'>
                  <span className='text-slate-500'>Severity:</span>
                  <span className={`block font-medium ${theme.text} capitalize`}>
                    {error.severity || 'Unknown'}
                  </span>
                </div>
                <div className='space-y-1'>
                  <span className='text-slate-500'>Category:</span>
                  <span className='block capitalize text-white'>{error.category || 'Unknown'}</span>
                </div>
                <div className='space-y-1'>
                  <span className='text-slate-500'>Recoverable:</span>
                  <span
                    className={`block ${error.recoverable ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {error.recoverable ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {/* Retry information */}
              {retryCount > 0 && (
                <div className='rounded bg-slate-900/50 p-2 text-xs text-slate-400'>
                  Previous retry attempts: {retryCount}
                </div>
              )}
            </div>

            {/* Development details */}
            {process.env.NODE_ENV === 'development' && (
              <details className='text-left'>
                <summary className='cursor-pointer text-xs text-slate-500 hover:text-slate-400'>
                  Technical Details (Development)
                </summary>
                <pre className='mt-2 max-h-32 overflow-auto rounded bg-slate-900/50 p-2 text-xs text-slate-400'>
                  {error.stack}
                </pre>
              </details>
            )}
          </div>

          {/* Action Buttons */}
          <div className='border-t border-slate-700/50 p-4'>
            <div className='space-y-2'>
              {/* Primary actions */}
              {error.recoverable && (
                <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                  <Button
                    onClick={onRetry}
                    size='lg'
                    className={`h-12 ${theme.button} font-medium text-white`}
                  >
                    <RefreshCw className='mr-2 h-4 w-4' />
                    Try Again
                  </Button>

                  <Button
                    onClick={onReset}
                    variant='outline'
                    size='lg'
                    className={`h-12 ${theme.border} hover:${theme.bg} text-white`}
                  >
                    <RotateCcw className='mr-2 h-4 w-4' />
                    Reset Form
                  </Button>
                </div>
              )}

              {/* Secondary actions */}
              <div className='pt-2'>
                {error.severity === 'critical' || !error.recoverable ? (
                  <Button
                    onClick={onGoHome}
                    variant='outline'
                    size='lg'
                    className='h-12 w-full border-slate-600 text-white hover:bg-slate-800'
                  >
                    <Home className='mr-2 h-4 w-4' />
                    Return to Dashboard
                  </Button>
                ) : (
                  <Button
                    onClick={onGoHome}
                    variant='ghost'
                    size='sm'
                    className='w-full text-slate-400 hover:bg-slate-800 hover:text-white'
                  >
                    <Home className='mr-2 h-3 w-3' />
                    Return to Dashboard
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </OperationCard>
    </div>
  );
};

// Main Error Boundary Class Component
export default class StockTransferErrorBoundary extends React.Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      isRecovering: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const analyzedError = analyzeError(error);
    return {
      hasError: true,
      error: analyzedError,
      isRecovering: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('StockTransfer Error Boundary:', error, errorInfo);

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error monitoring service
      console.error('Production error logged:', {
        error: error.message,
        stack: error.stack,
        errorInfo: errorInfo.componentStack,
      });
    }
  }

  handleRetry = () => {
    this.setState({ isRecovering: true });

    // Clear any existing timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    // Simulate recovery delay and increment retry count
    this.retryTimeoutId = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        isRecovering: false,
        retryCount: prevState.retryCount + 1,
      }));
    }, 1500);
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      isRecovering: false,
      retryCount: 0,
    });

    // Force a page refresh to reset all state
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <StockTransferErrorUI
          error={this.state.error}
          onRetry={this.handleRetry}
          onReset={this.handleReset}
          onGoHome={this.handleGoHome}
          isRecovering={this.state.isRecovering}
          retryCount={this.state.retryCount}
        />
      );
    }

    return this.props.children;
  }
}
