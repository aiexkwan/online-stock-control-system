/**
 * Top Products by Quantity Widget - Apollo GraphQL Version
 * 顯示指定時間範圍內產量最高的前10個產品
 * 用於 Injection Dashboard
 * 
 * GraphQL Migration:
 * - 使用 Apollo Client 查詢
 * - 支援 cache-and-network 策略
 * - 保留 Server Actions fallback
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { motion } from 'framer-motion';
import { format, startOfDay, endOfDay } from 'date-fns';
import { createDashboardAPIClient as createDashboardAPI } from '@/lib/api/admin/DashboardAPI.client';
import { useGetTopProductsByQuantityQuery } from '@/lib/graphql/generated/apollo-hooks';
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

  // 使用環境變量控制是否使用 GraphQL
  const useGraphQL = process.env.NEXT_PUBLIC_ENABLE_GRAPHQL_INJECTION === 'true' || 
                     widget?.config?.useGraphQL === true;

  // GraphQL 查詢 - 使用生成嘅 hook
  const { 
    data: graphqlData, 
    loading: graphqlLoading, 
    error: graphqlError 
  } = useGetTopProductsByQuantityQuery({
    skip: !useGraphQL || isEditMode,
    variables: { startDate, endDate },
    pollInterval: 300000, // 5分鐘輪詢
    fetchPolicy: 'cache-and-network',
    onCompleted: (data) => {
      // 處理查詢結果：按產品代碼聚合數量
      const productMap = new Map<string, ProductData>();
      
      data?.record_palletinfoCollection?.edges?.forEach((edge: any) => {
        const { product_code, product_qty, data_code } = edge.node;
        
        if (productMap.has(product_code)) {
          const existing = productMap.get(product_code)!;
          existing.total_qty += product_qty || 0;
        } else {
          productMap.set(product_code, {
            product_code,
            total_qty: product_qty || 0,
            description: data_code?.description,
            colour: data_code?.colour,
            type: data_code?.type,
          });
        }
      });
      
      // 排序並取前10個
      const sorted = Array.from(productMap.values())
        .sort((a, b) => b.total_qty - a.total_qty)
        .slice(0, 10);
      
      setTopProducts(sorted);
    }
  });

  // Server Actions fallback
  const [serverActionsLoading, setServerActionsLoading] = useState(!useGraphQL);
  const [serverActionsError, setServerActionsError] = useState<string | null>(null);

  useEffect(() => {
    if (useGraphQL || isEditMode) return;

    const fetchData = async () => {
      setServerActionsLoading(true);
      setServerActionsError(null);

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
          if (data.products) {
            setTopProducts(data.products);
          }
        }
      } catch (err) {
        console.error('Error fetching top products:', err);
        setServerActionsError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setServerActionsLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, useGraphQL, isEditMode]);

  // 合併 loading 和 error 狀態
  const loading = useGraphQL ? graphqlLoading : serverActionsLoading;
  const error = useGraphQL ? graphqlError?.message : serverActionsError;

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
          {useGraphQL && (
            <span className='ml-2 text-xs text-blue-400'>⚡ GraphQL</span>
          )}
        </p>
      </CardHeader>
      <CardContent className='flex-1 overflow-auto'>
        {loading ? (
          <WidgetSkeleton type="list" rows={10} />
        ) : error ? (
          <WidgetError 
            message={error || "Failed to load top products"}
            severity="error"
            display="compact"
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
                      <span className='text-xs font-medium text-slate-500'>
                        #{index + 1}
                      </span>
                      <div>
                        <p className='text-sm font-medium text-white'>
                          {product.product_code}
                        </p>
                        {product.description && (
                          <p className='text-xs text-slate-400 truncate max-w-[200px]'>
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
 * GraphQL Migration completed on 2025-07-09
 * 
 * Features:
 * - Apollo Client with cache-and-network policy
 * - 5-minute polling for real-time updates
 * - Client-side aggregation by product code
 * - Animated bar chart visualization
 * - Feature flag control: NEXT_PUBLIC_ENABLE_GRAPHQL_INJECTION
 * 
 * Performance improvements:
 * - Efficient data aggregation on client
 * - Apollo cache reduces network requests
 * - Smooth animations with Framer Motion
 */