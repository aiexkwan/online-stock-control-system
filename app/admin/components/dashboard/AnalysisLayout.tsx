'use client';

import React, { Suspense } from 'react';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { useLayoutVirtualization } from '@/app/hooks/useLayoutVirtualization';

interface AnalysisLayoutProps {
  theme: string;
  timeFrame: TimeFrame;
  children: React.ReactNode[];
}

// Simple error boundary class component
class WidgetErrorBoundary extends React.Component<
  { children: React.ReactNode; index: number },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; index: number }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Widget ${this.props.index} error:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-red-400 p-4 border border-red-300 rounded">
          <div className="text-lg mb-2">⚠️</div>
          <p className="text-sm text-center">Widget Error</p>
          <p className="text-xs text-gray-500 mt-1">{this.state.error?.message}</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading fallback component
const WidgetLoadingFallback = () => (
  <div className="h-48 bg-gray-800/50 animate-pulse rounded flex items-center justify-center">
    <div className="text-gray-400">Loading widget...</div>
  </div>
);

export const AnalysisLayout: React.FC<AnalysisLayoutProps> = ({ theme, timeFrame, children }) => {
  // 確保 children 是數組
  const childrenArray = React.Children.toArray(children);

  // 使用虛擬化 hook
  const containerRef = useLayoutVirtualization({
    widgetCount: childrenArray.length,
    theme,
    threshold: 100,
  });

  // 讓 CSS 類別處理所有佈局，不需要 inline styles
  return (
    <div ref={containerRef} className='analysis-container'>
      {childrenArray.map((child, index) => (
        <WidgetErrorBoundary key={index} index={index}>
          <Suspense fallback={<WidgetLoadingFallback />}>
            {child}
          </Suspense>
        </WidgetErrorBoundary>
      ))}
    </div>
  );
};
