'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useAdminRefresh } from '@/app/admin/contexts/AdminRefreshContext';
import { TrendingUp } from 'lucide-react';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';
import { format } from 'date-fns';
import { useGraphQLFallback } from '@/app/admin/hooks/useGraphQLFallback';
import { useInViewport } from '@/app/admin/hooks/useInViewport';
import { ChartContainer } from './common/charts/ChartContainer';
import { LineChartSkeleton } from './common/charts/ChartSkeleton';
import gql from 'graphql-tag';

// GraphQL query for stock level snapshots from inventory table
// 注意：這個查詢假設我們有一個方式追蹤庫存歷史快照
// 實際上可能需要使用 RPC function 或專門的歷史表
const GET_STOCK_LEVEL_HISTORY = gql`
  query GetStockLevelHistory($productCodes: [String!]!, $startDate: String!, $endDate: String!) {
    record_inventoryCollection(
      filter: {
        product_code: { in: $productCodes }
        latest_update: { gte: $startDate, lte: $endDate }
      }
      orderBy: [{ latest_update: AscNullsLast }]
    ) {
      edges {
        node {
          product_code
          injection
          pipeline
          prebook
          await
          fold
          bulk
          backcarpark
          damage
          latest_update
        }
      }
    }
  }
`;

interface ChartDataPoint {
  time: string;
  timestamp: Date;
  [key: string]: any; // 動態的產品代碼欄位
}

interface StockData {
  stock: string;
  stock_level: number;
  latest_update: string;
}

interface StockLevelHistoryChartProps extends WidgetComponentProps {
  timeFrame?: {
    start: Date;
    end: Date;
  };
  useGraphQL?: boolean;
}

// 顏色調色板
const LINE_COLORS = [
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ef4444', // red-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
];

