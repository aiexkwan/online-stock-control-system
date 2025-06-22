/**
 * Responsive Chart Widget
 * 根據大小顯示不同複雜度的圖表 - 庫存統計
 */

'use client';

import React, { useState, useCallback, useEffect, memo } from 'react';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { ResponsiveWidgetWrapper } from '../ResponsiveWidgetWrapper';
import { ContentLevel } from '@/app/admin/types/widgetContentLevel';
import { TrendingUp, BarChart3, PieChart, Package } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { createClient } from '@/app/utils/supabase/client';
import { cn } from '@/lib/utils';
import { useAdminRefresh } from '@/app/admin/contexts/AdminRefreshContext';

interface InventoryData {
  totalInventory: number;
  locationData: Array<{
    location: string;
    count: number;
    percentage: number;
  }>;
  topProducts: Array<{
    product_code: string;
    total: number;
  }>;
  trend: number;
}

// 位置顏色映射
const LOCATION_COLORS: Record<string, string> = {
  'injection': '#3b82f6',      // 藍色
  'pipeline': '#10b981',       // 綠色
  'prebook': '#f59e0b',        // 橙色
  'await': '#ef4444',          // 紅色
  'fold': '#8b5cf6',           // 紫色
  'bulk': '#6366f1',           // 靛藍色
  'backcarpark': '#64748b',    // 灰色
};

