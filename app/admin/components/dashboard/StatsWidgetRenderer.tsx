/**
 * Stats Widget Renderer  
 * 處理所有統計數據類型的 Widget 渲染
 */

'use client';

import React from 'react';
import { 
  BaseWidgetRendererProps,
  createErrorFallback,
  getComponentPropsFactory 
} from './widget-renderer-shared';
import { 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CubeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export const StatsWidgetRenderer: React.FC<BaseWidgetRendererProps> = ({
  config,
  theme,
  timeFrame,
  data,
  loading,
  error,
  renderLazyComponent
}) => {
  const getComponentProps = getComponentPropsFactory(config, timeFrame, theme);
  
  if (loading) {
    return <div>Loading stats...</div>;
  }
  
  if (error) {
    return createErrorFallback(config.type, error);
  }

  try {
    switch (config.type) {
      case 'AwaitLocationQtyWidget':
        return renderLazyComponent('AwaitLocationQtyWidget', getComponentProps(data));
        
      case 'YesterdayTransferCountWidget':
        return renderLazyComponent('YesterdayTransferCountWidget', getComponentProps(data));
        
      case 'StillInAwaitWidget':
        return renderLazyComponent('StillInAwaitWidget', getComponentProps(data));
        
      case 'StillInAwaitPercentageWidget':
        return renderLazyComponent('StillInAwaitPercentageWidget', getComponentProps(data));
        
      case 'production_summary':
      case 'production_details':
        return renderLazyComponent('ProductionDetailsWidget', getComponentProps(data));
        
      case 'work_level':
      case 'pipeline_work_level':
        return renderLazyComponent('StaffWorkloadWidget', getComponentProps(data));
        
      case 'pipeline_production_details':
        return renderLazyComponent('ProductionDetailsWidget', getComponentProps(data));
        
      case 'system_status':
        return (
          <div className="h-full w-full p-4">
            <h3 className="mb-4 text-lg font-semibold">系統狀態</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">系統運行正常</span>
                </div>
                <span className="text-xs text-green-600">99.9% 正常運行時間</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CubeIcon className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">數據庫連接</span>
                </div>
                <span className="text-xs text-blue-600">正常</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium">響應時間</span>
                </div>
                <span className="text-xs text-yellow-600">125ms</span>
              </div>
            </div>
          </div>
        );
        
      case 'stats':
        // 通用統計處理
        const statsData = data || { value: 0, change: 0 };
        const isPositive = statsData.change >= 0;
        
        return (
          <div className="h-full w-full p-4">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                {typeof statsData.value === 'number' 
                  ? statsData.value.toLocaleString() 
                  : statsData.value}
              </div>
              <div className={`flex items-center justify-center space-x-1 text-sm ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositive ? (
                  <ArrowTrendingUpIcon className="h-4 w-4" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4" />
                )}
                <span>{Math.abs(statsData.change)}%</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {config.title || 'Statistics'}
              </div>
            </div>
          </div>
        );
        
      default:
        return createErrorFallback(`Unknown stats type: ${config.type}`);
    }
  } catch (err) {
    console.error('StatsWidgetRenderer error:', err);
    return createErrorFallback(config.type, err instanceof Error ? err.message : 'Unknown error');
  }
};