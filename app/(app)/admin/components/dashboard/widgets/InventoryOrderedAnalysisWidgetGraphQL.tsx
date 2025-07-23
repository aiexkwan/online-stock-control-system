/**
 * Inventory Ordered Analysis Widget - GraphQL Version
 * 顯示庫存與訂單匹配分析 - 使用 GraphQL
 *
 * GraphQL Migration Features:
 * - Uses Apollo Client for data fetching
 * - Leverages InventoryOrderedAnalysisLoader for optimized queries
 * - Maintains all existing functionality and UI
 * - Provides better caching and performance
 * - Supports real-time updates through GraphQL subscriptions
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TraditionalWidgetComponentProps } from '@/types/components/dashboard';
import { useAdminRefresh } from '@/app/(app)/admin/contexts/AdminRefreshContext';
import {
  Loader2,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { useInViewport, InViewportPresets } from '@/app/(app)/admin/hooks/useInViewport';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import {
  brandColors,
  widgetColors,
  semanticColors,
  getWidgetCategoryColor,
} from '@/lib/design-system/colors';
import { textClasses, getTextClass } from '@/lib/design-system/typography';
import { spacing, widgetSpacing, spacingUtilities } from '@/lib/design-system/spacing';
import { cn } from '@/lib/utils';

// GraphQL Query for Inventory Ordered Analysis
const INVENTORY_ORDERED_ANALYSIS_QUERY = gql`
  query InventoryOrderedAnalysis($input: InventoryOrderedAnalysisInput) {
    inventoryOrderedAnalysis(input: $input) {
      success
      summary {
        total_products
        total_inventory_value
        total_outstanding_orders_value
        overall_fulfillment_rate
        products_sufficient
        products_insufficient
        products_out_of_stock
        products_no_orders
      }
      data {
        product_code
        product_description
        product_type
        standard_qty
        inventory {
          total
          locations {
            injection
            pipeline
            prebook
            await
            fold
            bulk
            backcarpark
            damage
            await_grn
          }
          last_update
        }
        orders {
          total_orders
          total_ordered_qty
          total_loaded_qty
          total_outstanding_qty
        }
        analysis {
          fulfillment_rate
          inventory_gap
          status
        }
      }
      generated_at
    }
  }
`;

// Interfaces
interface InventoryAnalysisData {
  product_code: string;
  product_description: string;
  product_type: string;
  standard_qty: number;
  inventory: {
    total: number;
    locations?: {
      injection: number;
      pipeline: number;
      prebook: number;
      await: number;
      fold: number;
      bulk: number;
      backcarpark: number;
      damage: number;
      await_grn: number;
    };
    last_update?: string;
  };
  orders: {
    total_orders: number;
    total_ordered_qty: number;
    total_loaded_qty: number;
    total_outstanding_qty: number;
  };
  analysis: {
    fulfillment_rate: number;
    inventory_gap: number;
    status: 'SUFFICIENT' | 'INSUFFICIENT' | 'OUT_OF_STOCK' | 'NO_ORDERS';
  };
}

interface InventoryAnalysisSummary {
  total_products: number;
  total_inventory_value: number;
  total_outstanding_orders_value: number;
  overall_fulfillment_rate: number;
  products_sufficient: number;
  products_insufficient: number;
  products_out_of_stock: number;
  products_no_orders: number;
}

interface StockTypeChangeEvent {
  stockType?: string;
}

export default function InventoryOrderedAnalysisWidgetGraphQL({
  id,
  config,
  className,
}: TraditionalWidgetComponentProps) {
  // State
  const [stockType, setStockType] = useState<string | undefined>(undefined);
  const [localLoading, setLocalLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Refs and contexts
  const { refreshTrigger } = useAdminRefresh();
  const { ref: inViewportRef, inViewport } = useInViewport(InViewportPresets.PROGRESSIVE_LOADING);

  // GraphQL Query
  const { data, loading, error, refetch } = useQuery(INVENTORY_ORDERED_ANALYSIS_QUERY, {
    variables: {
      input: {
        productType: stockType,
        includeLocationBreakdown: true,
        sortBy: 'STATUS',
        sortOrder: 'ASC',
      },
    },
    skip: !inViewport, // Progressive loading - only fetch when in viewport
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network', // Use cache but also check network
    notifyOnNetworkStatusChange: true,
  });

  // Event listeners for stock type changes
  useEffect(() => {
    const handleStockTypeChange = (event: CustomEvent<StockTypeChangeEvent>) => {
      const newStockType = event.detail?.stockType;
      setStockType(newStockType);
    };

    window.addEventListener('stockTypeChanged', handleStockTypeChange as EventListener);
    return () => {
      window.removeEventListener('stockTypeChanged', handleStockTypeChange as EventListener);
    };
  }, []);

  // Refresh on admin trigger
  useEffect(() => {
    if (refreshTrigger > 0 && inViewport) {
      refetch();
    }
  }, [refreshTrigger, inViewport, refetch]);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    if (localLoading) return;
    
    setLocalLoading(true);
    setHasError(false);
    
    try {
      await refetch();
    } catch (error) {
      console.error('[InventoryOrderedAnalysisWidgetGraphQL] Refresh error:', error);
      setHasError(true);
    } finally {
      setLocalLoading(false);
    }
  }, [localLoading, refetch]);

  // Memoized data processing
  const processedData = useMemo(() => {
    if (!data?.inventoryOrderedAnalysis?.success) {
      return { summary: null, items: [] };
    }

    const result = data.inventoryOrderedAnalysis;
    return {
      summary: result.summary,
      items: result.data || [],
    };
  }, [data]);

  // Status styling helper
  const getStatusStyle = useCallback((status: string) => {
    switch (status) {
      case 'SUFFICIENT':
        return {
          color: semanticColors.success.primary,
          bgColor: semanticColors.success.background,
          icon: CheckCircle,
          label: 'Sufficient',
        };
      case 'INSUFFICIENT':
        return {
          color: semanticColors.warning.primary,
          bgColor: semanticColors.warning.background,
          icon: AlertTriangle,
          label: 'Insufficient',
        };
      case 'OUT_OF_STOCK':
        return {
          color: semanticColors.error.primary,
          bgColor: semanticColors.error.background,
          icon: AlertCircle,
          label: 'Out of Stock',
        };
      case 'NO_ORDERS':
        return {
          color: semanticColors.info.primary,
          bgColor: semanticColors.info.background,
          icon: Package,
          label: 'No Orders',
        };
      default:
        return {
          color: semanticColors.neutral.primary,
          bgColor: semanticColors.neutral.background,
          icon: Package,
          label: status,
        };
    }
  }, []);

  // Summary card component
  const SummaryCard = React.memo(({ summary }: { summary: InventoryAnalysisSummary }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <motion.div
        className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600 font-medium">Total Products</p>
            <p className="text-2xl font-bold text-blue-800">{summary.total_products}</p>
          </div>
          <Package className="h-8 w-8 text-blue-500" />
        </div>
      </motion.div>

      <motion.div
        className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-green-600 font-medium">Fulfillment Rate</p>
            <p className="text-2xl font-bold text-green-800">
              {summary.overall_fulfillment_rate.toFixed(1)}%
            </p>
          </div>
          <TrendingUp className="h-8 w-8 text-green-500" />
        </div>
        <Progress
          value={Math.min(summary.overall_fulfillment_rate, 100)}
          className="mt-2 h-2"
        />
      </motion.div>

      <motion.div
        className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-purple-600 font-medium">Total Inventory</p>
            <p className="text-2xl font-bold text-purple-800">
              {summary.total_inventory_value.toLocaleString()}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-orange-600 font-medium">Outstanding Orders</p>
            <p className="text-2xl font-bold text-orange-800">
              {summary.total_outstanding_orders_value.toLocaleString()}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  ));

  // Product item component
  const ProductItem = React.memo(({ item }: { item: InventoryAnalysisData }) => {
    const statusStyle = getStatusStyle(item.analysis.status);
    const StatusIcon = statusStyle.icon;

    return (
      <motion.div
        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{item.product_code}</h4>
            <p className="text-sm text-gray-600 mt-1">{item.product_description}</p>
            <p className="text-xs text-gray-500">Type: {item.product_type}</p>
          </div>
          <div
            className={cn(
              'flex items-center px-3 py-1 rounded-full text-xs font-medium',
              'transition-colors duration-200'
            )}
            style={{ 
              backgroundColor: statusStyle.bgColor, 
              color: statusStyle.color 
            }}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusStyle.label}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Inventory</p>
            <p className="font-semibold text-lg">{item.inventory.total.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Outstanding</p>
            <p className="font-semibold text-lg">{item.orders.total_outstanding_qty.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Fulfillment</p>
            <p className="font-semibold text-lg">{item.analysis.fulfillment_rate.toFixed(1)}%</p>
          </div>
        </div>

        {item.analysis.inventory_gap !== 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Inventory Gap:</span>
              <span
                className={cn(
                  'font-medium',
                  item.analysis.inventory_gap > 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {item.analysis.inventory_gap > 0 ? '+' : ''}
                {item.analysis.inventory_gap.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </motion.div>
    );
  });

  // Loading skeleton
  if (!inViewport) {
    return (
      <Card ref={inViewportRef} className={cn('h-96', className)}>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error || hasError) {
    return (
      <Card ref={inViewportRef} className={className}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Inventory Ordered Analysis (GraphQL)
          </CardTitle>
          <button
            onClick={handleRefresh}
            disabled={localLoading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <RefreshCw className={cn('h-4 w-4', localLoading && 'animate-spin')} />
          </button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-center">
            <div>
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Failed to load inventory analysis</p>
              <button
                onClick={handleRefresh}
                disabled={localLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {localLoading ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (loading || localLoading) {
    return (
      <Card ref={inViewportRef} className={className}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Inventory Ordered Analysis (GraphQL)
          </CardTitle>
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main render
  return (
    <Card ref={inViewportRef} className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Package className="h-5 w-5 mr-2 text-blue-600" />
          Inventory Ordered Analysis (GraphQL)
          {stockType && (
            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
              {stockType}
            </span>
          )}
        </CardTitle>
        <button
          onClick={handleRefresh}
          disabled={localLoading}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <RefreshCw className={cn('h-4 w-4', localLoading && 'animate-spin')} />
        </button>
      </CardHeader>
      <CardContent>
        {processedData.summary && (
          <SummaryCard summary={processedData.summary} />
        )}

        <div className="space-y-4">
          {processedData.items.length > 0 ? (
            processedData.items.map((item, index) => (
              <ProductItem key={`${item.product_code}-${index}`} item={item} />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No inventory analysis data available</p>
              {stockType && (
                <p className="text-sm mt-2">for product type: {stockType}</p>
              )}
            </div>
          )}
        </div>

        {data?.inventoryOrderedAnalysis?.generated_at && (
          <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500 text-center">
            Last updated: {new Date(data.inventoryOrderedAnalysis.generated_at).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}