/**
 * Pallet Overview Widget
 * 支援三種尺寸：
 * - Small: 只顯示統計數值
 * - Medium: 顯示統計和百分比
 * - Large: 完整圓環圖和時間選擇
 */

'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartPieIcon, ClockIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useWidgetData } from '@/app/admin/hooks/useWidgetData';
import { createClient } from '@/app/utils/supabase/client';
import PalletDonutChart from '@/app/components/PalletDonutChart';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardStats {
  palletsDone: number;
  palletsTransferred: number;
}

export const PalletOverviewWidget = React.memo(function PalletOverviewWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [stats, setStats] = useState<DashboardStats>({
    palletsDone: 0,
    palletsTransferred: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(widget.config.timeRange || 'Past 3 days');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);


  const calculateTransferredPallets = useCallback(async (palletNums: string[]) => {
    if (!palletNums || palletNums.length === 0) return 0;
    
    const supabase = createClient();
    const { data: transferredData } = await supabase
      .from('record_transfer')
      .select('plt_num')
      .in('plt_num', palletNums);

    const uniqueTransferredPallets = new Set(transferredData?.map(r => r.plt_num) || []);
    return uniqueTransferredPallets.size;
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const today = new Date();
      
      let startDate = new Date();
      switch (timeRange) {
        case 'Today':
          startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          break;
        case 'Yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
          const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          
          // Get yesterday's data
          const { count: yesterdayDoneCount } = await supabase
            .from('record_palletinfo')
            .select('*', { count: 'exact', head: true })
            .gte('generate_time', startDate.toISOString())
            .lt('generate_time', endDate.toISOString())
            .not('plt_remark', 'ilike', '%Material GRN-%');
          
          const { data: yesterdayPallets } = await supabase
            .from('record_palletinfo')
            .select('plt_num')
            .gte('generate_time', startDate.toISOString())
            .lt('generate_time', endDate.toISOString())
            .not('plt_remark', 'ilike', '%Material GRN-%');
          
          const transferredCount = await calculateTransferredPallets(yesterdayPallets?.map(p => p.plt_num) || []);
          
          setStats({
            palletsDone: yesterdayDoneCount || 0,
            palletsTransferred: transferredCount
          });
          return;
        case 'Past 3 days':
          startDate.setDate(today.getDate() - 3);
          break;
        case 'Past 7 days':
          startDate.setDate(today.getDate() - 7);
          break;
      }

      // Get pallets done
      const { count: doneCount } = await supabase
        .from('record_palletinfo')
        .select('*', { count: 'exact', head: true })
        .gte('generate_time', startDate.toISOString())
        .not('plt_remark', 'ilike', '%Material GRN-%');

      // Get pallets for transfer calculation
      const { data: pallets } = await supabase
        .from('record_palletinfo')
        .select('plt_num')
        .gte('generate_time', startDate.toISOString())
        .not('plt_remark', 'ilike', '%Material GRN-%');

      const transferredCount = await calculateTransferredPallets(pallets?.map(p => p.plt_num) || []);

      setStats({
        palletsDone: doneCount || 0,
        palletsTransferred: transferredCount
      });
      setError(null);
    } catch (err: any) {
      console.error('Error loading pallet stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [timeRange, calculateTransferredPallets]);

  useWidgetData({ loadFunction: loadStats, isEditMode });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange);
    setIsDropdownOpen(false);
  };

  const getPercentage = () => {
    if (stats.palletsDone === 0) return 0;
    return Math.round((stats.palletsTransferred / stats.palletsDone) * 100);
  };

  // Small size - only show numbers

  // Medium size - show stats with time range

  return (
    <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-purple-500/30 shadow-2xl ${isEditMode ? 'border-dashed border-2 border-purple-500/50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium bg-gradient-to-r from-purple-300 via-indigo-300 to-purple-200 bg-clip-text text-transparent">
            {timeRange} Overview
          </CardTitle>
          
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg transition-all duration-300 text-sm border border-slate-600/30"
              disabled={isEditMode}
            >
              <ClockIcon className="w-4 h-4" />
              {timeRange}
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-1 bg-slate-900/98 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl z-50 min-w-[140px]"
                >
                  {['Today', 'Yesterday', 'Past 3 days', 'Past 7 days'].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleTimeRangeChange(option)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-700/50 transition-all duration-300 first:rounded-t-xl last:rounded-b-xl ${
                        timeRange === option ? 'bg-slate-700/50 text-purple-400' : 'text-slate-300'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-48">
          <div className="w-40 h-40">
            <PalletDonutChart 
              palletsDone={stats.palletsDone}
              palletsTransferred={stats.palletsTransferred}
              loading={loading}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <p className="text-sm text-slate-400">Pallets Produced</p>
            <p className="text-2xl font-bold text-white">{stats.palletsDone}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <p className="text-sm text-slate-400">Pallets Transferred</p>
            <p className="text-2xl font-bold text-white">{stats.palletsTransferred}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});