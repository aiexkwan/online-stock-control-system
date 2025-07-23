/**
 * Order Trend Chart
 * Shows trends of orders by product over time
 * Updated to use Analytics API instead of direct database queries
 */

'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { dialogStyles } from '@/app/utils/dialogStyles';
import { AnalyticsApiClient, type ProductTrendsData } from '@/lib/analytics/api-client';

interface ProductTrendChartProps {
  timeRange: string;
}

// Define colors for different products
const PRODUCT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#84CC16', // Lime
];

export function ProductTrendChart({ timeRange }: ProductTrendChartProps) {
  const [data, setData] = useState<ProductTrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'summary' | 'detail'>('summary');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate time range
      if (!AnalyticsApiClient.validateTimeRange(timeRange)) {
        throw new Error(`Invalid time range: ${timeRange}`);
      }

      // Use Analytics API client instead of direct database queries
      const result = await AnalyticsApiClient.getProductTrends(timeRange);
      setData(result);
    } catch (err: unknown) {
      console.error('Error loading product trends data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chart data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const chartData = view === 'summary' ? data?.summary : data?.detail;
  const productCodes = data?.productCodes || [];
  
  const chartProps = {
    data: chartData,
    margin: { top: 20, right: 30, left: 20, bottom: 60 },
  };

  const tooltipStyle = {
    backgroundColor: '#1F2937',
    border: '1px solid #374151',
    borderRadius: '8px',
    padding: '8px 12px',
    maxHeight: '300px',
    overflow: 'auto',
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { name: string; value: number; color: string; [key: string]: unknown }[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const sortedPayload = [...payload].sort((a, b) => b.value - a.value);
      return (
        <div style={tooltipStyle}>
          <p className='mb-2 font-medium text-slate-300'>{label}</p>
          {sortedPayload.map(
            (
              entry: { name: string; value: number; color: string; [key: string]: unknown },
              index: number
            ) => (
              <p key={index} className='text-sm' style={{ color: entry.color }}>
                {entry.name}: {entry.value}
              </p>
            )
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={dialogStyles.card}>
        <div className='flex h-[400px] items-center justify-center'>
          <div className='h-2 w-16 bg-slate-600 rounded-full opacity-75' />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={dialogStyles.card}>
        <div className='flex h-[400px] items-center justify-center'>
          <p className='text-red-400'>{error}</p>
        </div>
      </div>
    );
  }

  if (!data || (!data.summary.length && !data.detail.length)) {
    return (
      <div className={dialogStyles.card}>
        <div className='flex h-[400px] items-center justify-center'>
          <p className='text-slate-400'>No order data available for this period</p>
        </div>
      </div>
    );
  }

  return (
    <div className={dialogStyles.card}>
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-white'>
          Order Trend {view === 'summary' ? 'Summary' : 'by Product'}
        </h3>
        <div className='flex gap-2'>
          <button
            onClick={() => setView('summary')}
            className={`rounded-lg px-3 py-1 text-sm transition-colors ${
              view === 'summary'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setView('detail')}
            className={`rounded-lg px-3 py-1 text-sm transition-colors ${
              view === 'detail'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Detail
          </button>
        </div>
      </div>

      {view === 'summary' ? (
        // Summary view - show total orders by time period
        <>
          <ResponsiveContainer width='100%' height={400}>
            {timeRange === '1d' ? (
              <BarChart data={data.summary} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
                <XAxis dataKey='date' stroke='#9CA3AF' angle={-45} textAnchor='end' height={80} />
                <YAxis stroke='#9CA3AF' />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: unknown) => `${value} orders`}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType='rect' />
                <Bar dataKey='count' fill='#3B82F6' name='Orders' radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={data.summary} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
                <XAxis dataKey='date' stroke='#9CA3AF' angle={-45} textAnchor='end' height={80} />
                <YAxis stroke='#9CA3AF' />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: unknown) => `${value} orders`}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType='line' />
                <Line
                  type='monotone'
                  dataKey='count'
                  stroke='#3B82F6'
                  name='Orders'
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
          <div className='mt-4 flex justify-between text-sm text-slate-400'>
            <span>Total orders created per {timeRange === '1d' ? 'hour' : 'day'}</span>
            <span>Total Orders: {data.totalOrders}</span>
          </div>
        </>
      ) : (
        // Detail view - show orders by product
        <>
          <ResponsiveContainer width='100%' height={400}>
            {timeRange === '1d' ? (
              <BarChart data={data.detail} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
                <XAxis dataKey='date' stroke='#9CA3AF' angle={-45} textAnchor='end' height={80} />
                <YAxis stroke='#9CA3AF' />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType='rect' />
                {productCodes.map((code, index) => (
                  <Bar
                    key={code}
                    dataKey={code}
                    fill={PRODUCT_COLORS[index % PRODUCT_COLORS.length]}
                    stackId='products'
                    radius={index === productCodes.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            ) : (
              <LineChart data={data.detail} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
                <XAxis dataKey='date' stroke='#9CA3AF' angle={-45} textAnchor='end' height={80} />
                <YAxis stroke='#9CA3AF' />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType='line' />
                {productCodes.map((code, index) => (
                  <Line
                    key={code}
                    type='monotone'
                    dataKey={code}
                    stroke={PRODUCT_COLORS[index % PRODUCT_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
          <div className='mt-4 flex justify-between text-sm text-slate-400'>
            <span>Top {productCodes.length} products by order count</span>
            <span>Total Orders: {data.totalOrders}</span>
          </div>
        </>
      )}
    </div>
  );
}
