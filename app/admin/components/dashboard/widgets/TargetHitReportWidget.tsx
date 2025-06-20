/**
 * Target Hit Report Widget
 * Shows target achievement data in a line chart
 */

'use client';

import React, { useState } from 'react';
import { BaseWidget, WidgetLayouts } from '../../widgets/BaseWidget';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, ComposedChart
} from 'recharts';
import { useWidgetData } from '@/app/admin/hooks/useWidgetData';
import { createClient } from '@/app/utils/supabase/client';
import { format } from 'date-fns';

interface TargetData {
  dailyTargets: Array<{
    date: string;
    hitRate: number;
    efficiency: number;
  }>;
}

export function TargetHitReportWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('week');
  const [data, setData] = useState<TargetData>({
    dailyTargets: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTargetData = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      
      // Mock data for demonstration
      const today = new Date();
      const mockData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        return {
          date: format(date, 'MM/dd'),
          hitRate: Math.floor(Math.random() * 20) + 80,
          efficiency: Math.floor(Math.random() * 15) + 75
        };
      });
      
      setData({ dailyTargets: mockData });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load target data');
    } finally {
      setLoading(false);
    }
  };

  useWidgetData({
    loadFunction: loadTargetData,
    dependencies: [dateRange],
    isEditMode
  });

  return (
    <BaseWidget
      title="Target Hit Report"
      theme="production"
      headerAction={
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as any)}
          className="text-xs bg-[#22222A] border border-[#23232A]/40 rounded px-2 py-1 text-[#EAEAEA]"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="quarter">Last Quarter</option>
        </select>
      }
    >
      <WidgetLayouts.FullChart>
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center text-red-400">
            Error loading data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.dailyTargets} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#23232A" />
              <XAxis 
                dataKey="date" 
                stroke="#8E8EA0"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#8E8EA0"
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181C',
                  border: '1px solid #23232A',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: '#EAEAEA' }}
                formatter={(value: any) => `${value}%`}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                iconType="line"
              />
              <Area
                type="monotone"
                dataKey="efficiency"
                fill="#FFD70020"
                stroke="#FFD700"
                strokeWidth={0}
                name="Efficiency Zone"
              />
              <Line 
                type="monotone" 
                dataKey="hitRate" 
                stroke="#FFA500" 
                strokeWidth={3}
                dot={{ fill: '#FFA500', r: 4 }}
                activeDot={{ r: 6 }}
                name="Hit Rate %"
              />
              <Line 
                type="monotone" 
                dataKey="efficiency" 
                stroke="#FFD700" 
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
                name="Efficiency %"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </WidgetLayouts.FullChart>
    </BaseWidget>
  );
}