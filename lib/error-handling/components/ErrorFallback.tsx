/**
 * Error Fallback Components
 * 錯誤回退組件集合
 * 
 * 提供多種錯誤顯示樣式和恢復選項的用戶友好界面
 */

'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ErrorFallbackProps, ErrorSeverity } from '../types';

// Base Error Fallback Component
export function ErrorFallback({ 
  error, 
  errorReport,
  retry, 
  reset,
  recoveryActions = ['retry'],
  customActions = []
}: ErrorFallbackProps) {
  const severity = errorReport?.severity || 'medium';
  const category = errorReport?.category || 'unknown';
  const userMessage = errorReport?.userMessage || error.message;

  const getSeverityIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      case 'high':
        return <AlertCircle className="w-6 h-6 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'low':
        return <Info className="w-6 h-6 text-blue-500" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-gray-500" />;
    }
  };

  const getSeverityColors = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-950/20',
          border: 'border-red-500/50',
          text: 'text-red-400',
        };
      case 'high':
        return {
          bg: 'bg-orange-950/20',
          border: 'border-orange-500/50',
          text: 'text-orange-400',
        };
      case 'medium':
        return {
          bg: 'bg-yellow-950/20',
          border: 'border-yellow-500/50',
          text: 'text-yellow-400',
        };
      case 'low':
        return {
          bg: 'bg-blue-950/20',
          border: 'border-blue-500/50',
          text: 'text-blue-400',
        };
      default:
        return {
          bg: 'bg-gray-950/20',
          border: 'border-gray-500/50',
          text: 'text-gray-400',
        };
    }
  };

  const colors = getSeverityColors(severity);

  return (
    <div className={`flex items-center justify-center min-h-[200px] p-6 rounded-lg border ${colors.bg} ${colors.border}`}>
      <div className="max-w-md space-y-4 text-center">
        <div className="flex justify-center">
          <div className={`rounded-full p-3 ${colors.bg}`}>
            {getSeverityIcon(severity)}
          </div>
        </div>

        <div>
          <h3 className={`mb-2 text-lg font-semibold ${colors.text}`}>
            {severity === 'critical' ? 'Critical Error' : 
             severity === 'high' ? 'System Error' :
             severity === 'medium' ? 'Error Occurred' : 'Minor Issue'}
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            {userMessage}
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-400">
                Technical Details
              </summary>
              <pre className="mt-2 p-2 bg-gray-900/50 rounded text-xs text-gray-400 overflow-auto max-h-32">
                {error.stack}
              </pre>
            </details>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {customActions.map((action, index) => (
            <Button
              key={index}
              onClick={action.action}
              variant={action.variant === 'primary' ? 'default' : 
                     action.variant === 'destructive' ? 'destructive' : 'outline'}
              size="sm"
              className="w-full"
            >
              {action.label}
            </Button>
          ))}
          
          {customActions.length === 0 && (
            <>
              <Button
                onClick={retry}
                size="sm"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              {severity === 'critical' && (
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact Error Fallback for small components
export function CompactErrorFallback({ 
  error, 
  errorReport,
  retry 
}: Pick<ErrorFallbackProps, 'error' | 'errorReport' | 'retry'>) {
  const severity = errorReport?.severity || 'medium';
  const colors = {
    critical: 'text-red-400 border-red-500/50',
    high: 'text-orange-400 border-orange-500/50',
    medium: 'text-yellow-400 border-yellow-500/50',
    low: 'text-blue-400 border-blue-500/50',
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${colors[severity] || colors.medium} bg-gray-900/50`}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm">Error occurred</span>
      </div>
      <Button
        onClick={retry}
        size="sm"
        variant="outline"
        className="h-7 px-2"
      >
        <RefreshCw className="w-3 h-3" />
      </Button>
    </div>
  );
}

// Widget-specific Error Fallback
export function WidgetErrorFallback({ 
  error, 
  errorReport,
  retry,
  widgetName
}: ErrorFallbackProps & { widgetName?: string }) {
  return (
    <Card className="h-full border-red-800/50 bg-red-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4" />
          Widget Error
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-gray-400">
          {widgetName ? `${widgetName} widget` : 'This widget'} encountered an error
        </p>
        
        {errorReport?.userMessage && (
          <Alert className="border-red-800/50 bg-red-950/20">
            <AlertDescription className="text-xs text-red-300">
              {errorReport.userMessage}
            </AlertDescription>
          </Alert>
        )}
        
        <Button
          onClick={retry}
          size="sm"
          variant="outline"
          className="w-full border-red-800 hover:bg-red-900/50"
        >
          <RefreshCw className="w-3 h-3 mr-2" />
          Retry Widget
        </Button>
      </CardContent>
    </Card>
  );
}

// Page-level Error Fallback
export function PageErrorFallback({ 
  error, 
  errorReport,
  retry,
  reset 
}: ErrorFallbackProps) {
  const severity = errorReport?.severity || 'high';
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
      <Card className="max-w-lg w-full border-red-800/50 bg-red-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-red-400">
            <AlertTriangle className="w-6 h-6" />
            Page Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300">
            {errorReport?.userMessage || 'An error occurred while loading this page.'}
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details>
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-400">
                Error Details
              </summary>
              <pre className="mt-2 p-3 bg-gray-900/50 rounded text-xs text-gray-400 overflow-auto max-h-40">
                {error.stack}
              </pre>
            </details>
          )}
          
          <div className="flex gap-2">
            <Button
              onClick={retry}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Inline Error Message Component
export function InlineErrorMessage({ 
  message, 
  severity = 'medium',
  showIcon = true,
  action
}: {
  message: string;
  severity?: ErrorSeverity;
  showIcon?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  const getIcon = () => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <AlertCircle className="w-4 h-4" />;
      case 'low':
        return <Info className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getColors = () => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 bg-red-950/20 border-red-500/50';
      case 'high':
        return 'text-orange-400 bg-orange-950/20 border-orange-500/50';
      case 'medium':
        return 'text-yellow-400 bg-yellow-950/20 border-yellow-500/50';
      case 'low':
        return 'text-blue-400 bg-blue-950/20 border-blue-500/50';
      default:
        return 'text-gray-400 bg-gray-950/20 border-gray-500/50';
    }
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${getColors()}`}>
      <div className="flex items-center gap-2">
        {showIcon && getIcon()}
        <span className="text-sm">{message}</span>
      </div>
      {action && (
        <Button
          onClick={action.onClick}
          size="sm"
          variant="outline"
          className="h-7 px-3 text-xs"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Success Message Component
export function SuccessMessage({ 
  message,
  description,
  action
}: {
  message: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-green-500/50 bg-green-950/20 text-green-400">
      <div className="flex items-center gap-2">
        <CheckCircle className="w-4 h-4" />
        <div>
          <span className="text-sm font-medium">{message}</span>
          {description && (
            <p className="text-xs text-green-300 mt-1">{description}</p>
          )}
        </div>
      </div>
      {action && (
        <Button
          onClick={action.onClick}
          size="sm"
          variant="outline"
          className="h-7 px-3 text-xs border-green-500/50 hover:bg-green-900/50"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}