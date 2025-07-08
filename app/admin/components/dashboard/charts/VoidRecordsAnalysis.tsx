'use client';

import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { gql, useGraphQLQuery } from '@/lib/graphql-client-stable';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const GET_VOID_RECORDS = gql`
  query GetVoidRecords {
    report_voidCollection(first: 100) {
      edges {
        node {
          uuid
          plt_num
          reason
          time
          damage_qty
        }
      }
    }
  }
`;

interface VoidRecordsAnalysisProps {
  timeFrame?: any;
}

export default function VoidRecordsAnalysis({ timeFrame }: VoidRecordsAnalysisProps) {
  const { data, loading, error } = useGraphQLQuery(GET_VOID_RECORDS);

  const { reasonData, productData } = useMemo(() => {
    if (!data?.report_voidCollection?.edges) return { reasonData: [], productData: [] };

    // Group by void reason
    const reasonMap = new Map<string, number>();
    const palletMap = new Map<string, { count: number; qty: number }>();

    data.report_voidCollection.edges.forEach(({ node }: any) => {
      // Count by reason
      const reason = node.reason || 'Unspecified Reason';
      reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);

      // Count by pallet (extract product code from pallet number)
      const pltNum = node.plt_num || '';
      const productCode = pltNum.split('-')[1] || 'Unknown'; // Extract product code from pallet format
      const existing = palletMap.get(productCode) || { count: 0, qty: 0 };
      palletMap.set(productCode, {
        count: existing.count + 1,
        qty: existing.qty + (node.damage_qty || 0),
      });
    });

    // Convert to array format for charts
    const reasonData = Array.from(reasonMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    const productData = Array.from(palletMap.entries())
      .map(([code, stats]) => ({
        code,
        count: stats.count,
        qty: stats.qty,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 products

    return { reasonData, productData };
  }, [data]);

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
        <AlertDescription>Failed to load void records: {error.message}</AlertDescription>
      </Alert>
    );
  }

  // Colors for pie chart
  const COLORS = [
    '#ef4444',
    '#f97316',
    '#f59e0b',
    '#84cc16',
    '#10b981',
    '#06b6d4',
    '#3b82f6',
    '#8b5cf6',
  ];

  // Calculate total voids
  const totalVoids = reasonData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className='flex h-full w-full flex-col'>
      <div className='mb-4'>
        <p className='text-sm text-white/60'>
          Analysis of the last 100 void records (Total: {totalVoids} records)
        </p>
      </div>

      <div className='grid flex-1 grid-cols-2 gap-4'>
        {/* Void Reasons Pie Chart */}
        <div className='flex flex-col'>
          <h3 className='mb-2 text-sm font-medium'>Void Reasons Distribution</h3>
          <div className='flex-1'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={reasonData}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  label={({ reason, percent }) => `${reason} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill='#8884d8'
                  dataKey='count'
                >
                  {reasonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className='rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur-sm'>
                          <p className='font-medium'>{data.reason}</p>
                          <p className='text-sm'>Count: {data.count}</p>
                          <p className='text-sm text-white/60'>
                            Percentage: {((data.count / totalVoids) * 100).toFixed(1)}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Bar Chart */}
        <div className='flex flex-col'>
          <h3 className='mb-2 text-sm font-medium'>High Risk Products - Top 10</h3>
          <div className='flex-1'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                data={productData}
                layout='horizontal'
                margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray='3 3' className='opacity-30' />
                <XAxis type='number' className='text-xs' />
                <YAxis dataKey='code' type='category' width={50} className='text-xs' />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className='rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur-sm'>
                          <p className='font-medium'>{data.code}</p>
                          <p className='text-sm'>Void Count: {data.count}</p>
                          <p className='text-sm'>Total Quantity: {data.qty}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey='count' fill='#ef4444' radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className='mt-4 grid grid-cols-4 gap-2 border-t pt-4 text-xs'>
        <div className='text-center'>
          <div className='font-medium text-red-600'>{reasonData[0]?.reason || 'N/A'}</div>
          <div className='text-white/60'>Most Common Reason</div>
        </div>
        <div className='text-center'>
          <div className='font-medium'>{productData[0]?.code || 'N/A'}</div>
          <div className='text-white/60'>Most Voided Product</div>
        </div>
        <div className='text-center'>
          <div className='font-medium'>{reasonData.length}</div>
          <div className='text-white/60'>Void Reason Types</div>
        </div>
        <div className='text-center'>
          <div className='font-medium'>{productData.reduce((sum, p) => sum + p.qty, 0)}</div>
          <div className='text-white/60'>Total Voided Quantity</div>
        </div>
      </div>
    </div>
  );
}
