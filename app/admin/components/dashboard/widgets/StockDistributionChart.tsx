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
}

interface StockData {
  stock: string;
  stock_level: number;
  description?: string;
  type?: string;
}

interface StockDistributionChartProps extends WidgetComponentProps {}

// 綠色系顏色 - 正庫存
const GREEN_COLORS = [
  '#10b981', // emerald-500
  '#059669', // emerald-600
  '#047857', // emerald-700
  '#065f46', // emerald-800
  '#22c55e', // green-500
  '#16a34a', // green-600
  '#15803d', // green-700
  '#166534', // green-800
];

// 紅色系顏色 - 低庫存或特殊標記
const RED_COLORS = [
  '#ef4444', // red-500
  '#dc2626', // red-600
  '#b91c1c', // red-700
  '#991b1b', // red-800
];

export const StockDistributionChart: React.FC<StockDistributionChartProps> = ({ widget, isEditMode }) => {
  const [chartData, setChartData] = useState<TreemapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const { refreshTrigger } = useAdminRefresh();
  const supabase = createClient();

  // 判斷是否為低庫存
  const isLowStock = (stockLevel: number, average: number) => {
    return stockLevel < average * 0.3; // 低於平均值30%視為低庫存
  };

  // 處理庫存數據並生成圖表數據
  const processStockData = (data: StockData[]) => {
    // 計算總庫存和平均值
    const totalStock = data.reduce((sum, item) => sum + item.stock_level, 0);
    const averageStock = totalStock / data.length;
    
    // 按庫存量排序
    const sortedData = [...data]
      .sort((a, b) => b.stock_level - a.stock_level);
    
    // 生成 Treemap 數據
    const processedData: TreemapData[] = sortedData.map((item, index) => ({
      name: item.stock,
      size: item.stock_level,
      value: item.stock_level,
      percentage: (item.stock_level / totalStock) * 100,
      color: isLowStock(item.stock_level, averageStock) 
        ? RED_COLORS[index % RED_COLORS.length]
        : GREEN_COLORS[index % GREEN_COLORS.length]
    }));
    
    setChartData(processedData);
  };

  // 獲取初始數據
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_level')
        .select(`
          stock,
          stock_level,
          data_code!inner(
            description,
            type
          )
        `)
        .gt('stock_level', 0)
        .order('stock_level', { ascending: false });

      if (error) throw error;

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
  }, [supabase]);

  // 監聽類型變更事件
  useEffect(() => {
    const handleTypeChange = (event: CustomEvent) => {
      const { type, data } = event.detail;
      setSelectedType(type);
      processStockData(data);
    };

    window.addEventListener('stockTypeChanged', handleTypeChange as EventListener);
    return () => {
      window.removeEventListener('stockTypeChanged', handleTypeChange as EventListener);
    };
  }, []);

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
            Stock: <span className="text-white font-medium">{data.value.toLocaleString()}</span>
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
    const useWhiteText = props.fill && (
      props.fill.includes('#047857') || 
      props.fill.includes('#065f46') ||
      props.fill.includes('#166534') ||
      props.fill.includes('#b91c1c') ||
      props.fill.includes('#991b1b')
    );
    
    const textColor = useWhiteText ? '#ffffff' : '#1f2937';
    
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
              {value.toLocaleString()}
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
            fill="#10b981"
            content={<CustomizedContent />}
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      )}
    </div>
  );
};