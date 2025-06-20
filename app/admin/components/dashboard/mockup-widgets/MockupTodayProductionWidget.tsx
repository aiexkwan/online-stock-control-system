/**
 * Mockup Today Production Widget - 今日生產 Widget
 * 支援 2x4 數據顯示和 6x6 圖表顯示
 */

'use client';

import React from 'react';
import { CardContent, CardHeader } from '@/components/ui/card';
import { WidgetCard } from '../WidgetCard';
import { CubeIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { WidgetStyles } from '@/app/utils/widgetStyles';

// 模擬每小時生產數據
const hourlyData = [
  { hour: '08:00', production: 28, target: 30 },
  { hour: '09:00', production: 32, target: 30 },
  { hour: '10:00', production: 35, target: 30 },
  { hour: '11:00', production: 29, target: 30 },
  { hour: '12:00', production: 15, target: 15 },
  { hour: '13:00', production: 31, target: 30 },
  { hour: '14:00', production: 33, target: 30 },
  { hour: '15:00', production: 36, target: 30 },
  { hour: '16:00', production: 34, target: 30 },
];

export function MockupTodayProductionWidget({ widget, isEditMode }: WidgetComponentProps) {
  const size = widget.config.size || WidgetSize.MEDIUM;

  // 2x4 數據顯示版本
  if (size === WidgetSize.MEDIUM) {
    return (
      <WidgetCard size={widget.config.size} widgetType={widget.type as keyof typeof WidgetStyles.borders} isEditMode={isEditMode}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <CubeIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-sm font-medium text-slate-200">Today Production</h3>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-3">
            {/* 主要數據 */}
            <div className="bg-black/20 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-3xl font-bold text-blue-400">273</span>
                <span className="text-sm text-green-400">+8.7%</span>
              </div>
              <div className="text-sm text-slate-400">Total Pallets</div>
            </div>
            
            {/* 次要數據 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/20 rounded-lg p-3 border border-slate-700/50">
                <div className="text-xl font-semibold text-cyan-400">30.3</div>
                <div className="text-xs text-slate-500">Avg/Hour</div>
              </div>
              <div className="bg-black/20 rounded-lg p-3 border border-slate-700/50">
                <div className="text-xl font-semibold text-teal-400">91%</div>
                <div className="text-xs text-slate-500">Target</div>
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
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <CubeIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-medium bg-gradient-to-r from-blue-300 via-cyan-300 to-teal-300 bg-clip-text text-transparent">
              Today Production Analysis
            </h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-400">273</div>
            <div className="text-xs text-slate-400">Total Pallets</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="hour" 
                stroke="#64748B"
                tick={{ fill: '#94A3B8', fontSize: 12 }}
              />
              <YAxis 
                stroke="#64748B"
                tick={{ fill: '#94A3B8', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#FFFFFF'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="target" 
                stroke="#10B981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorTarget)" 
                strokeDasharray="5 5"
              />
              <Area 
                type="monotone" 
                dataKey="production" 
                stroke="#3B82F6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorProduction)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </WidgetCard>
  );
}