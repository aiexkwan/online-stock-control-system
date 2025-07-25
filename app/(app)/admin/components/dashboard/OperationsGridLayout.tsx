/**
 * Operations Grid Layout Component
 * 14列 x 10行專用網格佈局，9個定位項目，10px間距
 * 根據16位專家協作設計實施
 */

'use client';

import React, { Suspense } from 'react';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { KeyboardNavigableGrid } from './KeyboardNavigableGrid';
import { Skeleton } from '@/components/ui/skeleton';

interface OperationsGridLayoutProps {
  theme: string;
  timeFrame: TimeFrame;
  children: React.ReactNode[];
}

// Simple error boundary for operations widgets
class OperationsWidgetErrorBoundary extends React.Component<
  { children: React.ReactNode; widgetName: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; widgetName: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Operations Widget ${this.props.widgetName} error:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='flex h-full min-h-[120px] flex-col items-center justify-center rounded-lg border border-red-300/20 bg-red-500/5 p-4 text-red-400'>
          <div className='mb-2 text-lg'>⚠️</div>
          <p className='text-center text-sm font-medium'>{this.props.widgetName} Error</p>
          <p className='mt-1 text-xs text-gray-500'>{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className='mt-2 rounded-md bg-red-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
            aria-label={`Retry ${this.props.widgetName}`}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Operations widget loading skeleton
const OperationsWidgetSkeleton = ({ gridArea }: { gridArea: string }) => (
  <div
    style={{ gridArea }}
    className='rounded-lg border border-slate-600/20 bg-slate-800/50 p-4'
    role='status'
    aria-label={`Loading ${gridArea}`}
  >
    <div className='space-y-3'>
      <Skeleton className='h-6 w-3/4 bg-slate-700' />
      <div className='space-y-2'>
        <Skeleton className='h-4 w-full bg-slate-700' />
        <Skeleton className='h-4 w-2/3 bg-slate-700' />
      </div>
      {/* Different skeleton patterns based on area */}
      {gridArea.includes('chart') && (
        <div className='mt-4 space-y-2'>
          <Skeleton className='h-32 w-full bg-slate-700' />
        </div>
      )}
      {gridArea.includes('large') && (
        <div className='mt-4 grid grid-cols-2 gap-2'>
          <Skeleton className='h-12 bg-slate-700' />
          <Skeleton className='h-12 bg-slate-700' />
          <Skeleton className='h-12 bg-slate-700' />
          <Skeleton className='h-12 bg-slate-700' />
        </div>
      )}
      {gridArea.includes('stats') && !gridArea.includes('large') && (
        <div className='mt-4'>
          <Skeleton className='h-16 w-full bg-slate-700' />
        </div>
      )}
    </div>
  </div>
);

/**
 * Operations Grid Layout Component
 * 實施14列 x 10行CSS Grid佈局
 * 專家建議的9個定位項目配置
 */
export const OperationsGridLayout: React.FC<OperationsGridLayoutProps> = ({
  theme,
  timeFrame,
  children,
}) => {
  // Widget names for error handling (matching grid areas)
  const widgetNames = [
    'Department Selector',
    'Production Status',
    'Quality Metrics',
    'Inventory Levels',
    'Overall Performance',
    'Resource Utilization',
    'Production Trends',
    'Quality Analysis',
    'Operations History',
  ];

  return (
    <div className='h-full w-full'>
      {/* Accessibility heading */}
      <div className='sr-only'>
        <h1>Operations Dashboard</h1>
        <p>14 column by 10 row grid layout with 9 positioned monitoring cards</p>
      </div>

      <KeyboardNavigableGrid
        className='h-full w-full'
        gridColumns={14}
        aria-label='Operations monitoring dashboard'
      >
        {/* 14x10 CSS Grid Container with 10px gaps */}
        <div
          className='operations-grid-container h-full w-full'
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(14, 1fr)',
            gridTemplateRows: 'repeat(10, minmax(60px, auto))',
            gap: '10px',
            gridTemplateAreas: `
              ". dept-sel dept-sel dept-sel . . . . . . . hist hist hist"
              ". dept-sel dept-sel dept-sel . . . . . . . hist hist hist"
              ". stats-a stats-a stats-b stats-b stats-c stats-c . . . . hist hist hist"
              ". stats-a stats-a stats-b stats-b stats-c stats-c . . . . hist hist hist"
              ". large-a large-a large-a large-b large-b large-b large-b . . hist hist hist"
              ". large-a large-a large-a large-b large-b large-b large-b . . hist hist hist"
              ". large-a large-a large-a large-b large-b large-b large-b . . hist hist hist"
              ". chart-a chart-a chart-a chart-a chart-b chart-b chart-b chart-b . hist hist hist"
              ". chart-a chart-a chart-a chart-a chart-b chart-b chart-b chart-b . hist hist hist"
              ". chart-a chart-a chart-a chart-a chart-b chart-b chart-b chart-b . hist hist hist"
            `,
            height: '100%',
            width: '100%',
            padding: '20px',
            // CSS containment for performance
            contain: 'layout style',
          }}
          role='main'
        >
          {/* Render children with error boundaries and loading states */}
          {children.map((child, index) => (
            <Suspense
              key={`operations-widget-${index}`}
              fallback={
                <OperationsWidgetSkeleton
                  gridArea={
                    [
                      'dept-sel',
                      'stats-a',
                      'stats-b',
                      'stats-c',
                      'large-a',
                      'large-b',
                      'chart-a',
                      'chart-b',
                      'hist',
                    ][index] || 'widget'
                  }
                />
              }
            >
              <OperationsWidgetErrorBoundary
                widgetName={widgetNames[index] || `Widget ${index + 1}`}
              >
                {child}
              </OperationsWidgetErrorBoundary>
            </Suspense>
          ))}
        </div>
      </KeyboardNavigableGrid>

      {/* CSS Grid debugging styles (development only) */}
      <style jsx>{`
        .operations-grid-container {
          /* Grid debugging (remove in production) */
          /* background-image: 
            linear-gradient(rgba(255,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,0,0,0.1) 1px, transparent 1px); */
        }

        /* Responsive adjustments */
        @media (max-width: 1200px) {
          .operations-grid-container {
            grid-template-columns: repeat(8, 1fr);
            grid-template-areas:
              'dept-sel dept-sel dept-sel dept-sel . . hist hist'
              'dept-sel dept-sel dept-sel dept-sel . . hist hist'
              'stats-a stats-a stats-b stats-b stats-c stats-c hist hist'
              'stats-a stats-a stats-b stats-b stats-c stats-c hist hist'
              'large-a large-a large-a large-b large-b large-b hist hist'
              'large-a large-a large-a large-b large-b large-b hist hist'
              'large-a large-a large-a large-b large-b large-b hist hist'
              'chart-a chart-a chart-a chart-b chart-b chart-b hist hist'
              'chart-a chart-a chart-a chart-b chart-b chart-b hist hist'
              'chart-a chart-a chart-a chart-b chart-b chart-b hist hist';
          }
        }

        @media (max-width: 768px) {
          .operations-grid-container {
            grid-template-columns: 1fr;
            grid-template-rows: auto;
            grid-template-areas:
              'dept-sel'
              'stats-a'
              'stats-b'
              'stats-c'
              'large-a'
              'large-b'
              'chart-a'
              'chart-b'
              'hist';
            gap: 16px;
            padding: 16px;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .operations-grid-container {
            gap: 12px;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .operations-grid-container * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};
