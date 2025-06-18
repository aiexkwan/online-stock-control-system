/**
 * Void Pallet Widget
 * 1x1: 顯示作廢總數
 * 3x3: 顯示最近作廢記錄列表
 * 5x5: 顯示作廢統計圖表和詳細列表
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { NoSymbolIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WidgetCard } from '../WidgetCard';
import { Button } from "@/components/ui/button";
import { useDialog } from '@/app/contexts/DialogContext';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import { WidgetStyles } from '@/app/utils/widgetStyles';

interface VoidRecord {
  void_id: number;
  plt_num: string;
  void_date: string;
  void_reason: string;
  voided_by: string;
  product_code?: string;
  quantity?: number;
}

interface VoidStats {
  total_voided: number;
  today_voided: number;
  this_week_voided: number;
  this_month_voided: number;
}

export function VoidPalletWidget({ widget, isEditMode }: WidgetComponentProps) {
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
  
  const size = widget.config.size || WidgetSize.MEDIUM;

  // 載入作廢統計資料
  const loadVoidStats = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 7);
      
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

      // 獲取總數和不同時間範圍的統計
      const [totalResult, todayResult, weekResult, monthResult] = await Promise.all([
        supabase.from('record_void').select('*', { count: 'exact', head: true }),
        supabase.from('record_void').select('*', { count: 'exact', head: true }).gte('void_date', todayStart),
        supabase.from('record_void').select('*', { count: 'exact', head: true }).gte('void_date', weekStart.toISOString()),
        supabase.from('record_void').select('*', { count: 'exact', head: true }).gte('void_date', monthStart)
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
          .from('record_void')
          .select('*')
          .order('void_date', { ascending: false })
          .limit(size === WidgetSize.MEDIUM ? 5 : 10);

        setRecentVoids(voidData || []);
      }

      // 如果是 LARGE size，載入圖表資料
      if (size === WidgetSize.LARGE) {
        const { data: chartVoidData } = await supabase
          .from('record_void')
          .select('void_date')
          .gte('void_date', weekStart.toISOString())
          .order('void_date', { ascending: true });

        // 按日期分組統計
        const groupedData = (chartVoidData || []).reduce((acc: any, record) => {
          const date = format(new Date(record.void_date), 'MM/dd');
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
  };

  useEffect(() => {
    loadVoidStats();
    
    // 設置自動刷新
    const interval = setInterval(loadVoidStats, widget.config.refreshInterval || 60000);
    return () => clearInterval(interval);
  }, [size]);

  const handleOpenVoidDialog = () => {
    openDialog('voidPallet');
  };

  // 1x1 - 只顯示數值
  if (size === WidgetSize.SMALL) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <WidgetCard widgetType="VOID_PALLET" isEditMode={isEditMode}>
          <CardContent className="p-4 h-full flex flex-col items-center justify-center">
            <NoSymbolIcon className="w-8 h-8 text-red-400 mb-2" />
            <div className="text-3xl font-bold text-purple-400">{stats.today_voided}</div>
            <div className="text-xs text-slate-400 mt-1">Today's Voids</div>
          </CardContent>
        </WidgetCard>
      </motion.div>
    );
  }

  // 3x3 - 顯示資料明細
  if (size === WidgetSize.MEDIUM) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <WidgetCard widgetType="VOID_PALLET" isEditMode={isEditMode} className="hover:border-orange-400/50 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <NoSymbolIcon className="w-5 h-5 text-red-400" />
              <span className="text-lg">Void Pallets</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 統計摘要 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="text-2xl font-bold text-purple-400">{stats.today_voided}</div>
                <div className="text-xs text-slate-400">Today</div>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="text-2xl font-bold text-purple-400">{stats.this_week_voided}</div>
                <div className="text-xs text-slate-400">This Week</div>
              </div>
            </div>

            {/* 最近作廢記錄 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-400">Recent Voids</h4>
              {loading ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-slate-700/30 rounded-lg"></div>
                  ))}
                </div>
              ) : recentVoids.length === 0 ? (
                <div className="text-center py-4 text-slate-500">No recent voids</div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {recentVoids.map((record) => (
                    <div key={record.void_id} className="bg-slate-700/30 rounded-lg p-2 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-purple-400">{record.plt_num}</div>
                          <div className="text-purple-300">{record.void_reason}</div>
                        </div>
                        <div className="text-purple-300 text-right">
                          <div>{format(new Date(record.void_date), 'MM/dd')}</div>
                          <div>{format(new Date(record.void_date), 'HH:mm')}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </WidgetCard>
      </motion.div>
    );
  }

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
        <CardContent className="space-y-4">
          {/* 統計卡片 */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-lg p-3 border border-red-500/30">
              <div className="text-2xl font-bold text-purple-400">{stats.total_voided}</div>
              <div className="text-xs text-red-300">Total Voided</div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-400">{stats.today_voided}</div>
              <div className="text-xs text-slate-400">Today</div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-400">{stats.this_week_voided}</div>
              <div className="text-xs text-slate-400">This Week</div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-400">{stats.this_month_voided}</div>
              <div className="text-xs text-slate-400">This Month</div>
            </div>
          </div>

          {/* 圖表 */}
          {chartData.length > 0 && (
            <div className="bg-slate-700/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-400 mb-3">7-Day Trend</h4>
              <ResponsiveContainer width="100%" height={200}>
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
            </div>
          )}

          {/* 詳細列表 */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-400">Recent Void Records</h4>
            {loading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-16 bg-slate-700/30 rounded-lg"></div>
                ))}
              </div>
            ) : recentVoids.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No void records found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentVoids.map((record) => (
                  <div key={record.void_id} className="bg-slate-700/30 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-purple-400">{record.plt_num}</span>
                          {record.product_code && (
                            <span className="text-xs bg-slate-600/50 px-2 py-1 rounded text-purple-300">
                              {record.product_code}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-purple-300 mt-1">{record.void_reason}</div>
                        <div className="text-xs text-purple-200 mt-1">By: {record.voided_by}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-purple-300">{format(new Date(record.void_date), 'MMM dd')}</div>
                        <div className="text-xs text-purple-200">{format(new Date(record.void_date), 'HH:mm')}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </WidgetCard>
    </motion.div>
  );
}