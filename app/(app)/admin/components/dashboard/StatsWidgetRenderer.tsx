/**
 * Stats Widget Renderer
 * 處理所有統計數據類型的 Widget 渲染
 */

'use client';

import React from 'react';
import { WidgetComponentProps } from './widget-renderer-shared';
import {
  BaseWidgetRendererProps,
  createErrorFallback,
  getComponentPropsFactory,
} from './widget-renderer-shared';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CubeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export const StatsWidgetRenderer: React.FC<BaseWidgetRendererProps> = ({
  config,
  theme,
  timeFrame,
  data,
  loading,
  error,
  renderLazyComponent,
}) => {
  const getComponentProps = getComponentPropsFactory(config, timeFrame, theme);

  // 創建符合 WidgetComponentProps 的 props 對象
  const createWidgetProps = (widgetData?: unknown): WidgetComponentProps => {
    return {
      config,
      timeFrame,
      theme,
      data: widgetData as Record<string, unknown>,
    };
  };

  if (loading) {
    return <div>Loading stats...</div>;
  }

  if (error) {
    return createErrorFallback(config.type, error);
  }

  try {
    switch (config.type) {
      case 'AwaitLocationQtyWidget':
        return renderLazyComponent('AwaitLocationQtyWidget', createWidgetProps(data));

      case 'YesterdayTransferCountWidget':
        return renderLazyComponent('YesterdayTransferCountWidget', createWidgetProps(data));

      case 'StillInAwaitWidget':
        return renderLazyComponent('StillInAwaitWidget', createWidgetProps(data));

      case 'StillInAwaitPercentageWidget':
        return renderLazyComponent('StillInAwaitPercentageWidget', createWidgetProps(data));

      case 'production_summary':
      case 'production_details':
        return renderLazyComponent('ProductionDetailsWidget', createWidgetProps(data));

      case 'work_level':
      case 'pipeline_work_level':
        return renderLazyComponent('StaffWorkloadWidget', createWidgetProps(data));

      case 'pipeline_production_details':
        return renderLazyComponent('ProductionDetailsWidget', createWidgetProps(data));

      case 'system_status':
        return (
          <div className='h-full w-full p-4'>
            <h3 className='mb-4 text-lg font-semibold'>系統狀態</h3>
            <div className='space-y-3'>
              <div className='flex items-center justify-between rounded-lg bg-green-50 p-3'>
                <div className='flex items-center space-x-2'>
                  <CheckCircleIcon className='h-5 w-5 text-green-600' />
                  <span className='text-sm font-medium'>系統運行正常</span>
                </div>
                <span className='text-xs text-green-600'>99.9% 正常運行時間</span>
              </div>
              <div className='flex items-center justify-between rounded-lg bg-blue-50 p-3'>
                <div className='flex items-center space-x-2'>
                  <CubeIcon className='h-5 w-5 text-blue-600' />
                  <span className='text-sm font-medium'>數據庫連接</span>
                </div>
                <span className='text-xs text-blue-600'>正常</span>
              </div>
              <div className='flex items-center justify-between rounded-lg bg-yellow-50 p-3'>
                <div className='flex items-center space-x-2'>
                  <ClockIcon className='h-5 w-5 text-yellow-600' />
                  <span className='text-sm font-medium'>響應時間</span>
                </div>
                <span className='text-xs text-yellow-600'>125ms</span>
              </div>
            </div>
          </div>
        );

      case 'stats':
        // 通用統計處理 - 添加類型安全檢查
        const defaultStats = { value: 0, change: 0 };
        let statsData = defaultStats;

        if (data && typeof data === 'object' && data !== null) {
          const value = 'value' in data ? data.value : 0;
          const change = 'change' in data ? data.change : 0;
          statsData = {
            value:
              typeof value === 'number'
                ? value
                : typeof value === 'string'
                  ? parseFloat(value) || 0
                  : 0,
            change:
              typeof change === 'number'
                ? change
                : typeof change === 'string'
                  ? parseFloat(change) || 0
                  : 0,
          };
        }

        const isPositive = statsData.change >= 0;

        return (
          <div className='h-full w-full p-4'>
            <div className='text-center'>
              <div className='mb-2 text-3xl font-bold'>
                {typeof statsData.value === 'number'
                  ? statsData.value.toLocaleString()
                  : String(statsData.value)}
              </div>
              <div
                className={`flex items-center justify-center space-x-1 text-sm ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {isPositive ? (
                  <ArrowTrendingUpIcon className='h-4 w-4' />
                ) : (
                  <ArrowTrendingDownIcon className='h-4 w-4' />
                )}
                <span>{Math.abs(statsData.change)}%</span>
              </div>
              <div className='mt-1 text-xs text-gray-500'>{config.title || 'Statistics'}</div>
            </div>
          </div>
        );

      case 'performance-monitor':
        return renderLazyComponent('UnifiedStatsWidget', createWidgetProps(data));

      case 'system-health':
        return renderLazyComponent('UnifiedStatsWidget', createWidgetProps(data));

      default:
        return createErrorFallback(`Unknown stats type: ${config.type}`);
    }
  } catch (err) {
    console.error('StatsWidgetRenderer error:', err);
    return createErrorFallback(
      config.type,
      err instanceof Error ? (err as { message: string }).message : 'Unknown error'
    );
  }
};
