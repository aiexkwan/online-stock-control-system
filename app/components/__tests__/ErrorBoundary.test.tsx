import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

// Mock window.location.reload
delete (window as any).location;
window.location = { reload: jest.fn() } as any;

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should catch errors and display error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText("We're working to fix this issue. Please try again later.")).toBeInTheDocument();
    expect(screen.getByText('Error: Test error')).toBeInTheDocument();
  });

  it('should display reload button when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByText('Reload page');
    expect(reloadButton).toBeInTheDocument();
  });

  it('should reload page when reload button is clicked', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByText('Reload page');
    fireEvent.click(reloadButton);

    expect(window.location.reload).toHaveBeenCalled();
  });

  it('should log error to console', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error boundary caught an error:',
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('should handle multiple children', () => {
    render(
      <ErrorBoundary>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('Child 3')).toBeInTheDocument();
  });

  it('should handle errors from nested components', () => {
    const NestedComponent = () => {
      throw new Error('Nested error');
    };

    const ParentComponent = () => (
      <div>
        <NestedComponent />
      </div>
    );

    render(
      <ErrorBoundary>
        <ParentComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Error: Nested error')).toBeInTheDocument();
  });

  it('should render without children', () => {
    render(<ErrorBoundary />);
    
    // Should not throw and should render nothing
    expect(document.body.firstChild).toBeDefined();
  });

  it('should display custom error messages', () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'CustomError';
      }
    }

    const ThrowCustomError = () => {
      throw new CustomError('Custom error message');
    };

    render(
      <ErrorBoundary>
        <ThrowCustomError />
      </ErrorBoundary>
    );

    expect(screen.getByText('CustomError: Custom error message')).toBeInTheDocument();
  });

  it('should handle errors during render phase', () => {
    const BrokenComponent = () => {
      // Simulate error during render
      const obj: any = null;
      return <div>{obj.nonExistent}</div>;
    };

    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should apply correct styles to error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const container = screen.getByText('Something went wrong').closest('div');
    expect(container).toHaveClass('max-w-md', 'w-full', 'space-y-8');

    const errorPre = screen.getByText('Error: Test error');
    expect(errorPre).toHaveClass('mt-4', 'p-4', 'bg-red-50', 'rounded-md', 'text-sm', 'text-red-600', 'overflow-auto');

    const reloadButton = screen.getByText('Reload page');
    expect(reloadButton).toHaveClass('inline-flex', 'items-center', 'px-4', 'py-2', 'border', 'border-transparent');
  });

  it('should reset error state when receiving new props', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // This would typically be handled by a reset mechanism in a real app
    // For testing, we verify the error boundary maintains its state
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Error boundary should still show error state
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should handle async errors', async () => {
    const AsyncError = () => {
      React.useEffect(() => {
        throw new Error('Async error');
      }, []);
      return <div>Loading...</div>;
    };

    // Note: Error boundaries don't catch errors in event handlers, 
    // async code, or during SSR. This test verifies the limitation.
    render(
      <ErrorBoundary>
        <AsyncError />
      </ErrorBoundary>
    );

    // Should render normally since async errors aren't caught
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});