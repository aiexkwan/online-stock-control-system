/**
 * Output Stats Widget - GraphQL Version
 * 試點實施 GraphQL 查詢優化
 * 支援三種尺寸：
 * - Small (1x1): 顯示當天生成的 pallet number 總數，不支援 data range pick
 * - Medium (3x3): 顯示當天生成的 pallet number 總數和 product_code 及其 qty 總和，支援 data range pick
 * - Large (5x5): 分成上中下(1:1:2)，支援 data range pick
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetCard } from '../WidgetCard';
import { CubeIcon, ClockIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { dialogStyles, iconColors } from '@/app/utils/dialogStyles';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { getTodayRange, getYesterdayRange, getDateRange, formatDbTime } from '@/app/utils/timezone';
import { format } from 'date-fns';
import { UnifiedWidgetLayout, TableRow, ChartContainer } from '../UnifiedWidgetLayout';
import { useWidgetData } from '@/app/admin/hooks/useWidgetData';
import { useGraphQLQuery } from '@/lib/graphql-client-stable';
import { GET_PRODUCTION_STATS } from '@/lib/graphql/queries';

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

export const OutputStatsWidgetGraphQL = React.memo(function OutputStatsWidgetGraphQL({ widget, isEditMode }: WidgetComponentProps) {
  const [timeRange, setTimeRange] = useState('Today');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 暫時移除 size 邏輯，統一使用完整功能
  // 根據時間範圍設定查詢範圍
  const getDateRangeForQuery = () => {
    // 支援時間範圍選擇
      switch (timeRange) {
        case 'Yesterday':
          return getYesterdayRange();
        case 'Past 3 days':
          return getDateRange(3);
        case 'This week':
          return getDateRange(7);
        default:
          return getTodayRange();
      }
    return getTodayRange();
  };

  const dateRange = getDateRangeForQuery();

  // 使用 GraphQL 查詢 - 使用新的 stable client
  const { data: graphqlData, loading, error, isRefetching } = useGraphQLQuery(
    GET_PRODUCTION_STATS,
    {
      startDate: dateRange.start,
      endDate: dateRange.end
    }
  );

  // 處理 GraphQL 數據
  const processedData = React.useMemo<OutputData>(() => {
    if (!graphqlData?.record_palletinfoCollection) {
      return {
        palletCount: 0,
        productCodeCount: 0,
        totalQuantity: 0,
        productDetails: [],
        dailyData: []
      };
    }

    const edges = graphqlData.record_palletinfoCollection.edges || [];
    const pallets = edges.map((edge: any) => edge.node);
    const palletCount = edges.length;

    let productCodeCount = 0;
    let totalQuantity = 0;
    let productDetails: Array<{ product_code: string; quantity: number }> = [];
    let dailyData: any[] = [];

    // 統計不同 product_code 的數量
    if (palletCount > 0) {
      // 統計不同 product_code 的數量
      const productMap = new Map<string, number>();
      const dailyMap = new Map<string, Map<string, number>>();
      
      pallets.forEach((p: any) => {
        // 總計
        // GraphQL 返回的 product_qty 是字符串，需要轉換
        const qty = Number(p.product_qty) || 0;
        productMap.set(p.product_code, (productMap.get(p.product_code) || 0) + qty);
        
        // 按日期統計 (for Large size)
        // 按日期統計 (for chart)
        if (p.generate_time) {
          const date = formatDbTime(p.generate_time, 'yyyy-MM-dd');
          if (!dailyMap.has(date)) {
            dailyMap.set(date, new Map());
          }
          const dateData = dailyMap.get(date)!;
          const qty = Number(p.product_qty) || 0;
          dateData.set(p.product_code, (dateData.get(p.product_code) || 0) + qty);
        }
      });
      
      productCodeCount = productMap.size;
      totalQuantity = Array.from(productMap.values()).reduce((sum, qty) => sum + qty, 0);
      
      // Medium 和 Large size 都需要 productDetails
      productDetails = Array.from(productMap.entries())
        .map(([product_code, quantity]) => ({ product_code, quantity }))
        .sort((a, b) => b.quantity - a.quantity);
        
      // 生成圖表數據
      if (dailyMap.size > 0) {
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

    return {
      palletCount,
      productCodeCount,
      totalQuantity,
      productDetails,
      dailyData
    };
  }, [graphqlData]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange);
    setIsDropdownOpen(false);
  };

  // GraphQL 標識
  const GraphQLBadge = () => (
    <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs rounded-full shadow-lg">
      GraphQL
    </div>
  );

  // Small size (1x1) - 只顯示文字和數據，無 icon

  // Medium size - 顯示 pallet 總數和 product qty 總和，支援時間選擇

  return (
    <WidgetCard widgetType="OUTPUT_STATS" isEditMode={isEditMode}>
      <div className="relative h-full">
        <GraphQLBadge />
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
                className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-md transition-all duration-300 text-sm border border-slate-600/30"
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
                    className="absolute right-0 top-full mt-1 bg-black/80 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl z-50 min-w-[140px]"
                  >
                    {['Today', 'Yesterday', 'Past 3 days', 'This week'].map((option) => (
                      <button
                        key={option}
                        onClick={() => handleTimeRangeChange(option)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-all duration-300 first:rounded-t-xl last:rounded-b-xl ${
                          timeRange === option ? 'bg-white/10 text-blue-400' : 'text-slate-300'
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
          {loading && !graphqlData ? (
            <div className="h-64 bg-white/10 rounded animate-pulse"></div>
          ) : error ? (
            <div className="text-red-400 text-sm">GraphQL Error: {error.message}</div>
          ) : (
            <UnifiedWidgetLayout

              tableData={processedData.productDetails}
              renderTableRow={(product) => (
                <TableRow key={product.product_code}>
                  <span className="text-purple-200 text-xs">{product.product_code}</span>
                  <span className="text-purple-200 font-medium text-xs">{product.quantity.toLocaleString()}</span>
                </TableRow>
              )}
              tableContent={
                <div className="bg-black/20 rounded-lg p-2 h-full overflow-hidden flex flex-col">
                  <p className="text-xs text-purple-400 mb-1 flex-shrink-0">Product Details ({processedData.productCodeCount} codes, Total: {processedData.totalQuantity.toLocaleString()})</p>
                  {processedData.productDetails && processedData.productDetails.length > 0 ? (
                    <div className="flex-1 overflow-y-auto pr-1">
                      <div className="space-y-0.5">
                        {processedData.productDetails.slice(0, 4).map((product) => (
                          <TableRow key={product.product_code}>
                            <span className="text-purple-200 text-xs">{product.product_code}</span>
                            <span className="text-purple-200 font-medium text-xs">{product.quantity.toLocaleString()}</span>
                          </TableRow>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 text-center py-2">No data</div>
                  )}
                </div>
              }
              chartContent={
                <ChartContainer title="Daily Product Quantity Chart (Top 3)">
                  {processedData.productDetails && processedData.productDetails.length > 0 ? (
                    <>
                      {(!processedData.dailyData || processedData.dailyData.length === 0) ? (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-sm text-slate-500">No chart data available</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={processedData.dailyData}
                            margin={{ top: 5, right: 0, left: 0, bottom: 20 }}
                          >
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#9CA3AF"
                            tick={{ fontSize: 10, fill: '#9CA3AF' }}
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
                          {processedData.productDetails && processedData.productDetails.length > 0 ? (
                            processedData.productDetails.slice(0, 3).map((product, index) => (
                              <Bar 
                                key={product.product_code}
                                dataKey={product.product_code} 
                                fill={[
                                  '#3B82F6', // Blue
                                  '#F59E0B', // Amber
                                  '#8B5CF6', // Purple
                                ][index]}
                                radius={[4, 4, 0, 0]}
                              />
                            ))
                          ) : (
                            <Bar dataKey="quantity" fill="#10B981" radius={[4, 4, 0, 0]} />
                          )}
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-sm text-slate-500">No product data available</p>
                    </div>
                  )}
                </ChartContainer>
              }
            />
          )}
        </CardContent>
      </div>
    </WidgetCard>
  );
});