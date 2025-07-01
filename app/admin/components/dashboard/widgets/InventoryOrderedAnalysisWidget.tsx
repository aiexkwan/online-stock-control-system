'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useAdminRefresh } from '@/app/admin/contexts/AdminRefreshContext';
import { Loader2, Package, TrendingUp, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { createClient } from '@/app/utils/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

interface ProductAnalysis {
  productCode: string;
  description: string;
  currentStock: number;
  orderDemand: number;
  remainingStock: number;
  fulfillmentRate: number;
  isSufficient: boolean;
}

interface InventoryOrderedAnalysisWidgetProps extends WidgetComponentProps {}

// 顏色配置
const STATUS_COLORS = {
  sufficient: '#10b981',   // emerald-500 - 庫存充足
  warning: '#f59e0b',      // amber-500 - 庫存警告
  insufficient: '#ef4444', // red-500 - 庫存不足
};

export const InventoryOrderedAnalysisWidget: React.FC<InventoryOrderedAnalysisWidgetProps> = ({ 
  widget, 
  isEditMode 
}) => {
  const [productAnalysis, setProductAnalysis] = useState<ProductAnalysis[]>([]);
  const [totalStock, setTotalStock] = useState(0);
  const [totalDemand, setTotalDemand] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [overallSufficient, setOverallSufficient] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const { refreshTrigger } = useAdminRefresh();
  const supabase = createClient();

  // 獲取庫存滿足分析數據
  const fetchInventoryAnalysis = useCallback(async (productCodes?: string[]) => {
    setLoading(true);
    try {
      // 1. 獲取庫存數據
      let stockQuery = supabase
        .from('stock_level')
        .select('stock, stock_level, update_time')
        .order('update_time', { ascending: false });

      // 如果有指定產品代碼，則過濾
      if (productCodes && productCodes.length > 0) {
        stockQuery = stockQuery.in('stock', productCodes);
      }

      const { data: stockData, error: stockError } = await stockQuery;
      if (stockError) throw stockError;

      // 計算每個產品的最新庫存
      const latestStockByProduct = new Map<string, number>();
      stockData?.forEach(item => {
        if (!latestStockByProduct.has(item.stock)) {
          latestStockByProduct.set(item.stock, item.stock_level);
        }
      });

      // 2. 獲取訂單需求數據
      let orderQuery = supabase
        .from('data_order')
        .select('product_code, product_desc, product_qty, loaded_qty');

      // 如果有指定產品代碼，則過濾
      if (productCodes && productCodes.length > 0) {
        orderQuery = orderQuery.in('product_code', productCodes);
      }

      const { data: orderData, error: orderError } = await orderQuery;
      if (orderError) throw orderError;

      // 計算每個產品的訂單需求
      const demandByProduct = new Map<string, { demand: number; description: string }>();
      orderData?.forEach(order => {
        const currentDemand = demandByProduct.get(order.product_code)?.demand || 0;
        const remainingDemand = parseInt(order.product_qty) - parseInt(order.loaded_qty || '0');
        
        demandByProduct.set(order.product_code, {
          demand: currentDemand + Math.max(0, remainingDemand),
          description: order.product_desc
        });
      });

      // 3. 獲取產品詳情（如果需要）
      const productCodesToQuery = Array.from(new Set([
        ...Array.from(latestStockByProduct.keys()),
        ...Array.from(demandByProduct.keys())
      ]));

      let productInfoQuery = supabase
        .from('data_code')
        .select('code, description, type')
        .in('code', productCodesToQuery);

      const { data: productInfo, error: productInfoError } = await productInfoQuery;
      if (productInfoError) throw productInfoError;

      const productInfoMap = new Map(productInfo?.map(p => [p.code, p]) || []);

      // 4. 分析每個產品的庫存滿足情況
      const analysis: ProductAnalysis[] = [];
      let totalStockForOrderedProducts = 0;  // 只計算有訂單產品的庫存
      let totalDemandSum = 0;
      let totalRemainingSum = 0;

      // 只處理有訂單需求的產品
      demandByProduct.forEach((demandInfo, productCode) => {
        const stock = latestStockByProduct.get(productCode) || 0;
        const demand = demandInfo.demand;
        const productInfoData = productInfoMap.get(productCode);
        const description = demandInfo.description || productInfoData?.description || productCode;
        
        const remaining = stock - demand;
        const fulfillmentRate = demand > 0 ? (stock / demand) * 100 : 100;
        
        // 只有有訂單需求的產品才加入分析
        if (demand > 0) {
          analysis.push({
            productCode,
            description,
            currentStock: stock,
            orderDemand: demand,
            remainingStock: remaining,
            fulfillmentRate,
            isSufficient: remaining >= 0
          });

          totalStockForOrderedProducts += stock;
          totalDemandSum += demand;
          totalRemainingSum += remaining;
        }
      });

      // 排序：先顯示庫存不足的產品
      analysis.sort((a, b) => {
        if (a.isSufficient !== b.isSufficient) {
          return a.isSufficient ? 1 : -1;
        }
        return b.orderDemand - a.orderDemand;
      });

      setProductAnalysis(analysis);
      setTotalStock(totalStockForOrderedProducts);  // 只顯示有訂單產品的總庫存
      setTotalDemand(totalDemandSum);
      setTotalRemaining(totalRemainingSum);
      setOverallSufficient(totalDemandSum === 0 || totalStockForOrderedProducts >= totalDemandSum);
    } catch (error) {
      console.error('Error fetching inventory analysis:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // 監聽 StockTypeSelector 的類型變更事件
  useEffect(() => {
    const handleTypeChange = (event: CustomEvent) => {
      console.log('[InventoryOrderedAnalysis] Received stockTypeChanged event:', event.detail);
      const { type, data } = event.detail;
      setSelectedType(type);
      
      // 獲取該類型所有產品的代碼
      const codes = data.map((item: any) => item.stock);
      
      if (type === 'all' || type === 'ALL TYPES') {
        // 如果選擇全部，不傳入產品代碼過濾
        fetchInventoryAnalysis();
      } else {
        // 否則只分析選定類型的產品
        fetchInventoryAnalysis(codes);
      }
    };

    window.addEventListener('stockTypeChanged', handleTypeChange as EventListener);
    
    // 初始加載所有數據
    fetchInventoryAnalysis();
    
    return () => {
      window.removeEventListener('stockTypeChanged', handleTypeChange as EventListener);
    };
  }, [fetchInventoryAnalysis]);

  // 當刷新觸發時重新加載數據
  useEffect(() => {
    if (selectedType === 'all' || selectedType === 'ALL TYPES') {
      fetchInventoryAnalysis();
    }
  }, [refreshTrigger, fetchInventoryAnalysis, selectedType]);

  // 計算不足產品數量
  const insufficientProducts = productAnalysis.filter(p => !p.isSufficient).length;
  const sufficientProducts = productAnalysis.filter(p => p.isSufficient).length;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Package className="w-5 h-5" />
          Inventory Ordered Analysis
        </h3>
      </div>

      {/* 總體狀態卡片 */}
      <div className="mb-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border ${
            overallSufficient 
              ? 'bg-emerald-900/20 border-emerald-700' 
              : 'bg-red-900/20 border-red-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {overallSufficient ? (
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm font-medium text-white">
              {overallSufficient ? 'Stock Sufficient' : 'Stock Insufficient'}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="text-center">
              <p className="text-xs text-gray-400">Total Stock</p>
              <p className="text-lg font-bold text-white">{totalStock.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Order Demand</p>
              <p className="text-lg font-bold text-amber-400">{totalDemand.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Remaining Stock</p>
              <p className={`text-lg font-bold ${totalRemaining >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalRemaining.toLocaleString()}
              </p>
            </div>
          </div>
          
          {/* 總體滿足率進度條 */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Order Fulfillment Rate</span>
              <span>{totalDemand > 0 ? ((totalStock / totalDemand) * 100).toFixed(1) : 100}%</span>
            </div>
            <Progress 
              value={Math.min(totalDemand > 0 ? (totalStock / totalDemand) * 100 : 100, 100)} 
              className="h-2" 
            />
          </div>
        </motion.div>
      </div>

      {/* 產品詳細分析列表 */}
      <div className="flex-1 overflow-auto">
        <div className="space-y-2">
          {productAnalysis.length > 0 ? (
            productAnalysis.map((product, index) => (
              <motion.div
                key={product.productCode}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{product.productCode}</p>
                    <p className="text-xs text-gray-400 truncate">{product.description}</p>
                  </div>
                  {!product.isSufficient && (
                    <AlertTriangle className="w-4 h-4 text-amber-500 ml-2" />
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">Stock:</span>
                    <span className="text-white ml-1">{product.currentStock}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Demand:</span>
                    <span className="text-amber-400 ml-1">{product.orderDemand}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Remain:</span>
                    <span className={`ml-1 ${product.remainingStock >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {product.remainingStock}
                    </span>
                  </div>
                </div>
                
                {/* 滿足率進度條 */}
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-gray-400">Fulfillment</span>
                    <span className="text-[10px] text-gray-400">{product.fulfillmentRate.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={Math.min(product.fulfillmentRate, 100)} 
                    className="h-1" 
                  />
                </div>
              </motion.div>
            ))
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-400">No inventory data available</p>
            </div>
          )}
        </div>
        
        {productAnalysis.length > 0 && (
          <p className="text-xs text-gray-400 text-center mt-3">
            Total: {productAnalysis.length} products
          </p>
        )}
      </div>
    </div>
  );
};