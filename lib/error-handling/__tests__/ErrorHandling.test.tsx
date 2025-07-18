/**
 * Error Handling System Tests
 * 錯誤處理系統測試
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  ErrorProvider, 
  useError, 
  ErrorBoundary,
  ErrorFallback,
  useErrorHandler,
  ErrorHandlingUtils
} from '../index';

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Test component that uses error context
function TestErrorComponent() {
  const { handleError, errorState } = useError();
  
  const triggerError = () => {
    handleError(
      new Error('Test error'),
      { component: 'TestComponent', action: 'test' }
    );
  };
  
  return (
    <div>
      <button onClick={triggerError}>Trigger Error</button>
      <div data-testid="error-count">
        Errors: {errorState.errorCount}
      </div>
      <div data-testid="critical-errors">
        Critical: {errorState.hasCriticalError ? 'Yes' : 'No'}
      </div>
    </div>
  );
}

// Test component that throws an error
function ThrowingComponent({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Component error');
  }
  return <div>Component loaded successfully</div>;
}

// Test component using error handler hook
function ErrorHandlerComponent() {
  const { handleError, handleSuccess } = useErrorHandler('TestComponent');
  
  return (
    <div>
      <button onClick={() => handleError(new Error('Hook error'), 'test_action')}>
        Trigger Hook Error
      </button>
      <button onClick={() => handleSuccess('Success message', 'test_action')}>
        Trigger Success
      </button>
    </div>
  );
}

describe('Error Handling System', () => {
  describe('ErrorProvider', () => {
    it('provides error context to children', () => {
      render(
        <ErrorProvider>
          <TestErrorComponent />
        </ErrorProvider>
      );
      
      expect(screen.getByTestId('error-count')).toHaveTextContent('Errors: 0');
      expect(screen.getByTestId('critical-errors')).toHaveTextContent('Critical: No');
    });
    
    it('handles errors correctly', async () => {
      render(
        <ErrorProvider>
          <TestErrorComponent />
        </ErrorProvider>
      );
      
      fireEvent.click(screen.getByText('Trigger Error'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error-count')).toHaveTextContent('Errors: 1');
      });
    });
    
    it('categorizes errors correctly', async () => {
      function NetworkErrorComponent() {
        const { handleError, errorState } = useError();
        
        const triggerNetworkError = () => {
          handleError(
            new Error('fetch failed'),
            { component: 'NetworkTest', action: 'fetch' }
          );
        };
        
        return (
          <div>
            <button onClick={triggerNetworkError}>Network Error</button>
            <div data-testid="errors">
              {Array.from(errorState.errors.values()).map(error => (
                <div key={error.id} data-testid={`error-${error.category}`}>
                  {error.category}
                </div>
              ))}
            </div>
          </div>
        );
      }
      
      render(
        <ErrorProvider>
          <NetworkErrorComponent />
        </ErrorProvider>
      );
      
      fireEvent.click(screen.getByText('Network Error'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error-network')).toBeInTheDocument();
      });
    });
  });
  
  describe('ErrorBoundary', () => {
    it('catches and displays errors', () => {
      render(
        <ErrorBoundary
          context={{ component: 'TestBoundary', action: 'render' }}
        >
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/Try Again/i)).toBeInTheDocument();
    });
    
    it('renders children when no error', () => {
      render(
        <ErrorBoundary
          context={{ component: 'TestBoundary', action: 'render' }}
        >
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Component loaded successfully')).toBeInTheDocument();
    });
    
    it('allows retry functionality', () => {
      const { rerender } = render(
        <ErrorBoundary
          context={{ component: 'TestBoundary', action: 'render' }}
        >
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText(/Try Again/i)).toBeInTheDocument();
      
      // Click retry - this would reset the error boundary in real usage
      fireEvent.click(screen.getByText(/Try Again/i));
      
      // In a real scenario, the component would re-render without error
      rerender(
        <ErrorBoundary
          context={{ component: 'TestBoundary', action: 'render' }}
        >
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Component loaded successfully')).toBeInTheDocument();
    });
  });
  
  describe('useErrorHandler Hook', () => {
    it('provides component-specific error handling', async () => {
      render(
        <ErrorProvider>
          <ErrorHandlerComponent />
        </ErrorProvider>
      );
      
      fireEvent.click(screen.getByText('Trigger Hook Error'));
      
      // Verify error was logged (mocked console.error should be called)
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('[ErrorProvider] MEDIUM error in TestComponent:'),
          expect.any(Error)
        );
      });
    });
    
    it('handles success messages', async () => {
      render(
        <ErrorProvider>
          <ErrorHandlerComponent />
        </ErrorProvider>
      );
      
      fireEvent.click(screen.getByText('Trigger Success'));
      
      // Verify success was logged
      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('[ErrorProvider] Success in TestComponent: Success message')
        );
      });
    });
  });
  
  describe('ErrorFallback Components', () => {
    it('renders error fallback with proper styling', () => {
      const mockError = new Error('Test error message');
      const mockRetry = vi.fn();
      
      render(
        <ErrorFallback
          error={mockError}
          retry={mockRetry}
          reset={() => {}}
        />
      );
      
      expect(screen.getByText(/Error Occurred/i)).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
      expect(screen.getByText(/Try Again/i)).toBeInTheDocument();
    });
    
    it('handles retry action', () => {
      const mockError = new Error('Test error');
      const mockRetry = vi.fn();
      
      render(
        <ErrorFallback
          error={mockError}
          retry={mockRetry}
          reset={() => {}}
        />
      );
      
      fireEvent.click(screen.getByText(/Try Again/i));
      expect(mockRetry).toHaveBeenCalled();
    });
  });
  
  describe('ErrorHandlingUtils', () => {
    it('normalizes different error types', () => {
      expect(ErrorHandlingUtils.normalizeError('string error')).toBeInstanceOf(Error);
      expect(ErrorHandlingUtils.normalizeError(new Error('error'))).toBeInstanceOf(Error);
      expect(ErrorHandlingUtils.normalizeError({ message: 'object error' })).toBeInstanceOf(Error);
      expect(ErrorHandlingUtils.normalizeError(null)).toBeInstanceOf(Error);
    });
    
    it('detects network errors', () => {
      expect(ErrorHandlingUtils.isNetworkError(new Error('network error'))).toBe(true);
      expect(ErrorHandlingUtils.isNetworkError(new Error('fetch failed'))).toBe(true);
      expect(ErrorHandlingUtils.isNetworkError(new Error('connection timeout'))).toBe(true);
      expect(ErrorHandlingUtils.isNetworkError(new Error('validation error'))).toBe(false);
    });
    
    it('detects auth errors', () => {
      expect(ErrorHandlingUtils.isAuthError(new Error('unauthorized'))).toBe(true);
      expect(ErrorHandlingUtils.isAuthError(new Error('forbidden'))).toBe(true);
      expect(ErrorHandlingUtils.isAuthError(new Error('token expired'))).toBe(true);
      expect(ErrorHandlingUtils.isAuthError(new Error('network error'))).toBe(false);
    });
    
    it('determines error severity correctly', () => {
      expect(ErrorHandlingUtils.getErrorSeverity(new Error('token expired'))).toBe('critical');
      expect(ErrorHandlingUtils.getErrorSeverity(new Error('unauthorized'))).toBe('high');
      expect(ErrorHandlingUtils.getErrorSeverity(new Error('network error'))).toBe('medium');
      expect(ErrorHandlingUtils.getErrorSeverity(new Error('validation failed'))).toBe('low');
    });
    
    it('wraps async functions with error handling', async () => {
      const mockErrorHandler = vi.fn();
      const successfulFn = vi.fn().mockResolvedValue('success');
      const failingFn = vi.fn().mockRejectedValue(new Error('async error'));
      
      const wrappedSuccess = ErrorHandlingUtils.withErrorHandling(successfulFn, mockErrorHandler);
      const wrappedFailing = ErrorHandlingUtils.withErrorHandling(failingFn, mockErrorHandler);
      
      const result1 = await wrappedSuccess('test');
      expect(result1).toBe('success');
      expect(mockErrorHandler).not.toHaveBeenCalled();
      
      const result2 = await wrappedFailing('test');
      expect(result2).toBe(null);
      expect(mockErrorHandler).toHaveBeenCalledWith(expect.any(Error));
    });
  });
  
  describe('Error Recovery', () => {
    it('supports auto-retry for network errors', async () => {
      function AutoRetryComponent() {
        const { handleError, errorState } = useError();
        
        const triggerRetryableError = () => {
          handleError(
            new Error('network connection failed'),
            { 
              component: 'AutoRetryTest', 
              action: 'fetch',
              category: 'network'
            },
            {
              recoveryStrategy: {
                autoRetry: {
                  enabled: true,
                  maxAttempts: 3,
                  delayMs: 100,
                }
              }
            }
          );
        };
        
        return (
          <div>
            <button onClick={triggerRetryableError}>Trigger Auto Retry</button>
            <div data-testid="network-errors">
              {Array.from(errorState.errors.values())
                .filter(e => e.category === 'network')
                .map(error => (
                  <div key={error.id}>
                    Network Error: {error.recoveryStrategy.autoRetry?.enabled ? 'Auto Retry' : 'Manual'}
                  </div>
                ))}
            </div>
          </div>
        );
      }
      
      render(
        <ErrorProvider>
          <AutoRetryComponent />
        </ErrorProvider>
      );
      
      fireEvent.click(screen.getByText('Trigger Auto Retry'));
      
      await waitFor(() => {
        expect(screen.getByText(/Network Error: Auto Retry/)).toBeInTheDocument();
      });
    });
  });
});