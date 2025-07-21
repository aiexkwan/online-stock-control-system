'use client';

import React, { useMemo } from 'react';
import { DatabaseRecord } from '@/types/database/tables';
import { useQuery } from '@tanstack/react-query';
import { widgetAPI } from '@/lib/api/widgets/widget-api-client';
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
} from '@/lib/recharts-dynamic';

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface VoidRecordsAnalysisProps {
  timeFrame?: {
    start: Date;
    end: Date;
  };
}

interface VoidRecord {
  id: string;
  product_code?: string;
  reason?: string;
  void_qty?: number;
  created_at: string;
  user_name?: string;
}

export default function VoidRecordsAnalysis({ timeFrame }: VoidRecordsAnalysisProps) {
  // Get last 30 days of data for analysis
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const queryParams = {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    limit: 100, // Limit to last 100 records for performance
  };

  // Use React Query for data fetching
  const {
    data: response,
    isLoading: loading,
    error,
    isError,
  } = useQuery({
    queryKey: ['void-records-analysis', queryParams],
    queryFn: () => widgetAPI.getVoidRecordsAnalysis(queryParams),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Extract data from response and memoize to avoid dependency issues
  const data = useMemo(() => {
    if (!response?.success || !response.data) return [];
    const apiData = response.data as { records?: unknown[] };
    return apiData.records || [];
  }, [response]);

  const { reasonData, productData } = useMemo(() => {
    if (!data || data.length === 0) return { reasonData: [], productData: [] };

    // Group by void reason
    const reasonMap = new Map<string, number>();
    const productMap = new Map<string, { count: number; qty: number }>();

    data.forEach((record: unknown) => {
      // Type guard to ensure record is a valid object
      if (!record || typeof record !== 'object') return;

      const typedRecord = record as DatabaseRecord;

      // Count by reason
      const reason =
        'reason' in typedRecord && typeof typedRecord.reason === 'string'
          ? typedRecord.reason || 'Unspecified Reason'
          : 'Unspecified Reason';
      reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);

      // Count by product code
      const productCode =
        'product_code' in typedRecord && typeof typedRecord.product_code === 'string'
          ? typedRecord.product_code || 'Unknown'
          : 'Unknown';
      const existing = productMap.get(productCode) || { count: 0, qty: 0 };

      const voidQty =
        'void_qty' in typedRecord && typeof typedRecord.void_qty === 'number'
          ? typedRecord.void_qty || 0
          : 0;

      productMap.set(productCode, {
        count: existing.count + 1,
        qty: existing.qty + voidQty,
      });
    });

    // Convert to array format for charts
    const reasonData = Array.from(reasonMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    const productData = Array.from(productMap.entries())
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

  if (isError) {
    const errorMessage =
      error instanceof Error
        ? (error as { message: string }).message
        : 'Failed to load void records';
    return (
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>Failed to load void records: {errorMessage}</AlertDescription>
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
          Analysis of the last {data.length} void records (Total: {totalVoids} records)
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
                  label={(props: Record<string, unknown>) => {
                    const reason = props.reason as string;
                    const percent = props.percent as number;
                    return `${reason} ${(percent * 100).toFixed(0)}%`;
                  }}
                  outerRadius={80}
                  fill='#8884d8'
                  dataKey='count'
                >
                  {reasonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  // @types-migration:todo(phase3) [P2] 使用 recharts TooltipProps 完整接口 - Target: 2025-08 - Owner: @frontend-team
                  content={({ active, payload }: { active?: boolean; payload?: any[] }) => {
                    if (
                      active &&
                      Array.isArray(payload) &&
                      payload.length > 0 &&
                      payload[0]?.payload
                    ) {
                      const data = payload[0].payload;
                      return (
                        <div className='rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur-sm'>
                          <p className='font-medium'>{String(data.reason)}</p>
                          <p className='text-sm'>Count: {String(data.count)}</p>
                          <p className='text-sm text-white/60'>
                            Percentage: {((Number(data.count) / totalVoids) * 100).toFixed(1)}%
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
                <CartesianGrid strokeDasharray='3 3' opacity={0.3} />
                <XAxis type='number' tick={{ fontSize: '12px' }} />
                <YAxis dataKey='code' type='category' width={50} tick={{ fontSize: '12px' }} />
                <Tooltip
                  // @types-migration:todo(phase3) [P2] 使用 recharts TooltipProps 完整接口 - Target: 2025-08 - Owner: @frontend-team
                  content={({ active, payload }: { active?: boolean; payload?: any[] }) => {
                    if (
                      active &&
                      Array.isArray(payload) &&
                      payload.length > 0 &&
                      payload[0]?.payload
                    ) {
                      const data = payload[0].payload;
                      return (
                        <div className='rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur-sm'>
                          <p className='font-medium'>{String(data.code)}</p>
                          <p className='text-sm'>Void Count: {String(data.count)}</p>
                          <p className='text-sm'>Total Quantity: {String(data.qty)}</p>
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
