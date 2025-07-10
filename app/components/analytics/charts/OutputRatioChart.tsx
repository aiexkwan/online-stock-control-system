/**
 * Output vs Booked Out Ratio Chart
 * Shows production output compared to booked out quantities
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
import { createClient } from '@/lib/supabase';
import { dialogStyles } from '@/app/utils/dialogStyles';
import {
  getStartDate,
  getEndDate,
  processOutputRatioData,
  HourlyData,
  DailyData,
} from '@/app/utils/analyticsDataProcessors';

interface OutputRatioChartProps {
  timeRange: string;
}

export function OutputRatioChart({ timeRange }: OutputRatioChartProps) {
  const [data, setData] = useState<(HourlyData | DailyData)[]>([]);
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
      const supabase = createClient();
      const startDate = getStartDate(timeRange);
      const endDate = getEndDate();

      (process.env.NODE_ENV as string) !== 'production' &&
        (process.env.NODE_ENV as string) !== 'production' &&
        console.log('Loading data for time range:', timeRange);
      (process.env.NODE_ENV as string) !== 'production' &&
        (process.env.NODE_ENV as string) !== 'production' &&
        console.log('Start date:', startDate.toISOString());
      (process.env.NODE_ENV as string) !== 'production' &&
        (process.env.NODE_ENV as string) !== 'production' &&
        console.log('End date:', endDate.toISOString());

      // Fetch output data (pallets generated)
      const { data: outputData, error: outputError } = await supabase
        .from('record_palletinfo')
        .select('generate_time')
        .gte('generate_time', startDate.toISOString())
        .lte('generate_time', endDate.toISOString())
        .not('plt_remark', 'ilike', '%Material GRN-%');

      if (outputError) {
        console.error('Output query error:', outputError);
        throw outputError;
      }

      (process.env.NODE_ENV as string) !== 'production' &&
        (process.env.NODE_ENV as string) !== 'production' &&
        console.log('Output data count:', outputData?.length || 0);

      // Fetch transfer data (pallets booked out)
      const { data: transferData, error: transferError } = await supabase
        .from('record_transfer')
        .select('tran_date, plt_num')
        .gte('tran_date', startDate.toISOString())
        .lte('tran_date', endDate.toISOString());

      if (transferError) {
        console.error('Transfer query error:', transferError);
        throw transferError;
      }

      (process.env.NODE_ENV as string) !== 'production' &&
        (process.env.NODE_ENV as string) !== 'production' &&
        console.log('Transfer data count:', transferData?.length || 0);

      // Process data
      const processedData = processOutputRatioData(outputData || [], transferData || [], timeRange);

      (process.env.NODE_ENV as string) !== 'production' &&
        (process.env.NODE_ENV as string) !== 'production' &&
        console.log('Processed data:', processedData);

      setData(processedData);
    } catch (err: any) {
      console.error('Error loading output ratio data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const chartProps = {
    data,
    margin: { top: 20, right: 30, left: 20, bottom: 60 },
  };

  const tooltipStyle = {
    backgroundColor: '#1F2937',
    border: '1px solid #374151',
    borderRadius: '8px',
    padding: '8px 12px',
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={tooltipStyle}>
          <p className='mb-2 font-medium text-slate-300'>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className='text-sm' style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={dialogStyles.card}>
        <div className='flex h-[400px] items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin text-blue-500' />
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

  // Use bar chart for 1 day, line chart for others
  if (timeRange === '1d') {
    return (
      <div className={dialogStyles.card}>
        <h3 className='mb-4 text-lg font-semibold text-white'>Hourly Output vs Booked Out Ratio</h3>
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
      </div>
    );
  }

  return (
    <div className={dialogStyles.card}>
      <h3 className='mb-4 text-lg font-semibold text-white'>Daily Output vs Booked Out Ratio</h3>
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
      <div className='mt-4 text-sm text-slate-400'>
        <p>Ratio = (Booked Out / Output) × 100%</p>
      </div>
    </div>
  );
}
