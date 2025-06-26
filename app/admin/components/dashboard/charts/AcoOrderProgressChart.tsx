'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { gql, useGraphQLQuery } from '@/lib/graphql-client-stable';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const GET_ACO_ORDERS = gql`
  query GetAcoOrders {
    record_acoCollection(
      orderBy: [{ order_ref: AscNullsLast }]
      first: 20
    ) {
      edges {
        node {
          order_ref
          code
          required_qty
          remain_qty
          latest_update
        }
      }
    }
  }
`;

interface AcoOrderProgressChartProps {
  timeFrame?: any;
}

export default function AcoOrderProgressChart({ timeFrame }: AcoOrderProgressChartProps) {
  const { data, loading, error } = useGraphQLQuery(GET_ACO_ORDERS);

  const chartData = useMemo(() => {
    if (!data?.record_acoCollection?.edges) return [];

    return data.record_acoCollection.edges.map(({ node }: any) => {
      const completedQty = node.required_qty - node.remain_qty;
      const completionRate = (completedQty / node.required_qty) * 100;

      return {
        orderRef: `#${node.order_ref}`,
        code: node.code,
        completed: completedQty,
        remaining: node.remain_qty,
        total: node.required_qty,
        completionRate: Math.round(completionRate),
      };
    }).slice(0, 10); // Show top 10 orders
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
          Failed to load order data: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  const getBarColor = (completionRate: number) => {
    if (completionRate >= 80) return '#10b981'; // green
    if (completionRate >= 50) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4">
        <p className="text-sm text-white/60">
          Showing completion progress for the latest 10 ACO orders
        </p>
      </div>
      
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="orderRef" 
              angle={-45}
              textAnchor="end"
              height={80}
              className="text-xs"
            />
            <YAxis 
              label={{ 
                value: 'Completion Rate (%)', 
                angle: -90, 
                position: 'insideLeft',
                className: 'text-xs'
              }}
              domain={[0, 100]}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{data.orderRef}</p>
                      <p className="text-sm text-white/60">Product: {data.code}</p>
                      <p className="text-sm">Completed: {data.completed}/{data.total}</p>
                      <p className="text-sm font-medium text-primary">
                        Completion Rate: {data.completionRate}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              content={() => (
                <div className="flex justify-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded" />
                    <span className="text-xs">≥80%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 rounded" />
                    <span className="text-xs">50-79%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded" />
                    <span className="text-xs">&lt;50%</span>
                  </div>
                </div>
              )}
            />
            <Bar dataKey="completionRate" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.completionRate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}