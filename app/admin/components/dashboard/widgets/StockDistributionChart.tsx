/**
 * Stock Distribution Chart
 * 遷移至 REST API 架構，移除版本號
 * 使用 NestJS Inventory API 端點進行數據獲取
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { WidgetComponentProps } from '@/app/types/dashboard';
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

interface StockDistributionData {
  product_code: string;
  injection?: number;
  pipeline?: number;
  prebook?: number;
  await?: number;
  fold?: number;
  bulk?: number;
  await_grn?: number;
  backcarpark?: number;
  data_code?: {
    description?: string;
    colour?: string;
    type?: string;
  };
}

interface TreemapData {
  name: string;
  value: number;
  color: string;
  description?: string;
}

// REST API client for stock distribution
const stockDistributionApiClient = {
  async getStockDistribution(offset: number = 0, limit: number = 100): Promise<StockDistributionData[]> {
    const url = new URL('/api/v1/inventory/stock-distribution', window.location.origin);
    url.searchParams.append('offset', offset.toString());
    url.searchParams.append('limit', limit.toString());
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stock distribution: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || [];
  },
};

interface StockDistributionChartProps extends WidgetComponentProps {
  useGraphQL?: boolean;
}

export const StockDistributionChart: React.FC<StockDistributionChartProps> = ({
  widget,
  isEditMode,
  useGraphQL = false, // 默認使用 REST API
}) => {
  const [chartData, setChartData] = useState<StockDistributionData[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    lastFetchTime?: number;
    optimized?: boolean;
    totalStock?: number;
  }>({});
  const { refreshTrigger } = useAdminRefresh();

  const fetchStockDistribution = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const startTime = performance.now();
      const data = await stockDistributionApiClient.getStockDistribution();
      const endTime = performance.now();

      // Calculate total stock
      const totalStock = data.reduce((sum, item) => {
        return sum + 
          (item.injection || 0) + 
          (item.pipeline || 0) + 
          (item.prebook || 0) + 
          (item.await || 0) + 
          (item.fold || 0) + 
          (item.bulk || 0) + 
          (item.await_grn || 0) + 
          (item.backcarpark || 0);
      }, 0);

      setChartData(data);
      setPerformanceMetrics({
        lastFetchTime: Math.round(endTime - startTime),
        optimized: true,
        totalStock,
      });
    } catch (err) {
      console.error('[StockDistributionChart] Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stock distribution');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      fetchStockDistribution();
    }
  }, [isEditMode, fetchStockDistribution, refreshTrigger]);

  // Transform data for treemap visualization
  const transformDataForTreemap = useCallback((data: StockDistributionData[], selectedType: string): TreemapData[] => {
    if (!data || data.length === 0) return [];

    const locations = ['injection', 'pipeline', 'prebook', 'await', 'fold', 'bulk', 'await_grn', 'backcarpark'];
    const result: TreemapData[] = [];

    data.forEach(item => {
      locations.forEach(location => {
        const value = item[location as keyof StockDistributionData] as number;
        if (value && value > 0) {
          // Filter by selected type if not "all"
          if (selectedType !== 'all' && item.data_code?.type !== selectedType) {
            return;
          }

          result.push({
            name: `${item.product_code} (${location})`,
            value,
            color: getLocationColor(location),
            description: item.data_code?.description || item.product_code,
          });
        }
      });
    });

    return result.sort((a, b) => b.value - a.value);
  }, []);

  const getLocationColor = (location: string): string => {
    const colorMap: Record<string, string> = {
      injection: brandColors.primary.DEFAULT,
      pipeline: brandColors.secondary.DEFAULT,
      prebook: '#F59E0B',
      await: '#EF4444',
      fold: '#8B5CF6',
      bulk: '#10B981',
      await_grn: '#F97316',
      backcarpark: '#6B7280',
    };
    return colorMap[location] || brandColors.primary.DEFAULT;
  };

  const getAvailableTypes = useCallback(() => {
    const types = new Set(['all']);
    chartData.forEach(item => {
      if (item.data_code?.type) {
        types.add(item.data_code.type);
      }
    });
    return Array.from(types);
  }, [chartData]);

  const treemapData = transformDataForTreemap(chartData, selectedType);

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={cn(
          'rounded-lg border bg-card p-3 shadow-lg',
          'border-border',
          'text-foreground'
        )}>
          <p className={cn('font-semibold', textClasses['body-small'])}>
            {data.description || data.name}
          </p>
          <p className={cn('text-muted-foreground', textClasses['label-small'])}>
            Quantity: {data.value}
          </p>
        </div>
      );
    }
    return null;
  };

  if (isEditMode) {
    return (
      <div className={cn(
        'flex h-full w-full items-center justify-center rounded-lg border',
        'border-border bg-card/40'
      )}>
        <div className='text-center'>
          <h3 className={cn(textClasses['body-medium'], 'font-semibold text-foreground')}>
            Stock Distribution Chart
          </h3>
          <p className={cn(textClasses['body-small'], 'text-muted-foreground')}>
            Treemap visualization of stock distribution
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn(
        'flex h-full w-full items-center justify-center rounded-lg border',
        'border-border bg-card/40'
      )}>
        <WidgetSkeleton type='chart' />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        'flex h-full w-full items-center justify-center rounded-lg border',
        'border-border bg-card/40'
      )}>
        <WidgetError message={error} onRetry={fetchStockDistribution} />
      </div>
    );
  }

  return (
    <div className={cn(
      'flex h-full w-full flex-col overflow-hidden rounded-lg border',
      'border-border bg-card/40'
    )}>
      {/* Header */}
      <div className={cn(
        'flex-shrink-0 border-b px-3 py-2',
        'border-border'
      )}>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className={cn(textClasses['body-small'], 'font-semibold text-foreground')}>
              Stock Distribution
            </h3>
            <p className={cn('mt-0.5', textClasses['label-small'], 'text-muted-foreground')}>
              Treemap visualization
            </p>
          </div>
          
          {/* Type Filter */}
          <div className='flex items-center gap-2'>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={cn(
                'rounded border px-2 py-1',
                'border-border bg-background',
                'text-foreground',
                textClasses['label-small']
              )}
            >
              {getAvailableTypes().map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className={cn('min-h-0 flex-1', widgetSpacing.container)}>
        {treemapData.length > 0 ? (
          <ResponsiveContainer width='100%' height='100%'>
            <Treemap
              data={treemapData}
              dataKey='value'
              ratio={4 / 3}
              stroke='#ffffff'
              strokeWidth={2}
              fill={brandColors.primary.DEFAULT}
              content={({ x, y, width, height, payload }) => {
                if (!payload || width < 40 || height < 30) return null;
                
                return (
                  <g>
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={payload.color}
                      stroke='#ffffff'
                      strokeWidth={1}
                      opacity={0.8}
                    />
                    {width > 60 && height > 40 && (
                      <text
                        x={x + width / 2}
                        y={y + height / 2 - 6}
                        textAnchor='middle'
                        fill='#ffffff'
                        fontSize={12}
                        fontWeight='bold'
                      >
                        {payload.name.split(' ')[0]}
                      </text>
                    )}
                    {width > 60 && height > 40 && (
                      <text
                        x={x + width / 2}
                        y={y + height / 2 + 8}
                        textAnchor='middle'
                        fill='#ffffff'
                        fontSize={10}
                      >
                        {payload.value}
                      </text>
                    )}
                  </g>
                );
              }}
            >
              <Tooltip content={customTooltip} />
            </Treemap>
          </ResponsiveContainer>
        ) : (
          <div className='flex h-full items-center justify-center'>
            <p className={cn(textClasses['body-small'], 'text-muted-foreground')}>
              No stock distribution data available
            </p>
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      {performanceMetrics.optimized && (
        <div className={cn(
          'flex-shrink-0 border-t px-3 py-2',
          'border-border'
        )}>
          <div className='flex items-center justify-between'>
            <div className={cn(
              'text-right',
              textClasses['label-small']
            )} style={{ color: semanticColors.success.DEFAULT }}>
              ✓ REST API optimized ({performanceMetrics.lastFetchTime}ms)
            </div>
            {performanceMetrics.totalStock && (
              <div className={cn(
                textClasses['label-small'],
                'text-muted-foreground'
              )}>
                Total Stock: {performanceMetrics.totalStock}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockDistributionChart;