/**
 * Mockup Machine Efficiency Widget - 機器效率 Widget
 * 支援 2x4 數據顯示和 6x6 圖表顯示
 */

'use client';

import React from 'react';
import { CardContent, CardHeader } from '@/components/ui/card';
import { WidgetCard } from '../WidgetCard';
import { CogIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { WidgetStyles } from '@/app/utils/widgetStyles';

// 模擬機器效率數據
const machineData = [
  { name: 'Machine A', efficiency: 92, status: 'good' },
  { name: 'Machine B', efficiency: 87, status: 'good' },
  { name: 'Machine C', efficiency: 78, status: 'warning' },
  { name: 'Machine D', efficiency: 95, status: 'excellent' },
  { name: 'Machine E', efficiency: 65, status: 'poor' },
  { name: 'Machine F', efficiency: 88, status: 'good' },
];

const getBarColor = (status: string) => {
  switch (status) {
    case 'excellent': return '#10B981';
    case 'good': return '#3B82F6';
    case 'warning': return '#F59E0B';
    case 'poor': return '#EF4444';
    default: return '#6B7280';
  }
};

export function MockupMachineEfficiencyWidget({ widget, isEditMode }: WidgetComponentProps) {
  const size = widget.config.size || WidgetSize.MEDIUM;

  // 2x4 數據顯示版本
  if (size === WidgetSize.MEDIUM) {
    return (
      <WidgetCard size={widget.config.size} widgetType={widget.type as keyof typeof WidgetStyles.borders} isEditMode={isEditMode}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <CogIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-sm font-medium text-slate-200">Machine Efficiency</h3>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-3">
            {/* 主要數據 */}
            <div className="bg-black/20 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-3xl font-bold text-purple-400">84.2%</span>
                <span className="text-sm text-red-400">-2.3%</span>
              </div>
              <div className="text-sm text-slate-400">Average Efficiency</div>
            </div>
            
            {/* 次要數據 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/20 rounded-lg p-3 border border-slate-700/50">
                <div className="text-xl font-semibold text-green-400">4/6</div>
                <div className="text-xs text-slate-500">Running</div>
              </div>
              <div className="bg-black/20 rounded-lg p-3 border border-slate-700/50">
                <div className="text-xl font-semibold text-yellow-400">1</div>
                <div className="text-xs text-slate-500">Warning</div>
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
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <CogIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-medium bg-gradient-to-r from-purple-300 via-pink-300 to-rose-300 bg-clip-text text-transparent">
              Machine Efficiency Overview
            </h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-400">84.2%</div>
            <div className="text-xs text-slate-400">Average</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={machineData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="name" 
                stroke="#64748B"
                tick={{ fill: '#94A3B8', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
              />
              <YAxis 
                stroke="#64748B"
                tick={{ fill: '#94A3B8', fontSize: 12 }}
                domain={[0, 100]}
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
              <Bar 
                dataKey="efficiency" 
                radius={[8, 8, 0, 0]}
              >
                {machineData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* 圖例 */}
        <div className="flex justify-center gap-4 mt-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-slate-400">Excellent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-slate-400">Good</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-xs text-slate-400">Warning</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs text-slate-400">Poor</span>
          </div>
        </div>
      </CardContent>
    </WidgetCard>
  );
}