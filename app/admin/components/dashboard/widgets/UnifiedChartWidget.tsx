import React, { useMemo } from 'react';
import { ChartContainer } from './common/charts/ChartContainer';
import { ChartSkeleton } from './common/charts/ChartSkeleton';
import { useDashboardConcurrentQuery } from '@/app/admin/hooks/useDashboardConcurrentQuery';
import { AdminWidgetConfig } from '../adminDashboardLayouts';

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
  Cell
} from '@/lib/recharts-dynamic';

interface UnifiedChartWidgetProps {
  config: AdminWidgetConfig;
  dateRange?: {
    start: string;
    end: string;
  };
  warehouse?: string;
}

/**
 * UnifiedChartWidget - 統一圖表組件
 * 
 * 基於現有的 ChartContainer 組件，提供統一的圖表數據顯示
 * 支持多種圖表類型和動態配置
 */
export const UnifiedChartWidget: React.FC<UnifiedChartWidgetProps> = ({
  config,
  dateRange,
  warehouse
}) => {
  // 轉換 dateRange 格式以匹配 DashboardDateRange 接口
  const dashboardDateRange = dateRange ? {
    startDate: new Date(dateRange.start),
    endDate: new Date(dateRange.end)
  } : {
    startDate: null,
    endDate: null
  };

  // 使用現有的統一API查詢機制
  const { data, isLoading, error } = useDashboardConcurrentQuery({
    dateRange: dashboardDateRange,
    enabledWidgets: [config.dataSource || 'default'],
    enabled: true
  });

  // 處理圖表數據
  const processedChartData = useMemo(() => {
    if (!data || !config.dataSource) return null;

    const sourceData = data[config.dataSource];
    if (!sourceData) return null;

    // 根據圖表類型處理數據
    const chartType = config.chartType || 'bar';
    
    switch (chartType) {
      case 'bar':
      case 'line':
        return {
          labels: sourceData.labels || [],
          datasets: [{
            label: config.title,
            data: sourceData.values || [],
            backgroundColor: sourceData.colors || ['#3B82F6'],
            borderColor: sourceData.borderColors || ['#1E40AF'],
            borderWidth: 1
          }]
        };
        
      case 'donut':
      case 'pie':
        return {
          labels: sourceData.labels || [],
          datasets: [{
            data: sourceData.values || [],
            backgroundColor: sourceData.colors || [
              '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'
            ],
            borderWidth: 1
          }]
        };
        
      case 'area':
        return {
          labels: sourceData.labels || [],
          datasets: [{
            label: config.title,
            data: sourceData.values || [],
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: '#3B82F6',
            borderWidth: 2,
            fill: true
          }]
        };
        
      default:
        return {
          labels: sourceData.labels || [],
          datasets: [{
            label: config.title,
            data: sourceData.values || [],
            backgroundColor: '#3B82F6'
          }]
        };
    }
  }, [data, config.dataSource, config.chartType, config.title]);

  // 獲取圖表配置
  const getChartOptions = (chartType: string) => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1000
      },
      plugins: {
        legend: {
          display: true,
          position: 'top' as const
        },
        tooltip: {
          enabled: true,
          mode: 'index' as const,
          intersect: false
        }
      }
    };

    switch (chartType) {
      case 'line':
        return {
          ...baseOptions,
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Time'
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Value'
              }
            }
          }
        };
        
      case 'bar':
        return {
          ...baseOptions,
          scales: {
            x: {
              display: true
            },
            y: {
              display: true,
              beginAtZero: true
            }
          }
        };
        
      case 'donut':
      case 'pie':
        return {
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            legend: {
              display: true,
              position: 'right' as const
            }
          }
        };
        
      default:
        return baseOptions;
    }
  };

  // 動態渲染圖表組件
  const renderChart = (chartType: string, chartData: any, options: any) => {
    const { labels, datasets } = chartData;
    const data = labels.map((label: string, index: number) => ({
      name: label,
      value: datasets[0]?.data[index] || 0,
      color: datasets[0]?.backgroundColor?.[index] || datasets[0]?.backgroundColor || '#3B82F6'
    }));

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'donut':
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={chartType === 'donut' ? 60 : 0}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
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
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  // 錯誤狀態處理
  if (error) {
    return (
      <ChartContainer
        title={config.title}
        subtitle={config.description}
        className="min-h-[300px]"
      >
        <div className="flex flex-col items-center justify-center h-full text-red-500">
          <div className="text-lg font-semibold">資料載入失敗</div>
          <div className="text-sm mt-2">請稍後再試</div>
        </div>
      </ChartContainer>
    );
  }

  // 載入狀態
  if (isLoading || !processedChartData) {
    return (
      <ChartContainer
        title={config.title}
        subtitle={config.description}
        className="min-h-[300px]"
      >
        <ChartSkeleton />
      </ChartContainer>
    );
  }

  const chartType = config.chartType || 'bar';
  const chartOptions = getChartOptions(chartType);

  return (
    <ChartContainer
      title={config.title}
      subtitle={config.description}
      className="min-h-[300px]"
    >
      <div className="h-full w-full">
        {renderChart(chartType, processedChartData, chartOptions)}
      </div>
    </ChartContainer>
  );
};

export default UnifiedChartWidget;