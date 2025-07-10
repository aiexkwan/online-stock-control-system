/**
 * Await Location Qty Widget - Batch Query Version
 * 顯示 record_inventory 表內 await 欄位的總和
 * 使用批量查詢系統優化性能
 * 
 * Updated to use DashboardDataContext:
 * - 移除獨立的 GraphQL queries 和 Server Actions
 * - 使用 useWidgetData hook 從批量查詢獲取數據
 * - 保持原有功能和 UI 不變，特別是動畫效果
 * - 統一的錯誤處理和加載狀態
 */

'use client';

import React from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import {
  BuildingOfficeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useWidgetData } from '@/app/admin/contexts/DashboardDataContext';
import { WidgetSkeleton, WidgetError } from '@/app/admin/components/dashboard/widgets/common/WidgetStates';

interface AwaitLocationQtyData {
  locations: Array<{
    location: string;
    quantity: number;
    lastUpdated: string;
  }>;
  totalAwaitingQty: number;
}

const AwaitLocationQtyWidget = React.memo(function AwaitLocationQtyWidget({
  widget,
  isEditMode,
}: WidgetComponentProps) {
  // 使用批量查詢系統獲取數據
  const { data: rawData, loading, error, refetch } = useWidgetData<AwaitLocationQtyData>('awaitLocationQty');
  
  // 處理數據格式
  const data = React.useMemo(() => {
    if (!rawData) {
      return {
        count: 0,
        trend: 0,
      };
    }
    
    return {
      count: rawData.totalAwaitingQty || 0,
      trend: 0, // 暫時設為 0，可以之後加入趨勢計算
    };
  }, [rawData]);

  if (isEditMode) {
    return (
      <WidgetCard widgetType='custom' isEditMode={true}>
        <div className='flex h-full items-center justify-center'>
          <p className='text-gray-400'>Await Location Qty Widget</p>
        </div>
      </WidgetCard>
    );
  }

  // 處理 loading 狀態
  if (loading) {
    return (
      <WidgetCard widgetType='custom'>
        <CardHeader className='pb-2'>
          <CardTitle className='widget-title flex items-center gap-2'>
            <BuildingOfficeIcon className='h-5 w-5' />
            Await Location Qty
          </CardTitle>
        </CardHeader>
        <CardContent className='flex flex-1 items-center justify-center'>
          <WidgetSkeleton rows={1}>
            <div className='space-y-2'>
              <div className='h-8 w-24 rounded bg-slate-700'></div>
              <div className='h-4 w-16 rounded bg-slate-700'></div>
            </div>
          </WidgetSkeleton>
        </CardContent>
      </WidgetCard>
    );
  }

  // 處理錯誤狀態
  if (error) {
    return (
      <WidgetCard widgetType='custom'>
        <CardHeader className='pb-2'>
          <CardTitle className='widget-title flex items-center gap-2'>
            <BuildingOfficeIcon className='h-5 w-5' />
            Await Location Qty
          </CardTitle>
        </CardHeader>
        <CardContent className='flex flex-1 items-center justify-center'>
          <WidgetError
            message={error.message || 'Failed to load await location data'}
            onRetry={refetch}
            className='py-4'
          />
        </CardContent>
      </WidgetCard>
    );
  }

  // 正常顯示數據
  return (
    <WidgetCard widgetType='custom'>
      <CardHeader className='pb-2'>
        <CardTitle className='widget-title flex items-center gap-2'>
          <BuildingOfficeIcon className='h-5 w-5' />
          Await Location Qty
        </CardTitle>
      </CardHeader>
      <CardContent className='flex flex-1 items-center justify-center'>
        <div className='text-center'>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className='mb-2 text-4xl font-bold text-white'
          >
            {(data.count || 0).toLocaleString()}
          </motion.div>
          <p className='text-xs text-slate-400'>Pallets</p>

          {/* Performance indicator - 批量查詢系統自動優化 */}
          <div className='mt-1 flex items-center justify-center gap-1 text-xs text-green-400'>
            <span>⚡</span>
            <span>Batch Query Optimized</span>
          </div>

          {data.trend !== 0 && (
            <div
              className={cn(
                'mt-2 flex items-center justify-center gap-1 text-sm',
                data.trend > 0 ? 'text-green-400' : 'text-red-400'
              )}
            >
              {data.trend > 0 ? (
                <ArrowTrendingUpIcon className='h-4 w-4' />
              ) : (
                <ArrowTrendingDownIcon className='h-4 w-4' />
              )}
              <span>{Math.abs(data.trend).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </WidgetCard>
  );
});

export default AwaitLocationQtyWidget;

/**
 * Batch Query Migration completed on 2025-07-10
 * 
 * Features:
 * - 使用 DashboardDataContext 批量查詢系統
 * - 統一的錯誤處理和加載狀態
 * - 保持原有的動畫效果和 UI
 * - 自動緩存和性能優化
 * 
 * 優化:
 * - 移除了獨立的 GraphQL queries 和 Server Actions
 * - 減少了組件複雜度
 * - 改善了性能（批量查詢）
 * - 統一的數據獲取模式
 */
