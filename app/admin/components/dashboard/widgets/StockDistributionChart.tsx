'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useAdminRefresh } from '@/app/admin/contexts/AdminRefreshContext';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/app/utils/supabase/client';

interface ChartData {
  name: string;
  value: number;
  percentage: number;
}

interface StockData {
  stock: string;
  stock_level: number;
  description?: string;
  type?: string;
}

interface StockDistributionChartProps extends WidgetComponentProps {}

// 顏色調色板
const COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500
  '#F97316', // orange-500
  '#84CC16', // lime-500
  '#6366F1', // indigo-500
];

export const StockDistributionChart: React.FC<StockDistributionChartProps> = ({ widget, isEditMode }) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const { refreshTrigger } = useAdminRefresh();
  const supabase = createClient();

  // 處理庫存數據並生成圖表數據
  const processStockData = (data: StockData[]) => {
    // 計算總庫存
    const totalStock = data.reduce((sum, item) => sum + item.stock_level, 0);
    
    // 按庫存量排序並取前10個
    const sortedData = [...data]
      .sort((a, b) => b.stock_level - a.stock_level)
      .slice(0, 10);
    
    // 計算其他產品的總和
    const topTenTotal = sortedData.reduce((sum, item) => sum + item.stock_level, 0);
    const othersTotal = totalStock - topTenTotal;
    
    // 生成圖表數據
    const processedData: ChartData[] = sortedData.map(item => ({
      name: item.stock,
      value: item.stock_level,
      percentage: (item.stock_level / totalStock) * 100
    }));
    
    // 如果有其他產品，添加到圖表
    if (othersTotal > 0 && data.length > 10) {
      processedData.push({
        name: 'Others',
        value: othersTotal,
        percentage: (othersTotal / totalStock) * 100
      });
    }
    
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
        .order('stock_level', { ascending: false })
        .limit(100);

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
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-lg">
          <p className="text-white font-medium">{payload[0].name}</p>
          <p className="text-gray-300 text-sm">
            Stock: <span className="text-white font-medium">{payload[0].value.toLocaleString()}</span>
          </p>
          <p className="text-gray-300 text-sm">
            Percentage: <span className="text-white font-medium">{payload[0].payload.percentage.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // 自定義 Label
  const renderCustomLabel = ({ percentage }: any) => {
    if (percentage > 3) { // 只顯示大於3%的標籤
      return `${percentage.toFixed(1)}%`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-white">Stock Distribution</h3>
        {selectedType !== 'all' && (
          <p className="text-sm text-gray-400 mt-1">Type: {selectedType}</p>
        )}
      </div>

      {/* Chart */}
      <div className="flex-1">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-400">No stock data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius="80%"
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                wrapperStyle={{
                  paddingTop: '20px',
                  fontSize: '12px'
                }}
                iconType="circle"
                formatter={(value) => <span className="text-gray-300">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Summary */}
      {chartData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700 text-sm text-gray-400">
          <div className="flex justify-between">
            <span>Total Products: {chartData.length}</span>
            <span>
              Total Stock: <span className="font-semibold text-white">
                {chartData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};