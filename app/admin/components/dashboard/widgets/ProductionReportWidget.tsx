/**
 * Production Report Widget
 * Shows production data in a line chart
 */

'use client';

import React, { useState } from 'react';
import { BaseWidget, WidgetLayouts } from '../../widgets/BaseWidget';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { useWidgetData } from '@/app/admin/hooks/useWidgetData';
import { createClient } from '@/app/utils/supabase/client';
import { format } from 'date-fns';

interface ProductionData {
  dailyProduction: Array<{
    date: string;
    total: number;
    target: number;
  }>;
}

export const ProductionReportWidget = React.memo(function ProductionReportWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('week');
  const [data, setData] = useState<ProductionData>({
    dailyProduction: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProductionData = async () => {
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
          total: Math.floor(Math.random() * 500) + 800,
          target: 1000
        };
      });
      
      setData({ dailyProduction: mockData });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load production data');
    } finally {
      setLoading(false);
    }
  };

  useWidgetData({
    loadFunction: loadProductionData,
    dependencies: [dateRange],
    isEditMode
  });

  return (
    <BaseWidget
      title="Production Report"
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
            <LineChart data={data.dailyProduction} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#23232A" />
              <XAxis 
                dataKey="date" 
                stroke="#8E8EA0"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#8E8EA0"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181C',
                  border: '1px solid #23232A',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: '#EAEAEA' }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#FFD700" 
                strokeWidth={2}
                dot={{ fill: '#FFD700', r: 4 }}
                activeDot={{ r: 6 }}
                name="Actual Production"
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="#FFA500" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#FFA500', r: 3 }}
                name="Target"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </WidgetLayouts.FullChart>
    </BaseWidget>
  );
});