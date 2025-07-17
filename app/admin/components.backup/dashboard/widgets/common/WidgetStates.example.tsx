/**
 * WidgetStates Usage Examples
 * 展示如何在 widgets 中使用通用狀態組件
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  WidgetSkeleton,
  WidgetError,
  WidgetEmpty,
  WidgetLoadingOverlay,
  WidgetStateWrapper,
} from './WidgetStates';
import { Button } from '@/components/ui/button';

// ================================
// Example 1: 使用 WidgetStateWrapper (推薦)
// ================================

export function ExampleWidgetWithStateWrapper() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Simulate different scenarios
      const random = Math.random();
      if (random < 0.3) {
        throw new Error('Failed to fetch data');
      } else if (random < 0.6) {
        setData([]);
      } else {
        setData([1, 2, 3]);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Example Widget with State Wrapper</CardTitle>
      </CardHeader>
      <CardContent>
        <WidgetStateWrapper
          loading={loading}
          error={error}
          empty={data.length === 0}
          onRetry={fetchData}
          emptyMessage='No items found'
          emptyDescription='Try adjusting your filters or add new items'
          errorMessage='Failed to load data'
          skeletonRows={4}
          showHeaderSkeleton={true}
        >
          {/* Your actual content */}
          <div className='space-y-2'>
            {data.map((item, index) => (
              <div key={index} className='rounded bg-slate-800 p-3'>
                Item {item}
              </div>
            ))}
          </div>
        </WidgetStateWrapper>
        <Button onClick={fetchData} className='mt-4'>
          Fetch Data
        </Button>
      </CardContent>
    </Card>
  );
}

// ================================
// Example 2: 使用個別組件
// ================================

export function ExampleWidgetWithIndividualStates() {
  const [state, setState] = useState<'loading' | 'error' | 'empty' | 'data'>('data');
  const [overlayLoading, setOverlayLoading] = useState(false);

  const handleAction = async () => {
    setOverlayLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setOverlayLoading(false);
  };

  return (
    <Card className='relative h-full'>
      <CardHeader>
        <CardTitle>Example Widget with Individual States</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Loading State */}
        {state === 'loading' && (
          <WidgetSkeleton rows={5} showHeader={true}>
            {/* Custom skeleton content */}
            <div className='space-y-3'>
              <div className='h-6 w-40 rounded bg-slate-700' />
              <div className='grid grid-cols-3 gap-3'>
                <div className='h-20 rounded bg-slate-700' />
                <div className='h-20 rounded bg-slate-700' />
                <div className='h-20 rounded bg-slate-700' />
              </div>
            </div>
          </WidgetSkeleton>
        )}

        {/* Error State */}
        {state === 'error' && (
          <WidgetError
            message='Unable to load widget data'
            error={new Error('Network request failed')}
            onRetry={() => setState('loading')}
          />
        )}

        {/* Empty State */}
        {state === 'empty' && (
          <WidgetEmpty
            message='No data yet'
            description='Start by adding some items to see them here'
            action={{
              label: 'Add First Item',
              onClick: () => alert('Add item clicked'),
            }}
          />
        )}

        {/* Normal Content */}
        {state === 'data' && (
          <div className='space-y-3'>
            <div className='rounded bg-slate-800 p-4'>
              <h3 className='mb-2 font-semibold'>Content Item 1</h3>
              <p className='text-sm text-slate-400'>This is your widget content</p>
            </div>
            <div className='rounded bg-slate-800 p-4'>
              <h3 className='mb-2 font-semibold'>Content Item 2</h3>
              <p className='text-sm text-slate-400'>More widget content here</p>
            </div>
            <Button onClick={handleAction} className='w-full'>
              Perform Action
            </Button>
          </div>
        )}

        {/* State Toggle Buttons */}
        <div className='mt-4 flex gap-2'>
          <Button size='sm' variant='outline' onClick={() => setState('loading')}>
            Loading
          </Button>
          <Button size='sm' variant='outline' onClick={() => setState('error')}>
            Error
          </Button>
          <Button size='sm' variant='outline' onClick={() => setState('empty')}>
            Empty
          </Button>
          <Button size='sm' variant='outline' onClick={() => setState('data')}>
            Data
          </Button>
        </div>

        {/* Loading Overlay */}
        <WidgetLoadingOverlay
          isLoading={overlayLoading}
          message='Processing...'
          blur={true}
        />
      </CardContent>
    </Card>
  );
}

// ================================
// Example 3: 自定義樣式和圖標
// ================================

export function ExampleWidgetWithCustomStyles() {
  const [showEmpty, setShowEmpty] = useState(true);
  const [showError, setShowError] = useState(false);

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Custom Styled States</CardTitle>
      </CardHeader>
      <CardContent>
        {showEmpty && (
          <WidgetEmpty
            message='Custom Empty State'
            description='With custom icon and styling'
            icon={
              <svg
                className='h-8 w-8 text-cyan-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
                />
              </svg>
            }
            className='bg-cyan-950/20'
          />
        )}

        {showError && (
          <WidgetError
            message='Custom Error State'
            icon={
              <svg
                className='h-8 w-8 text-orange-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                />
              </svg>
            }
            className='bg-orange-950/20'
            onRetry={() => alert('Custom retry')}
          />
        )}

        <div className='mt-4 flex gap-2'>
          <Button
            size='sm'
            variant='outline'
            onClick={() => {
              setShowEmpty(!showEmpty);
              setShowError(false);
            }}
          >
            Toggle Empty
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={() => {
              setShowError(!showError);
              setShowEmpty(false);
            }}
          >
            Toggle Error
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ================================
// Migration Guide
// ================================

/**
 * Migration from old loading/error states:
 * 
 * Before:
 * ```tsx
 * {loading ? (
 *   <div className='animate-pulse'>
 *     <div className='h-8 w-24 rounded bg-slate-700'></div>
 *     <div className='mt-2 h-4 w-16 rounded bg-slate-700'></div>
 *   </div>
 * ) : error ? (
 *   <div className='text-sm text-red-400'>{error}</div>
 * ) : (
 *   <div>Your content</div>
 * )}
 * ```
 * 
 * After (Option 1 - StateWrapper):
 * ```tsx
 * <WidgetStateWrapper
 *   loading={loading}
 *   error={error}
 *   empty={data.length === 0}
 *   onRetry={handleRetry}
 * >
 *   <div>Your content</div>
 * </WidgetStateWrapper>
 * ```
 * 
 * After (Option 2 - Individual components):
 * ```tsx
 * {loading && <WidgetSkeleton rows={3} />}
 * {error && <WidgetError message={error} onRetry={handleRetry} />}
 * {!loading && !error && data.length === 0 && <WidgetEmpty />}
 * {!loading && !error && data.length > 0 && <div>Your content</div>}
 * ```
 */