const ResponsiveChartWidget = memo<WidgetComponentProps>(({ widget, isEditMode }) => {
  const [data, setData] = useState<InventoryData>({
    totalInventory: 0,
    locationData: [],
    topProducts: [],
    trend: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const { refreshTrigger } = useAdminRefresh();

  // 載入庫存數據
  const loadInventoryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      
      // 查詢庫存數據
      const { data: inventoryData, error: queryError } = await supabase
        .from('record_inventory')
        .select('*');

      if (queryError) throw queryError;

      if (inventoryData) {
        // 計算各位置的庫存總和
        const locationTotals = {
          injection: 0,
          pipeline: 0,
          prebook: 0,
          await: 0,
          fold: 0,
          bulk: 0,
          backcarpark: 0
        };

        const productMap = new Map<string, number>();

        for (const record of inventoryData) {
          // 累加各位置的庫存
          locationTotals.injection += record.injection || 0;
          locationTotals.pipeline += record.pipeline || 0;
          locationTotals.prebook += record.prebook || 0;
          locationTotals.await += record.await || 0;
          locationTotals.fold += record.fold || 0;
          locationTotals.bulk += record.bulk || 0;
          locationTotals.backcarpark += record.backcarpark || 0;

          // 統計產品總數
          const productTotal = (record.injection || 0) + (record.pipeline || 0) + 
                              (record.prebook || 0) + (record.await || 0) + 
                              (record.fold || 0) + (record.bulk || 0) + 
                              (record.backcarpark || 0);
          
          if (productTotal > 0) {
            productMap.set(record.product_code, productTotal);
          }
        }

        // 計算總庫存
        const totalInventory = Object.values(locationTotals).reduce((sum, val) => sum + val, 0);

        // 格式化位置數據
        const locationData = Object.entries(locationTotals)
          .filter(([_, count]) => count > 0)
          .map(([location, count]) => ({
            location: location.charAt(0).toUpperCase() + location.slice(1),
            count,
            percentage: totalInventory > 0 ? (count / totalInventory * 100) : 0
          }))
          .sort((a, b) => b.count - a.count);

        // 獲取前 10 個產品
        const topProducts = Array.from(productMap.entries())
          .map(([product_code, total]) => ({ product_code, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 10);

        // 簡單的趨勢計算（這裡可以根據實際需求改進）
        const trend = 5.2; // 假設增長率

        setData({
          totalInventory,
          locationData,
          topProducts,
          trend
        });
      }

    } catch (err: any) {
      console.error('Error loading inventory data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始載入和刷新觸發
  useEffect(() => {
    if (!isEditMode) {
      loadInventoryData();
    }
  }, [isEditMode, loadInventoryData, refreshTrigger]);
  return (
    <ResponsiveWidgetWrapper widget={widget} isEditMode={isEditMode}>
      {(level) => {
        // MINIMAL - 只顯示總數
        if (level === ContentLevel.MINIMAL) {
          return (
            <div className="flex items-center justify-center h-full">
              {loading ? (
                <div className="h-8 w-16 bg-white/10 rounded animate-pulse"></div>
              ) : error ? (
                <span className="text-red-400 text-xs">Error</span>
              ) : (
                <div className="text-center">
                  <Package className="w-6 h-6 text-cyan-500 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-white">{data.totalInventory.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Total Stock</div>
                </div>
              )}
            </div>
          );
        }

        // COMPACT - 簡單的分布列表
        if (level === ContentLevel.COMPACT) {
          return (
            <div className="flex flex-col h-full p-3">
              <div className="flex items-center gap-2 mb-2">
                <PieChart className="w-5 h-5 text-cyan-500" />
                <h3 className="text-sm text-gray-400">Inventory Distribution</h3>
              </div>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 w-full bg-white/10 rounded animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse"></div>
                  <div className="h-4 w-5/6 bg-white/10 rounded animate-pulse"></div>
                </div>
              ) : error ? (
                <span className="text-red-400 text-xs">{error}</span>
              ) : (
                <div className="flex-1 space-y-1">
                  {data.locationData.slice(0, 3).map((loc) => (
                    <div key={loc.location} className="flex justify-between items-center text-xs">
                      <span className="text-gray-300">{loc.location}</span>
                      <span className="text-white font-medium">{loc.count.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="text-xs text-gray-500 pt-1">
                    Total: {data.totalInventory.toLocaleString()} units
                  </div>
                </div>
              )}
            </div>
          );
        }

        // STANDARD - 餅圖
        if (level === ContentLevel.STANDARD) {
          return (
            <div className="flex flex-col h-full p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-6 h-6 text-cyan-500" />
                <h3 className="text-base text-gray-400">Inventory Distribution</h3>
              </div>
              {loading ? (
                <div className="flex-1 bg-white/10 rounded animate-pulse"></div>
              ) : error ? (
                <span className="text-red-400 text-sm">{error}</span>
              ) : (
                <>
                  <div className="flex-1 min-h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={data.locationData}
                          dataKey="count"
                          nameKey="location"
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          label={false}
                        >
                          {data.locationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={LOCATION_COLORS[entry.location.toLowerCase()] || '#64748b'} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: '1px solid #334155',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}
                          formatter={(value: any) => value.toLocaleString()}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1 mt-2">
                    {data.locationData.slice(0, 3).map((loc) => (
                      <div key={loc.location} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded" 
                            style={{ backgroundColor: LOCATION_COLORS[loc.location.toLowerCase()] || '#64748b' }}
                          />
                          <span className="text-gray-300">{loc.location}</span>
                        </div>
                        <span className="text-white font-medium">{loc.percentage.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        }

        // DETAILED & FULL - 完整圖表
        return (
          <div className="flex flex-col h-full p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Inventory Statistics</h3>
                  <p className="text-sm text-gray-400">By location and product</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setChartType('pie')}
                  className={cn(
                    "px-3 py-1 text-xs rounded transition-colors",
                    chartType === 'pie' ? "bg-cyan-500 text-white" : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                  )}
                >
                  <PieChart className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setChartType('bar')}
                  className={cn(
                    "px-3 py-1 text-xs rounded transition-colors",
                    chartType === 'bar' ? "bg-cyan-500 text-white" : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                  )}
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4 flex-1">
                <div className="h-20 bg-white/10 rounded animate-pulse"></div>
                <div className="h-32 bg-white/10 rounded animate-pulse"></div>
                <div className="h-20 bg-white/10 rounded animate-pulse"></div>
              </div>
            ) : error ? (
              <div className="text-red-400 text-sm">{error}</div>
            ) : (
              <>
                {/* 統計卡片 */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Total Stock</div>
                    <div className="text-xl font-bold text-white">{data.totalInventory.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Locations</div>
                    <div className="text-xl font-bold text-white">{data.locationData.length}</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Products</div>
                    <div className="text-xl font-bold text-white">{data.topProducts.length}</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Trend</div>
                    <div className="text-xl font-bold text-green-500">+{data.trend}%</div>
                  </div>
                </div>

                {/* 圖表區域 */}
                <div className="flex-1 bg-slate-800 rounded-lg p-4 mb-4">
                  {chartType === 'pie' ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={data.locationData}
                          dataKey="count"
                          nameKey="location"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={(entry) => `${entry.location}: ${entry.percentage.toFixed(1)}%`}
                          labelLine={false}
                        >
                          {data.locationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={LOCATION_COLORS[entry.location.toLowerCase()] || '#64748b'} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            padding: '10px'
                          }}
                          formatter={(value: any) => value.toLocaleString()}
                        />
                        <Legend />
                      </RePieChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.locationData} margin={{ top: 10, right: 30, left: 30, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis 
                          dataKey="location" 
                          stroke="#94a3b8"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          stroke="#94a3b8"
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            padding: '10px'
                          }}
                          formatter={(value: any) => value.toLocaleString()}
                        />
                        <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]}>
                          {data.locationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={LOCATION_COLORS[entry.location.toLowerCase()] || '#64748b'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* 產品列表 */}
                {level === ContentLevel.FULL && data.topProducts.length > 0 && (
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">Top Products by Quantity</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {data.topProducts.slice(0, 6).map((product, index) => (
                        <div key={product.product_code} className="flex items-center justify-between bg-slate-800 rounded p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-cyan-500/20 rounded flex items-center justify-center text-xs font-bold text-cyan-400">
                              {index + 1}
                            </div>
                            <span className="text-sm text-white">{product.product_code}</span>
                          </div>
                          <span className="text-sm font-bold text-cyan-400">{product.total.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      }}
    </ResponsiveWidgetWrapper>
  );
});

ResponsiveChartWidget.displayName = 'ResponsiveChartWidget';

export default ResponsiveChartWidget;