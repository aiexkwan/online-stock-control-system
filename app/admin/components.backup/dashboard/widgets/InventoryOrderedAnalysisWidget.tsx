/**
 * Inventory Ordered Analysis Widget - Enhanced Version
 * 顯示庫存與訂單匹配分析
 * 
 * Enhanced Features:
 * - 使用 useUnifiedAPI hook 統一數據獲取
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
import { createDashboardAPIClient as createDashboardAPI } from '@/lib/api/admin/DashboardAPI.client';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
// Note: Migrated to REST API - GraphQL hooks removed
import { useInViewport, InViewportPresets } from '@/app/admin/hooks/useInViewport';
// Note: GraphQL query removed - migrated to REST API
import { Skeleton } from '@/components/ui/skeleton';
import { 
  brandColors, 
  widgetColors, 
  semanticColors,
  getWidgetCategoryColor 
} from '@/lib/design-system/colors';
import { textClasses, getTextClass } from '@/lib/design-system/typography';
import { spacing, widgetSpacing, spacingUtilities } from '@/lib/design-system/spacing';
import { cn } from '@/lib/utils';

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
  // useGraphQL prop removed - using REST API only
}

// 顏色配置 - 使用設計系統顏色
const STATUS_COLORS = {
  sufficient: semanticColors.success.DEFAULT,
  warning: semanticColors.warning.DEFAULT,
  insufficient: semanticColors.destructive.DEFAULT,
};

export const InventoryOrderedAnalysisWidget: React.FC<InventoryOrderedAnalysisWidgetProps> = ({
  widget,
  isEditMode,
}) => {
  const [analysisData, setAnalysisData] = useState<InventoryAnalysisResponse | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedProductCodes, setSelectedProductCodes] = useState<string[]>([]);
  const [queryTime, setQueryTime] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { refreshTrigger } = useAdminRefresh();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Progressive loading with viewport detection
  const { isInViewport, hasBeenInViewport } = useInViewport(containerRef, {
    ...InViewportPresets.chart,
    rootMargin: '100px', // Preload slightly before visible
  });

  // REST API data fetching
  const fetchInventoryAnalysisData = useCallback(
    async (variables?: { productType?: string | null; productCodes?: string[] }) => {
      if (isEditMode || !hasBeenInViewport) return;
      
      setLoading(true);
      try {
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
          setAnalysisData(analysisResponse);
        }
      } catch (error) {
        console.error('Error fetching inventory analysis:', error);
      } finally {
        setLoading(false);
      }
    },
    [isEditMode, hasBeenInViewport]
  );

  // Initial data fetch
  useEffect(() => {
    if (hasBeenInViewport) {
      fetchInventoryAnalysisData({
        productType: selectedType === 'all' || selectedType === 'ALL TYPES' ? null : selectedType,
        productCodes: selectedProductCodes.length > 0 ? selectedProductCodes : undefined,
      });
    }
  }, [hasBeenInViewport, selectedType, selectedProductCodes, fetchInventoryAnalysisData]);

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
      fetchInventoryAnalysisData({
        productType: selectedType === 'all' || selectedType === 'ALL TYPES' ? null : selectedType,
        productCodes: selectedProductCodes.length > 0 ? selectedProductCodes : undefined,
      });
    }
  }, [refreshTrigger, hasBeenInViewport, selectedType, selectedProductCodes, fetchInventoryAnalysisData]);

  // 合併數據源
  const finalAnalysisData = analysisData;
  const finalLoading = loading || !hasBeenInViewport;

  // Render skeleton while loading or not in viewport
  if (finalLoading || !hasBeenInViewport) {
    return (
      <Card ref={containerRef} className={cn('h-full bg-card/50 border-border')}>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div className={cn('flex items-center', spacingUtilities.gap.small)}>
              <Package className='h-5 w-5 text-muted-foreground' />
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
      <Card ref={containerRef} className={cn('h-full bg-card/50 border-border')}>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <Package className='h-5 w-5' />
              Inventory Ordered Analysis
            </CardTitle>
            <span className='text-xs text-green-400'>
              ✓ REST API
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className='flex h-32 items-center justify-center'>
            <p className={cn(textClasses['body-base'], 'text-muted-foreground')}>No inventory data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { products, summary } = finalAnalysisData;

  return (
    <Card ref={containerRef} className={cn('h-full bg-card/50 border-border')}>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className={cn('flex items-center text-lg', spacingUtilities.gap.small, textClasses['heading-base'])}>
            <Package className='h-5 w-5 text-foreground' />
            Inventory Ordered Analysis
          </CardTitle>
          <div className='flex items-center gap-2'>
            <span className={cn(textClasses['label-small'])} style={{ color: semanticColors.success.DEFAULT }}>
              ✓ REST API
            </span>
            {queryTime && (
              <span className={cn(textClasses['label-small'], 'text-muted-foreground')}>
                {queryTime}
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
          className={cn(
            'rounded-lg border p-4',
            summary.overallSufficient
              ? 'border-success/30 bg-success/10'
              : 'border-destructive/30 bg-destructive/10'
          )}
        >
          <div className='flex items-center gap-2'>
            {summary.overallSufficient ? (
              <CheckCircle className='h-5 w-5' style={{ color: semanticColors.success.DEFAULT }} />
            ) : (
              <AlertCircle className='h-5 w-5' style={{ color: semanticColors.destructive.DEFAULT }} />
            )}
            <span className={cn(textClasses['body-small'], 'font-medium text-foreground')}>
              {summary.overallSufficient ? 'Stock Sufficient' : 'Stock Insufficient'}
            </span>
          </div>

          <div className='mt-3 grid grid-cols-3 gap-3'>
            <div className='text-center'>
              <p className={cn(textClasses['label-small'], 'text-muted-foreground')}>Total Stock</p>
              <p className={cn(textClasses['heading-base'], 'font-bold text-foreground')}>{summary.totalStock.toLocaleString()}</p>
            </div>
            <div className='text-center'>
              <p className={cn(textClasses['label-small'], 'text-muted-foreground')}>Order Demand</p>
              <p className={cn(textClasses['heading-base'], 'font-bold')} style={{ color: semanticColors.warning.DEFAULT }}>
                {summary.totalDemand.toLocaleString()}
              </p>
            </div>
            <div className='text-center'>
              <p className={cn(textClasses['label-small'], 'text-muted-foreground')}>Remaining Stock</p>
              <p
                className={cn(textClasses['heading-base'], 'font-bold')}
                style={{ color: summary.totalRemaining >= 0 ? semanticColors.success.DEFAULT : semanticColors.destructive.DEFAULT }}
              >
                {summary.totalRemaining.toLocaleString()}
              </p>
            </div>
          </div>

          {/* 總體滿足率進度條 */}
          <div className='mt-3'>
            <div className={cn('mb-1 flex justify-between', textClasses['label-small'], 'text-muted-foreground')}>
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
              <p className={cn(textClasses['label-small'], 'text-muted-foreground')}>Sufficient Products</p>
              <p className={cn(textClasses['body-small'], 'font-bold')} style={{ color: semanticColors.success.DEFAULT }}>{summary.sufficientCount}</p>
            </div>
            <div className='text-center'>
              <p className={cn(textClasses['label-small'], 'text-muted-foreground')}>Insufficient Products</p>
              <p className={cn(textClasses['body-small'], 'font-bold')} style={{ color: semanticColors.destructive.DEFAULT }}>{summary.insufficientCount}</p>
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
                className={cn(
                  'rounded-lg border bg-card/50 p-3 transition-colors',
                  'border-border hover:border-border/80'
                )}
              >
                <div className='mb-2 flex items-center justify-between'>
                  <div className='flex-1'>
                    <p className={cn(textClasses['body-small'], 'font-medium text-foreground')}>{product.productCode}</p>
                    <p className={cn('truncate', textClasses['label-small'], 'text-muted-foreground')}>{product.description}</p>
                  </div>
                  {!product.isSufficient && (
                    <AlertTriangle className='ml-2 h-4 w-4' style={{ color: semanticColors.warning.DEFAULT }} />
                  )}
                </div>

                <div className={cn('grid grid-cols-3 gap-2', textClasses['label-small'])}>
                  <div>
                    <span className='text-muted-foreground'>Stock:</span>
                    <span className='ml-1 text-foreground'>{product.currentStock}</span>
                  </div>
                  <div>
                    <span className='text-muted-foreground'>Demand:</span>
                    <span className='ml-1' style={{ color: semanticColors.warning.DEFAULT }}>{product.orderDemand}</span>
                  </div>
                  <div>
                    <span className='text-muted-foreground'>Remain:</span>
                    <span
                      className='ml-1'
                      style={{ color: product.remainingStock >= 0 ? semanticColors.success.DEFAULT : semanticColors.destructive.DEFAULT }}
                    >
                      {product.remainingStock}
                    </span>
                  </div>
                </div>

                {/* 滿足率進度條 */}
                <div className='mt-2'>
                  <div className='mb-1 flex items-center justify-between'>
                    <span className={cn(textClasses['label-small'], 'text-muted-foreground')}>Fulfillment</span>
                    <span className={cn(textClasses['label-small'], 'text-muted-foreground')}>
                      {product.fulfillmentRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={Math.min(product.fulfillmentRate, 100)} className='h-1' />
                </div>
              </motion.div>
            ))
          ) : (
            <div className='flex h-full items-center justify-center'>
              <p className={cn(textClasses['body-base'], 'text-muted-foreground')}>No products with active orders</p>
            </div>
          )}
        </div>

        {products.length > 0 && (
          <div className={cn('mt-3 border-t pt-3', 'border-border')}>
            <p className={cn('text-center', textClasses['label-small'], 'text-muted-foreground')}>
              Total: {products.length} products analyzed
            </p>
            {queryTime && (
              <p className={cn('mt-1 text-center', textClasses['label-small'], 'text-muted-foreground')}>Query time: {queryTime}</p>
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
 * Enhanced Features (2025-07-16):
 * 
 * 1. REST API Data Fetching:
 *    - Uses direct REST API calls via Dashboard API client
 *    - Removed GraphQL fallback complexity
 *    - Simplified data fetching with proper caching
 * 
 * 2. Progressive Loading:
 *    - Implements useInViewport for lazy loading
 *    - Shows skeleton UI until widget is visible
 *    - Improves initial page load performance
 * 
 * 3. Performance Optimizations:
 *    - Uses RPC functions for complex multi-table JOINs
 *    - Caches results based on product type and codes
 *    - Simple loading state management
 * 
 * 4. Preserved Features:
 *    - StockTypeSelector event listening
 *    - Complex inventory vs order analysis logic
 *    - Real-time fulfillment rate calculations
 *    - Product filtering by type
 * 
 * Note: Uses RPC functions for optimal performance with complex multi-table JOINs.
 * GraphQL support has been removed in favor of REST API simplicity.
 */
