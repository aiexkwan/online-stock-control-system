/**
 * Void Pallet Widget
 * 1x1: 顯示作廢總數
 * 3x3: 顯示最近作廢記錄列表
 * 5x5: 顯示作廢統計圖表和詳細列表
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { NoSymbolIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WidgetCard } from '../WidgetCard';
import { Button } from "@/components/ui/button";
import { useDialog } from '@/app/contexts/DialogContext';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import { WidgetStyles } from '@/app/utils/widgetStyles';
import { UnifiedWidgetLayout, TableRow, ChartContainer } from '../UnifiedWidgetLayout';
import { useWidgetData } from '@/app/admin/hooks/useWidgetData';

interface VoidRecord {
  uuid: string;
  plt_num: string;
  time: string;
  reason: string;
  damage_qty: number;
}

interface VoidStats {
  total_voided: number;
  today_voided: number;
  this_week_voided: number;
  this_month_voided: number;
}

export const VoidPalletWidget = React.memo(function VoidPalletWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [stats, setStats] = useState<VoidStats>({
    total_voided: 0,
    today_voided: 0,
    this_week_voided: 0,
    this_month_voided: 0,
  });
  const [recentVoids, setRecentVoids] = useState<VoidRecord[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { openDialog } = useDialog();
  

  // 載入作廢統計資料
  const loadVoidStats = useCallback(async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 7);
      
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

      // 獲取總數和不同時間範圍的統計
      const [totalResult, todayResult, weekResult, monthResult] = await Promise.all([
        supabase.from('report_void').select('*', { count: 'exact', head: true }),
        supabase.from('report_void').select('*', { count: 'exact', head: true }).gte('time', todayStart),
        supabase.from('report_void').select('*', { count: 'exact', head: true }).gte('time', weekStart.toISOString()),
        supabase.from('report_void').select('*', { count: 'exact', head: true }).gte('time', monthStart)
      ]);

      setStats({
        total_voided: totalResult.count || 0,
        today_voided: todayResult.count || 0,
        this_week_voided: weekResult.count || 0,
        this_month_voided: monthResult.count || 0
      });

      // 如果是 MEDIUM 或 LARGE size，載入最近的作廢記錄
      if (size !== WidgetSize.SMALL) {
        const { data: voidData } = await supabase
          .from('report_void')
          .select('*')
          .order('time', { ascending: false })
          .limit(size === WidgetSize.MEDIUM ? 5 : 10);

        setRecentVoids(voidData || []);
      }

      // 如果是 LARGE size，載入圖表資料
      if (size === WidgetSize.LARGE) {
        const { data: chartVoidData } = await supabase
          .from('report_void')
          .select('time')
          .gte('time', weekStart.toISOString())
          .order('time', { ascending: true });

        // 按日期分組統計
        const groupedData = (chartVoidData || []).reduce((acc: any, record) => {
          const date = format(new Date(record.time), 'MM/dd');
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        const chartArray = Object.entries(groupedData).map(([date, count]) => ({
          date,
          count
        }));

        setChartData(chartArray);
      }

    } catch (error) {
      console.error('Error loading void statistics:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useWidgetData({ loadFunction: loadVoidStats, isEditMode });

  const handleOpenVoidDialog = () => {
    openDialog('voidPallet');
  };

  // 1x1 - 只顯示數值

  // 3x3 - 顯示資料明細

  // 5x5 - 顯示圖表統計
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <WidgetCard widgetType="VOID_PALLET" isEditMode={isEditMode} className="hover:border-red-400/50 transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <NoSymbolIcon className="w-6 h-6 text-red-400" />
            <span className="text-xl">Void Pallet Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0">
          <UnifiedWidgetLayout

            tableData={recentVoids}
            renderTableRow={(record) => (
              <TableRow key={record.uuid}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-purple-400 text-xs">{record.plt_num}</span>
                    {record.damage_qty > 0 && (
                      <span className="text-xs bg-slate-600/50 px-1.5 py-0.5 rounded text-purple-300">
                        Qty: {record.damage_qty}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-purple-300 mt-0.5">{record.reason}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-purple-300">{format(new Date(record.time), 'MMM dd')}</div>
                  <div className="text-xs text-purple-200">{format(new Date(record.time), 'HH:mm')}</div>
                </div>
              </TableRow>
            )}
            chartContent={
              chartData.length > 0 ? (
                <ChartContainer title="7-Day Trend">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                        labelStyle={{ color: '#9CA3AF' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#EF4444" 
                        strokeWidth={2}
                        dot={{ fill: '#EF4444', r: 4 }}
                        name="Voids"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No data for chart</p>
                  </div>
                </div>
              )
            }
          />
        </CardContent>
      </WidgetCard>
    </motion.div>
  );
});