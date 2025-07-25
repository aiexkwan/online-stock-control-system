/**
 * 範例 Widget - 展示如何使用統一類型系統
 * Example Widget - Demonstrates how to use the unified type system
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  // 基礎類型
  BaseWidgetProps,
  WidgetState,
  WidgetType,
  WidgetErrorType,

  // 狀態管理
  createInitialWidgetState,
  WidgetActionType,
  widgetStateReducer,
  widgetStateSelectors,

  // 數據類型
  StatsCardData,
  ApiMetadata,
  WidgetCallbacks,

  // 常量和工具
  WIDGET_CONSTANTS,
  WIDGET_SIZE_CLASSES,
  WIDGET_ANIMATION_VARIANTS,
  WIDGET_TRANSITION,
  isWidgetError,
  WidgetDataMapper,
} from '@/types/widgets';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * 擴展 Widget 屬性接口
 * Extended widget props interface
 */
interface ExampleWidgetProps extends BaseWidgetProps, WidgetCallbacks {
  // 額外的自定義屬性
  showTrend?: boolean;
  theme?: 'light' | 'dark';
}

/**
 * 自定義數據類型
 * Custom data type
 */
interface ExampleWidgetData extends StatsCardData {
  customMetric?: number;
  lastUpdatedBy?: string;
}

/**
 * 範例 Widget 組件
 * Example Widget Component
 */
