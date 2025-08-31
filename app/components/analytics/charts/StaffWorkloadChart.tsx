/**
 * Staff Workload Chart
 * Shows staff productivity and workload distribution
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
// import { Loader2 } from 'lucide-react';
import { dialogStyles } from '@/app/utils/dialogStyles';
import { AnalyticsApiClient, type StaffWorkloadData } from '@/lib/analytics/api-client';

interface StaffWorkloadChartProps {
  timeRange: string;
}

// Define colors for different staff
const STAFF_COLORS = [
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

export function StaffWorkloadChart({ timeRange }: StaffWorkloadChartProps) {
  const [data, setData] = useState<StaffWorkloadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'summary' | 'timeline'>('summary');

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
      const result = await AnalyticsApiClient.getStaffWorkload(timeRange);
      setData(result);
    } catch (err: unknown) {
      console.error('Error loading staff workload data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chart data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const chartProps = {
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
                {entry.name}: {entry.value} operations
              </p>
            )
          )}
        </div>
      );
    }
    return null;
  };

  const CustomPieLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
    name: string;
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label for small slices

    return (
      <text
        x={x}
        y={y}
        fill='white'
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline='central'
        className='text-xs font-medium'
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
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

  if (!data || data.summary.length === 0) {
    return (
      <div className={dialogStyles.card}>
        <div className='flex h-[400px] items-center justify-center'>
          <p className='text-slate-400'>No staff workload data available for this period</p>
        </div>
      </div>
    );
  }

  return (
    <div className={dialogStyles.card}>
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-white'>Staff Workload Analysis</h3>
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
            onClick={() => setView('timeline')}
            className={`rounded-lg px-3 py-1 text-sm transition-colors ${
              view === 'timeline'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Timeline
          </button>
        </div>
      </div>

      {view === 'summary' ? (
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          {/* Bar chart for top performers */}
          <div>
            <h4 className='mb-2 text-sm font-medium text-slate-400'>Top Performers</h4>
            <ResponsiveContainer width='100%' height={350}>
              <BarChart data={data.summary.slice(0, 10)} {...chartProps}>
                <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
                <XAxis dataKey='name' stroke='#9CA3AF' angle={-45} textAnchor='end' height={80} />
                <YAxis stroke='#9CA3AF' />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: unknown) => `${value} operations`}
                />
                <Bar dataKey='pallets' fill='#3B82F6' radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart for distribution */}
          <div>
            <h4 className='mb-2 text-sm font-medium text-slate-400'>Workload Distribution</h4>
            <ResponsiveContainer width='100%' height={350}>
              <PieChart>
                <Pie
                  data={data.summary.slice(0, 8)}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  label={CustomPieLabel}
                  outerRadius={120}
                  fill='#8884d8'
                  dataKey='pallets'
                >
                  {data.summary.slice(0, 8).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STAFF_COLORS[index % STAFF_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: unknown, name: string) => [`${value} operations`, name]}
                />
                <Legend
                  verticalAlign='bottom'
                  height={36}
                  formatter={(value: unknown) => `${value}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div>
          <h4 className='mb-2 text-sm font-medium text-slate-400'>
            {timeRange === '1d' ? 'Hourly' : 'Daily'} Production by Staff
          </h4>
          <ResponsiveContainer width='100%' height={400}>
            {timeRange === '1d' ? (
              <BarChart data={data.timeline} {...chartProps}>
                <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
                <XAxis dataKey='date' stroke='#9CA3AF' angle={-45} textAnchor='end' height={80} />
                <YAxis stroke='#9CA3AF' />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType='rect' />
                {data.staffNames.map((name, index) => (
                  <Bar
                    key={name}
                    dataKey={name}
                    fill={STAFF_COLORS[index % STAFF_COLORS.length]}
                    stackId='staff'
                  />
                ))}
              </BarChart>
            ) : (
              <LineChart data={data.timeline} {...chartProps}>
                <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
                <XAxis dataKey='date' stroke='#9CA3AF' angle={-45} textAnchor='end' height={80} />
                <YAxis stroke='#9CA3AF' />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType='line' />
                {data.staffNames.map((name, index) => (
                  <Line
                    key={name}
                    type='monotone'
                    dataKey={name}
                    stroke={STAFF_COLORS[index % STAFF_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      <div className='mt-4 flex justify-between text-sm text-slate-400'>
        <span>Total Operations: {data.totalOperations}</span>
        <span>Active Staff: {data.totalStaff}</span>
        <span>Top Performers: {data.staffNames.length}</span>
      </div>
    </div>
  );
}
