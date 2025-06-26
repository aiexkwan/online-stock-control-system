/**
 * Product Mix Chart Widget - 使用統一佈局的示例
 * 展示如何使用 UnifiedWidgetLayout 組件
 */

'use client';

import React from 'react';
import { CardContent, CardHeader } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { ChartPieIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { UnifiedWidgetLayout, TableRow, ChartContainer } from '../UnifiedWidgetLayout';
import { useWidgetData } from '@/app/admin/hooks/useWidgetData';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const ProductMixChartWidget = React.memo(function ProductMixChartWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadData = React.useCallback(async () => {
    // 模擬數據載入
    setLoading(true);
    setTimeout(() => {
      setData([
        { code: 'CPDE123', count: 350, percentage: 28 },
        { code: 'CPDE456', count: 280, percentage: 22 },
        { code: 'CPDE789', count: 200, percentage: 16 },
        { code: 'CPDE012', count: 150, percentage: 12 },
        { code: 'CPDE345', count: 120, percentage: 10 },
        { code: 'Others', count: 150, percentage: 12 }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  useWidgetData({ loadFunction: loadData, isEditMode });

  // Small size (1x1)

  // Medium size (3x3) - 只有表格

  return (
    <WidgetCard widgetType="PRODUCT_MIX_CHART" isEditMode={isEditMode}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
            <ChartPieIcon className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-medium text-slate-200">Stock Level Distribution</h3>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <UnifiedWidgetLayout

          tableData={data}
          renderTableRow={(product, index) => (
            <TableRow key={product.code}>
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-xs text-slate-300">{product.code}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-200">
                  {product.count.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 ml-1">
                  ({product.percentage}%)
                </span>
              </div>
            </TableRow>
          )}
          chartContent={
            <ChartContainer>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="code"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          }
        />
      </CardContent>
    </WidgetCard>
  );
});