export const ExampleWidget: React.FC<ExampleWidgetProps> = ({
  widgetId,
  config,
  className,
  isEditMode = false,
  onUpdate,
  onRemove,
  onRefresh,
  timeFrame,
  showTrend = true,
  theme = 'light',
  // WidgetCallbacks
  onError,
  onSuccess,
  onComplete,
  onStateChange,
}) => {
  // 使用統一的狀態管理
  const [state, setState] = useState<WidgetState<ExampleWidgetData>>(
    createInitialWidgetState<ExampleWidgetData>(widgetId)
  );

  // 使用狀態選擇器
  const isReady = widgetStateSelectors.isReady(state);
  const hasData = widgetStateSelectors.hasData(state);
  const isStale = widgetStateSelectors.isStale(
    state,
    config?.refreshInterval || WIDGET_CONSTANTS.DEFAULT_REFRESH_INTERVAL
  );

  /**
   * 模擬數據獲取
   * Simulate data fetching
   */
  const fetchData = useCallback(async (): Promise<ExampleWidgetData> => {
    // 模擬 API 延遲
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 模擬錯誤情況（10% 機率）
    if (Math.random() < 0.1) {
      throw new Error('Failed to fetch widget data');
    }

    // 返回模擬數據
    return {
      totalProducts: Math.floor(Math.random() * 1000),
      totalStock: Math.floor(Math.random() * 10000),
      lowStockCount: Math.floor(Math.random() * 50),
      averageStockLevel: Math.random() * 100,
      customMetric: Math.random() * 1000,
      lastUpdatedBy: 'System',
    };
  }, []);

  /**
   * 處理數據加載
   * Handle data loading
   */
  const loadData = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      hasError: false,
      error: null,
    }));

    try {
      const data = await fetchData();

      // 創建元數據
      const metadata: ApiMetadata = {
        queryTime: state.lastUpdated ? Date.now() - state.lastUpdated.getTime() : 0,
        dataSource: 'server',
        timestamp: new Date().toISOString(),
        optimized: true,
      };

      setState(prev => ({
        ...prev,
        isLoading: false,
        data,
        metadata,
        lastUpdated: new Date(),
        hasError: false,
        error: null,
      }));

      // 觸發成功回調
      onSuccess?.(data);
    } catch (error) {
      const widgetError = WidgetDataMapper.createWidgetError(error, 'ExampleWidget');

      setState(prev => ({
        ...prev,
        isLoading: false,
        hasError: true,
        error: {
          ...widgetError,
          type: WidgetErrorType.DATA_ERROR,
        },
      }));

      // 觸發錯誤回調
      onError?.(widgetError);
    } finally {
      // 觸發完成回調
      onComplete?.();
    }
  }, [fetchData, state.lastUpdated, onSuccess, onError, onComplete]);

  /**
   * 處理刷新
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isRefreshing: true,
      refreshCount: prev.refreshCount + 1,
    }));

    await loadData();

    setState(prev => ({
      ...prev,
      isRefreshing: false,
    }));

    // 觸發外部刷新回調
    onRefresh?.();
  }, [loadData, onRefresh]);

  /**
   * 初始加載和自動刷新
   * Initial load and auto refresh
   */
  useEffect(() => {
    // 初始加載
    loadData();

    // 設置自動刷新
    if (config?.refreshInterval && config.refreshInterval > 0) {
      const interval = setInterval(() => {
        if (!state.isRefreshing && !isEditMode) {
          loadData();
        }
      }, config.refreshInterval);

      return () => clearInterval(interval);
    }
  }, [config?.refreshInterval, isEditMode]);

  /**
   * 檢查數據是否需要刷新
   * Check if data needs refresh
   */
  useEffect(() => {
    if (isStale && !state.isLoading && !state.isRefreshing) {
      loadData();
    }
  }, [isStale, state.isLoading, state.isRefreshing, loadData]);

  /**
   * 渲染錯誤狀態
   * Render error state
   */
  if (state.hasError && state.error) {
    return (
      <Card
        className={cn(
          'relative overflow-hidden',
          WIDGET_SIZE_CLASSES[config?.size || 'md'],
          className
        )}
      >
        <CardContent className='flex h-full flex-col items-center justify-center p-6'>
          <AlertCircle className='mb-4 h-12 w-12 text-red-500' />
          <p className='text-center text-sm text-muted-foreground'>{state.error.message}</p>
          <Button onClick={handleRefresh} variant='outline' size='sm' className='mt-4'>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  /**
   * 渲染加載狀態
   * Render loading state
   */
  if (state.isLoading && !state.data) {
    return (
      <Card
        className={cn(
          'relative overflow-hidden',
          WIDGET_SIZE_CLASSES[config?.size || 'md'],
          className
        )}
      >
        <CardContent className='flex h-full items-center justify-center'>
          <RefreshCw className='h-8 w-8 animate-spin text-muted-foreground' />
        </CardContent>
      </Card>
    );
  }

  /**
   * 渲染主要內容
   * Render main content
   */
  return (
    <AnimatePresence mode='wait'>
      <motion.div
        initial={WIDGET_ANIMATION_VARIANTS.hidden}
        animate={WIDGET_ANIMATION_VARIANTS.visible}
        exit={WIDGET_ANIMATION_VARIANTS.exit}
        transition={WIDGET_TRANSITION}
        className={cn(WIDGET_SIZE_CLASSES[config?.size || 'md'], className)}
      >
        <Card
          className={cn(
            'relative h-full overflow-hidden',
            theme === 'dark' && 'bg-gray-900 text-white'
          )}
        >
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-lg font-medium'>
              {config?.title || 'Example Widget'}
            </CardTitle>

            <div className='flex items-center gap-2'>
              {config?.showRefreshButton !== false && (
                <Button
                  onClick={handleRefresh}
                  variant='ghost'
                  size='sm'
                  disabled={state.isRefreshing}
                  className='h-8 w-8 p-0'
                >
                  <RefreshCw className={cn('h-4 w-4', state.isRefreshing && 'animate-spin')} />
                </Button>
              )}

              {isEditMode && onRemove && (
                <Button onClick={onRemove} variant='ghost' size='sm' className='h-8 w-8 p-0'>
                  ×
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {hasData && state.data && (
              <div className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-sm text-muted-foreground'>Total Products</p>
                    <p className='text-2xl font-bold'>
                      {state.data.totalProducts.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className='text-sm text-muted-foreground'>Total Stock</p>
                    <p className='text-2xl font-bold'>{state.data.totalStock.toLocaleString()}</p>
                  </div>
                </div>

                {showTrend && state.data.customMetric && (
                  <div className='flex items-center gap-2 border-t pt-2'>
                    <TrendingUp className='h-4 w-4 text-green-500' />
                    <span className='text-sm text-muted-foreground'>
                      Custom Metric: {state.data.customMetric.toFixed(2)}
                    </span>
                  </div>
                )}

                {state.metadata?.queryTime && (
                  <div className='text-xs text-muted-foreground'>
                    Query time: {state.metadata.queryTime}ms
                  </div>
                )}
              </div>
            )}
          </CardContent>

          {state.isCached && (
            <div className='absolute right-2 top-2'>
              <span className='rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800'>
                Cached
              </span>
            </div>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * 默認導出配置
 * Default export configuration
 */
export default {
  component: ExampleWidget,
  type: WidgetType.STATS,
  defaultConfig: {
    id: 'example-widget',
    type: WidgetType.STATS,
    title: 'Example Stats Widget',
    description: 'A demonstration of the unified widget type system',
    refreshInterval: WIDGET_CONSTANTS.DEFAULT_REFRESH_INTERVAL,
    showRefreshButton: true,
    size: 'md',
  },
};
