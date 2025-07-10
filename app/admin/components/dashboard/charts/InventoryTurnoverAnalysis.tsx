'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  useGetInventoryTurnoverQuery,
  type GetInventoryTurnoverQuery,
} from '@/lib/graphql/generated/apollo-hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface InventoryTurnoverAnalysisProps {
  timeFrame?: any;
}

export default function InventoryTurnoverAnalysis({ timeFrame }: InventoryTurnoverAnalysisProps) {
  // Check feature flag
  const isGraphQLAnalysisEnabled = process.env.NEXT_PUBLIC_ENABLE_GRAPHQL_ANALYSIS === 'true';

  const { data, loading, error } = useGetInventoryTurnoverQuery({
    skip: !isGraphQLAnalysisEnabled,
    pollInterval: 60000, // Poll every 60 seconds
    fetchPolicy: 'cache-and-network',
  });

  const chartData = useMemo(() => {
    if (!data?.record_inventoryCollection?.edges || !data?.data_orderCollection?.edges) return [];

    // Calculate inventory totals by product (aggregate multiple records per product)
    const inventoryMap = new Map<string, number>();
    data.record_inventoryCollection.edges.forEach((edge: any) => {
      const node = edge.node;
      const productCode = node.product_code;
      if (!productCode) return;

      // Calculate total inventory (all fields are already numbers in generated types)
      const recordTotal =
        (node.await || 0) +
        (node.await_grn || 0) +
        (node.backcarpark || 0) +
        (node.bulk || 0) +
        (node.fold || 0) +
        (node.injection || 0) +
        (node.pipeline || 0) +
        (node.prebook || 0);

      // Aggregate totals for each product
      const currentTotal = inventoryMap.get(productCode) || 0;
      inventoryMap.set(productCode, currentTotal + recordTotal);
    });

    // Calculate order demand by product
    const demandMap = new Map<string, number>();
    data.data_orderCollection.edges.forEach((edge: any) => {
      const node = edge.node;
      if (!node.product_code) return;

      const currentDemand = demandMap.get(node.product_code) || 0;
      const productQty = node.product_qty || 0;
      const loadedQty = parseInt(node.loaded_qty || '0') || 0; // loaded_qty is still string type
      const unloadedQty = Math.max(0, productQty - loadedQty);
      demandMap.set(node.product_code, currentDemand + unloadedQty);
    });

    // Combine and calculate turnover ratio
    const products = new Set([...inventoryMap.keys(), ...demandMap.keys()]);
    const turnoverData = Array.from(products).map(code => {
      const inventory = inventoryMap.get(code) || 0;
      const demand = demandMap.get(code) || 0;
      const turnoverRatio = inventory > 0 ? demand / inventory : 0;

      return {
        code,
        inventory,
        demand,
        turnoverRatio: Math.round(turnoverRatio * 100) / 100,
        status:
          turnoverRatio > 1 ? 'high-demand' : turnoverRatio < 0.3 ? 'overstocked' : 'balanced',
      };
    });

    // Log for debugging
    console.log('Inventory Turnover Data Sample:', turnoverData.slice(0, 5));

    // Filter and sort by turnover ratio
    return turnoverData
      .filter(item => item.inventory > 0 && item.inventory < 50000) // More reasonable limit
      .sort((a, b) => {
        // Sort by demand first, then by turnover ratio
        if (b.demand !== a.demand) return b.demand - a.demand;
        return b.turnoverRatio - a.turnoverRatio;
      })
      .slice(0, 12); // Show top 12 for better visibility
  }, [data]);

  // Early return if feature flag is disabled
  if (!isGraphQLAnalysisEnabled) {
    return (
      <Alert>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          Inventory turnover analysis is currently disabled. Enable NEXT_PUBLIC_ENABLE_GRAPHQL_ANALYSIS to use this feature.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className='flex h-full w-full flex-col gap-4'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='flex-1' />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>Failed to load turnover data: {error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='flex h-full w-full flex-col'>
      <div className='mb-4'>
        <p className='text-sm text-white/60'>
          Inventory Turnover = Order Demand ÷ Current Inventory (higher ratio indicates higher
          demand)
        </p>
      </div>

      <div className='flex-1'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray='3 3' className='opacity-30' />
            <XAxis dataKey='code' angle={-45} textAnchor='end' height={80} className='text-xs' />
            <YAxis
              yAxisId='left'
              label={{
                value: 'Quantity',
                angle: -90,
                position: 'insideLeft',
                className: 'text-xs',
              }}
            />
            <YAxis
              yAxisId='right'
              orientation='right'
              label={{
                value: 'Turnover Rate',
                angle: 90,
                position: 'insideRight',
                className: 'text-xs',
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  const data = payload[0].payload;
                  return (
                    <div className='rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur-sm'>
                      <p className='font-medium'>{data.code}</p>
                      <div className='mt-2 space-y-1'>
                        <p className='text-sm text-blue-600'>Inventory: {data.inventory}</p>
                        <p className='text-sm text-orange-600'>Demand: {data.demand}</p>
                        <p className='text-sm font-medium'>Turnover Rate: {data.turnoverRatio}</p>
                        <p className='text-xs text-white/60'>
                          Status:{' '}
                          {data.status === 'high-demand'
                            ? 'High Demand'
                            : data.status === 'overstocked'
                              ? 'Overstocked'
                              : 'Balanced'}
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line
              yAxisId='left'
              type='monotone'
              dataKey='inventory'
              stroke='#3b82f6'
              strokeWidth={2}
              name='Inventory'
              dot={{ r: 4 }}
            />
            <Line
              yAxisId='left'
              type='monotone'
              dataKey='demand'
              stroke='#f97316'
              strokeWidth={2}
              name='Demand'
              dot={{ r: 4 }}
            />
            <Line
              yAxisId='right'
              type='monotone'
              dataKey='turnoverRatio'
              stroke='#10b981'
              strokeWidth={2}
              strokeDasharray='5 5'
              name='Turnover Rate'
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className='mt-4 grid grid-cols-3 gap-4 text-xs'>
        <div className='text-center'>
          <div className='font-medium text-red-600'>High Demand Products</div>
          <div>{chartData.filter(d => d.status === 'high-demand').length} items</div>
        </div>
        <div className='text-center'>
          <div className='font-medium text-green-600'>Balanced Supply</div>
          <div>{chartData.filter(d => d.status === 'balanced').length} items</div>
        </div>
        <div className='text-center'>
          <div className='font-medium text-amber-600'>Overstocked</div>
          <div>{chartData.filter(d => d.status === 'overstocked').length} items</div>
        </div>
      </div>
    </div>
  );
}