export const StockLevelHistoryChart: React.FC<StockLevelHistoryChartProps> = ({
  widget,
  isEditMode,
  timeFrame,
  useGraphQL,
}) => {
  // 決定是否使用 GraphQL - 可以通過 widget config 或 props 控制
  const shouldUseGraphQL = useGraphQL ?? (widget as any)?.useGraphQL ?? false;
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [productCodes, setProductCodes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [adjustedTimeFrame, setAdjustedTimeFrame] = useState<{ start: Date; end: Date } | null>(
    null
  );
  const { refreshTrigger } = useAdminRefresh();
  const dashboardAPI = useMemo(() => createDashboardAPI(), []);
  
  // Progressive loading setup
  const chartRef = useRef<HTMLDivElement>(null);
  const { isInViewport, hasBeenInViewport } = useInViewport(chartRef, {
    threshold: 0.1,
    rootMargin: '50px',
    triggerOnce: true,
  });

  // 計算調整後的時間範圍
  const calculateAdjustedTimeFrame = useCallback(
    (originalTimeFrame?: { start: Date; end: Date }) => {
      const now = new Date();
      const twoWeeksAgo = new Date(now);
      twoWeeksAgo.setDate(now.getDate() - 14);

      // 如果沒有提供時間範圍，使用預設2週
      if (!originalTimeFrame) {
        console.log('[StockLevelHistoryChart] No timeFrame provided, using default 2 weeks');
        return { start: twoWeeksAgo, end: now };
      }

      const duration = originalTimeFrame.end.getTime() - originalTimeFrame.start.getTime();
      const days = duration / (1000 * 60 * 60 * 24);

      // 如果時間範圍太短（少於1天），使用預設2週
      if (days < 1) {
        console.log('[StockLevelHistoryChart] Time range too short, using default 2 weeks');
        return { start: twoWeeksAgo, end: now };
      }

      // 根據選擇的時間範圍調整顯示範圍
      if (days <= 14) {
        // 少於2週，使用原範圍
        return originalTimeFrame;
      } else if (days <= 21) {
        // 2-3週，顯示3週
        const threeWeeksAgo = new Date(now);
        threeWeeksAgo.setDate(now.getDate() - 21);
        return { start: threeWeeksAgo, end: now };
      } else if (days <= 28) {
        // 3-4週，顯示4週
        const fourWeeksAgo = new Date(now);
        fourWeeksAgo.setDate(now.getDate() - 28);
        return { start: fourWeeksAgo, end: now };
      } else if (days <= 60) {
        // 4週-2個月，顯示2個月
        const twoMonthsAgo = new Date(now);
        twoMonthsAgo.setMonth(now.getMonth() - 2);
        return { start: twoMonthsAgo, end: now };
      } else if (days <= 90) {
        // 2-3個月，顯示3個月
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return { start: threeMonthsAgo, end: now };
      } else {
        // 超過3個月，最多顯示6個月
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        return { start: sixMonthsAgo, end: now };
      }
    },
    []
  );

  // 更新調整後的時間範圍
  useEffect(() => {
    console.log('[StockLevelHistoryChart] timeFrame prop:', timeFrame);
    const adjusted = calculateAdjustedTimeFrame(timeFrame);
    console.log('[StockLevelHistoryChart] adjusted timeFrame:', adjusted);
    setAdjustedTimeFrame(adjusted);
  }, [timeFrame, calculateAdjustedTimeFrame]);

  // Server action fallback for stock history data
  const fetchStockHistoryServerAction = useCallback(
    async (variables?: { productCodes: string[]; startDate: string; endDate: string }) => {
      if (!variables || !adjustedTimeFrame || variables.productCodes.length === 0) {
        return { chartData: [], productCodes: [] };
      }

      const limitedProducts = variables.productCodes.slice(0, 10);

      try {
        const result = await dashboardAPI.fetch(
          {
            widgetIds: ['statsCard'],
            dateRange: {
              start: variables.startDate,
              end: variables.endDate,
            },
            params: {
              dataSource: 'stock_level_history',
              productCodes: limitedProducts,
              timeSegments: 24,
            },
          },
          {
            strategy: 'server',
            cache: { ttl: 60 }, // 1分鐘緩存
          }
        );

        if (result.widgets && result.widgets.length > 0) {
          const widgetData = result.widgets[0];
          if (!widgetData.data.error) {
            const historyData = widgetData.data.value || [];
            return { chartData: historyData, productCodes: limitedProducts };
          }
        }
        
        return { chartData: [], productCodes: [] };
      } catch (error) {
        console.error('[StockLevelHistoryChart] Server action error:', error);
        return { chartData: [], productCodes: [] };
      }
    },
    [dashboardAPI, adjustedTimeFrame]
  );

  // GraphQL variables setup
  const graphqlVariables = useMemo(
    () => {
      if (!adjustedTimeFrame || productCodes.length === 0) {
        return null;
      }
      return {
        productCodes: productCodes.slice(0, 10),
        startDate: adjustedTimeFrame.start.toISOString(),
        endDate: adjustedTimeFrame.end.toISOString(),
      };
    },
    [adjustedTimeFrame, productCodes]
  );

  // Use the unified GraphQL fallback hook
  const { data, loading, error, refetch } = useGraphQLFallback({
    graphqlQuery: shouldUseGraphQL ? GET_STOCK_LEVEL_HISTORY : undefined,
    serverAction: fetchStockHistoryServerAction,
    variables: graphqlVariables,
    skip: !graphqlVariables || !hasBeenInViewport,
    fallbackEnabled: true,
    widgetId: 'stock-level-history',
    onCompleted: (data) => {
      if (data.chartData) {
        setChartData(data.chartData);
        setProductCodes(data.productCodes || productCodes);
      }
    },
  });

  // Update chart data when data changes
  useEffect(() => {
    if (data?.chartData) {
      setChartData(data.chartData);
      if (data.productCodes) {
        setProductCodes(data.productCodes);
      }
    }
  }, [data]);

  // 監聽 StockTypeSelector 的類型變更事件
  useEffect(() => {
    const handleTypeChange = (event: CustomEvent) => {
      console.log('[StockLevelHistoryChart] Received stockTypeChanged event:', event.detail);
      const { type, data } = event.detail;
      setSelectedType(type);

      // 獲取該類型所有產品的代碼（限制最多10個）
      const codes = data.map((item: any) => item.stock).slice(0, 10);
      console.log('[StockLevelHistoryChart] Product codes:', codes);

      if (codes.length > 0) {
        setProductCodes(codes);
      } else {
        console.log('[StockLevelHistoryChart] No product codes, clearing data');
        setChartData([]);
        setProductCodes([]);
      }
    };

    window.addEventListener('stockTypeChanged', handleTypeChange as EventListener);
    return () => {
      window.removeEventListener('stockTypeChanged', handleTypeChange as EventListener);
    };
  }, []);

  // 初始化時設定預設時間範圍
  useEffect(() => {
    if (!timeFrame) {
      const now = new Date();
      const twoWeeksAgo = new Date(now);
      twoWeeksAgo.setDate(now.getDate() - 14);
      setAdjustedTimeFrame({ start: twoWeeksAgo, end: now });
    }
  }, [timeFrame]);

  // 當刷新觸發器改變時，重新加載數據
  const prevRefreshTriggerRef = React.useRef(refreshTrigger);
  useEffect(() => {
    // 只在 refreshTrigger 真正改變時重新加載
    if (productCodes.length > 0 && refreshTrigger !== prevRefreshTriggerRef.current) {
      console.log('[StockLevelHistoryChart] Refresh triggered, reloading data');
      prevRefreshTriggerRef.current = refreshTrigger;
      refetch();
    }
  }, [refreshTrigger, productCodes.length, refetch]);

  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className='rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-lg'>
          <p className='mb-2 text-sm font-medium text-white'>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className='text-xs'>
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className='ml-2 font-medium text-white'>
                {(entry.value || 0).toLocaleString()}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // 自定義圖例
  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className='mt-1 flex flex-wrap justify-center gap-2'>
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className='flex items-center gap-1'>
            <div className='h-2 w-2 rounded-full' style={{ backgroundColor: entry.color }} />
            <span className='text-[10px] text-gray-400'>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  // Return progressive loading skeleton if not in viewport yet
  if (!hasBeenInViewport) {
    return (
      <div ref={chartRef} className="h-full w-full">
        <LineChartSkeleton height="100%" showHeader={false} />
      </div>
    );
  }

  return (
    <div ref={chartRef} className="h-full w-full">
      <ChartContainer
        title="Stock Level History"
        icon={TrendingUp}
        iconColor="from-emerald-500 to-teal-500"
        loading={loading}
        error={error}
        onRetry={refetch}
        onRefresh={refetch}
        refreshing={loading}
        height="100%"
        showHeader={false}
        chartType="line"
        dateRange={adjustedTimeFrame || undefined}
        performanceMetrics={{
          optimized: true,
          source: 'GraphQL Fallback',
        }}
      >
      {chartData.length === 0 || productCodes.length === 0 ? (
        <div className='flex h-full items-center justify-center'>
          <p className='text-center text-sm text-gray-400'>
            Select a product type from the dropdown
            <br />
            to view stock level history
            <br />
            <span className='text-xs'>(最多顯示10款產品)</span>
          </p>
        </div>
      ) : (
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 35 }}>
            <CartesianGrid
              strokeDasharray='3 3'
              stroke='rgba(100, 116, 139, 0.1)'
              vertical={false}
            />
            <XAxis
              dataKey='time'
              stroke='#64748b'
              fontSize={9}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor='end'
              height={50}
              interval={Math.floor(chartData.length / 8)}
            />
            <YAxis
              stroke='#64748b'
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={45}
              tickFormatter={value => {
                if (value >= 1000) {
                  return `${(value / 1000).toFixed(0)}k`;
                }
                return value.toString();
              }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* 為每個產品代碼創建一條線 */}
            {productCodes.map((code, index) => (
              <Line
                key={code}
                type='monotone'
                dataKey={code}
                name={code}
                stroke={LINE_COLORS[index % LINE_COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
    </div>
  );
};

export default StockLevelHistoryChart;
