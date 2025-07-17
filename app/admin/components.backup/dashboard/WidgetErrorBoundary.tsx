/**
 * Widget Error Boundary Component
 * 捕獲 widget 渲染錯誤，防止整個 dashboard 崩潰
 */

'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { errorHandler } from '@/app/components/qc-label-form/services/ErrorHandler';
import { isDevelopment } from '@/lib/utils/env';

interface Props {
  children: ReactNode;
  widgetName: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { widgetName } = this.props;

    // Log error to console
    console.error(`[WidgetErrorBoundary] Error in ${widgetName}:`, error, errorInfo);

    // Log to error handler service
    errorHandler.handleApiError(
      error,
      {
        component: `Widget.${widgetName}`,
        action: 'render',
        additionalData: {
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
        },
      },
      `Widget "${widgetName}" encountered an error`
    );

    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <div className='flex h-full w-full items-center justify-center rounded-lg border border-red-800/50 bg-red-950/20 p-4'>
          <div className='max-w-sm space-y-4 text-center'>
            <div className='flex justify-center'>
              <div className='rounded-full bg-red-900/50 p-3'>
                <AlertTriangle className='h-6 w-6 text-red-400' />
              </div>
            </div>

            <div>
              <h3 className='mb-1 text-sm font-semibold text-red-400'>Widget Error</h3>
              <p className='text-xs text-gray-400'>{this.props.widgetName} encountered an error</p>
              {isDevelopment() && this.state.error && (
                <p className='mt-2 font-mono text-xs text-gray-500'>{this.state.error.message}</p>
              )}
            </div>

            <Button
              onClick={this.handleReset}
              size='sm'
              variant='outline'
              className='border-red-800 hover:bg-red-900/50'
            >
              <RefreshCw className='mr-1 h-3 w-3' />
              Retry
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
