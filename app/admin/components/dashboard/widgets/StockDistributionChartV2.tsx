/**
 * Stock Distribution Chart V2
 * 完全遷移到 REST API 架構
 * 使用 NestJS API 端點進行數據獲取
 * 移除 GraphQL 依賴
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { TraditionalWidgetComponentProps } from '@/app/types/dashboard';
import { useAdminRefresh } from '@/app/admin/contexts/AdminRefreshContext';
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

import { widgetAPI } from '@/lib/api/widgets/widget-api-client';

export interface StockDistributionData {
  name: string;
  size: number;
  value: number;
  percentage: number;
  color: string;
  fill: string;
  description: string;
  type: string;
  stock: string;
  stock_level: number;
}

interface StockDistributionChartProps extends TraditionalWidgetComponentProps {
  useGraphQL?: boolean;
}

export const StockDistributionChartV2: React.FC<StockDistributionChartProps> = ({
  widget,
  isEditMode,
  useGraphQL,
}) => {
  // 完全使用 NestJS REST API with React Query
  const [selectedType, setSelectedType] = useState<string>('all');
  const { refreshTrigger } = useAdminRefresh();

  // React Query for data fetching
  const { 
    data: response, 
    isLoading: loading, 
    error,
    isError,
    refetch
  } = useQuery({
    queryKey: ['stock-distribution', selectedType],
    queryFn: () => widgetAPI.getStockDistribution({
      type: selectedType === 'all' ? undefined : selectedType,
    }),
    enabled: !isEditMode, // Only fetch when not in edit mode
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // 數據處理函數
  function processStockDistributionData(rawData: any[], type: string): StockDistributionData[] {
    if (!rawData || !Array.isArray(rawData)) return [];
    
    // 過濾選定類型
    let filteredData = rawData;
    if (type !== 'all' && type !== 'ALL TYPES') {
      filteredData = rawData.filter((item) => item.type === type);
    }
    
    // 按庫存量排序
    const sortedData = filteredData
      .filter(item => item.stock_level > 0)
      .sort((a, b) => b.stock_level - a.stock_level);
    
    const totalStock = sortedData.reduce((sum, item) => sum + item.stock_level, 0);
    
    // 設計系統顏色
    const CHART_COLORS = [
      widgetColors.charts.primary,
      widgetColors.charts.secondary,
      widgetColors.charts.accent,
      semanticColors.success.DEFAULT,
      semanticColors.warning.DEFAULT,
      semanticColors.info.DEFAULT,
      brandColors.primary[500],
      brandColors.secondary[500],
      widgetColors.charts.accent,
      widgetColors.charts.grid,
      // 備用顏色
      '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
      '#06b6d4', '#f97316', '#6366f1', '#84cc16', '#14b8a6',
      '#a855f7', '#eab308', '#059669', '#2563eb', '#7c3aed',
    ];
    
    return sortedData.map((item, index) => ({
      name: item.product_code || item.stock || '',
      size: item.stock_level || 0,
      value: item.stock_level || 0,
      percentage: totalStock > 0 ? (item.stock_level / totalStock) * 100 : 0,
      color: CHART_COLORS[index % CHART_COLORS.length] || '#000000',
      fill: CHART_COLORS[index % CHART_COLORS.length] || '#000000',
      description: item.description || '-',
      type: item.type || '-',
      stock: item.product_code || item.stock || '',
      stock_level: item.stock_level || 0,
    }));
  }

  // Extract and process data
  const rawData = (response && typeof response === 'object' && response !== null && 'success' in response && response.success && 'data' in response && response.data) ? (Array.isArray(response.data) ? response.data : (typeof response.data === 'object' && response.data !== null && 'data' in response.data ? (response.data as any).data : response.data) || []) : [];
  const chartData = processStockDistributionData(rawData, selectedType);
  
  // Performance metrics
  const performanceMetrics = {
    lastFetchTime: (response && typeof response === 'object' && response !== null && 'responseTime' in response ? (response as any).responseTime : 0) || 0,
    optimized: true,
    totalStock: chartData.reduce((sum, item) => sum + item.stock_level, 0),
  };


  // 監聽刷新觸發器
  useEffect(() => {
    if (refreshTrigger) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  // 監聽類型變更事件
  useEffect(() => {
    const handleTypeChange = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { type } = customEvent.detail;
      setSelectedType(type);
      // React Query will automatically refetch when selectedType changes
    };

    window.addEventListener('stockTypeChanged', handleTypeChange);
    return () => {
      window.removeEventListener('stockTypeChanged', handleTypeChange);
    };
  }, []);

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

  if (isError) {
    const errorMessage = error instanceof Error ? (error as { message: string }).message : 'Failed to fetch stock distribution data';
    return (
      <WidgetError 
        message={errorMessage}
        severity="error"
        display="inline"
        onRetry={() => refetch()}
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
              <span className='text-success'>
                ✓ NestJS API ({performanceMetrics.lastFetchTime}ms)
              </span>
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