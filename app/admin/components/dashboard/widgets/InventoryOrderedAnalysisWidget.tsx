'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useAdminRefresh } from '@/app/admin/contexts/AdminRefreshContext';
import {
  Loader2,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
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

interface AnalysisSummary {
  totalStock: number;
  totalDemand: number;
  totalRemaining: number;
  overallSufficient: boolean;
  insufficientCount: number;
  sufficientCount: number;
}

interface InventoryAnalysisResponse {
  products: ProductAnalysis[];
  summary: AnalysisSummary;
  metadata?: {
    executed_at: string;
    calculation_time?: string;
  };
}

interface InventoryOrderedAnalysisWidgetProps extends WidgetComponentProps {}

// 顏色配置
const STATUS_COLORS = {
  sufficient: '#10b981', // emerald-500 - 庫存充足
  warning: '#f59e0b', // amber-500 - 庫存警告
  insufficient: '#ef4444', // red-500 - 庫存不足
};

export const InventoryOrderedAnalysisWidget: React.FC<InventoryOrderedAnalysisWidgetProps> = ({
  widget,
  isEditMode,
}) => {
  const [analysisData, setAnalysisData] = useState<InventoryAnalysisResponse | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedProductCodes, setSelectedProductCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryTime, setQueryTime] = useState<string>('');
  const { refreshTrigger } = useAdminRefresh();

  // 獲取庫存滿足分析數據 using DashboardAPI
  const fetchInventoryAnalysis = useCallback(
    async (productCodes?: string[], productType?: string) => {
      setLoading(true);
      try {
        const dashboardAPI = createDashboardAPI();

        // Use DashboardAPI with appropriate parameters
        const dashboardResult = await dashboardAPI.fetch(
          {
            widgetIds: ['inventory_ordered_analysis'],
            params: {
              dataSource: 'inventory_ordered_analysis',
              productCodes: productCodes,
              productType:
                productType === 'all' || productType === 'ALL TYPES' ? undefined : productType,
            },
          },
          {
            strategy: 'client', // Use client strategy as per Re-Structure-5.md
            cache: { ttl: 180 }, // 3 minutes cache
          }
        );

        const widgetData = dashboardResult.widgets.find(
          w => w.widgetId === 'inventory_ordered_analysis'
        );

        if (widgetData?.data?.value) {
          const analysisResponse = widgetData.data.value as InventoryAnalysisResponse;
          setAnalysisData(analysisResponse);

          // Extract calculation time from metadata
          if (widgetData.data.metadata?.calculationTime) {
            setQueryTime(widgetData.data.metadata.calculationTime);
          }
        }
      } catch (error) {
        console.error('Error fetching inventory analysis:', error);
        setAnalysisData(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 監聽 StockTypeSelector 的類型變更事件
  useEffect(() => {
    const handleTypeChange = (event: CustomEvent) => {
      console.log('[InventoryOrderedAnalysis] Received stockTypeChanged event:', event.detail);
      const { type, data } = event.detail;
      setSelectedType(type);

      // 獲取該類型所有產品的代碼
      const codes = data.map((item: any) => item.stock);
      setSelectedProductCodes(codes);

      if (type === 'all' || type === 'ALL TYPES') {
        // 如果選擇全部，不傳入產品代碼過濾
        fetchInventoryAnalysis();
      } else {
        // 否則只分析選定類型的產品
        fetchInventoryAnalysis(codes, type);
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
    } else if (selectedProductCodes.length > 0) {
      fetchInventoryAnalysis(selectedProductCodes, selectedType);
    }
  }, [refreshTrigger, fetchInventoryAnalysis, selectedType, selectedProductCodes]);

  if (loading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
      </div>
    );
  }

  if (!analysisData || !analysisData.products) {
    return (
      <div className='flex h-full flex-col p-4'>
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='flex items-center gap-2 text-lg font-semibold text-white'>
            <Package className='h-5 w-5' />
            Inventory Ordered Analysis
          </h3>
        </div>
        <div className='flex flex-1 items-center justify-center'>
          <p className='text-gray-400'>No inventory data available</p>
        </div>
      </div>
    );
  }

  const { products, summary } = analysisData;

  return (
    <div className='flex h-full flex-col p-4'>
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='flex items-center gap-2 text-lg font-semibold text-white'>
          <Package className='h-5 w-5' />
          Inventory Ordered Analysis
        </h3>
      </div>

      {/* 總體狀態卡片 */}
      <div className='mb-4'>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg border p-4 ${
            summary.overallSufficient
              ? 'border-emerald-700 bg-emerald-900/20'
              : 'border-red-700 bg-red-900/20'
          }`}
        >
          <div className='flex items-center gap-2'>
            {summary.overallSufficient ? (
              <CheckCircle className='h-5 w-5 text-emerald-500' />
            ) : (
              <AlertCircle className='h-5 w-5 text-red-500' />
            )}
            <span className='text-sm font-medium text-white'>
              {summary.overallSufficient ? 'Stock Sufficient' : 'Stock Insufficient'}
            </span>
          </div>

          <div className='mt-3 grid grid-cols-3 gap-3'>
            <div className='text-center'>
              <p className='text-xs text-gray-400'>Total Stock</p>
              <p className='text-lg font-bold text-white'>{summary.totalStock.toLocaleString()}</p>
            </div>
            <div className='text-center'>
              <p className='text-xs text-gray-400'>Order Demand</p>
              <p className='text-lg font-bold text-amber-400'>
                {summary.totalDemand.toLocaleString()}
              </p>
            </div>
            <div className='text-center'>
              <p className='text-xs text-gray-400'>Remaining Stock</p>
              <p
                className={`text-lg font-bold ${summary.totalRemaining >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {summary.totalRemaining.toLocaleString()}
              </p>
            </div>
          </div>

          {/* 總體滿足率進度條 */}
          <div className='mt-3'>
            <div className='mb-1 flex justify-between text-xs text-gray-400'>
              <span>Order Fulfillment Rate</span>
              <span>
                {summary.totalDemand > 0
                  ? ((summary.totalStock / summary.totalDemand) * 100).toFixed(1)
                  : 100}
                %
              </span>
            </div>
            <Progress
              value={Math.min(
                summary.totalDemand > 0 ? (summary.totalStock / summary.totalDemand) * 100 : 100,
                100
              )}
              className='h-2'
            />
          </div>

          {/* Products summary */}
          <div className='mt-3 grid grid-cols-2 gap-3'>
            <div className='text-center'>
              <p className='text-xs text-gray-400'>Sufficient Products</p>
              <p className='text-sm font-bold text-emerald-400'>{summary.sufficientCount}</p>
            </div>
            <div className='text-center'>
              <p className='text-xs text-gray-400'>Insufficient Products</p>
              <p className='text-sm font-bold text-red-400'>{summary.insufficientCount}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 產品詳細分析列表 */}
      <div className='flex-1 overflow-auto'>
        <div className='space-y-2'>
          {products.length > 0 ? (
            products.map((product, index) => (
              <motion.div
                key={product.productCode}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className='rounded-lg border border-slate-700 bg-slate-800/50 p-3 transition-colors hover:border-slate-600'
              >
                <div className='mb-2 flex items-center justify-between'>
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-white'>{product.productCode}</p>
                    <p className='truncate text-xs text-gray-400'>{product.description}</p>
                  </div>
                  {!product.isSufficient && (
                    <AlertTriangle className='ml-2 h-4 w-4 text-amber-500' />
                  )}
                </div>

                <div className='grid grid-cols-3 gap-2 text-xs'>
                  <div>
                    <span className='text-gray-400'>Stock:</span>
                    <span className='ml-1 text-white'>{product.currentStock}</span>
                  </div>
                  <div>
                    <span className='text-gray-400'>Demand:</span>
                    <span className='ml-1 text-amber-400'>{product.orderDemand}</span>
                  </div>
                  <div>
                    <span className='text-gray-400'>Remain:</span>
                    <span
                      className={`ml-1 ${product.remainingStock >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                    >
                      {product.remainingStock}
                    </span>
                  </div>
                </div>

                {/* 滿足率進度條 */}
                <div className='mt-2'>
                  <div className='mb-1 flex items-center justify-between'>
                    <span className='text-[10px] text-gray-400'>Fulfillment</span>
                    <span className='text-[10px] text-gray-400'>
                      {product.fulfillmentRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={Math.min(product.fulfillmentRate, 100)} className='h-1' />
                </div>
              </motion.div>
            ))
          ) : (
            <div className='flex h-full items-center justify-center'>
              <p className='text-gray-400'>No products with active orders</p>
            </div>
          )}
        </div>

        {products.length > 0 && (
          <div className='mt-3 border-t border-slate-700 pt-3'>
            <p className='text-center text-xs text-gray-400'>
              Total: {products.length} products analyzed
            </p>
            {queryTime && (
              <p className='mt-1 text-center text-xs text-gray-500'>Query time: {queryTime}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryOrderedAnalysisWidget;
