'use client';

import React, { Suspense, lazy } from 'react';

// Loading component
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center space-x-3">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      <span className="text-gray-400">{message}</span>
    </div>
  </div>
);

// Error boundary for lazy components
class LazyComponentErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">Failed to load component. Please refresh the page.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lazy loaded components
const LazyAcoOrderForm = lazy(() => 
  import('./AcoOrderForm').then(module => ({ default: module.AcoOrderForm }))
);

const LazySlateDetailsForm = lazy(() => 
  import('./SlateDetailsForm').then(module => ({ default: module.SlateDetailsForm }))
);

const LazyEnhancedProgressBar = lazy(() => 
  import('./EnhancedProgressBar').then(module => ({ default: module.EnhancedProgressBar }))
);

const LazyErrorStats = lazy(() => 
  import('./ErrorStats').then(module => ({ default: module.ErrorStats }))
);

// Simple wrapper components without performance monitoring
export const MonitoredLazyAcoOrderForm = LazyAcoOrderForm;
export const MonitoredLazySlateDetailsForm = LazySlateDetailsForm;
export const MonitoredLazyEnhancedProgressBar = LazyEnhancedProgressBar;
export const MonitoredLazyErrorStats = LazyErrorStats;

// Wrapper components with Suspense and Error Boundary
export const LazyAcoSection: React.FC<React.ComponentProps<typeof LazyAcoOrderForm>> = (props) => (
  <LazyComponentErrorBoundary fallback={<div className="p-4 text-red-500">Failed to load ACO form</div>}>
    <Suspense fallback={<LoadingSpinner message="Loading ACO form..." />}>
      <MonitoredLazyAcoOrderForm {...props} />
    </Suspense>
  </LazyComponentErrorBoundary>
);

export const LazySlateSection: React.FC<React.ComponentProps<typeof LazySlateDetailsForm>> = (props) => (
  <LazyComponentErrorBoundary fallback={<div className="p-4 text-red-500">Failed to load Slate form</div>}>
    <Suspense fallback={<LoadingSpinner message="Loading Slate form..." />}>
      <MonitoredLazySlateDetailsForm {...props} />
    </Suspense>
  </LazyComponentErrorBoundary>
);

export const LazyProgressSection: React.FC<React.ComponentProps<typeof LazyEnhancedProgressBar>> = (props) => (
  <LazyComponentErrorBoundary fallback={<div className="p-4 text-red-500">Failed to load progress bar</div>}>
    <Suspense fallback={<LoadingSpinner message="Loading progress..." />}>
      <MonitoredLazyEnhancedProgressBar {...props} />
    </Suspense>
  </LazyComponentErrorBoundary>
);

export const LazyErrorStatsSection: React.FC<React.ComponentProps<typeof LazyErrorStats>> = (props) => (
  <LazyComponentErrorBoundary fallback={<div className="p-4 text-red-500">Failed to load error stats</div>}>
    <Suspense fallback={<LoadingSpinner message="Loading error statistics..." />}>
      <MonitoredLazyErrorStats {...props} />
    </Suspense>
  </LazyComponentErrorBoundary>
);

// Preload functions for better UX
export const preloadAcoForm = () => {
  import('./AcoOrderForm');
};

export const preloadSlateForm = () => {
  import('./SlateDetailsForm');
};

export const preloadProgressBar = () => {
  import('./EnhancedProgressBar');
};

export const preloadErrorStats = () => {
  import('./ErrorStats');
};

// Preload all components
export const preloadAllComponents = () => {
  preloadAcoForm();
  preloadSlateForm();
  preloadProgressBar();
  preloadErrorStats();
};

// Hook for conditional preloading
export const useConditionalPreload = (productType: string | null) => {
  React.useEffect(() => {
    if (productType === 'ACO') {
      preloadAcoForm();
    } else if (productType === 'Slate') {
      preloadSlateForm();
    }
  }, [productType]);
};

export default {
  LazyAcoSection,
  LazySlateSection,
  LazyProgressSection,
  LazyErrorStatsSection,
  preloadAllComponents,
  useConditionalPreload
}; 