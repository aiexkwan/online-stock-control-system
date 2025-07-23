/**
 * TopProductsByQuantityWidget GraphQL Version - System Products Ranking by Quantity
 * 顯示庫存數量最高的產品排行榜 - 使用 GraphQL
 *
 * GraphQL Migration Features:
 * - Uses Apollo Client for optimized data fetching
 * - Leverages TopProductsLoader for efficient inventory aggregation
 * - Supports filtering, sorting, and product type selection
 * - Provides real-time quantity ranking with location breakdown
 * - Optimized performance with DataLoader batching
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { TraditionalWidgetComponentProps } from '@/types/components/dashboard';
import { useAdminRefresh } from '@/app/(app)/admin/contexts/AdminRefreshContext';
import {
  Loader2,
  ChartBarIcon,
  Package,
  Filter,
  RefreshCw,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInViewport, InViewportPresets } from '@/app/(app)/admin/hooks/useInViewport';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

// GraphQL Query for Top Products by Quantity
const TOP_PRODUCTS_QUERY = gql`
  query TopProductsByQuantity($input: TopProductsInput) {
    topProductsByQuantity(input: $input) {
      products {
        productCode
        productName
        productType
        colour
        standardQty
        totalQuantity
        locationQuantities {
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
        lastUpdated
      }
      totalCount
      averageQuantity
      maxQuantity
      minQuantity
      lastUpdated
      dataSource
      refreshInterval
    }
  }
`;

// Interfaces
interface TopProduct {
  productCode: string;
  productName: string;
  productType: string;
  colour: string;
  standardQty: number;
  totalQuantity: number;
  locationQuantities: {
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
  lastUpdated: string;
}

export default function TopProductsByQuantityWidgetGraphQL({
  id,
  config,
  className,
}: TraditionalWidgetComponentProps) {
  // State
  const [productType, setProductType] = useState<string>('');
  const [limit, setLimit] = useState<number>(10);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [localLoading, setLocalLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Refs and contexts
  const { refreshTrigger } = useAdminRefresh();
  const { ref: inViewportRef, inViewport } = useInViewport(InViewportPresets.PROGRESSIVE_LOADING);

  // Build query variables
  const queryVariables = useMemo(() => {
    return {
      input: {
        productType: productType || undefined,
        limit,
        sortOrder,
        includeInactive: false,
        locationFilter: [], // Include all locations
      },
    };
  }, [productType, limit, sortOrder]);

  // GraphQL Query
  const { data, loading, error, refetch } = useQuery(TOP_PRODUCTS_QUERY, {
    variables: queryVariables,
    skip: !inViewport,
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

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
      console.error('[TopProductsGraphQL] Refresh error:', error);
      setHasError(true);
    } finally {
      setLocalLoading(false);
    }
  }, [localLoading, refetch]);

  // Get quantity bar color based on rank
  const getBarColor = useCallback((index: number) => {
    if (index === 0) return semanticColors.success.primary; // Gold for #1
    if (index === 1) return semanticColors.info.primary; // Silver for #2
    if (index === 2) return semanticColors.warning.primary; // Bronze for #3
    return brandColors.primary.main; // Default blue for others
  }, []);

  // Calculate percentage for progress bar
  const calculatePercentage = useCallback((quantity: number, maxQuantity: number) => {
    if (maxQuantity === 0) return 0;
    return (quantity / maxQuantity) * 100;
  }, []);

  // Processed data
  const processedData = useMemo(() => {
    if (!data?.topProductsByQuantity) {
      return { products: [], totalCount: 0, maxQuantity: 0, averageQuantity: 0 };
    }
    return data.topProductsByQuantity;
  }, [data]);

  // Loading skeleton
  if (!inViewport) {
    return (
      <WidgetCard ref={inViewportRef} className={cn('h-96', className)} widgetType="custom">
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </WidgetCard>
    );
  }

  // Error state
  if (error || hasError) {
    return (
      <WidgetCard ref={inViewportRef} className={className} widgetType="custom">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
            Top Products by Quantity (GraphQL)
          </CardTitle>
          <Button
            onClick={handleRefresh}
            disabled={localLoading}
            variant="ghost"
            size="sm"
          >
            <RefreshCw className={cn('h-4 w-4', localLoading && 'animate-spin')} />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-center">
            <div>
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Failed to load products data</p>
              <Button onClick={handleRefresh} disabled={localLoading}>
                {localLoading ? 'Retrying...' : 'Retry'}
              </Button>
            </div>
          </div>
        </CardContent>
      </WidgetCard>
    );
  }

  // Loading state
  if (loading || localLoading) {
    return (
      <WidgetCard ref={inViewportRef} className={className} widgetType="custom">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
            Top Products by Quantity (GraphQL)
          </CardTitle>
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-24" />
              ))}
            </div>
            <div className="space-y-3">
              {[...Array(limit)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </WidgetCard>
    );
  }

  // Render product item
  const ProductItem = React.memo(({ product, index, maxQuantity }: { 
    product: TopProduct; 
    index: number; 
    maxQuantity: number;
  }) => {
    const percentage = calculatePercentage(product.totalQuantity, maxQuantity);
    const barColor = getBarColor(index);
    
    return (
      <motion.div
        className="relative p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: index * 0.05 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-700">#{index + 1}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                <span className="font-semibold text-gray-900">{product.productCode}</span>
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                  {product.productType}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate mt-1">
                {product.productName}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              {product.totalQuantity.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              std: {product.standardQty}
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <motion.div
            className="h-2 rounded-full"
            style={{ backgroundColor: barColor }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
          />
        </div>
        
        {/* Location breakdown (on hover) */}
        <div className="mt-2 text-xs text-gray-500">
          Top locations: 
          {Object.entries(product.locationQuantities)
            .filter(([_, qty]) => qty > 0)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([location, qty]) => ` ${location}: ${qty}`)
            .join(', ') || ' No active locations'}
        </div>
      </motion.div>
    );
  });

  // Main render
  return (
    <WidgetCard ref={inViewportRef} className={className} widgetType="custom">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
            Top Products by Quantity (GraphQL)
            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
              ✓ GraphQL
            </span>
          </CardTitle>
          <Button
            onClick={handleRefresh}
            disabled={localLoading}
            variant="ghost"
            size="sm"
          >
            <RefreshCw className={cn('h-4 w-4', localLoading && 'animate-spin')} />
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Select value={productType} onValueChange={setProductType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="A">Type A</SelectItem>
              <SelectItem value="B">Type B</SelectItem>
              <SelectItem value="C">Type C</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">Top 5</SelectItem>
              <SelectItem value="10">Top 10</SelectItem>
              <SelectItem value="15">Top 15</SelectItem>
              <SelectItem value="20">Top 20</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DESC">Highest First</SelectItem>
              <SelectItem value="ASC">Lowest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary stats */}
        {processedData.products.length > 0 && (
          <div className="flex gap-4 mt-3 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>Max: {processedData.maxQuantity.toLocaleString()}</span>
            </div>
            <div>Avg: {Math.round(processedData.averageQuantity).toLocaleString()}</div>
            <div>Total: {processedData.totalCount} products</div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {processedData.products.length > 0 ? (
            <AnimatePresence>
              {processedData.products.map((product, index) => (
                <ProductItem 
                  key={product.productCode} 
                  product={product} 
                  index={index}
                  maxQuantity={processedData.maxQuantity}
                />
              ))}
            </AnimatePresence>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No products found</p>
              <p className="text-sm mt-2">
                Try adjusting your filters
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </WidgetCard>
  );
}