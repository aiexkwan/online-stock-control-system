/**
 * Top Products by Quantity Widget - REST API Version
 * 顯示指定時間範圍內產量最高的前10個產品
 * 用於 Injection Dashboard
 *
 * v1.4 GraphQL Cleanup:
 * - 完全移除 GraphQL 代碼
 * - 使用純 REST API 調用
 * - 簡化代碼結構
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/types/components/dashboard';
import { motion } from 'framer-motion';
import { format, startOfDay, endOfDay } from 'date-fns';
import { createDashboardAPIClient as createDashboardAPI } from '@/lib/api/admin/DashboardAPI.client';
import { WidgetSkeleton, WidgetError } from './common/WidgetStates';

interface ProductData {
  product_code: string;
  total_qty: number;
  description?: string;
  colour?: string;
  type?: string;
}

export const TopProductsByQuantityWidget = React.memo(function TopProductsByQuantityWidget({
  widget,
  isEditMode,
  timeFrame,
}: WidgetComponentProps) {
  const [topProducts, setTopProducts] = useState<ProductData[]>([]);

  // 根據 timeFrame 設定查詢時間範圍
  const { startDate, endDate } = useMemo(() => {
    if (!timeFrame) {
      const today = new Date();
      return {
        startDate: startOfDay(today).toISOString(),
        endDate: endOfDay(today).toISOString(),
      };
    }
    return {
      startDate: timeFrame.start.toISOString(),
      endDate: timeFrame.end.toISOString(),
    };
  }, [timeFrame]);

  // API 狀態管理
  const [loading, setLoading] = useState(!isEditMode);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const dashboardAPI = createDashboardAPI();
        const result = await dashboardAPI.fetch(
          {
            widgetIds: ['top_products_by_quantity'],
            dateRange: { start: startDate, end: endDate },
          },
          {
            strategy: 'server',
            cache: { ttl: 300 },
          }
        );

        if (result.widgets && result.widgets.length > 0) {
          const data = result.widgets[0].data;
          if (
            typeof data === 'object' &&
            data !== null &&
            'products' in data &&
            Array.isArray(data.products)
          ) {
            setTopProducts(data.products);
          }
        }
      } catch (err) {
        console.error('Error fetching top products:', err);
        setError(err instanceof Error ? (err as { message: string }).message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, isEditMode]);

  // 獲取實際數據時間範圍（用於顯示）
  const displayDateRange = useMemo(() => {
    const start = timeFrame?.start || new Date();
    const end = timeFrame?.end || new Date();

    if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
      return format(start, 'MMM d, yyyy');
    }

    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  }, [timeFrame]);

  if (isEditMode) {
    return (
      <WidgetCard widgetType='custom' isEditMode={true}>
        <div className='flex h-full items-center justify-center'>
          <p className='font-medium text-slate-400'>Top Products by Quantity</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widgetType='custom'>
      <CardHeader className='pb-2'>
        <CardTitle className='widget-title flex items-center gap-2'>
          <ChartBarIcon className='h-5 w-5' />
          Top 10 Products by Quantity
        </CardTitle>
        <p className='mt-1 text-xs text-slate-400'>
          {displayDateRange}
          <span className='ml-2 text-xs text-green-400'>✓ REST API</span>
        </p>
      </CardHeader>
      <CardContent className='flex-1 overflow-auto'>
        {loading ? (
          <WidgetSkeleton type='list' rows={10} />
        ) : error ? (
          <WidgetError
            message={error || 'Failed to load top products'}
            severity='error'
            display='compact'
          />
        ) : topProducts.length === 0 ? (
          <div className='flex h-full items-center justify-center'>
            <p className='text-sm text-slate-400'>No production data</p>
          </div>
        ) : (
          <div className='space-y-2'>
            {topProducts.map((product, index) => {
              const maxQty = topProducts[0]?.total_qty || 1;
              const percentage = (product.total_qty / maxQty) * 100;

              return (
                <motion.div
                  key={product.product_code}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className='relative'
                >
                  <div className='flex items-center justify-between py-1'>
                    <div className='flex items-center space-x-2'>
                      <span className='text-xs font-medium text-slate-500'>#{index + 1}</span>
                      <div>
                        <p className='text-sm font-medium text-white'>{product.product_code}</p>
                        {product.description && (
                          <p className='max-w-[200px] truncate text-xs text-slate-400'>
                            {product.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className='text-sm font-bold text-white'>
                      {product.total_qty.toLocaleString()}
                    </span>
                  </div>
                  <div className='absolute bottom-0 left-0 h-1 rounded bg-blue-500/20'>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className='h-full rounded bg-blue-500'
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </WidgetCard>
  );
});

export default TopProductsByQuantityWidget;

/**
 * v1.4 GraphQL Cleanup completed on 2025-07-16
 *
 * Changes:
 * - 完全移除 GraphQL 代碼和依賴
 * - 使用純 REST API 調用
 * - 簡化代碼結構，減少複雜性
 * - 保持原有 UI 和功能不變
 *
 * Features:
 * - REST API 數據獲取
 * - 統一的錯誤處理
 * - 5分鐘緩存 (TTL: 300s)
 * - 動畫效果保持不變
 */
