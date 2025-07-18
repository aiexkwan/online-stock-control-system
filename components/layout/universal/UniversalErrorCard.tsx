/**
 * Universal Error Card Component
 * 統一錯誤卡片組件
 * 
 * 與通用佈局系統整合的錯誤顯示卡片
 */

'use client';

import React from 'react';
import { UniversalCard } from './UniversalCard';
import { 
  ErrorFallback, 
  CompactErrorFallback, 
  WidgetErrorFallback,
  InlineErrorMessage,
  SuccessMessage,
  ErrorBoundary
} from '@/lib/error-handling';
import { useUniversalLayout } from './UniversalProvider';
import type { ErrorFallbackProps, ErrorSeverity } from '@/lib/error-handling/types';

// Enhanced Universal Error Card Props
interface UniversalErrorCardProps extends Omit<ErrorFallbackProps, 'error'> {
  /** Error object or message */
  error?: Error | string;
  /** Error severity */
  severity?: ErrorSeverity;
  /** Error message override */
  message?: string;
  /** Component variant */
  variant?: 'default' | 'compact' | 'widget' | 'inline';
  /** Card styling */
  className?: string;
  /** Whether to show in card format */
  showCard?: boolean;
  /** Card title */
  title?: string;
  /** Widget name (for widget variant) */
  widgetName?: string;
}

export function UniversalErrorCard({
  error,
  severity = 'medium',
  message,
  variant = 'default',
  className,
  showCard = true,
  title,
  widgetName,
  retry,
  reset,
  recoveryActions,
  customActions,
  ...props
}: UniversalErrorCardProps) {
  const { theme, isMobile } = useUniversalLayout();
  
  // Normalize error
  const normalizedError = React.useMemo(() => {
    if (error instanceof Error) {
      return error;
    }
    if (typeof error === 'string') {
      return new Error(error);
    }
    return new Error(message || 'An error occurred');
  }, [error, message]);
  
  // Create error report mock
  const errorReport = React.useMemo(() => ({
    id: `error_${Date.now()}`,
    timestamp: new Date().toISOString(),
    context: {
      component: widgetName || 'UniversalErrorCard',
      action: 'display',
    },
    error: normalizedError,
    severity,
    category: 'unknown' as const,
    userMessage: message || normalizedError.message,
    technicalMessage: normalizedError.message,
    recoveryStrategy: {
      primaryAction: 'retry' as const,
      secondaryActions: recoveryActions || ['refresh'],
      autoRetry: { enabled: false, maxAttempts: 0, delayMs: 0 },
    },
    retryCount: 0,
    resolved: false,
  }), [normalizedError, severity, message, widgetName, recoveryActions]);
  
  // Fallback props
  const fallbackProps: ErrorFallbackProps = {
    error: normalizedError,
    errorReport,
    retry: retry || (() => window.location.reload()),
    reset: reset || (() => {}),
    recoveryActions,
    customActions,
    ...props,
  };
  
  // Render based on variant
  const renderErrorContent = () => {
    switch (variant) {
      case 'compact':
        return <CompactErrorFallback {...fallbackProps} />;
        
      case 'widget':
        return <WidgetErrorFallback {...fallbackProps} widgetName={widgetName} />;
        
      case 'inline':
        return (
          <InlineErrorMessage
            message={message || normalizedError.message}
            severity={severity}
            action={retry ? {
              label: 'Retry',
              onClick: retry,
            } : undefined}
          />
        );
        
      default:
        return <ErrorFallback {...fallbackProps} />;
    }
  };
  
  // Apply responsive sizing for mobile
  const cardProps = React.useMemo(() => {
    const baseProps = {
      className: className,
      theme: theme.name as 'admin' | 'warehouse' | 'production' | 'neutral' | 'qc' | 'grn',
    };
    
    if (isMobile) {
      return {
        ...baseProps,
        size: 'sm' as const,
        padding: 'sm' as const,
      };
    }
    
    return baseProps;
  }, [className, theme.name, isMobile]);
  
  // Don't wrap in card for inline variant
  if (variant === 'inline' || !showCard) {
    return <>{renderErrorContent()}</>;
  }
  
  return (
    <UniversalCard {...cardProps} title={title}>
      {renderErrorContent()}
    </UniversalCard>
  );
}

// Success Card Component
interface UniversalSuccessCardProps {
  /** Success message */
  message: string;
  /** Optional description */
  description?: string;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Card styling */
  className?: string;
  /** Card title */
  title?: string;
  /** Whether to show in card format */
  showCard?: boolean;
}

export function UniversalSuccessCard({
  message,
  description,
  action,
  className,
  title = 'Success',
  showCard = true,
}: UniversalSuccessCardProps) {
  const { theme, isMobile } = useUniversalLayout();
  
  const successContent = (
    <SuccessMessage
      message={message}
      description={description}
      action={action}
    />
  );
  
  if (!showCard) {
    return <>{successContent}</>;
  }
  
  const cardProps = {
    className,
    theme: theme.name as 'admin' | 'warehouse' | 'production' | 'neutral' | 'qc' | 'grn',
    ...(isMobile && {
      size: 'sm' as const,
      padding: 'sm' as const,
    }),
  };
  
  return (
    <UniversalCard {...cardProps} title={title}>
      {successContent}
    </UniversalCard>
  );
}

// Error Boundary Card Wrapper
interface UniversalErrorBoundaryCardProps {
  children: React.ReactNode;
  componentName: string;
  fallbackVariant?: 'default' | 'compact' | 'widget';
  fallbackTitle?: string;
  className?: string;
}

export function UniversalErrorBoundaryCard({
  children,
  componentName,
  fallbackVariant = 'widget',
  fallbackTitle,
  className,
}: UniversalErrorBoundaryCardProps) {
  return (
    <ErrorBoundary
      context={{
        component: componentName,
        action: 'render',
      }}
      fallback={({ error, retry, reset }) => (
        <UniversalErrorCard
          error={error}
          variant={fallbackVariant}
          title={fallbackTitle || `${componentName} Error`}
          retry={retry}
          reset={reset}
          className={className}
          widgetName={componentName}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// Export error handling utilities for Universal components
export const UniversalErrorUtils = {
  /**
   * Wrap component with error boundary
   */
  withErrorBoundary: <P extends object>(
    Component: React.ComponentType<P>,
    componentName: string,
    options?: {
      fallbackVariant?: 'default' | 'compact' | 'widget';
      fallbackTitle?: string;
      className?: string;
    }
  ) => {
    return function WrappedComponent(props: P) {
      return (
        <UniversalErrorBoundaryCard
          componentName={componentName}
          fallbackVariant={options?.fallbackVariant}
          fallbackTitle={options?.fallbackTitle}
          className={options?.className}
        >
          <Component {...props} />
        </UniversalErrorBoundaryCard>
      );
    };
  },

  /**
   * Create error card for async operations
   */
  createAsyncErrorCard: (
    error: Error | string,
    componentName: string,
    onRetry?: () => void
  ) => (
    <UniversalErrorCard
      error={error}
      variant="widget"
      widgetName={componentName}
      retry={onRetry || (() => {})}
      reset={() => window.location.reload()}
      title={`${componentName} Error`}
    />
  ),

  /**
   * Create success card for operations
   */
  createSuccessCard: (
    message: string,
    description?: string,
    action?: { label: string; onClick: () => void }
  ) => (
    <UniversalSuccessCard
      message={message}
      description={description}
      action={action}
    />
  ),
};