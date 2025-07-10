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
  Area,
  AreaChart,
} from 'recharts';
import { useGetStocktakeAccuracyQuery, GetStocktakeAccuracyQuery } from '@/lib/graphql/generated/apollo-hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface StocktakeAccuracyTrendProps {
  timeFrame?: any;
}

export default function StocktakeAccuracyTrend({ timeFrame }: StocktakeAccuracyTrendProps) {
  const { data, loading, error } = useGetStocktakeAccuracyQuery({
    pollInterval: 60000, // Poll every 60 seconds
    fetchPolicy: 'cache-and-network',
    skip: !process.env.NEXT_PUBLIC_ENABLE_GRAPHQL_ANALYSIS,
  });

  const chartData = useMemo(() => {
    if (!data?.stocktake_daily_summaryCollection?.edges) return [];

    // Group by date and calculate accuracy
    const dateMap = new Map<string, { counted: number; expected: number; products: number }>();

    data.stocktake_daily_summaryCollection.edges.forEach(({ node }) => {
      if (!node?.count_date) return;
      
      const date = node.count_date;
      const existing = dateMap.get(date) || { counted: 0, expected: 0, products: 0 };

      dateMap.set(date, {
        counted: existing.counted + (node.total_counted || 0),
        expected: existing.expected + (node.final_remain_qty || 0),
        products: existing.products + 1,
      });
    });

    // Convert to array and calculate accuracy
    return Array.from(dateMap.entries())
      .map(([date, stats]) => {
        const accuracy =
          stats.expected > 0 ? Math.round((stats.counted / stats.expected) * 100 * 10) / 10 : 100;

        return {
          date: format(parseISO(date), 'MM/dd'),
          fullDate: date,
          accuracy: Math.min(accuracy, 100), // Cap at 100%
          scanned: stats.counted,
          expected: stats.expected,
          discrepancy: Math.abs(stats.expected - stats.counted),
          products: stats.products,
        };
      })
      .sort((a, b) => a.fullDate.localeCompare(b.fullDate))
      .slice(-30); // Last 30 days
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
        <AlertDescription>Failed to load stocktake data: {error.message}</AlertDescription>
      </Alert>
    );
  }

  // Calculate average accuracy
  const avgAccuracy =
    chartData.length > 0
      ? Math.round((chartData.reduce((sum, d) => sum + d.accuracy, 0) / chartData.length) * 10) / 10
      : 0;

  // Calculate trend
  const recentData = chartData.slice(-7);
  const oldData = chartData.slice(-14, -7);
  const recentAvg = recentData.reduce((sum, d) => sum + d.accuracy, 0) / recentData.length;
  const oldAvg =
    oldData.length > 0
      ? oldData.reduce((sum, d) => sum + d.accuracy, 0) / oldData.length
      : recentAvg;
  const trend = recentAvg - oldAvg;

  // Check if GraphQL analysis is disabled
  if (!process.env.NEXT_PUBLIC_ENABLE_GRAPHQL_ANALYSIS) {
    return (
      <Alert>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>GraphQL analysis is disabled</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='flex h-full w-full flex-col'>
      <div className='mb-4'>
        <p className='text-sm text-white/60'>Stocktake accuracy trend over the last 30 days</p>
        <div className='mt-2 flex gap-4'>
          <div className='text-sm'>
            <span className='text-white/60'>Average Accuracy: </span>
            <span className='font-medium'>{avgAccuracy}%</span>
          </div>
          <div className='text-sm'>
            <span className='text-white/60'>Trend: </span>
            <span
              className={`font-medium ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}`}
            >
              {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(Math.round(trend * 10) / 10)}%
            </span>
          </div>
        </div>
      </div>

      <div className='flex-1'>
        <ResponsiveContainer width='100%' height='100%'>
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <defs>
              <linearGradient id='accuracyGradient' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='#10b981' stopOpacity={0.3} />
                <stop offset='95%' stopColor='#10b981' stopOpacity={0} />
              </linearGradient>
              <linearGradient id='discrepancyGradient' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='#ef4444' stopOpacity={0.3} />
                <stop offset='95%' stopColor='#ef4444' stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray='3 3' className='opacity-30' />
            <XAxis dataKey='date' className='text-xs' />
            <YAxis
              yAxisId='left'
              label={{
                value: 'Accuracy Rate (%)',
                angle: -90,
                position: 'insideLeft',
                className: 'text-xs',
              }}
              domain={[80, 100]}
            />
            <YAxis
              yAxisId='right'
              orientation='right'
              label={{
                value: 'Discrepancy Count',
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
                      <p className='font-medium'>{data.fullDate}</p>
                      <div className='mt-2 space-y-1'>
                        <p className='text-sm text-green-600'>Accuracy: {data.accuracy}%</p>
                        <p className='text-sm'>Scanned: {data.scanned}</p>
                        <p className='text-sm'>Expected: {data.expected}</p>
                        <p className='text-sm text-red-600'>Discrepancy: {data.discrepancy}</p>
                        <p className='text-sm text-white/60'>Products: {data.products}</p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Area
              yAxisId='left'
              type='monotone'
              dataKey='accuracy'
              stroke='#10b981'
              strokeWidth={2}
              fill='url(#accuracyGradient)'
              name='Accuracy Rate'
            />
            <Line
              yAxisId='right'
              type='monotone'
              dataKey='discrepancy'
              stroke='#ef4444'
              strokeWidth={2}
              name='Discrepancy Count'
              dot={{ r: 3 }}
            />
            {/* Target line at 95% */}
            <Line
              yAxisId='left'
              type='monotone'
              dataKey={() => 95}
              stroke='#6366f1'
              strokeWidth={1}
              strokeDasharray='5 5'
              name='Target (95%)'
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className='mt-4 grid grid-cols-3 gap-4 border-t pt-4 text-xs'>
        <div className='text-center'>
          <div className='text-2xl font-bold text-green-600'>
            {chartData.filter(d => d.accuracy >= 95).length}
          </div>
          <div className='text-white/60'>Days Meeting Target (≥95%)</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-amber-600'>
            {chartData.filter(d => d.accuracy >= 90 && d.accuracy < 95).length}
          </div>
          <div className='text-white/60'>Near Target (90-94%)</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-red-600'>
            {chartData.filter(d => d.accuracy < 90).length}
          </div>
          <div className='text-white/60'>Needs Improvement (&lt;90%)</div>
        </div>
      </div>
    </div>
  );
}
