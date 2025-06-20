/**
 * Mockup Product Mix Chart Widget - Static version for layout design
 */

'use client';

import React from 'react';
import { CardContent, CardHeader } from '@/components/ui/card';
import { WidgetCard } from '../WidgetCard';
import { ChartPieIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { WidgetStyles } from '@/app/utils/widgetStyles';

const COLORS = [
  '#10B981', // Emerald green
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
];

const mockData = [
  { code: 'CPDE123', count: 350, percentage: 28 },
  { code: 'CPDE456', count: 280, percentage: 22 },
  { code: 'CPDE789', count: 200, percentage: 16 },
  { code: 'CPDE012', count: 150, percentage: 12 },
  { code: 'CPDE345', count: 120, percentage: 10 },
  { code: 'Others', count: 150, percentage: 12 }
];

export function MockupProductMixChartWidget({ widget, isEditMode }: WidgetComponentProps) {
  const size = widget.config.size || WidgetSize.SMALL;

  if (size === WidgetSize.SMALL) {
    return (
      <WidgetCard size={widget.config.size} widgetType={widget.type as keyof typeof WidgetStyles.borders} isEditMode={isEditMode}>
        <CardContent className="p-2 h-full flex flex-col justify-center items-center">
          <h3 className="text-xs text-slate-400 mb-1">Stock Level</h3>
          <div className="text-lg font-medium text-slate-500">(N/A)</div>
          <p className="text-xs text-slate-500 mt-1">1×1</p>
        </CardContent>
      </WidgetCard>
    );
  }

  if (size === WidgetSize.MEDIUM) {
    return (
      <WidgetCard size={widget.config.size} widgetType={widget.type as keyof typeof WidgetStyles.borders} isEditMode={isEditMode}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                <ChartPieIcon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-sm font-medium text-slate-200">Stock Level</h3>
            </div>
            <select className="px-2 py-1 bg-white/5 border border-slate-600/30 rounded-md text-xs text-slate-300">
              <option>ALL</option>
              <option>Standard</option>
              <option>Special</option>
              <option>Premium</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-2">
            {mockData.slice(0, 5).map((product, index) => (
              <div key={product.code} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-slate-300">{product.code}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-slate-200">{product.count.toLocaleString()}</span>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-slate-700">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Total</span>
                <span className="text-slate-200">1,250 units</span>
              </div>
            </div>
          </div>
        </CardContent>
      </WidgetCard>
    );
  }

  // Large size
  return (
    <WidgetCard size={widget.config.size} widgetType={widget.type as keyof typeof WidgetStyles.borders} isEditMode={isEditMode}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
              <ChartPieIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-medium bg-gradient-to-r from-orange-300 via-amber-300 to-orange-200 bg-clip-text text-transparent">
              Stock Level Distribution
            </h3>
          </div>
          <select className="px-3 py-1 bg-white/5 border border-slate-600/30 rounded-md text-sm text-slate-300">
            <option>ALL</option>
            <option>Standard</option>
            <option>Special</option>
            <option>Premium</option>
          </select>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col h-[calc(100%-4rem)]">
        {/* Product list */}
        <div className="h-[33.33%] bg-black/20 rounded-lg p-3 mb-3 overflow-hidden">
          <div className="h-full overflow-y-auto pr-2">
            <div className="space-y-1">
              {mockData.map((product, index) => (
                <div key={product.code} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-xs text-slate-300">{product.code}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-200">{product.count.toLocaleString()}</span>
                    <span className="text-xs text-slate-400 ml-1">({product.percentage}%)</span>
                  </div>
                </div>
              ))}
              <div className="pt-1 border-t border-slate-700">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total</span>
                  <span className="font-semibold text-slate-200">1,250 units</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Pie chart */}
        <div className="h-[66.67%]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={mockData}
                cx="50%"
                cy="50%"
                labelLine={{ stroke: '#94A3B8', strokeWidth: 1 }}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index, name }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = 25 + innerRadius + (outerRadius - innerRadius);
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  const percentage = mockData[index].percentage;

                  return (
                    <text
                      x={x}
                      y={y}
                      fill="#94A3B8"
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="central"
                      className="text-[10px]"
                    >
                      {`${name} (${percentage}%)`}
                    </text>
                  );
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                nameKey="code"
              >
                {mockData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </WidgetCard>
  );
}