'use client';

import React, { Suspense } from 'react';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { useLayoutVirtualization } from '@/app/hooks/useLayoutVirtualization';
import { AnalyticsTabSystem } from './AnalyticsTabSystem';

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
        <div className='flex h-48 flex-col items-center justify-center rounded border border-red-300 p-4 text-red-400'>
          <div className='mb-2 text-lg'>⚠️</div>
          <p className='text-center text-sm'>Widget Error</p>
          <p className='mt-1 text-xs text-gray-500'>{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className='mt-2 rounded bg-red-500 px-3 py-1 text-xs text-white hover:bg-red-600'
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
  <div className='flex h-48 animate-pulse items-center justify-center rounded bg-gray-800/50'>
    <div className='text-gray-400'>Loading widget...</div>
  </div>
);

export const AnalysisLayout: React.FC<AnalysisLayoutProps> = ({ theme, timeFrame, children }) => {
  // 確保 children 是數組
  const childrenArray = React.Children.toArray(children);

  // 將 children 包裝在錯誤邊界中
  const wrappedChildren = childrenArray.map((child, index) => (
    <WidgetErrorBoundary key={index} index={index}>
      <Suspense fallback={<WidgetLoadingFallback />}>{child}</Suspense>
    </WidgetErrorBoundary>
  ));

  // Phase 3.0 重構：AnalyticsTabSystem 不再需要 widgets prop
  // 現在它內部使用 AnalysisDisplayContainer 和 UnifiedWidget 系統
  return <AnalyticsTabSystem theme={theme} timeFrame={timeFrame} />;
};
