/**
 * 統計卡片小部件 - Batch Query Version
 * 通用統計卡片，使用批量查詢系統優化性能
 * 
 * Updated to use DashboardDataContext:
 * - 移除獨立的 GraphQL queries 和 Server Actions
 * - 使用 useWidgetData hook 從批量查詢獲取數據
 * - 保持原有功能和 UI 不變
 * - 支援所有原有的數據源
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Package, AlertCircle } from 'lucide-react';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useWidgetData } from '@/app/admin/contexts/DashboardDataContext';
import { iconColors } from '@/app/utils/dialogStyles';
import { WidgetSkeleton, WidgetError } from '@/app/admin/components/dashboard/widgets/common/WidgetStates';

interface StatsData {
  value: number | string;
  trend?: number;
  label?: string;
}

interface StatsCardWidgetProps extends WidgetComponentProps {}

const StatsCardWidget = React.memo(function StatsCardWidget({
  widget,
  isEditMode,
}: StatsCardWidgetProps) {
  const dataSource = widget.config.dataSource as string || 'total_pallets';
  
  // 使用批量查詢系統獲取數據
  const { data: rawData, loading, error, refetch } = useWidgetData<StatsData>(dataSource);
  
  // 處理數據格式
  const data: StatsData = React.useMemo(() => {
    if (!rawData) {
      // Fallback for static values
      return {
        value: (widget.config.staticValue as string | number) || 0,
        label: (widget.config.label as string) || 'Stats',
      };
    }
    
    return {
      value: rawData.value || 0,
      label: rawData.label || (widget.config.label as string) || 'Stats',
      trend: rawData.trend,
    };
  }, [rawData, widget.config]);

  const getIcon = () => {
    switch (widget.config.icon) {
      case 'package':
        return <Package className={`h-4 w-4 ${iconColors.blue}`} />;
      case 'trending-up':
        return <TrendingUp className={`h-4 w-4 ${iconColors.green}`} />;
      case 'trending-down':
        return <TrendingDown className={`h-4 w-4 ${iconColors.red}`} />;
      case 'alert':
        return <AlertCircle className={`h-4 w-4 ${iconColors.yellow}`} />;
      default:
        return <Package className={`h-4 w-4 ${iconColors.blue}`} />;
    }
  };

  // 處理 loading 狀態
  if (loading) {
    return (
      <Card className={`h-full border border-slate-700/50 bg-slate-900/95 shadow-2xl backdrop-blur-xl ${isEditMode ? 'border-2 border-dashed border-blue-500/50' : ''}`}>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text text-sm font-medium text-transparent'>
            {'title' in widget ? widget.title : 'Stats'}
          </CardTitle>
          {getIcon()}
        </CardHeader>
        <CardContent>
          <WidgetSkeleton rows={1}>
            <div className='space-y-2'>
              <div className='h-8 w-24 rounded bg-slate-700'></div>
              <div className='h-4 w-16 rounded bg-slate-700'></div>
            </div>
          </WidgetSkeleton>
        </CardContent>
      </Card>
    );
  }

  // 處理錯誤狀態
  if (error) {
    return (
      <Card className={`h-full border border-slate-700/50 bg-slate-900/95 shadow-2xl backdrop-blur-xl ${isEditMode ? 'border-2 border-dashed border-blue-500/50' : ''}`}>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text text-sm font-medium text-transparent'>
            {'title' in widget ? widget.title : 'Stats'}
          </CardTitle>
          {getIcon()}
        </CardHeader>
        <CardContent>
          <WidgetError
            message={error.message || 'Failed to load stats'}
            onRetry={refetch}
            className='py-4'
          />
        </CardContent>
      </Card>
    );
  }

  // 正常顯示數據
  return (
    <Card
      className={`h-full border border-slate-700/50 bg-slate-900/95 shadow-2xl backdrop-blur-xl ${isEditMode ? 'border-2 border-dashed border-blue-500/50' : ''}`}
    >
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text text-sm font-medium text-transparent'>
          {'title' in widget ? widget.title : 'Stats'}
        </CardTitle>
        {getIcon()}
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold text-white'>{data.value}</div>
        {data.label && <p className='text-xs text-slate-400'>{data.label}</p>}
        {data.trend !== undefined && (
          <p className={`text-xs ${data.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {data.trend > 0 ? '+' : ''}
            {data.trend}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  );
});

export default StatsCardWidget;

/**
 * Batch Query Migration completed on 2025-07-10
 * 
 * Features:
 * - 使用 DashboardDataContext 批量查詢系統
 * - 支援所有原有數據源
 * - 統一的錯誤處理和加載狀態
 * - 保持原有的動畫效果和 UI
 * - 自動緩存和性能優化
 * 
 * 優化:
 * - 移除了大量獨立的 GraphQL queries
 * - 減少了組件複雜度
 * - 改善了性能（批量查詢）
 * - 統一的數據獲取模式
 */
