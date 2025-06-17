/**
 * Output Stats 小部件
 * 支援三種尺寸：
 * - Small (2x2): 顯示當天生成的 pallet number 總數，不支援 data range pick
 * - Medium (4x4): 顯示當天生成的 pallet number 總數和 product_code 及其 qty 總和，支援 data range pick
 * - Large (6x6): 分成上中下(1:1:2)，支援 data range pick
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CubeIcon, ClockIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { createClient } from '@/app/utils/supabase/client';
import { dialogStyles, iconColors } from '@/app/utils/dialogStyles';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { getTodayRange, getYesterdayRange, getDateRange, formatDbTime } from '@/app/utils/timezone';

interface OutputData {
  palletCount: number;
  productCodeCount: number;
  totalQuantity: number;
  productDetails?: Array<{ 
    product_code: string; 
    quantity: number; 
  }>;
  dailyData?: Array<{
    date: string;
    [key: string]: any; // 動態 product code 欄位
  }>;
}

export function OutputStatsWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [data, setData] = useState<OutputData>({
    palletCount: 0,
    productCodeCount: 0,
    totalQuantity: 0,
    productDetails: [],
    dailyData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('Today');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const size = widget.config.size || WidgetSize.SMALL;

  useEffect(() => {
    loadData();
    
    if (widget.config.refreshInterval && !isEditMode) {
      const interval = setInterval(loadData, widget.config.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [widget.config, timeRange, isEditMode]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      // 根據時間範圍設定查詢範圍
      let dateRange;
      if (size === WidgetSize.MEDIUM || size === WidgetSize.LARGE) {
        // 4x4 和 6x6 模式支援時間範圍選擇
        switch (timeRange) {
          case 'Yesterday':
            dateRange = getYesterdayRange();
            break;
          case 'Past 3 days':
            dateRange = getDateRange(3);
            break;
          case 'This week':
            dateRange = getDateRange(7);
            break;
          default:
            dateRange = getTodayRange();
        }
      } else {
        // 2x2 模式只顯示當天
        dateRange = getTodayRange();
      }

      // 查詢 pallet 總數 - 只顯示 plt_remark="Finished In Production"
      const { count: palletCount } = await supabase
        .from('record_palletinfo')
        .select('*', { count: 'exact', head: true })
        .gte('generate_time', dateRange.start)
        .lt('generate_time', dateRange.end)
        .eq('plt_remark', 'Finished In Production');

      // 如果是 Medium 或 Large size，還需要獲取 product code 統計
      let productCodeCount = 0;
      let totalQuantity = 0;
      let productDetails = [];
      let dailyData = [];
      
      if (size === WidgetSize.MEDIUM || size === WidgetSize.LARGE) {
        // 獲取所有產品代碼和數量
        const { data: products } = await supabase
          .from('record_palletinfo')
          .select('product_code, product_qty, generate_time')
          .gte('generate_time', dateRange.start)
          .lt('generate_time', dateRange.end)
          .eq('plt_remark', 'Finished In Production');

        if (products) {
          // 統計不同 product_code 的數量
          const productMap = new Map<string, number>();
          const dailyMap = new Map<string, Map<string, number>>();
          
          products.forEach(p => {
            // 總計
            productMap.set(p.product_code, (productMap.get(p.product_code) || 0) + (p.product_qty || 0));
            
            // 按日期統計 (for Large size)
            if (size === WidgetSize.LARGE) {
              const date = formatDbTime(p.generate_time).split(' ')[0]; // 取日期部分
              if (!dailyMap.has(date)) {
                dailyMap.set(date, new Map());
              }
              const dateData = dailyMap.get(date)!;
              dateData.set(p.product_code, (dateData.get(p.product_code) || 0) + (p.product_qty || 0));
            }
          });
          
          productCodeCount = productMap.size;
          totalQuantity = Array.from(productMap.values()).reduce((sum, qty) => sum + qty, 0);
          
          // Medium 和 Large size 都需要 productDetails
          productDetails = Array.from(productMap.entries())
            .map(([product_code, quantity]) => ({ product_code, quantity }))
            .sort((a, b) => b.quantity - a.quantity);
            
          // Large size 需要 daily data for grouped bar chart
          if (size === WidgetSize.LARGE) {
            // 獲取前 3 個產品代碼
            const topProducts = productDetails.slice(0, 3).map(p => p.product_code);
            
            // 轉換成圖表數據格式
            dailyData = Array.from(dailyMap.entries())
              .map(([date, products]) => {
                const dayData: any = { date };
                topProducts.forEach(code => {
                  dayData[code] = products.get(code) || 0;
                });
                return dayData;
              })
              .sort((a, b) => a.date.localeCompare(b.date));
          }
        }
      }

      setData({
        palletCount: palletCount || 0,
        productCodeCount,
        totalQuantity,
        productDetails,
        dailyData
      });
      setError(null);
    } catch (err: any) {
      console.error('Error loading output data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange);
    setIsDropdownOpen(false);
  };

  // Small size - only show number
  if (size === WidgetSize.SMALL) {
    return (
      <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-blue-500/30 shadow-2xl ${isEditMode ? 'border-dashed border-2 border-blue-500/50' : ''}`}>
        <CardContent className="p-4 h-full flex flex-col justify-center items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-2">
            <CubeIcon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-sm font-medium text-slate-400 mb-1">Today's Output</h3>
          {loading ? (
            <div className="h-12 w-20 bg-slate-700 rounded animate-pulse"></div>
          ) : error ? (
            <div className="text-red-400 text-sm">Error</div>
          ) : (
            <>
              <div className="text-4xl font-bold text-white">{data.palletCount}</div>
              <p className="text-xs text-slate-500 mt-1">Pallets</p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Medium size - 顯示 pallet 總數和 product qty 總和，支援時間選擇
  if (size === WidgetSize.MEDIUM) {
    return (
      <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-blue-500/30 shadow-2xl ${isEditMode ? 'border-dashed border-2 border-blue-500/50' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <CubeIcon className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-sm font-medium text-slate-200">Output Stats</CardTitle>
            </div>
            
            {/* Time Range Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-md transition-all duration-300 text-xs border border-slate-600/30"
                disabled={isEditMode}
              >
                <ClockIcon className="w-3 h-3" />
                {timeRange}
                <ChevronDownIcon className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-1 bg-slate-900/98 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl z-50 min-w-[120px]"
                  >
                    {['Today', 'Yesterday', 'Past 3 days', 'This week'].map((option) => (
                      <button
                        key={option}
                        onClick={() => handleTimeRangeChange(option)}
                        className={`w-full px-3 py-2 text-left text-xs hover:bg-slate-700/50 transition-all duration-300 first:rounded-t-xl last:rounded-b-xl ${
                          timeRange === option ? 'bg-slate-700/50 text-blue-400' : 'text-slate-300'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {loading ? (
            <div className="space-y-3">
              <div className="h-16 bg-slate-700 rounded animate-pulse"></div>
              <div className="h-16 bg-slate-700 rounded animate-pulse"></div>
            </div>
          ) : error ? (
            <div className="text-red-400 text-sm">{error}</div>
          ) : (
            <div className="h-full flex flex-col space-y-2">
              {/* Pallet 總數 */}
              <div className="bg-slate-800/50 rounded-lg p-2">
                <p className="text-xs text-slate-400">Total Pallets</p>
                <div className="text-2xl font-bold text-white">{data.palletCount}</div>
              </div>
              
              {/* Product 明細 */}
              <div className="flex-1 bg-slate-800/50 rounded-lg p-2 overflow-hidden">
                <p className="text-xs text-slate-400 mb-1">Product Details ({data.productCodeCount} codes, Total: {data.totalQuantity.toLocaleString()})</p>
                
                {data.productDetails && data.productDetails.length > 0 ? (
                  <div className="max-h-[calc(100%-1.5rem)] overflow-y-auto pr-1">
                    <div className="space-y-1">
                      {data.productDetails.map((product) => (
                        <div 
                          key={product.product_code}
                          className="flex justify-between items-center py-1 px-2 text-xs hover:bg-slate-700/50 rounded transition-colors"
                        >
                          <span className="text-slate-300">{product.product_code}</span>
                          <span className="text-white font-medium">{product.quantity.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 text-center py-4">No data</div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Large size - add chart
  return (
    <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-blue-500/30 shadow-2xl ${isEditMode ? 'border-dashed border-2 border-blue-500/50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <CubeIcon className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-lg font-medium bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text text-transparent">
              Production Output
            </CardTitle>
          </div>
          
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-md transition-all duration-300 text-sm border border-slate-600/30"
            >
              <ClockIcon className="w-4 h-4" />
              {timeRange}
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-1 bg-slate-900/98 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl z-50 min-w-[140px]"
                >
                  {['Today', 'Yesterday', 'Past 3 days', 'This week'].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleTimeRangeChange(option)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-700/50 transition-all duration-300 first:rounded-t-xl last:rounded-b-xl ${
                        timeRange === option ? 'bg-slate-700/50 text-blue-400' : 'text-slate-300'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {loading ? (
          <div className="h-64 bg-slate-700 rounded animate-pulse"></div>
        ) : error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : (
          <div className="h-full flex flex-col">
            {/* 上部份 - Pallet 總數 (1/4) */}
            <div className="flex-1 mb-2">
              <div className="bg-slate-800/50 rounded-lg p-3 h-full flex flex-col justify-center">
                <p className="text-sm text-slate-400 mb-1">Total Pallets</p>
                <div className="text-4xl font-bold text-white">{data.palletCount}</div>
              </div>
            </div>
            
            {/* 中部份 - Product Code 明細列表 (1/4) */}
            <div className="flex-1 mb-2">
              <div className="bg-slate-800/50 rounded-lg p-2 h-full overflow-hidden flex flex-col">
                <p className="text-xs text-slate-400 mb-1">Product Details ({data.productCodeCount} codes, Total: {data.totalQuantity.toLocaleString()})</p>
                {data.productDetails && data.productDetails.length > 0 ? (
                  <div className="flex-1 overflow-y-auto pr-1">
                    <div className="space-y-0.5">
                      {data.productDetails.map((product) => (
                        <div 
                          key={product.product_code}
                          className="flex justify-between items-center py-0.5 px-2 text-xs hover:bg-slate-700/50 rounded transition-colors"
                        >
                          <span className="text-slate-300">{product.product_code}</span>
                          <span className="text-white font-medium">{product.quantity.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 text-center py-2">No data</div>
                )}
              </div>
            </div>
            
            {/* 下部份 - 棒型圖 (2/4) */}
            <div className="flex-[2] bg-slate-800/30 rounded-lg p-3">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Daily Product Quantity Chart (Top 3)</h4>
              {data.dailyData && data.dailyData.length > 0 && data.productDetails && data.productDetails.length > 0 ? (
                <div style={{ width: '100%', height: '450px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={data.dailyData}
                      margin={{ top: 10, right: 10, left: 5, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#9CA3AF"
                        tick={false}
                        axisLine={{ stroke: '#9CA3AF' }}
                      />
                      <YAxis 
                        stroke="#9CA3AF" 
                        tick={{ fontSize: 11, fill: '#9CA3AF' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#E5E7EB'
                        }}
                        formatter={(value: any) => value.toLocaleString()}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      />
                      {/* 動態生成 Bar components for top 3 products */}
                      {data.productDetails.slice(0, 3).map((product, index) => (
                        <Bar 
                          key={product.product_code}
                          dataKey={product.product_code} 
                          fill={[
                            '#3B82F6', // Blue
                            '#10B981', // Green
                            '#F59E0B', // Amber
                          ][index]}
                          radius={[4, 4, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ height: '450px' }} className="flex items-center justify-center">
                  <p className="text-sm text-slate-500">No data to display</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}