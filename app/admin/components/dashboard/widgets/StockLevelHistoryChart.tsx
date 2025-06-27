'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useAdminRefresh } from '@/app/admin/contexts/AdminRefreshContext';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/app/utils/supabase/client';
import { format } from 'date-fns';

interface ChartDataPoint {
  time: string;
  timestamp: Date;
  [key: string]: any; // 動態的產品代碼欄位
}

interface StockData {
  stock: string;
  stock_level: number;
  update_time: string;
}

interface StockLevelHistoryChartProps extends WidgetComponentProps {
  timeFrame?: {
    start: Date;
    end: Date;
  };
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

export const StockLevelHistoryChart: React.FC<StockLevelHistoryChartProps> = ({ widget, isEditMode, timeFrame }) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [productCodes, setProductCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const { refreshTrigger } = useAdminRefresh();
  const supabase = createClient();

  // 生成12個時間段
  const generateTimeSegments = useCallback(() => {
    if (!timeFrame) return [];
    
    const segments: { start: Date; end: Date; label: string }[] = [];
    const totalDuration = timeFrame.end.getTime() - timeFrame.start.getTime();
    const segmentDuration = totalDuration / 12;

    for (let i = 0; i < 12; i++) {
      const segmentStart = new Date(timeFrame.start.getTime() + (segmentDuration * i));
      const segmentEnd = new Date(timeFrame.start.getTime() + (segmentDuration * (i + 1)));
      
      segments.push({
        start: segmentStart,
        end: segmentEnd,
        label: format(segmentStart, 'HH:mm')
      });
    }

    return segments;
  }, [timeFrame]);

  // 處理庫存歷史數據
  const processHistoryData = useCallback(async (products: string[]) => {
    if (!timeFrame || products.length === 0) {
      setChartData([]);
      return;
    }

    const segments = generateTimeSegments();
    const dataPoints: ChartDataPoint[] = [];

    try {
      // 獲取所有產品在時間範圍內的數據
      const { data, error } = await supabase
        .from('stock_level')
        .select('stock, stock_level, update_time')
        .in('stock', products)
        .gte('update_time', timeFrame.start.toISOString())
        .lte('update_time', timeFrame.end.toISOString())
        .order('update_time', { ascending: true });

      if (error) throw error;

      // 為每個產品建立最後已知的庫存水平
      const lastKnownStock = new Map<string, number>();
      
      // 為每個時間段建立數據點
      for (const segment of segments) {
        const dataPoint: ChartDataPoint = {
          time: segment.label,
          timestamp: segment.start
        };

        // 獲取該時間段內的數據
        const segmentData = (data || []).filter(item => {
          const updateTime = new Date(item.update_time);
          return updateTime >= segment.start && updateTime < segment.end;
        });

        // 為每個產品設置庫存值
        for (const product of products) {
          // 查找該產品在這個時間段的最新數據
          const productData = segmentData
            .filter(item => item.stock === product)
            .sort((a, b) => new Date(b.update_time).getTime() - new Date(a.update_time).getTime());

          if (productData.length > 0) {
            // 使用該時間段內最新的數據
            dataPoint[product] = productData[0].stock_level;
            lastKnownStock.set(product, productData[0].stock_level);
          } else {
            // 使用最後已知的庫存水平，如果沒有則為 0
            dataPoint[product] = lastKnownStock.get(product) || 0;
          }
        }

        dataPoints.push(dataPoint);
      }

      setChartData(dataPoints);
      setProductCodes(products);
    } catch (error) {
      console.error('Error fetching stock history:', error);
      setChartData([]);
    }
  }, [supabase, timeFrame, generateTimeSegments]);

  // 監聽 StockTypeSelector 的類型變更事件
  useEffect(() => {
    const handleTypeChange = (event: CustomEvent) => {
      const { type, data } = event.detail;
      setSelectedType(type);
      
      // 獲取該類型所有產品的代碼
      const codes = data.map((item: any) => item.stock);
      
      if (codes.length > 0) {
        setLoading(true);
        processHistoryData(codes).finally(() => setLoading(false));
      } else {
        setChartData([]);
        setProductCodes([]);
        setLoading(false);
      }
    };

    window.addEventListener('stockTypeChanged', handleTypeChange as EventListener);
    return () => {
      window.removeEventListener('stockTypeChanged', handleTypeChange as EventListener);
    };
  }, [processHistoryData]);

  // 初始化時顯示 loading，等待類型選擇
  useEffect(() => {
    setLoading(false);
  }, []);

  // 當時間範圍或刷新觸發器改變時，重新加載數據
  useEffect(() => {
    if (productCodes.length > 0) {
      setLoading(true);
      processHistoryData(productCodes).finally(() => setLoading(false));
    }
  }, [productCodes, processHistoryData, refreshTrigger]);

  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-lg">
          <p className="text-white text-sm font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="text-white ml-2 font-medium">{entry.value.toLocaleString()}</span>
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
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-gray-400">{entry.value}</span>
          </div>
        ))}
      </div>
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
    <div className="h-full w-full p-4">
      {chartData.length === 0 || productCodes.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-400 text-sm text-center">
            Select a product type from the dropdown<br />
            to view stock level history
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 5, bottom: 60 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(100, 116, 139, 0.1)"
              vertical={false}
            />
            <XAxis 
              dataKey="time" 
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderLegend} />
            
            {/* 為每個產品代碼創建一條線 */}
            {productCodes.map((code, index) => (
              <Line
                key={code}
                type="monotone"
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
    </div>
  );
};