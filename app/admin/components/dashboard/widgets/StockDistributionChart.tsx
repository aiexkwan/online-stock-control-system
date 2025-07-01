'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useAdminRefresh } from '@/app/admin/contexts/AdminRefreshContext';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/app/utils/supabase/client';

interface TreemapData {
  name: string;
  size: number;
  value: number;
  percentage: number;
  color: string;
  fill: string;
}

interface StockData {
  stock: string;
  stock_level: number;
  description?: string;
  type?: string;
}

interface StockDistributionChartProps extends WidgetComponentProps {}

// 多樣化顏色方案 - 使用唔同色系
const CHART_COLORS = [
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f59e0b', // amber-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
  '#84cc16', // lime-500
  '#14b8a6', // teal-500
  '#a855f7', // purple-500
  '#eab308', // yellow-500
  '#059669', // emerald-600
  '#2563eb', // blue-600
  '#7c3aed', // violet-600
  '#db2777', // pink-600
  '#d97706', // amber-600
  '#0891b2', // cyan-600
  '#ea580c', // orange-600
  '#4f46e5', // indigo-600
];


export const StockDistributionChart: React.FC<StockDistributionChartProps> = ({ widget, isEditMode }) => {
  const [chartData, setChartData] = useState<TreemapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const { refreshTrigger } = useAdminRefresh();
  const supabase = createClient();


  // 處理庫存數據並生成圖表數據
  const processStockData = useCallback((data: StockData[]) => {
    // 計算總庫存
    const totalStock = data.reduce((sum, item) => sum + item.stock_level, 0);
    
    // 按庫存量排序
    const sortedData = [...data]
      .sort((a, b) => b.stock_level - a.stock_level);
    
    // 生成 Treemap 數據
    const processedData: TreemapData[] = sortedData.map((item, index) => ({
      name: item.stock,
      size: item.stock_level,
      value: item.stock_level,
      percentage: (item.stock_level / totalStock) * 100,
      color: CHART_COLORS[index % CHART_COLORS.length],
      fill: CHART_COLORS[index % CHART_COLORS.length]  // Treemap 需要 fill 屬性
    }));
    
    setChartData(processedData);
  }, []);

  // 獲取初始數據
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      // 先獲取每個產品的最新更新時間
      const { data: latestDates, error: dateError } = await supabase
        .from('stock_level')
        .select('stock, update_time')
        .order('update_time', { ascending: false });

      if (dateError) throw dateError;

      if (!latestDates || latestDates.length === 0) {
        console.log('[StockDistributionChart] No stock data found');
        setChartData([]);
        setLoading(false);
        return;
      }

      // 為每個產品找出最新日期
      const latestByProduct = new Map<string, string>();
      latestDates.forEach(item => {
        if (!latestByProduct.has(item.stock)) {
          latestByProduct.set(item.stock, item.update_time);
        }
      });

      console.log('[StockDistributionChart] Products with latest dates:', latestByProduct.size);

      // 批量查詢每個產品的最新庫存（包含 data_code 資訊）
      const stockPromises = Array.from(latestByProduct.entries()).map(async ([stock, date]) => {
        const { data, error } = await supabase
          .from('stock_level')
          .select(`
            stock,
            stock_level,
            update_time,
            data_code!inner(
              description,
              type
            )
          `)
          .eq('stock', stock)
          .eq('update_time', date)
          .single();
        
        if (error) {
          console.error(`Error fetching stock for ${stock}:`, error);
          return null;
        }
        return data;
      });

      const results = await Promise.all(stockPromises);
      const data = results.filter(item => item !== null && item.stock_level > 0);
      
      console.log('[StockDistributionChart] Latest stock data:', data.length, 'items');

      if (!data || data.length === 0) {
        setChartData([]);
        setLoading(false);
        return;
      }

      const formattedData: StockData[] = (data || []).map(item => ({
        stock: item.stock,
        stock_level: item.stock_level,
        description: item.data_code?.description || '-',
        type: item.data_code?.type || '-'
      }));

      processStockData(formattedData);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, processStockData]);

  // 監聽類型變更事件
  useEffect(() => {
    const handleTypeChange = async (event: CustomEvent) => {
      const { type, data } = event.detail;
      setSelectedType(type);
      
      // 如果選擇 all 或 ALL TYPES，重新獲取所有數據
      if (type === 'all' || type === 'ALL TYPES') {
        await fetchInitialData();
      } else {
        // 否則使用傳入的過濾數據（包括 non-material）
        processStockData(data);
      }
    };

    window.addEventListener('stockTypeChanged', handleTypeChange as EventListener);
    return () => {
      window.removeEventListener('stockTypeChanged', handleTypeChange as EventListener);
    };
  }, [processStockData, fetchInitialData]);

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
            Share: <span className="text-white font-medium">{data.percentage.toFixed(1)}%</span>
          </p>
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
    <div className="h-full w-full p-2">
      {chartData.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-400">No stock data available</p>
        </div>
      ) : (
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
      )}
    </div>
  );
};