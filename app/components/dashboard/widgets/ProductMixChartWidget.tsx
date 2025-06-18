/**
 * Stock Level 小部件
 * 支援三種尺寸：
 * - Small (1x1): 不支援
 * - Medium (3x3): 按 stock 類型分類顯示庫存
 * - Large (5x5): 包括 3x3 所有功能 + 圓餅圖視覺化
 */

'use client';

import React, { useEffect, useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetCard } from '@/app/components/dashboard/WidgetCard';
import { ChartPieIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { createClient } from '@/app/utils/supabase/client';
import { iconColors } from '@/app/utils/dialogStyles';
import { WidgetStyles } from '@/app/utils/widgetStyles';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProductData {
  code: string;
  count: number;
  percentage: number;
}

interface StockType {
  type: string;
  products: ProductData[];
  total: number;
}

const COLORS = WidgetStyles.charts.pie;

export function ProductMixChartWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [data, setData] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [stockTypes, setStockTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [stockByType, setStockByType] = useState<Map<string, StockType>>(new Map());

  const size = widget.config.size || WidgetSize.SMALL;

  useEffect(() => {
    loadData();
    
    if (widget.config.refreshInterval && !isEditMode) {
      const interval = setInterval(loadData, widget.config.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [widget.config, selectedType, isEditMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Get product distribution from stock_level - 只獲取有庫存的產品
      const { data: stockData, error: stockError } = await supabase
        .from('stock_level')
        .select('stock, stock_level')
        .gt('stock_level', 0)
        .order('stock_level', { ascending: false });

      if (stockError) throw stockError;
      
      // Get product types from data_code - 分批獲取所有記錄
      let allCodeData: any[] = [];
      let offset = 0;
      const batchSize = 1000;
      
      while (true) {
        const { data: batch, error: codeError } = await supabase
          .from('data_code')
          .select('code, type')
          .range(offset, offset + batchSize - 1);
          
        if (codeError) throw codeError;
        
        if (!batch || batch.length === 0) break;
        
        allCodeData = [...allCodeData, ...batch];
        offset += batchSize;
        
        if (batch.length < batchSize) break;
      }
      
      const codeData = allCodeData;

      if (!stockData || stockData.length === 0 || !codeData) {
        setData([]);
        setTotalProducts(0);
        return;
      }
      
      // Create a map of product code to type
      const codeTypeMap = new Map<string, string>();
      codeData.forEach(item => {
        // 將 "-" 視為 "Standard" 類型，null 或空值才設為 "Unknown"
        let productType = item.type;
        if (productType === '-') {
          productType = 'Standard';
        } else if (!productType) {
          productType = 'Unknown';
        }
        codeTypeMap.set(item.code, productType);
      });
      

      // Group stock by type
      const typeMap = new Map<string, StockType>();
      const allProducts: ProductData[] = [];
      let totalStock = 0;
      
      // 先統計有多少產品找到對應的 type
      let matchedCount = 0;
      let unmatchedCount = 0;
      
      stockData.forEach(record => {
        const stockLevel = record.stock_level || 0;
        
        if (stockLevel > 0) {
          const productType = codeTypeMap.get(record.stock) || 'Unknown';
          
          if (productType === 'Unknown') {
            unmatchedCount++;
          } else {
            matchedCount++;
          }
          
          if (!typeMap.has(productType)) {
            typeMap.set(productType, {
              type: productType,
              products: [],
              total: 0
            });
          }
          
          const typeData = typeMap.get(productType)!;
          typeData.products.push({
            code: record.stock,
            count: stockLevel,
            percentage: 0 // 將在稍後計算
          });
          typeData.total += stockLevel;
          totalStock += stockLevel;
          
          allProducts.push({
            code: record.stock,
            count: stockLevel,
            percentage: 0
          });
        }
      });
      
      // 計算百分比
      typeMap.forEach(typeData => {
        typeData.products.forEach(product => {
          product.percentage = Math.round((product.count / typeData.total) * 100);
        });
        typeData.products.sort((a, b) => b.count - a.count);
      });
      
      allProducts.forEach(product => {
        product.percentage = Math.round((product.count / totalStock) * 100);
      });
      allProducts.sort((a, b) => b.count - a.count);
      
      setStockByType(typeMap);
      const sortedTypes = Array.from(typeMap.keys()).sort();
      setStockTypes(['ALL', ...sortedTypes]);
      
      // 根據選擇的類型設定數據和總數
      if (selectedType === 'ALL') {
        setTotalProducts(totalStock);
        
        if (size === WidgetSize.LARGE) {
          // 對於大尺寸，組合小百分比
          const threshold = 2;
          const mainProducts: ProductData[] = [];
          let othersCount = 0;

          allProducts.forEach(product => {
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
              percentage: Math.round((othersCount / totalStock) * 100)
            });
          }

          setData(mainProducts);
        } else {
          setData(allProducts.slice(0, 10));
        }
      } else {
        const typeData = typeMap.get(selectedType);
        if (typeData) {
          setTotalProducts(typeData.total); // 設定為該類型的總數
          setData(typeData.products.slice(0, 10));
        } else {
          setTotalProducts(0);
          setData([]);
        }
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

  // Small size (1x1) - 不支援，顯示 N/A
  if (size === WidgetSize.SMALL) {
    return (
      <WidgetCard widgetType="PRODUCT_MIX_CHART" isEditMode={isEditMode}>
        <CardContent className="p-2 h-full flex flex-col justify-center items-center">
          <h3 className="text-xs text-slate-400 mb-1">Stock Level</h3>
          <div className="text-lg font-medium text-slate-500">(N/A)</div>
          <p className="text-xs text-slate-500 mt-1">1×1</p>
        </CardContent>
      </WidgetCard>
    );
  }

  // Medium size - 按類型顯示庫存
  if (size === WidgetSize.MEDIUM) {
    return (
      <WidgetCard widgetType="PRODUCT_MIX_CHART" isEditMode={isEditMode}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                <ChartPieIcon className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-sm font-medium text-slate-200">Stock Level</CardTitle>
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2 py-1 bg-white/5 border border-slate-600/30 rounded-md text-xs text-slate-300 focus:outline-none focus:border-orange-500/50"
              disabled={isEditMode}
            >
              {stockTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-white/10 rounded animate-pulse"></div>
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
                    <span className={`text-sm ${WidgetStyles.text.tableData}`}>{product.code}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${WidgetStyles.text.table}`}>{product.count.toLocaleString()}</span>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-700">
                <div className="flex justify-between text-xs">
                  <span className={WidgetStyles.text.tableHeader}>Total</span>
                  <span className={WidgetStyles.text.table}>{totalProducts} units</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </WidgetCard>
    );
  }

  // Large size - 上半部分明細 + 下半部分圓餅圖
  return (
    <WidgetCard widgetType="PRODUCT_MIX_CHART" isEditMode={isEditMode}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
              <ChartPieIcon className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-lg font-medium bg-gradient-to-r from-orange-300 via-amber-300 to-orange-200 bg-clip-text text-transparent">
              Stock Level Distribution
            </CardTitle>
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1 bg-white/5 border border-slate-600/30 rounded-md text-sm text-slate-300 focus:outline-none focus:border-orange-500/50"
            disabled={isEditMode}
          >
            {stockTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col h-[calc(100%-4rem)]">
        {loading ? (
          <div className="space-y-3">
            <div className="h-40 bg-white/10 rounded animate-pulse"></div>
            <div className="h-40 bg-white/10 rounded animate-pulse"></div>
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            No data available
          </div>
        ) : (
          <>
            {/* 上半部分 - 產品明細列表 (1/3) */}
            <div className="h-[33.33%] bg-black/20 rounded-lg p-3 mb-3 overflow-hidden">
              <div className="h-full overflow-y-auto pr-2">
                <div className="space-y-1">
                  {data.slice(0, 10).map((product, index) => (
                    <div key={product.code} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2.5 h-2.5 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className={`text-xs ${WidgetStyles.text.tableData}`}>{product.code}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-semibold ${WidgetStyles.text.table}`}>{product.count.toLocaleString()}</span>
                        <span className={`text-xs ${WidgetStyles.text.tableData} ml-1`}>({product.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-1 border-t border-slate-700">
                    <div className="flex justify-between text-xs">
                      <span className={WidgetStyles.text.tableHeader}>Total</span>
                      <span className={`font-semibold ${WidgetStyles.text.table}`}>{totalProducts.toLocaleString()} units</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 下半部分 - 圓餅圖 (2/3) */}
            <div className="h-[66.67%]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={{
                      stroke: '#94A3B8',
                      strokeWidth: 1
                    }}
                    label={({
                      cx,
                      cy,
                      midAngle,
                      innerRadius,
                      outerRadius,
                      value,
                      index,
                      name
                    }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = 35 + innerRadius + (outerRadius - innerRadius);
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      
                      // 從 data 中獲取百分比
                      const percentage = data[index].percentage;

                      return (
                        <text
                          x={x}
                          y={y}
                          fill={WidgetStyles.charts.line}
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          className="text-xs"
                        >
                          {`${name} (${percentage}%)`}
                        </text>
                      );
                    }}
                    outerRadius={125}
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
                      borderRadius: '8px',
                      color: '#FFFFFF'
                    }}
                    labelStyle={{ color: '#FFFFFF' }}
                    itemStyle={{ color: '#FFFFFF' }}
                    formatter={(value: any, name: any) => [`${value} units`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </WidgetCard>
  );
}