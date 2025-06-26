'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { gql, useGraphQLQuery } from '@/lib/graphql-client-stable';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const GET_TOP_PRODUCTS_INVENTORY = gql`
  query GetTopProductsInventory {
    record_inventoryCollection {
      edges {
        node {
          product_code
          await
          await_grn
          backcarpark
          bulk
          fold
          injection
          pipeline
          prebook
          data_code {
            description
            colour
          }
        }
      }
    }
  }
`;

interface TopProductsInventoryChartProps {
  timeFrame?: any;
}

export default function TopProductsInventoryChart({ timeFrame }: TopProductsInventoryChartProps) {
  const { data, loading, error } = useGraphQLQuery(GET_TOP_PRODUCTS_INVENTORY);

  const chartData = useMemo(() => {
    if (!data?.record_inventoryCollection?.edges) return [];

    // Calculate total inventory for each product
    const productTotals = data.record_inventoryCollection.edges.map(({ node }: any) => {
      const total = (node.await || 0) + 
                   (node.await_grn || 0) + 
                   (node.backcarpark || 0) + 
                   (node.bulk || 0) + 
                   (node.fold || 0) + 
                   (node.injection || 0) + 
                   (node.pipeline || 0) + 
                   (node.prebook || 0);

      return {
        code: node.product_code,
        description: node.data_code?.description || node.product_code,
        colour: node.data_code?.colour || 'N/A',
        total,
        await: node.await || 0,
        bulk: node.bulk || 0,
        fold: node.fold || 0,
        other: (node.await_grn || 0) + (node.backcarpark || 0) + 
                (node.injection || 0) + (node.pipeline || 0) + (node.prebook || 0)
      };
    });

    // Sort by total and take top 10
    return productTotals
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [data]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="flex-1" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load inventory data: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  // Generate colors for bars
  const colors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
    '#06b6d4', '#f43f5e', '#6366f1', '#84cc16', '#a855f7'
  ];

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4">
        <p className="text-sm text-white/60">
          Showing top 10 products by inventory quantity
        </p>
      </div>
      
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              type="number"
              label={{ 
                value: 'Inventory Quantity', 
                position: 'insideBottom',
                offset: -10,
                className: 'text-xs'
              }}
            />
            <YAxis 
              dataKey="code" 
              type="category"
              width={90}
              className="text-xs"
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{data.code}</p>
                      <p className="text-sm text-white/60">{data.description}</p>
                      <p className="text-sm">Color: {data.colour}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-medium">Total Stock: {data.total}</p>
                        <p className="text-xs">Await: {data.await}</p>
                        <p className="text-xs">Bulk: {data.bulk}</p>
                        <p className="text-xs">Fold: {data.fold}</p>
                        <p className="text-xs">Other: {data.other}</p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="total" radius={[0, 8, 8, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {chartData.slice(0, 4).map((item, index) => (
          <div key={item.code} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded" 
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="truncate">{item.code}: {item.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}