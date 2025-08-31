/**
 * Output vs Booked Out Ratio Chart
 * Shows production output compared to booked out quantities
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
// import { Loader2 } from 'lucide-react';
import { dialogStyles } from '@/app/utils/dialogStyles';
import { AnalyticsApiClient, type OutputRatioData } from '@/lib/analytics/api-client';

interface OutputRatioChartProps {
  timeRange: string;
}

export function OutputRatioChart({ timeRange }: OutputRatioChartProps) {
  const [data, setData] = useState<OutputRatioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const result = await AnalyticsApiClient.getOutputRatio(timeRange);
      setData(result);
    } catch (err: unknown) {
      console.error('Error loading output ratio data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chart data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const chartData = timeRange === '1d' ? data?.hourlyData : data?.dailyData;
  const chartProps = {
    data: chartData,
    margin: { top: 20, right: 30, left: 20, bottom: 60 },
  };

  const tooltipStyle = {
    backgroundColor: '#1F2937',
    border: '1px solid #374151',
    borderRadius: '8px',
    padding: '8px 12px',
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
      return (
        <div style={tooltipStyle}>
          <p className='mb-2 font-medium text-slate-300'>{label}</p>
          {payload.map(
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
          <div className='h-2 w-16 rounded-full bg-slate-600 opacity-75' />
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

  if (!chartData || chartData.length === 0) {
    return (
      <div className={dialogStyles.card}>
        <div className='flex h-[400px] items-center justify-center'>
          <p className='text-slate-400'>No output ratio data available for this period</p>
        </div>
      </div>
    );
  }

  // Use bar chart for 1 day, line chart for others
  if (timeRange === '1d') {
    return (
      <div className={dialogStyles.card}>
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='text-lg font-semibold text-white'>Hourly Output vs Booked Out Ratio</h3>
          {data?.summary && (
            <div className='text-sm text-slate-400'>
              Efficiency:{' '}
              <span
                className={
                  data.summary.efficiency === 'High'
                    ? 'text-green-400'
                    : data.summary.efficiency === 'Medium'
                      ? 'text-yellow-400'
                      : 'text-red-400'
                }
              >
                {data.summary.efficiency}
              </span>
            </div>
          )}
        </div>
        <ResponsiveContainer width='100%' height={400}>
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
            <XAxis dataKey='hour' stroke='#9CA3AF' angle={-45} textAnchor='end' height={80} />
            <YAxis stroke='#9CA3AF' />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType='rect' />
            <Bar dataKey='output' fill='#3B82F6' name='Output' radius={[4, 4, 0, 0]} />
            <Bar dataKey='booked_out' fill='#10B981' name='Booked Out' radius={[4, 4, 0, 0]} />
            <Bar dataKey='ratio' fill='#F59E0B' name='Ratio' radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {data?.summary && (
          <div className='mt-4 flex justify-between text-sm text-slate-400'>
            <span>Total Output: {data.summary.totalOutput}</span>
            <span>Total Booked Out: {data.summary.totalBookedOut}</span>
            <span>Average Ratio: {data.summary.averageRatio}%</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={dialogStyles.card}>
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-white'>Daily Output vs Booked Out Ratio</h3>
        {data?.summary && (
          <div className='text-sm text-slate-400'>
            Efficiency:{' '}
            <span
              className={
                data.summary.efficiency === 'High'
                  ? 'text-green-400'
                  : data.summary.efficiency === 'Medium'
                    ? 'text-yellow-400'
                    : 'text-red-400'
              }
            >
              {data.summary.efficiency}
            </span>
          </div>
        )}
      </div>
      <ResponsiveContainer width='100%' height={400}>
        <LineChart {...chartProps}>
          <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
          <XAxis dataKey='date' stroke='#9CA3AF' angle={-45} textAnchor='end' height={80} />
          <YAxis stroke='#9CA3AF' />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} iconType='line' />
          <Line
            type='monotone'
            dataKey='output'
            stroke='#3B82F6'
            name='Output'
            strokeWidth={2}
            dot={{ fill: '#3B82F6', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type='monotone'
            dataKey='booked_out'
            stroke='#10B981'
            name='Booked Out'
            strokeWidth={2}
            dot={{ fill: '#10B981', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type='monotone'
            dataKey='ratio'
            stroke='#F59E0B'
            name='Ratio'
            strokeWidth={2}
            dot={{ fill: '#F59E0B', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className='mt-4 space-y-2'>
        <div className='flex justify-between text-sm text-slate-400'>
          <span>Total Output: {data?.summary.totalOutput}</span>
          <span>Total Booked Out: {data?.summary.totalBookedOut}</span>
          <span>Average Ratio: {data?.summary.averageRatio}%</span>
        </div>
        <p className='text-xs text-slate-500'>Ratio = (Booked Out / Output) × 100%</p>
      </div>
    </div>
  );
}
