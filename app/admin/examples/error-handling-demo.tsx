/**
 * Error Handling Demo Page
 * 錯誤處理系統演示頁面
 * 
 * 展示統一錯誤處理系統的各種功能和用法
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  useError, 
  useErrorHandler, 
  useAsyncError,
  useErrorRetry,
  useComponentErrorState,
  ErrorBoundary,
  WidgetErrorBoundary,
  ErrorFallback,
  CompactErrorFallback,
  WidgetErrorFallback,
  InlineErrorMessage,
  SuccessMessage,
  AutoRecovery,
  ManualRecovery,
  ErrorRecoveryPanel,
  ErrorHandlingUtils
} from '@/lib/error-handling';
import { 
  UniversalErrorCard, 
  UniversalSuccessCard, 
  UniversalErrorBoundaryCard,
  UniversalErrorUtils 
} from '@/components/layout/universal';
import { AlertTriangle, RefreshCw, CheckCircle, Zap } from 'lucide-react';

// Demo components for testing different error scenarios
function NetworkErrorDemo() {
  const { handleError, handleSuccess } = useErrorHandler('NetworkDemo');
  
  const simulateNetworkError = () => {
    handleError(
      new Error('Failed to fetch data from server'),
      'fetch_data',
      { userMessage: 'Unable to load data. Please check your connection.' }
    );
  };
  
  const simulateSuccess = () => {
    handleSuccess('Data loaded successfully', 'fetch_data');
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Network Error Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Simulate network-related errors with automatic retry functionality.
        </p>
        <div className="flex gap-2">
          <Button onClick={simulateNetworkError} variant="destructive">
            Trigger Network Error
          </Button>
          <Button onClick={simulateSuccess} variant="default">
            Simulate Success
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AuthErrorDemo() {
  const { handleError } = useErrorHandler('AuthDemo');
  
  const simulateAuthError = () => {
    handleError(
      new Error('Token has expired'),
      'authenticate',
      { 
        userMessage: 'Your session has expired. Please log in again.',
        recoveryStrategy: {
          primaryAction: 'logout',
          secondaryActions: ['refresh']
        }
      }
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          Authentication Error Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Simulate authentication errors that require user action.
        </p>
        <Button onClick={simulateAuthError} variant="destructive">
          Trigger Auth Error
        </Button>
      </CardContent>
    </Card>
  );
}

function ValidationErrorDemo() {
  const { handleError, handleWarning, handleInfo } = useErrorHandler('ValidationDemo');
  
  const simulateValidationError = () => {
    handleError(
      new Error('Invalid email format'),
      'validate_input',
      { userMessage: 'Please enter a valid email address.' }
    );
  };
  
  const simulateWarning = () => {
    handleWarning('This action cannot be undone', 'delete_confirmation');
  };
  
  const simulateInfo = () => {
    handleInfo('Changes saved automatically', 'auto_save');
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          Validation & Messages Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Demonstrate validation errors and different message types.
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={simulateValidationError} variant="destructive" size="sm">
            Validation Error
          </Button>
          <Button onClick={simulateWarning} variant="outline" size="sm">
            Warning Message
          </Button>
          <Button onClick={simulateInfo} variant="secondary" size="sm">
            Info Message
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AsyncErrorDemo() {
  const { executeAsync, isLoading, error } = useAsyncError();
  const [result, setResult] = useState<string | null>(null);
  
  const simulateAsyncOperation = async (shouldFail: boolean = false) => {
    setResult(null);
    
    const asyncFn = () => new Promise<string>((resolve, reject) => {
      setTimeout(() => {
        if (shouldFail) {
          reject(new Error('Async operation failed'));
        } else {
          resolve('Async operation completed successfully');
        }
      }, 1000);
    });
    
    const result = await executeAsync(
      asyncFn,
      { component: 'AsyncDemo', action: 'async_operation' }
    );
    
    if (result) {
      setResult(result);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Async Operation Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Test error handling for asynchronous operations.
        </p>
        <div className="flex gap-2">
          <Button 
            onClick={() => simulateAsyncOperation(false)} 
            disabled={isLoading}
            variant="default"
          >
            {isLoading ? 'Loading...' : 'Success Operation'}
          </Button>
          <Button 
            onClick={() => simulateAsyncOperation(true)} 
            disabled={isLoading}
            variant="destructive"
          >
            {isLoading ? 'Loading...' : 'Failing Operation'}
          </Button>
        </div>
        {result && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{result}</AlertDescription>
          </Alert>
        )}
        {error && (
          <InlineErrorMessage
            message={error.message}
            severity="medium"
            action={{
              label: 'Retry',
              onClick: () => simulateAsyncOperation(false)
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

function ErrorBoundaryDemo() {
  const [shouldThrow, setShouldThrow] = useState(false);
  
  const ThrowingComponent = () => {
    if (shouldThrow) {
      throw new Error('Component rendering error');
    }
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded">
        <p className="text-green-800">Component loaded successfully!</p>
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Error Boundary Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Demonstrate error boundary functionality with component errors.
        </p>
        <div className="flex gap-2 mb-4">
          <Button 
            onClick={() => setShouldThrow(false)} 
            variant={!shouldThrow ? "default" : "outline"}
          >
            Normal Component
          </Button>
          <Button 
            onClick={() => setShouldThrow(true)} 
            variant={shouldThrow ? "destructive" : "outline"}
          >
            Throwing Component
          </Button>
        </div>
        
        <ErrorBoundary
          context={{ component: 'ErrorBoundaryDemo', action: 'render' }}
          fallback={({ error, retry }) => (
            <ErrorFallback
              error={error}
              retry={() => {
                setShouldThrow(false);
                retry();
              }}
              reset={() => setShouldThrow(false)}
            />
          )}
        >
          <ThrowingComponent />
        </ErrorBoundary>
      </CardContent>
    </Card>
  );
}

function WidgetErrorDemo() {
  const [showError, setShowError] = useState(false);
  
  const FakeWidget = () => {
    if (showError) {
      throw new Error('Widget data loading failed');
    }
    return (
      <div className="p-6 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-medium text-blue-800">Sales Analytics Widget</h3>
        <p className="text-blue-600 mt-2">Revenue: $12,345</p>
        <p className="text-blue-600">Growth: +15%</p>
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-500" />
          Widget Error Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Demonstrate error handling for dashboard widgets.
        </p>
        <div className="flex gap-2 mb-4">
          <Button 
            onClick={() => setShowError(false)} 
            variant={!showError ? "default" : "outline"}
          >
            Working Widget
          </Button>
          <Button 
            onClick={() => setShowError(true)} 
            variant={showError ? "destructive" : "outline"}
          >
            Broken Widget
          </Button>
        </div>
        
        <WidgetErrorBoundary
          widgetName="SalesAnalytics"
          fallback={({ error, retry }) => (
            <WidgetErrorFallback
              error={error}
              retry={() => {
                setShowError(false);
                retry();
              }}
              reset={() => setShowError(false)}
              widgetName="Sales Analytics"
            />
          )}
        >
          <FakeWidget />
        </WidgetErrorBoundary>
      </CardContent>
    </Card>
  );
}

function UniversalErrorDemo() {
  const [errorType, setErrorType] = useState<'none' | 'network' | 'auth' | 'validation'>('none');
  
  const getErrorForType = (type: string) => {
    switch (type) {
      case 'network':
        return new Error('Network connection failed');
      case 'auth':
        return new Error('Authentication required');
      case 'validation':
        return new Error('Invalid input provided');
      default:
        return undefined;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-purple-500" />
          Universal Error Components
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Showcase universal error components with different variants.
        </p>
        
        <div className="flex gap-2 flex-wrap mb-4">
          <Button 
            onClick={() => setErrorType('none')} 
            variant={errorType === 'none' ? "default" : "outline"}
            size="sm"
          >
            No Error
          </Button>
          <Button 
            onClick={() => setErrorType('network')} 
            variant={errorType === 'network' ? "destructive" : "outline"}
            size="sm"
          >
            Network Error
          </Button>
          <Button 
            onClick={() => setErrorType('auth')} 
            variant={errorType === 'auth' ? "destructive" : "outline"}
            size="sm"
          >
            Auth Error
          </Button>
          <Button 
            onClick={() => setErrorType('validation')} 
            variant={errorType === 'validation' ? "destructive" : "outline"}
            size="sm"
          >
            Validation Error
          </Button>
        </div>
        
        {errorType === 'none' ? (
          <UniversalSuccessCard
            message="All systems operational"
            description="No errors detected"
            showCard={false}
          />
        ) : (
          <UniversalErrorCard
            error={getErrorForType(errorType)}
            variant="widget"
            severity={errorType === 'auth' ? 'critical' : errorType === 'network' ? 'medium' : 'low'}
            showCard={false}
            retry={() => setErrorType('none')}
            reset={() => window.location.reload()}
          />
        )}
      </CardContent>
    </Card>
  );
}

function ErrorStatsDemo() {
  const { errorState, clearAllErrors } = useError();
  const componentErrors = useComponentErrorState('ErrorStatsDemo');
  
  const errorsByCategory = React.useMemo(() => {
    const categories: Record<string, number> = {};
    Array.from(errorState.errors.values()).forEach(error => {
      categories[error.category] = (categories[error.category] || 0) + 1;
    });
    return categories;
  }, [errorState.errors]);
  
  const errorsBySeverity = React.useMemo(() => {
    const severities: Record<string, number> = {};
    Array.from(errorState.errors.values()).forEach(error => {
      severities[error.severity] = (severities[error.severity] || 0) + 1;
    });
    return severities;
  }, [errorState.errors]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Error Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Global Stats</h4>
            <p className="text-sm">Total Errors: {errorState.errorCount}</p>
            <p className="text-sm">Critical Errors: {errorState.hasCriticalError ? 'Yes' : 'None'}</p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">By Category</h4>
            {Object.entries(errorsByCategory).map(([category, count]) => (
              <p key={category} className="text-sm capitalize">
                {category}: {count}
              </p>
            ))}
          </div>
          
          <div>
            <h4 className="font-medium mb-2">By Severity</h4>
            {Object.entries(errorsBySeverity).map(([severity, count]) => (
              <p key={severity} className="text-sm capitalize">
                {severity}: {count}
              </p>
            ))}
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Actions</h4>
            <Button 
              onClick={clearAllErrors} 
              variant="outline" 
              size="sm"
              disabled={errorState.errorCount === 0}
            >
              Clear All Errors
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Demo Page Component
export default function ErrorHandlingDemo() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Error Handling System Demo</h1>
        <p className="text-gray-600">
          Comprehensive demonstration of the unified error handling system with various error types, 
          recovery mechanisms, and user-friendly interfaces.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Error Types */}
        <NetworkErrorDemo />
        <AuthErrorDemo />
        <ValidationErrorDemo />
        <AsyncErrorDemo />
        
        {/* Error Boundaries */}
        <ErrorBoundaryDemo />
        <WidgetErrorDemo />
        
        {/* Universal Components */}
        <UniversalErrorDemo />
        <ErrorStatsDemo />
      </div>
      
      <div className="mt-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This demo page showcases various error handling scenarios. In a production environment, 
            errors would be automatically logged and monitored for analysis and improvement.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}