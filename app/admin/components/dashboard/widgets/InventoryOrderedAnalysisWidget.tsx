/**
 * Inventory Ordered Analysis Widget - Enhanced Version
 * 顯示庫存與訂單匹配分析
 * 
 * Enhanced Features:
 * - 使用 useGraphQLFallback hook 統一數據獲取
 * - Progressive Loading with useInViewport
 * - 統一使用 common 組件
 * - 保留現有的事件監聽和產品篩選功能
 * - 保留複雜的庫存與訂單匹配分析邏輯
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { useGetInventoryOrderedAnalysisWidgetQuery } from '@/lib/graphql/generated/apollo-hooks';
import { useGraphQLFallback, GraphQLFallbackPresets } from '@/app/admin/hooks/useGraphQLFallback';
import { useInViewport, InViewportPresets } from '@/app/admin/hooks/useInViewport';
import { GET_INVENTORY_ORDERED_ANALYSIS_WIDGET } from '@/lib/graphql/queries/stock/inventoryOrderedAnalysis';
import { Skeleton } from '@/components/ui/skeleton';

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

interface InventoryOrderedAnalysisWidgetProps extends WidgetComponentProps {
  useGraphQL?: boolean;
}

// 顏色配置
const STATUS_COLORS = {
  sufficient: '#10b981', // emerald-500 - 庫存充足
  warning: '#f59e0b', // amber-500 - 庫存警告
  insufficient: '#ef4444', // red-500 - 庫存不足
};

export const InventoryOrderedAnalysisWidget: React.FC<InventoryOrderedAnalysisWidgetProps> = ({
  widget,
  isEditMode,
  useGraphQL,
}) => {
  const [analysisData, setAnalysisData] = useState<InventoryAnalysisResponse | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedProductCodes, setSelectedProductCodes] = useState<string[]>([]);
  const [queryTime, setQueryTime] = useState<string>('');
  const { refreshTrigger } = useAdminRefresh();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Progressive loading with viewport detection
  const { isInViewport, hasBeenInViewport } = useInViewport(containerRef, {
    ...InViewportPresets.chart,
    rootMargin: '100px', // Preload slightly before visible
  });
  
  // 使用環境變量控制是否使用 GraphQL
  // 由於此 widget 複雜度高，默認使用 RPC
  const shouldUseGraphQL = process.env.NEXT_PUBLIC_ENABLE_GRAPHQL_STOCK === 'true' || 
                          (useGraphQL ?? widget?.config?.useGraphQL ?? false);

  // Server action for fallback
  const fetchInventoryAnalysisAction = useCallback(
    async (variables?: { productType?: string | null; productCodes?: string[] }) => {
      const dashboardAPI = createDashboardAPI();
      
      const dashboardResult = await dashboardAPI.fetch(
        {
          widgetIds: ['inventory_ordered_analysis'],
          params: {
            dataSource: 'inventory_ordered_analysis',
            productCodes: variables?.productCodes,
            productType: variables?.productType === null ? undefined : variables?.productType,
          },
        },
        {
          strategy: 'client',
          cache: { ttl: 180 }, // 3 minutes cache
        }
      );

      const widgetData = dashboardResult.widgets.find(
        w => w.widgetId === 'inventory_ordered_analysis'
      );

      if (widgetData?.data?.value) {
        const analysisResponse = widgetData.data.value as InventoryAnalysisResponse;
        if (widgetData.data.metadata?.calculationTime) {
          setQueryTime(widgetData.data.metadata.calculationTime);
        }
        return analysisResponse;
      }
      return null;
    },
    []
  );

  // 使用 useGraphQLFallback hook 統一數據獲取
  const { data: fetchedData, loading: dataLoading, error, refetch, mode, performanceMetrics } = useGraphQLFallback<
    InventoryAnalysisResponse | null,
    { productType?: string | null; productCodes?: string[] }
  >({
    graphqlQuery: shouldUseGraphQL ? GET_INVENTORY_ORDERED_ANALYSIS_WIDGET : undefined,
    serverAction: fetchInventoryAnalysisAction,
    variables: {
      productType: selectedType === 'all' || selectedType === 'ALL TYPES' ? null : selectedType,
      productCodes: selectedProductCodes.length > 0 ? selectedProductCodes : undefined,
    },
    skip: isEditMode || !hasBeenInViewport, // Progressive loading
    fallbackEnabled: true,
    widgetId: widget?.id || 'inventory-ordered-analysis',
    ...GraphQLFallbackPresets.cached,
    extractFromContext: (context) => {
      // Try to extract from dashboard context if available
      const inventoryData = context?.inventoryOrderedAnalysis;
      if (inventoryData) {
        return inventoryData as InventoryAnalysisResponse;
      }
      return null;
    },
  });

  // 處理 GraphQL 數據 - Client-side JOIN 和計算 
  const processGraphQLData = useCallback((graphqlData: any) => {
    if (!graphqlData) return null;

    const { record_inventoryCollection, data_orderCollection, data_codeCollection } = graphqlData;

    // 處理庫存數據
    const inventoryMap = new Map<string, any>();
    record_inventoryCollection?.edges?.forEach((edge: any) => {
      const node = edge.node;
      const totalInventory = 
        (node.injection || 0) + (node.pipeline || 0) + (node.prebook || 0) +
        (node.await || 0) + (node.fold || 0) + (node.bulk || 0) +
        (node.backcarpark || 0) + (node.damage || 0) + (node.await_grn || 0);
      
      inventoryMap.set(node.product_code, {
        total: totalInventory,
        ...node
      });
    });

    // 處理訂單數據
    const orderMap = new Map<string, any>();
    data_orderCollection?.edges?.forEach((edge: any) => {
      const node = edge.node;
      const loadedQty = parseInt(node.loaded_qty || '0', 10);
      const outstandingQty = node.product_qty - loadedQty;
      
      if (!orderMap.has(node.product_code)) {
        orderMap.set(node.product_code, {
          totalOrders: 0,
          totalOutstanding: 0,
          totalOrdered: 0,
          totalLoaded: 0
        });
      }
      
      const existing = orderMap.get(node.product_code);
      existing.totalOrders += 1;
      existing.totalOutstanding += Math.max(0, outstandingQty);
      existing.totalOrdered += node.product_qty;
      existing.totalLoaded += loadedQty;
    });

    // 處理產品資料
    const productMap = new Map<string, any>();
    data_codeCollection?.edges?.forEach((edge: any) => {
      productMap.set(edge.node.code, edge.node);
    });

    // 結合所有數據
    const products: ProductAnalysis[] = [];
    const allProductCodes = new Set([...inventoryMap.keys(), ...orderMap.keys()]);
    
    let totalStock = 0;
    let totalDemand = 0;
    let sufficientCount = 0;
    let insufficientCount = 0;

    allProductCodes.forEach(productCode => {
      const inventory = inventoryMap.get(productCode);
      const order = orderMap.get(productCode);
      const product = productMap.get(productCode);
      
      const currentStock = inventory?.total || 0;
      const orderDemand = order?.totalOutstanding || 0;
      const remainingStock = currentStock - orderDemand;
      const fulfillmentRate = orderDemand > 0 ? (currentStock / orderDemand) * 100 : 100;
      const isSufficient = currentStock >= orderDemand;
      
      if (currentStock > 0 || orderDemand > 0) {
        products.push({
          productCode,
          description: product?.description || '',
          currentStock,
          orderDemand,
          remainingStock,
          fulfillmentRate: Math.min(fulfillmentRate, 100),
          isSufficient
        });
        
        totalStock += currentStock;
        totalDemand += orderDemand;
        if (isSufficient) {
          sufficientCount++;
        } else {
          insufficientCount++;
        }
      }
    });

    // 按狀態排序
    products.sort((a, b) => {
      if (!a.isSufficient && b.isSufficient) return -1;
      if (a.isSufficient && !b.isSufficient) return 1;
      return a.remainingStock - b.remainingStock;
    });

    return {
      products,
      summary: {
        totalStock,
        totalDemand,
        totalRemaining: totalStock - totalDemand,
        overallSufficient: totalStock >= totalDemand,
        insufficientCount,
        sufficientCount
      }
    } as InventoryAnalysisResponse;
  }, []);

  // Process fetched data based on mode
  const processedData = useMemo(() => {
    if (!fetchedData) return null;
    
    // If data comes from GraphQL, it needs processing
    if (mode === 'graphql' && 'record_inventoryCollection' in (fetchedData as any)) {
      return processGraphQLData(fetchedData);
    }
    
    // Otherwise it's already processed (from server action or context)
    return fetchedData as InventoryAnalysisResponse;
  }, [fetchedData, mode, processGraphQLData]);

  // 監聽 StockTypeSelector 的類型變更事件
  useEffect(() => {
    const handleTypeChange = (event: CustomEvent) => {
      console.log('[InventoryOrderedAnalysis] Received stockTypeChanged event:', event.detail);
      const { type, data } = event.detail;
      setSelectedType(type);

      // 獲取該類型所有產品的代碼
      const codes = data.map((item: any) => item.stock);
      setSelectedProductCodes(codes);
    };

    window.addEventListener('stockTypeChanged', handleTypeChange as EventListener);

    return () => {
      window.removeEventListener('stockTypeChanged', handleTypeChange as EventListener);
    };
  }, []);

  // 當刷新觸發時重新加載數據
  useEffect(() => {
    if (refreshTrigger && hasBeenInViewport) {
      refetch();
    }
  }, [refreshTrigger, refetch, hasBeenInViewport]);

  // 合併數據源
  const finalAnalysisData = processedData;
  const finalLoading = dataLoading || !hasBeenInViewport;

  // Render skeleton while loading or not in viewport
  if (finalLoading || !hasBeenInViewport) {
    return (
      <Card ref={containerRef} className='h-full bg-slate-800/50 border-slate-700'>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Package className='h-5 w-5 text-gray-400' />
              <Skeleton className='h-6 w-48' />
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-0'>
          <div className='space-y-4'>
            {/* Summary skeleton */}
            <Skeleton className='h-32 w-full rounded-lg' />
            
            {/* Product list skeleton */}
            <div className='space-y-2'>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className='h-20 w-full rounded-lg' />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!finalAnalysisData || !finalAnalysisData.products) {
    return (
      <Card ref={containerRef} className='h-full bg-slate-800/50 border-slate-700'>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <Package className='h-5 w-5' />
              Inventory Ordered Analysis
            </CardTitle>
            {mode === 'graphql' && (
              <span className='text-xs text-blue-400'>
                ⚡ GraphQL
              </span>
            )}
            {mode === 'server-action' && (
              <span className='text-xs text-amber-400'>
                🔄 Fallback
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className='flex h-32 items-center justify-center'>
            <p className='text-gray-400'>No inventory data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { products, summary } = finalAnalysisData;

  return (
    <Card ref={containerRef} className='h-full bg-slate-800/50 border-slate-700'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <Package className='h-5 w-5' />
            Inventory Ordered Analysis
          </CardTitle>
          <div className='flex items-center gap-2'>
            {mode === 'graphql' && (
              <span className='text-xs text-blue-400'>
                ⚡ GraphQL
              </span>
            )}
            {mode === 'server-action' && (
              <span className='text-xs text-amber-400'>
                🔄 Fallback
              </span>
            )}
            {performanceMetrics && (
              <span className='text-xs text-gray-400'>
                {performanceMetrics.queryTime}ms
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className='pt-0 flex flex-col h-[calc(100%-4rem)]'>

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
      </CardContent>
    </Card>
  );
};

export default InventoryOrderedAnalysisWidget;

/**
 * Enhanced Features (2025-07-10):
 * 
 * 1. Unified Data Fetching:
 *    - Uses useGraphQLFallback hook for consistent data loading
 *    - Supports GraphQL → Server Action fallback pattern
 *    - Integrates with DashboardDataContext for optimal caching
 * 
 * 2. Progressive Loading:
 *    - Implements useInViewport for lazy loading
 *    - Shows skeleton UI until widget is visible
 *    - Improves initial page load performance
 * 
 * 3. Performance Optimizations:
 *    - Client-side GraphQL data processing only when needed
 *    - Caches results based on product type and codes
 *    - Performance metrics tracking
 * 
 * 4. Preserved Features:
 *    - StockTypeSelector event listening
 *    - Complex inventory vs order analysis logic
 *    - Real-time fulfillment rate calculations
 *    - Product filtering by type
 * 
 * Note: Due to complex multi-table JOINs, server action (RPC) is recommended
 * for production use. GraphQL mode available via NEXT_PUBLIC_ENABLE_GRAPHQL_STOCK flag.
 */
