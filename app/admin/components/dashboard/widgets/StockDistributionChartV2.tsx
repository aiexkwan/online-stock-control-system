/**
 * Stock Distribution Chart V2
 * 使用標準化 useGraphQLFallback hook 進行數據獲取
 * 展示從自定義 useGraphQLQuery 遷移到統一架構
 * 支持 GraphQL 優先，Server Action fallback
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useAdminRefresh } from '@/app/admin/contexts/AdminRefreshContext';
import { useGraphQLFallback } from '@/app/admin/hooks/useGraphQLFallback';
import { gql } from '@apollo/client';
import { WidgetSkeleton, WidgetError } from './common/WidgetStates';
import { 
  brandColors, 
  widgetColors, 
  semanticColors,
  getWidgetCategoryColor 
} from '@/lib/design-system/colors';
import { textClasses, getTextClass } from '@/lib/design-system/typography';
import { spacing, widgetSpacing, spacingUtilities } from '@/lib/design-system/spacing';
import { cn } from '@/lib/utils';

// GraphQL query for stock distribution
const GET_STOCK_DISTRIBUTION = gql`
  query GetStockDistribution {
    record_inventoryCollection {
      edges {
        node {
          product_code
          injection
          pipeline
          prebook
          await
          fold
          bulk
          await_grn
          backcarpark
          data_code {
            description
            colour
            type
          }
        }
      }
    }
  }
`;

import { getStockDistributionRPCAction, type StockDistributionData } from '@/app/actions/dashboardActions';

interface StockDistributionChartProps extends WidgetComponentProps {
  useGraphQL?: boolean;
}

export const StockDistributionChartV2: React.FC<StockDistributionChartProps> = ({
  widget,
  isEditMode,
  useGraphQL,
}) => {
  // 決定是否使用 GraphQL - 可以通過 widget config 或 props 控制
  const shouldUseGraphQL = useGraphQL ?? (widget as any)?.useGraphQL ?? true; // 默認使用 GraphQL
  const [chartData, setChartData] = useState<StockDistributionData[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    lastFetchTime?: number;
    optimized?: boolean;
    totalStock?: number;
  }>({});
  const { refreshTrigger } = useAdminRefresh();

  // 使用標準化的 useGraphQLFallback hook
  const {
    data: rawData,
    loading,
    error,
    refetch,
    mode,
    performanceMetrics: hookMetrics,
  } = useGraphQLFallback<any>({
    graphqlQuery: shouldUseGraphQL ? GET_STOCK_DISTRIBUTION : undefined,
    serverAction: useCallback(async () => {
      // 使用 RPC 版本的 Server Action 作為 fallback
      return getStockDistributionRPCAction(selectedType);
    }, [selectedType]),
    variables: {},
    skip: isEditMode,
    pollInterval: 300000, // 5分鐘自動刷新
    cacheTime: 300000, // 5分鐘緩存
    widgetId: 'stock-distribution-chart-v2',
    extractFromContext: (contextData) => {
      // 從 DashboardDataContext 提取數據（如果有）
      if (contextData?.stockDistribution) {
        return contextData.stockDistribution;
      }
      return null;
    },
    onCompleted: (data) => {
      // 處理成功回調
      console.log('[StockDistributionChartV2] Data fetched via', mode);
    },
    onError: (error) => {
      // 處理錯誤回調
      console.error('[StockDistributionChartV2] Error:', error);
    },
  });

  // 處理 GraphQL 數據的轉換函數
  const processGraphQLData = useCallback((data: any): StockDistributionData[] => {
    if (!data?.record_inventoryCollection?.edges) return [];
    
    const edges = data.record_inventoryCollection.edges;
    const items = edges.map((edge: any) => {
      const node = edge.node;
      // 計算總庫存 - 所有庫存欄位嘅總和
      const stockTotal = (node.injection || 0) + 
                        (node.pipeline || 0) + 
                        (node.prebook || 0) + 
                        (node.await || 0) + 
                        (node.fold || 0) + 
                        (node.bulk || 0) + 
                        (node.await_grn || 0) + 
                        (node.backcarpark || 0);
      
      return {
        stock: node.product_code,
        stock_level: stockTotal,
        description: node.data_code?.description,
        type: node.data_code?.type,
      };
    });
    
    // 過濾選定類型
    let filteredItems = items;
    if (selectedType !== 'all' && selectedType !== 'ALL TYPES') {
      filteredItems = items.filter((item: any) => item.type === selectedType);
    }
    
    const totalStock = filteredItems.reduce((sum: number, item: any) => sum + item.stock_level, 0);
    
    // 按庫存量排序
    const sortedData = filteredItems
      .filter((item: any) => item.stock_level > 0)
      .sort((a: any, b: any) => b.stock_level - a.stock_level);
    
    // Use design system colors for chart data
    const CHART_COLORS = [
      widgetColors.charts.primary,
      widgetColors.charts.secondary,
      widgetColors.charts.accent,
      semanticColors.success.DEFAULT,
      semanticColors.warning.DEFAULT,
      semanticColors.info.DEFAULT,
      brandColors.primary,
      brandColors.secondary,
      brandColors.accent,
      widgetColors.charts.grid,
      // Fallback to additional colors if needed
      '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
      '#06b6d4', '#f97316', '#6366f1', '#84cc16', '#14b8a6',
      '#a855f7', '#eab308', '#059669', '#2563eb', '#7c3aed',
    ];
    
    return sortedData.map((item: any, index: number) => ({
      name: item.stock,
      size: item.stock_level,
      value: item.stock_level,
      percentage: totalStock > 0 ? (item.stock_level / totalStock) * 100 : 0,
      color: CHART_COLORS[index % CHART_COLORS.length],
      fill: CHART_COLORS[index % CHART_COLORS.length],
      description: item.description || '-',
      type: item.type || '-',
    }));
  }, [selectedType]);

  // 處理數據更新
  useEffect(() => {
    if (!loading && rawData) {
      let processedData: StockDistributionData[];
      
      // 判斷數據來源並處理
      if (mode === 'context' && rawData.record_inventoryCollection) {
        // GraphQL 數據需要轉換
        processedData = processGraphQLData(rawData);
      } else if (Array.isArray(rawData)) {
        // Server Action 或 Context 數據已經是正確格式
        processedData = rawData;
      } else {
        processedData = [];
      }
      
      setChartData(processedData);
      
      // 更新性能指標
      const totalStock = processedData.reduce((sum, item) => sum + item.value, 0);
      setPerformanceMetrics({
        lastFetchTime: hookMetrics?.queryTime || 0,
        optimized: mode !== 'fallback',
        totalStock,
      });
    }
  }, [rawData, loading, mode, processGraphQLData, hookMetrics]);

  // 監聽類型變更事件
  useEffect(() => {
    const handleTypeChange = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { type, data } = customEvent.detail;
      setSelectedType(type);

      // 如果選擇 all 或 ALL TYPES，重新獲取所有數據
      if (type === 'all' || type === 'ALL TYPES') {
        await refetch();
      } else {
        // 否則使用傳入的過濾數據（需要計算百分比和顏色）
        if (data && Array.isArray(data)) {
          const totalStock = data.reduce((sum, item) => sum + item.stock_level, 0);

          // 按庫存量排序
          const sortedData = [...data]
            .filter(item => item.stock_level > 0)
            .sort((a, b) => b.stock_level - a.stock_level);

          // Use design system colors for consistent styling
          const CHART_COLORS = [
            widgetColors.charts.primary,
            widgetColors.charts.secondary,
            widgetColors.charts.accent,
            semanticColors.success.DEFAULT,
            semanticColors.warning.DEFAULT,
            semanticColors.info.DEFAULT,
            brandColors.primary,
            brandColors.secondary,
            brandColors.accent,
            widgetColors.charts.grid,
            // Fallback to additional colors if needed
            '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
            '#06b6d4', '#f97316', '#6366f1', '#84cc16', '#14b8a6',
          ];

          // 生成 Treemap 數據
          const processedData: StockDistributionData[] = sortedData.map((item, index) => ({
            name: item.stock,
            size: item.stock_level,
            value: item.stock_level,
            percentage: totalStock > 0 ? (item.stock_level / totalStock) * 100 : 0,
            color: CHART_COLORS[index % CHART_COLORS.length],
            fill: CHART_COLORS[index % CHART_COLORS.length],
            description: item.description || '-',
            type: item.type || '-',
          }));

          setChartData(processedData);
          setPerformanceMetrics({
            lastFetchTime: 0,
            optimized: false, // Client-side filter
            totalStock: totalStock,
          });
        }
      }
    };

    window.addEventListener('stockTypeChanged', handleTypeChange);
    return () => {
      window.removeEventListener('stockTypeChanged', handleTypeChange);
    };
  }, [refetch]);

  // 監聽刷新觸發器
  useEffect(() => {
    if (refreshTrigger) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  // 當 selectedType 變更時重新獲取數據（只在使用 server action 時）
  useEffect(() => {
    if (mode === 'server-action' && !loading) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType]); // 故意不包含 refetch 和 mode 以避免無限循環

  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className={cn(
          'rounded-lg border bg-card p-3 shadow-lg',
          'border-border'
        )}>
          <p className={cn(textClasses['body-small'], 'font-medium text-foreground')}>{data.name}</p>
          <p className={cn('mt-1', textClasses['label-small'], 'text-muted-foreground')}>
            Stock:{' '}
            <span className='font-medium text-foreground'>{(data.value || 0).toLocaleString()}</span>
          </p>
          <p className={cn(textClasses['label-small'], 'text-muted-foreground')}>
            Share:{' '}
            <span className='font-medium text-foreground'>{(data.percentage || 0).toFixed(1)}%</span>
          </p>
          {data.description && (
            <p className={cn('mt-1', textClasses['label-small'], 'text-muted-foreground')}>
              Description: <span className='text-foreground'>{data.description}</span>
            </p>
          )}
          {data.type && (
            <p className={cn(textClasses['label-small'], 'text-muted-foreground')}>
              Type: <span className='text-foreground'>{data.type}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // 自定義內容渲染
  const CustomizedContent = (props: any) => {
    const { x, y, width, height, name, value, percentage } = props;

    // 只在有足夠空間時顯示內容
    if (width < 50 || height < 40) return null;

    // 判斷是否需要使用白色文字（深色背景）
    // 使用更通用嘅方法：將顏色轉換為 RGB 並計算亮度
    const getTextColor = (bgColor: string) => {
      // 轉換 hex 到 RGB
      const hex = bgColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);

      // 計算亮度
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;

      // 如果背景較暗，使用設計系統的前景色；否則使用深色
      return brightness < 128 ? 'hsl(var(--foreground))' : 'hsl(var(--foreground) / 0.8)';
    };

    const textColor = props.fill ? getTextColor(props.fill) : 'hsl(var(--foreground) / 0.8)';

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={props.fill}
          stroke='rgba(0, 0, 0, 0.1)'
          strokeWidth={1}
        />
        {width > 80 && height > 60 && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 10}
              textAnchor='middle'
              fill={textColor}
              fontSize={Math.min(width / 8, 18)}
              fontWeight='600'
            >
              {name}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 10}
              textAnchor='middle'
              fill={textColor}
              fontSize={Math.min(width / 10, 14)}
              opacity={0.8}
            >
              {(value || 0).toLocaleString()}
            </text>
            {percentage >= 1 && (
              <text
                x={x + width / 2}
                y={y + height / 2 + 25}
                textAnchor='middle'
                fill={textColor}
                fontSize={Math.min(width / 12, 12)}
                opacity={0.6}
              >
                {percentage.toFixed(1)}%
              </text>
            )}
          </>
        )}
        {width > 60 && height > 50 && width <= 80 && (
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor='middle'
            fill={textColor}
            fontSize={Math.min(width / 6, 14)}
            fontWeight='500'
          >
            {name}
          </text>
        )}
      </g>
    );
  };

  if (loading) {
    return <WidgetSkeleton type="chart-bar" height={200} />;
  }

  if (error) {
    return (
      <WidgetError 
        message={error.message || "Failed to load stock distribution data"}
        severity="error"
        display="inline"
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className='relative h-full w-full p-2'>
      {chartData.length === 0 ? (
        <div className='flex h-full items-center justify-center'>
          <p className={cn(textClasses['body-base'], 'text-muted-foreground')}>No stock data available</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width='100%' height='100%'>
            <Treemap
              data={chartData}
              dataKey='size'
              aspectRatio={4 / 3}
              stroke='rgba(0, 0, 0, 0.1)'
              content={<CustomizedContent />}
            >
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>

          {/* Performance indicator */}
          {performanceMetrics.optimized && (
            <div className={cn(
              'absolute bottom-2 right-2 rounded bg-card/80 border border-border px-2 py-1',
              textClasses['label-small']
            )}>
              {mode === 'context' && (
                <span className='text-primary'>⚡ Context optimized</span>
              )}
              {mode === 'context' && (
                <span className='text-info'>⚡ GraphQL optimized</span>
              )}
              {mode === 'server-action' && (
                <span className='text-success'>
                  ✓ Server-optimized ({performanceMetrics.lastFetchTime}ms)
                </span>
              )}
              {mode === 'fallback' && (
                <span className='text-warning'>⚠ Fallback mode</span>
              )}
              {performanceMetrics.totalStock && (
                <span className='ml-2 text-muted-foreground'>
                  Total: {performanceMetrics.totalStock.toLocaleString()}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StockDistributionChartV2;
