import React from 'react';
import { DatabaseRecord } from '@/types/database/tables';
import { ChartContainer } from '@/app/admin/components/dashboard/widgets/common/charts/ChartContainer';
import { ChartSkeleton } from '@/app/admin/components/dashboard/widgets/common/charts/ChartSkeleton';
import { AdminWidgetConfig } from '@/types/components/dashboard';

// 直接導入 recharts 組件以優化 bundle size
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from '@/lib/recharts-dynamic';

// Strategy 2: DTO 模式強化 - 擴展 MockData 類型以支持多種數據結構
interface MockData {
  data: DatabaseRecord[] | Record<string, unknown> | null;
  isLoading: boolean;
  error: Error | null;
}

interface UnifiedChartWidgetMockWrapperProps {
  config: AdminWidgetConfig;
  dateRange?: {
    start: string;
    end: string;
  };
  warehouse?: string;
  mockData: MockData;
}

/**
 * Mock wrapper for UnifiedChartWidget that works in Storybook
 * Bypasses the hook dependency by accepting mock data as props
 */
export const UnifiedChartWidgetMockWrapper: React.FC<UnifiedChartWidgetMockWrapperProps> = ({
  config,
  dateRange,
  warehouse,
  mockData,
}) => {
  const { data, isLoading, error } = mockData;

  // 處理圖表數據
  const processedChartData = React.useMemo(() => {
    if (!data || !config.dataSource) return null;

    const sourceData = Array.isArray(data)
      ? data
      : data && typeof data === 'object' && config.dataSource in data
        ? (data as any)[config.dataSource]
        : null;
    if (!sourceData) return null;

    // 根據圖表類型處理數據
    const chartType = config.chartType || 'bar';

    switch (chartType) {
      case 'bar':
      case 'line':
        return {
          labels: sourceData.labels || [],
          datasets: [
            {
              label: config.title,
              data: sourceData.values || [],
              backgroundColor: sourceData.colors || ['#3B82F6'],
              borderColor: sourceData.borderColors || ['#1E40AF'],
              borderWidth: 1,
            },
          ],
        };

      case 'donut':
      case 'pie':
        return {
          labels: sourceData.labels || [],
          datasets: [
            {
              data: sourceData.values || [],
              backgroundColor: sourceData.colors || [
                '#3B82F6',
                '#10B981',
                '#F59E0B',
                '#EF4444',
                '#8B5CF6',
              ],
              borderWidth: 1,
            },
          ],
        };

      case 'area':
        return {
          labels: sourceData.labels || [],
          datasets: [
            {
              label: config.title,
              data: sourceData.values || [],
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderColor: '#3B82F6',
              borderWidth: 2,
              fill: true,
            },
          ],
        };

      default:
        return {
          labels: sourceData.labels || [],
          datasets: [
            {
              label: config.title,
              data: sourceData.values || [],
              backgroundColor: '#3B82F6',
            },
          ],
        };
    }
  }, [data, config.dataSource, config.chartType, config.title]);

  // 動態渲染圖表組件
  const renderChart = (chartType: string, chartData: any) => {
    const { labels, datasets } = chartData;
    const data = labels.map((label: string, index: number) => ({
      name: label,
      value: datasets[0]?.data[index] || 0,
      color: datasets[0]?.backgroundColor?.[index] || datasets[0]?.backgroundColor || '#3B82F6',
    }));

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='name' />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey='value' fill='#3B82F6' />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='name' />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type='monotone' dataKey='value' stroke='#3B82F6' strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'donut':
      case 'pie':
        return (
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <Pie
                data={data}
                cx='50%'
                cy='50%'
                innerRadius={chartType === 'donut' ? 60 : 0}
                outerRadius={80}
                paddingAngle={5}
                dataKey='value'
              >
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='name' />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type='monotone'
                dataKey='value'
                stroke='#3B82F6'
                fill='#3B82F6'
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='name' />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey='value' fill='#3B82F6' />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  // 錯誤狀態處理
  if (error) {
    return (
      <ChartContainer title={config.title} subtitle={config.description} className='min-h-[300px]'>
        <div className='flex h-full flex-col items-center justify-center text-red-500'>
          <div className='text-lg font-semibold'>資料載入失敗</div>
          <div className='mt-2 text-sm'>請稍後再試</div>
        </div>
      </ChartContainer>
    );
  }

  // 載入狀態
  if (isLoading || !processedChartData) {
    return (
      <ChartContainer title={config.title} subtitle={config.description} className='min-h-[300px]'>
        <ChartSkeleton />
      </ChartContainer>
    );
  }

  const chartType = config.chartType || 'bar';

  return (
    <ChartContainer title={config.title} subtitle={config.description} className='min-h-[300px]'>
      <div className='h-full w-full'>{renderChart(chartType, processedChartData)}</div>
    </ChartContainer>
  );
};
