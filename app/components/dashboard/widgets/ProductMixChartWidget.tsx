/**
 * 產品混合圖表小部件
 * 支援三種尺寸：
 * - Small: 只顯示總產品數
 * - Medium: 顯示前5個產品的數量
 * - Large: 完整的圓餅圖視覺化
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartPieIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { createClient } from '@/app/utils/supabase/client';
import { iconColors } from '@/app/utils/dialogStyles';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProductData {
  code: string;
  count: number;
  percentage: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export function ProductMixChartWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [data, setData] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);

  const size = widget.config.size || WidgetSize.SMALL;
  const timeRange = widget.config.timeRange || 'today';

  useEffect(() => {
    loadData();
    
    if (widget.config.refreshInterval) {
      const interval = setInterval(loadData, widget.config.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [widget.config, timeRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      // Get product distribution
      const { data: palletData, error: palletError } = await supabase
        .from('record_palletinfo')
        .select('product_code')
        .gte('generate_time', startDate.toISOString())
        .not('plt_remark', 'ilike', '%Material GRN-%');

      if (palletError) throw palletError;

      if (!palletData || palletData.length === 0) {
        setData([]);
        setTotalProducts(0);
        return;
      }

      // Count products
      const productCounts = new Map<string, number>();
      palletData.forEach(record => {
        const code = record.product_code;
        productCounts.set(code, (productCounts.get(code) || 0) + 1);
      });

      // Convert to array and calculate percentages
      const total = palletData.length;
      setTotalProducts(total);
      
      const productArray = Array.from(productCounts.entries())
        .map(([code, count]) => ({
          code,
          count,
          percentage: Math.round((count / total) * 100)
        }))
        .sort((a, b) => b.count - a.count);

      // For small/medium sizes, limit to top products
      if (size !== WidgetSize.LARGE) {
        setData(productArray.slice(0, 5));
      } else {
        // For large size, group small percentages
        const threshold = 2; // Group products with less than 2%
        const mainProducts: ProductData[] = [];
        let othersCount = 0;

        productArray.forEach(product => {
          if (product.percentage >= threshold && mainProducts.length < 7) {
            mainProducts.push(product);
          } else {
            othersCount += product.count;
          }
        });

        if (othersCount > 0) {
          mainProducts.push({
            code: 'Others',
            count: othersCount,
            percentage: Math.round((othersCount / total) * 100)
          });
        }

        setData(mainProducts);
      }

      setError(null);
    } catch (err: any) {
      console.error('Error loading product mix data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Custom label for pie chart
  const renderCustomLabel = (entry: any) => {
    return entry.percentage > 5 ? `${entry.percentage}%` : '';
  };

  // Small size - only show total count
  if (size === WidgetSize.SMALL) {
    return (
      <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-orange-500/30 shadow-2xl ${isEditMode ? 'border-dashed border-2 border-orange-500/50' : ''}`}>
        <CardContent className="p-4 h-full flex flex-col justify-center items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center mb-2">
            <ChartPieIcon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-sm font-medium text-slate-400 mb-1">Product Mix</h3>
          {loading ? (
            <div className="h-12 w-20 bg-slate-700 rounded animate-pulse"></div>
          ) : error ? (
            <div className="text-red-400 text-sm">Error</div>
          ) : (
            <>
              <div className="text-4xl font-bold text-white">{data.length}</div>
              <p className="text-xs text-slate-400 mt-1">Products</p>
              <p className="text-xs text-slate-500">{totalProducts} total pallets</p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Medium size - show top 5 products
  if (size === WidgetSize.MEDIUM) {
    return (
      <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-orange-500/30 shadow-2xl ${isEditMode ? 'border-dashed border-2 border-orange-500/50' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
              <ChartPieIcon className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-sm font-medium text-slate-200">Product Mix</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-slate-700 rounded animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-red-400 text-sm">{error}</div>
          ) : data.length === 0 ? (
            <div className="text-slate-400 text-sm text-center">No data available</div>
          ) : (
            <div className="space-y-2">
              {data.map((product, index) => (
                <div key={product.code} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-slate-300">{product.code}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-white">{product.count}</span>
                    <span className="text-xs text-slate-400 ml-1">({product.percentage}%)</span>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-700">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Total</span>
                  <span>{totalProducts} pallets</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Large size - full pie chart
  return (
    <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-orange-500/30 shadow-2xl ${isEditMode ? 'border-dashed border-2 border-orange-500/50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
              <ChartPieIcon className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-lg font-medium bg-gradient-to-r from-orange-300 via-amber-300 to-orange-200 bg-clip-text text-transparent">
              Product Mix Distribution
            </CardTitle>
          </div>
          <select
            value={timeRange}
            onChange={(e) => widget.config.timeRange = e.target.value}
            className="px-3 py-1 bg-slate-700/50 border border-slate-600/30 rounded-md text-sm text-slate-300 focus:outline-none focus:border-orange-500/50"
            disabled={isEditMode}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 bg-slate-700 rounded animate-pulse"></div>
        ) : error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400">
            No data available
          </div>
        ) : (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="code"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any, name: any) => [`${value} pallets`, name]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    wrapperStyle={{ paddingTop: '10px' }}
                    formatter={(value) => (
                      <span style={{ color: '#94A3B8', fontSize: '12px' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-slate-400">
                Total: <span className="font-semibold text-white">{totalProducts}</span> pallets across{' '}
                <span className="font-semibold text-white">{data.length}</span> products
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}