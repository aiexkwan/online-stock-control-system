'use client';

/**
 * Example usage of inventory ordered analysis RPC function
 */

import React from 'react';
import { useInventoryAnalysis } from '@/app/admin/hooks/useInventoryAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Package, AlertTriangle, CheckCircle, Download } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function InventoryAnalysisExample() {
  // Example 1: Basic usage - get all products with order demand
  const { data, products, summary, criticalMetrics, loading, error, refresh, exportToCSV } =
    useInventoryAnalysis();

  // Example 2: Filter by product codes
  const { products: filteredProducts, loading: filteredLoading } = useInventoryAnalysis({
    p_product_codes: ['APBK3M', 'APGY3M', 'APBL3M'],
  });

  // Example 3: Filter by product type with auto-refresh
  const { products: slateProducts, loading: slateLoading } = useInventoryAnalysis(
    { p_product_type: 'Slate' },
    { autoRefresh: true, refreshInterval: 30000 } // Refresh every 30 seconds
  );

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-8 text-center'>
        <AlertTriangle className='mx-auto mb-2 h-8 w-8 text-red-500' />
        <p className='text-red-500'>Error loading data</p>
        <Button onClick={refresh} variant='outline' size='sm' className='mt-2'>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-6 p-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Inventory Analysis Example</h1>
        <Button onClick={exportToCSV} variant='outline' size='sm'>
          <Download className='mr-2 h-4 w-4' />
          Export CSV
        </Button>
      </div>

      {/* Summary Card */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Package className='h-5 w-5' />
              Inventory Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
              <div>
                <p className='text-sm text-muted-foreground'>Total Products</p>
                <p className='text-2xl font-bold'>{summary.total_products}</p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Total Stock</p>
                <p className='text-2xl font-bold'>{summary.total_stock.toLocaleString()}</p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Total Demand</p>
                <p className='text-2xl font-bold text-amber-600'>
                  {summary.total_demand.toLocaleString()}
                </p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Fulfillment Rate</p>
                <p className='text-2xl font-bold'>{summary.overall_fulfillment_rate.toFixed(1)}%</p>
              </div>
            </div>

            <div className='mt-4 space-y-2'>
              <div className='flex justify-between text-sm'>
                <span>Overall Stock Status</span>
                <Badge variant={summary.overall_sufficient ? 'default' : 'destructive'}>
                  {summary.overall_sufficient ? 'Sufficient' : 'Insufficient'}
                </Badge>
              </div>
              <Progress value={Math.min(summary.overall_fulfillment_rate, 100)} className='h-2' />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Critical Metrics */}
      {criticalMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>Critical Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
              <div>
                <p className='text-sm text-muted-foreground'>Critical Products</p>
                <p className='text-xl font-bold text-red-600'>{criticalMetrics.criticalCount}</p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Warning Products</p>
                <p className='text-xl font-bold text-amber-600'>{criticalMetrics.warningCount}</p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Total Shortage</p>
                <p className='text-xl font-bold text-red-600'>
                  {criticalMetrics.totalShortage.toLocaleString()}
                </p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Avg Fulfillment</p>
                <p className='text-xl font-bold'>
                  {criticalMetrics.avgFulfillmentRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product List */}
      <Card>
        <CardHeader>
          <CardTitle>Products with Order Demand</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            {products.slice(0, 10).map((product: any) => (
              <div
                key={product.product_code}
                className='flex items-center justify-between rounded-lg border p-3'
              >
                <div className='flex-1'>
                  <p className='font-medium'>{product.product_code}</p>
                  <p className='text-sm text-muted-foreground'>{product.product_description}</p>
                </div>
                <div className='flex items-center gap-4 text-sm'>
                  <div>
                    <span className='text-muted-foreground'>Stock: </span>
                    <span className='font-medium'>{product.current_stock}</span>
                  </div>
                  <div>
                    <span className='text-muted-foreground'>Demand: </span>
                    <span className='font-medium text-amber-600'>{product.order_demand}</span>
                  </div>
                  <Badge
                    variant={product.is_sufficient ? 'default' : 'destructive'}
                    className='ml-2'
                  >
                    {product.is_sufficient ? 'OK' : 'Short'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className='overflow-x-auto rounded-lg bg-muted p-4'>
            <code>{`// Basic usage
const { data, products, summary } = useInventoryAnalysis();

// Filter by product codes
const { products } = useInventoryAnalysis({
  p_product_codes: ['APBK3M', 'APGY3M']
});

// Filter by product type
const { products } = useInventoryAnalysis({
  p_product_type: 'Slate'
});

// With auto-refresh
const { products } = useInventoryAnalysis(
  { p_product_type: 'Slate' },
  { autoRefresh: true, refreshInterval: 30000 }
);

// Direct API call
const data = await inventoryAnalysisAPI.getInventoryOrderedAnalysis({
  p_product_codes: ['APBK3M']
});`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
