/**
 * Output Stats Widget - 支援 Compact 模式
 * Compact 模式下只顯示核心指標
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CubeIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useWidgetData } from '@/app/admin/hooks/useWidgetData';
import { createClient } from '@/app/utils/supabase/client';
import { getTodayRange } from '@/app/utils/timezone';
import { useAdminRefresh } from '@/app/admin/contexts/AdminRefreshContext';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OutputData {
  palletCount: number;
  productCodeCount: number;
  totalQuantity: number;
  percentageChange: number; // 相比昨天的變化百分比
}

export function OutputStatsWidgetCompact({ widget, isEditMode }: WidgetComponentProps) {
  const isCompact = widget.config?.isCompact ?? false;
  const [data, setData] = useState<OutputData>({
    palletCount: 0,
    productCodeCount: 0,
    totalQuantity: 0,
    percentageChange: 0
  });
  const [loading, setLoading] = useState(true);
  const { refreshTrigger } = useAdminRefresh();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      // 獲取今天的數據
      const today = getTodayRange();
      const { data: todayData, error: todayError } = await supabase
        .from('record_palletinfo')
        .select('plt_num, product_code, quantity')
        .gte('generate_time', today.start)
        .lt('generate_time', today.end)
        .not('plt_remark', 'ilike', '%Material GRN-%');
      
      if (todayError) throw todayError;
      
      // 計算統計數據
      const palletCount = todayData?.length || 0;
      const productCodes = new Set(todayData?.map(item => item.product_code));
      const totalQuantity = todayData?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      
      // 獲取昨天的數據來計算變化百分比
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).toISOString();
      const yesterdayEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1).toISOString();
      
      const { data: yesterdayData } = await supabase
        .from('record_palletinfo')
        .select('plt_num')
        .gte('generate_time', yesterdayStart)
        .lt('generate_time', yesterdayEnd)
        .not('plt_remark', 'ilike', '%Material GRN-%');
      
      const yesterdayCount = yesterdayData?.length || 0;
      const percentageChange = yesterdayCount > 0 
        ? ((palletCount - yesterdayCount) / yesterdayCount * 100)
        : 0;
      
      setData({
        palletCount,
        productCodeCount: productCodes.size,
        totalQuantity,
        percentageChange
      });
    } catch (err) {
      console.error('Error loading output stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      loadData();
    }
  }, [isEditMode, refreshTrigger, loadData]);

  // Compact 視圖 - 只顯示關鍵指標
  if (isCompact) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <CubeIcon className="w-5 h-5 text-orange-400" />
          <h3 className="text-sm font-medium text-white">生產統計</h3>
        </div>
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-3xl font-bold text-white">
              {data.palletCount}
            </div>
            <div className="text-sm text-slate-400 mt-1">
              今日生產
            </div>
            {data.percentageChange !== 0 && (
              <div className={cn(
                "flex items-center gap-1 mt-2 text-sm",
                data.percentageChange > 0 ? "text-green-400" : "text-red-400"
              )}>
                <ArrowTrendingUpIcon className={cn(
                  "w-4 h-4",
                  data.percentageChange < 0 && "rotate-180"
                )} />
                <span>{Math.abs(data.percentageChange).toFixed(1)}%</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 完整視圖 - 顯示詳細信息
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CubeIcon className="w-6 h-6 text-orange-400" />
          <h3 className="text-lg font-semibold text-white">生產統計</h3>
        </div>
      </div>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <div className="flex-1 space-y-4">
          {/* 主要指標 */}
          <motion.div 
            className="bg-slate-700/30 rounded-lg p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-4xl font-bold text-white">
              {data.palletCount}
            </div>
            <div className="text-sm text-slate-400 mt-1">
              Pallets 生產
            </div>
            {data.percentageChange !== 0 && (
              <div className={cn(
                "flex items-center gap-1 mt-2 text-sm",
                data.percentageChange > 0 ? "text-green-400" : "text-red-400"
              )}>
                <ArrowTrendingUpIcon className={cn(
                  "w-4 h-4",
                  data.percentageChange < 0 && "rotate-180"
                )} />
                <span>比昨天 {data.percentageChange > 0 ? '↑' : '↓'} {Math.abs(data.percentageChange).toFixed(1)}%</span>
              </div>
            )}
          </motion.div>
          
          {/* 次要指標 */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div 
              className="bg-slate-700/20 rounded-lg p-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="text-2xl font-semibold text-white">
                {data.productCodeCount}
              </div>
              <div className="text-xs text-slate-400">產品種類</div>
            </motion.div>
            
            <motion.div 
              className="bg-slate-700/20 rounded-lg p-3"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-2xl font-semibold text-white">
                {data.totalQuantity.toLocaleString()}
              </div>
              <div className="text-xs text-slate-400">總數量</div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}