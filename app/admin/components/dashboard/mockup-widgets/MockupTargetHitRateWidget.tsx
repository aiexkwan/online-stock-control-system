/**
 * Mockup Target Hit Rate Widget - 目標達成率 Widget
 * 支援 2x4 數據顯示和 6x6 圖表顯示
 */

'use client';

import React from 'react';
import { CardContent, CardHeader } from '@/components/ui/card';
import { WidgetCard } from '../WidgetCard';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { WidgetStyles } from '@/app/utils/widgetStyles';

// 模擬目標達成率數據
const weeklyData = [
  { day: 'Mon', target: 100, actual: 95, rate: 95 },
  { day: 'Tue', target: 100, actual: 102, rate: 102 },
  { day: 'Wed', target: 100, actual: 98, rate: 98 },
  { day: 'Thu', target: 100, actual: 105, rate: 105 },
  { day: 'Fri', target: 100, actual: 92, rate: 92 },
  { day: 'Sat', target: 80, actual: 78, rate: 97.5 },
  { day: 'Sun', target: 0, actual: 0, rate: 0 },
];

const radialData = [
  { name: 'Target', value: 94.5, fill: '#10B981' }
];

export function MockupTargetHitRateWidget({ widget, isEditMode }: WidgetComponentProps) {
  const size = widget.config.size || WidgetSize.MEDIUM;

  // 2x4 數據顯示版本
  if (size === WidgetSize.MEDIUM) {
    return (
      <WidgetCard size={widget.config.size} widgetType={widget.type as keyof typeof WidgetStyles.borders} isEditMode={isEditMode}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-sm font-medium text-slate-200">Target Hit Rate</h3>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-3">
            {/* 主要數據 */}
            <div className="bg-black/20 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-3xl font-bold text-green-400">94.5%</span>
                <span className="text-sm text-green-400">+3.2%</span>
              </div>
              <div className="text-sm text-slate-400">Weekly Average</div>
            </div>
            
            {/* 次要數據 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/20 rounded-lg p-3 border border-slate-700/50">
                <div className="text-xl font-semibold text-emerald-400">4/6</div>
                <div className="text-xs text-slate-500">Days Hit</div>
              </div>
              <div className="bg-black/20 rounded-lg p-3 border border-slate-700/50">
                <div className="text-xl font-semibold text-teal-400">105%</div>
                <div className="text-xs text-slate-500">Best Day</div>
              </div>
            </div>
          </div>
        </CardContent>
      </WidgetCard>
    );
  }

  // 6x6 圖表版本
  return (
    <WidgetCard size={widget.config.size} widgetType={widget.type as keyof typeof WidgetStyles.borders} isEditMode={isEditMode}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-medium bg-gradient-to-r from-green-300 via-emerald-300 to-teal-300 bg-clip-text text-transparent">
              Target Achievement Analysis
            </h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">94.5%</div>
            <div className="text-xs text-slate-400">Weekly Avg</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4" style={{ height: '300px' }}>
          {/* 左側 - 圓形進度圖 */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <ResponsiveContainer width={250} height={250}>
                <RadialBarChart 
                  innerRadius="60%" 
                  outerRadius="90%" 
                  data={radialData} 
                  startAngle={90} 
                  endAngle={-270}
                >
                  <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    angleAxisId={0}
                    tick={false}
                  />
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    fill="#10B981"
                    background={{ fill: '#1F2937' }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-green-400">94.5%</div>
                <div className="text-sm text-slate-400">Achievement</div>
              </div>
            </div>
            
            {/* 統計資訊 */}
            <div className="grid grid-cols-2 gap-3 mt-4 w-full">
              <div className="bg-black/20 rounded-lg p-2 border border-slate-700/50 text-center">
                <div className="text-lg font-semibold text-green-400">570</div>
                <div className="text-xs text-slate-500">Achieved</div>
              </div>
              <div className="bg-black/20 rounded-lg p-2 border border-slate-700/50 text-center">
                <div className="text-lg font-semibold text-slate-400">603</div>
                <div className="text-xs text-slate-500">Target</div>
              </div>
            </div>
          </div>
          
          {/* 右側 - 週趨勢圖 */}
          <div className="h-full">
            <div className="text-sm text-slate-400 mb-2">Daily Performance</div>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={weeklyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="day" 
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                />
                <YAxis 
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  domain={[80, 110]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#FFFFFF'
                  }}
                  formatter={(value) => `${value}%`}
                />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#6B7280" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </WidgetCard>
  );
}