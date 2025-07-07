/**
 * Stock Distribution Chart V2
 * 使用 RPC 函數和 DashboardAPI 優化圖表數據處理
 * 遷移自原 StockDistributionChart
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useAdminRefresh } from '@/app/admin/contexts/AdminRefreshContext';
import { Loader2 } from 'lucide-react';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';

interface TreemapData {
  name: string;
  size: number;
  value: number;
  percentage: number;
  color: string;
  fill: string;
  description?: string;
  type?: string;
}

interface StockDistributionChartProps extends WidgetComponentProps {}

export const StockDistributionChartV2: React.FC<StockDistributionChartProps> = ({ widget, isEditMode }) => {
  const [chartData, setChartData] = useState<TreemapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    lastFetchTime?: number;
    optimized?: boolean;
    totalStock?: number;
  }>({});
  const { refreshTrigger } = useAdminRefresh();
  const api = createDashboardAPI();

  // 獲取初始數據使用 DashboardAPI
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const startTime = performance.now();
      
      const result = await api.fetchData({
        widgetIds: ['stock_distribution_chart'],
        params: {
          dataSource: 'stock_distribution_chart',
          stockType: selectedType === 'all' || selectedType === 'ALL TYPES' ? null : selectedType
        }
      });
      
      const endTime = performance.now();
      
      if (result.widgets && result.widgets.length > 0) {
        const widgetData = result.widgets[0];
        
        if (widgetData.data.error) {
          console.error('[StockDistributionChartV2] Error:', widgetData.data.error);
          setChartData([]);
        } else {
          // Data already processed by RPC with colors and percentages
          setChartData(widgetData.data.value || []);
          setPerformanceMetrics({
            lastFetchTime: Math.round(endTime - startTime),
            optimized: widgetData.data.metadata?.optimized || true,
            totalStock: widgetData.data.metadata?.totalStock || 0
          });
        }
      }
    } catch (error) {
      console.error('[StockDistributionChartV2] Error fetching stock data:', error);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [api, selectedType]);

  // 監聽類型變更事件
  useEffect(() => {
    const handleTypeChange = async (event: CustomEvent) => {
      const { type, data } = event.detail;
      setSelectedType(type);
      
      // 如果選擇 all 或 ALL TYPES，重新獲取所有數據
      if (type === 'all' || type === 'ALL TYPES') {
        await fetchInitialData();
      } else {
        // 否則使用傳入的過濾數據（需要計算百分比和顏色）
        if (data && Array.isArray(data)) {
          const totalStock = data.reduce((sum, item) => sum + item.stock_level, 0);
          
          // 按庫存量排序
          const sortedData = [...data]
            .filter(item => item.stock_level > 0)
            .sort((a, b) => b.stock_level - a.stock_level);
          
          // 使用 RPC 返回的顏色方案
          const CHART_COLORS = [
            '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
            '#06b6d4', '#f97316', '#6366f1', '#84cc16', '#14b8a6',
            '#a855f7', '#eab308', '#059669', '#2563eb', '#7c3aed',
            '#db2777', '#d97706', '#0891b2', '#ea580c', '#4f46e5'
          ];
          
          // 生成 Treemap 數據
          const processedData: TreemapData[] = sortedData.map((item, index) => ({
            name: item.stock,
            size: item.stock_level,
            value: item.stock_level,
            percentage: totalStock > 0 ? (item.stock_level / totalStock) * 100 : 0,
            color: CHART_COLORS[index % CHART_COLORS.length],
            fill: CHART_COLORS[index % CHART_COLORS.length],
            description: item.description || '-',
            type: item.type || '-'
          }));
          
          setChartData(processedData);
          setPerformanceMetrics({
            lastFetchTime: 0,
            optimized: false, // Client-side filter
            totalStock: totalStock
          });
        }
      }
    };

    window.addEventListener('stockTypeChanged', handleTypeChange as EventListener);
    return () => {
      window.removeEventListener('stockTypeChanged', handleTypeChange as EventListener);
    };
  }, [fetchInitialData]);

  // 初始化
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData, refreshTrigger]);

  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-lg">
          <p className="text-white font-medium text-sm">{data.name}</p>
          <p className="text-gray-300 text-xs mt-1">
            Stock: <span className="text-white font-medium">{(data.value || 0).toLocaleString()}</span>
          </p>
          <p className="text-gray-300 text-xs">
            Share: <span className="text-white font-medium">{(data.percentage || 0).toFixed(1)}%</span>
          </p>
          {data.description && (
            <p className="text-gray-300 text-xs mt-1">
              Description: <span className="text-white">{data.description}</span>
            </p>
          )}
          {data.type && (
            <p className="text-gray-300 text-xs">
              Type: <span className="text-white">{data.type}</span>
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
      
      // 如果背景較暗，使用白色文字
      return brightness < 128 ? '#ffffff' : '#1f2937';
    };
    
    const textColor = props.fill ? getTextColor(props.fill) : '#1f2937';
    
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={props.fill}
          stroke="rgba(0, 0, 0, 0.1)"
          strokeWidth={1}
        />
        {width > 80 && height > 60 && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 10}
              textAnchor="middle"
              fill={textColor}
              fontSize={Math.min(width / 8, 18)}
              fontWeight="600"
            >
              {name}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 10}
              textAnchor="middle"
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
                textAnchor="middle"
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
            textAnchor="middle"
            fill={textColor}
            fontSize={Math.min(width / 6, 14)}
            fontWeight="500"
          >
            {name}
          </text>
        )}
      </g>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="h-full w-full p-2 relative">
      {chartData.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-400">No stock data available</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={chartData}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="rgba(0, 0, 0, 0.1)"
              content={<CustomizedContent />}
            >
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
          
          {/* Performance indicator */}
          {performanceMetrics.optimized && (
            <div className="absolute bottom-2 right-2 text-[10px] text-green-400 bg-slate-900/80 px-2 py-1 rounded">
              ✓ Server-optimized ({performanceMetrics.lastFetchTime}ms)
              {performanceMetrics.totalStock && (
                <span className="ml-2">
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