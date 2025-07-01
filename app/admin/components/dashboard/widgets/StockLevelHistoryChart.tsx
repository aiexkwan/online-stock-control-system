'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [loading, setLoading] = useState(false); // 改為 false，等待選擇產品類型
  const [selectedType, setSelectedType] = useState<string>('all');
  const [adjustedTimeFrame, setAdjustedTimeFrame] = useState<{ start: Date; end: Date } | null>(null);
  const { refreshTrigger } = useAdminRefresh();
  const supabase = createClient();

  // 計算調整後的時間範圍
  const calculateAdjustedTimeFrame = useCallback((originalTimeFrame?: { start: Date; end: Date }) => {
    const now = new Date();
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);
    
    // 如果沒有提供時間範圍，使用預設2週
    if (!originalTimeFrame) {
      console.log('[StockLevelHistoryChart] No timeFrame provided, using default 2 weeks');
      return { start: twoWeeksAgo, end: now };
    }
    
    const duration = originalTimeFrame.end.getTime() - originalTimeFrame.start.getTime();
    const days = duration / (1000 * 60 * 60 * 24);
    
    // 如果時間範圍太短（少於1天），使用預設2週
    if (days < 1) {
      console.log('[StockLevelHistoryChart] Time range too short, using default 2 weeks');
      return { start: twoWeeksAgo, end: now };
    }
    
    // 根據選擇的時間範圍調整顯示範圍
    if (days <= 14) {
      // 少於2週，使用原範圍
      return originalTimeFrame;
    } else if (days <= 21) {
      // 2-3週，顯示3週
      const threeWeeksAgo = new Date(now);
      threeWeeksAgo.setDate(now.getDate() - 21);
      return { start: threeWeeksAgo, end: now };
    } else if (days <= 28) {
      // 3-4週，顯示4週
      const fourWeeksAgo = new Date(now);
      fourWeeksAgo.setDate(now.getDate() - 28);
      return { start: fourWeeksAgo, end: now };
    } else if (days <= 60) {
      // 4週-2個月，顯示2個月
      const twoMonthsAgo = new Date(now);
      twoMonthsAgo.setMonth(now.getMonth() - 2);
      return { start: twoMonthsAgo, end: now };
    } else if (days <= 90) {
      // 2-3個月，顯示3個月
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      return { start: threeMonthsAgo, end: now };
    } else {
      // 超過3個月，最多顯示6個月
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      return { start: sixMonthsAgo, end: now };
    }
  }, []);

  // 更新調整後的時間範圍
  useEffect(() => {
    console.log('[StockLevelHistoryChart] timeFrame prop:', timeFrame);
    const adjusted = calculateAdjustedTimeFrame(timeFrame);
    console.log('[StockLevelHistoryChart] adjusted timeFrame:', adjusted);
    setAdjustedTimeFrame(adjusted);
  }, [timeFrame, calculateAdjustedTimeFrame]);

  // 生成24個時間段
  const generateTimeSegments = useCallback(() => {
    if (!adjustedTimeFrame) return [];
    
    const segments: { start: Date; end: Date; label: string }[] = [];
    const totalDuration = adjustedTimeFrame.end.getTime() - adjustedTimeFrame.start.getTime();
    const segmentDuration = totalDuration / 24;
    const days = totalDuration / (1000 * 60 * 60 * 24);

    for (let i = 0; i < 24; i++) {
      const segmentStart = new Date(adjustedTimeFrame.start.getTime() + (segmentDuration * i));
      const segmentEnd = new Date(adjustedTimeFrame.start.getTime() + (segmentDuration * (i + 1)));
      
      // 根據時間範圍選擇顯示格式
      let label: string;
      if (days <= 1) {
        // 一天內，顯示時間
        label = format(segmentStart, 'HH:mm');
      } else if (days <= 7) {
        // 一週內，顯示星期和時間
        label = format(segmentStart, 'EEE HH:mm');
      } else if (days <= 30) {
        // 一個月內，顯示日期
        label = format(segmentStart, 'MM/dd');
      } else {
        // 超過一個月，顯示月份和日期
        label = format(segmentStart, 'MMM dd');
      }
      
      segments.push({
        start: segmentStart,
        end: segmentEnd,
        label
      });
    }

    return segments;
  }, [adjustedTimeFrame]);

  // 處理庫存歷史數據
  const processHistoryData = useCallback(async (products: string[]) => {
    console.log('[StockLevelHistoryChart] processHistoryData called with:', products);
    console.log('[StockLevelHistoryChart] adjustedTimeFrame:', adjustedTimeFrame);
    
    if (!adjustedTimeFrame || products.length === 0) {
      console.log('[StockLevelHistoryChart] No adjustedTimeFrame or products, clearing data');
      setChartData([]);
      return;
    }
    
    // 限制顯示最多10款產品
    const limitedProducts = products.slice(0, 10);
    console.log('[StockLevelHistoryChart] Limited products:', limitedProducts);

    const segments = generateTimeSegments();
    console.log('[StockLevelHistoryChart] Generated segments:', segments.length);
    const dataPoints: ChartDataPoint[] = [];

    try {
      // 獲取所有產品在時間範圍內的數據，如果沒有數據就擴大範圍
      let { data, error } = await supabase
        .from('stock_level')
        .select('stock, stock_level, update_time')
        .in('stock', limitedProducts)
        .gte('update_time', adjustedTimeFrame.start.toISOString())
        .lte('update_time', adjustedTimeFrame.end.toISOString())
        .order('update_time', { ascending: true });

      if (error) throw error;

      console.log('[StockLevelHistoryChart] Query returned', data?.length || 0, 'records');
      console.log('[StockLevelHistoryChart] Time range:', adjustedTimeFrame.start.toISOString(), 'to', adjustedTimeFrame.end.toISOString());
      
      // 如果沒有數據，嘗試獲取最近30天的數據
      if (!data || data.length === 0) {
        console.log('[StockLevelHistoryChart] No data found, trying last 30 days');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const result = await supabase
          .from('stock_level')
          .select('stock, stock_level, update_time')
          .in('stock', limitedProducts)
          .gte('update_time', thirtyDaysAgo.toISOString())
          .order('update_time', { ascending: true });
          
        if (result.error) throw result.error;
        data = result.data;
        console.log('[StockLevelHistoryChart] Extended query returned', data?.length || 0, 'records');
      }

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
        for (const product of limitedProducts) {
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

      console.log('[StockLevelHistoryChart] Setting chart data with', dataPoints.length, 'points');
      setChartData(dataPoints);
      setProductCodes(limitedProducts);
      console.log('[StockLevelHistoryChart] processHistoryData completed successfully');
    } catch (error) {
      console.error('[StockLevelHistoryChart] Error fetching stock history:', error);
      setChartData([]);
    }
  }, [supabase, adjustedTimeFrame, generateTimeSegments]);

  // 監聽 StockTypeSelector 的類型變更事件
  useEffect(() => {
    const handleTypeChange = (event: CustomEvent) => {
      console.log('[StockLevelHistoryChart] Received stockTypeChanged event:', event.detail);
      const { type, data } = event.detail;
      setSelectedType(type);
      
      // 獲取該類型所有產品的代碼（限制最多10個）
      const codes = data.map((item: any) => item.stock).slice(0, 10);
      console.log('[StockLevelHistoryChart] Product codes:', codes);
      
      if (codes.length > 0) {
        setLoading(true);
        processHistoryData(codes)
          .then(() => {
            console.log('[StockLevelHistoryChart] processHistoryData completed successfully');
          })
          .catch((error) => {
            console.error('[StockLevelHistoryChart] processHistoryData error:', error);
          })
          .finally(() => {
            console.log('[StockLevelHistoryChart] Setting loading to false');
            setLoading(false);
          });
      } else {
        console.log('[StockLevelHistoryChart] No product codes, clearing data');
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

  // 初始化時設定預設時間範圍
  useEffect(() => {
    if (!timeFrame) {
      const now = new Date();
      const twoWeeksAgo = new Date(now);
      twoWeeksAgo.setDate(now.getDate() - 14);
      setAdjustedTimeFrame({ start: twoWeeksAgo, end: now });
    }
  }, [timeFrame]);

  // 當時間範圍或產品代碼改變時，重新加載數據
  // 使用 useMemo 創建穩定的依賴值
  const timeFrameKey = useMemo(() => 
    adjustedTimeFrame ? `${adjustedTimeFrame.start.getTime()}-${adjustedTimeFrame.end.getTime()}` : '', 
    [adjustedTimeFrame]
  );
  const productCodesKey = useMemo(() => productCodes.join(','), [productCodes]);
  
  useEffect(() => {
    if (productCodes.length > 0 && adjustedTimeFrame) {
      console.log('[StockLevelHistoryChart] Dependencies changed, reloading data');
      setLoading(true);
      processHistoryData(productCodes)
        .catch((error) => {
          console.error('[StockLevelHistoryChart] Reload error:', error);
        })
        .finally(() => setLoading(false));
    }
  }, [timeFrameKey, productCodesKey, processHistoryData, adjustedTimeFrame, productCodes]);

  // 當刷新觸發器改變時，重新加載數據
  const prevRefreshTriggerRef = React.useRef(refreshTrigger);
  useEffect(() => {
    // 只在 refreshTrigger 真正改變時重新加載
    if (productCodes.length > 0 && refreshTrigger !== prevRefreshTriggerRef.current) {
      console.log('[StockLevelHistoryChart] Refresh triggered, reloading data');
      prevRefreshTriggerRef.current = refreshTrigger;
      setLoading(true);
      processHistoryData(productCodes)
        .catch((error) => {
          console.error('[StockLevelHistoryChart] Refresh error:', error);
        })
        .finally(() => setLoading(false));
    }
  }, [refreshTrigger, productCodes, processHistoryData]);

  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-lg">
          <p className="text-white text-sm font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="text-white ml-2 font-medium">{(entry.value || 0).toLocaleString()}</span>
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
      <div className="flex flex-wrap gap-2 justify-center mt-1">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-1">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[10px] text-gray-400">{entry.value}</span>
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
    <div className="h-full w-full p-2">
      {chartData.length === 0 || productCodes.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-400 text-sm text-center">
            Select a product type from the dropdown<br />
            to view stock level history<br />
            <span className="text-xs">(最多顯示10款產品)</span>
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 0, bottom: 35 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(100, 116, 139, 0.1)"
              vertical={false}
            />
            <XAxis 
              dataKey="time" 
              stroke="#64748b"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={50}
              interval={Math.floor(chartData.length / 8)}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={45}
              tickFormatter={(value) => {
                if (value >= 1000) {
                  return `${(value / 1000).toFixed(0)}k`;
                }
                return value.toString();
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            
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