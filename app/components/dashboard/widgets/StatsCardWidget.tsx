/**
 * 統計卡片小部件
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Package, AlertCircle } from 'lucide-react';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { createClient } from '@/app/utils/supabase/client';
import { dialogStyles, iconColors } from '@/app/utils/dialogStyles';

interface StatsData {
  value: number | string;
  trend?: number;
  label?: string;
}

export function StatsCardWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [data, setData] = useState<StatsData>({ value: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    
    // 設置自動刷新
    if (widget.config.refreshInterval) {
      const interval = setInterval(loadData, widget.config.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [widget.config]);

  const loadData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      // 根據數據源獲取數據
      switch (widget.config.dataSource) {
        case 'total_pallets':
          const { count: palletCount } = await supabase
            .from('record_palletinfo')
            .select('*', { count: 'exact', head: true });
          
          setData({
            value: palletCount || 0,
            label: 'Total Pallets'
          });
          break;
          
        case 'today_transfers':
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const { count: transferCount } = await supabase
            .from('record_transfer')
            .select('*', { count: 'exact', head: true })
            .gte('tran_date', today.toISOString());
          
          setData({
            value: transferCount || 0,
            label: 'Today\'s Transfers'
          });
          break;
          
        case 'active_products':
          const { count: productCount } = await supabase
            .from('data_code')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');
          
          setData({
            value: productCount || 0,
            label: 'Active Products'
          });
          break;
          
        default:
          setData({
            value: widget.config.staticValue || 0,
            label: widget.config.label || 'Stats'
          });
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error loading stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = () => {
    switch (widget.config.icon) {
      case 'package':
        return <Package className={`h-4 w-4 ${iconColors.blue}`} />;
      case 'trending-up':
        return <TrendingUp className={`h-4 w-4 ${iconColors.green}`} />;
      case 'trending-down':
        return <TrendingDown className={`h-4 w-4 ${iconColors.red}`} />;
      case 'alert':
        return <AlertCircle className={`h-4 w-4 ${iconColors.yellow}`} />;
      default:
        return <Package className={`h-4 w-4 ${iconColors.blue}`} />;
    }
  };

  return (
    <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl ${isEditMode ? 'border-dashed border-2 border-blue-500/50' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text text-transparent">
          {widget.title}
        </CardTitle>
        {getIcon()}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-24"></div>
            <div className="h-4 bg-slate-700 rounded w-16 mt-2"></div>
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : (
          <>
            <div className="text-2xl font-bold text-white">{data.value}</div>
            {data.label && (
              <p className="text-xs text-slate-400">{data.label}</p>
            )}
            {data.trend !== undefined && (
              <p className={`text-xs ${data.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {data.trend > 0 ? '+' : ''}{data.trend}% from last period
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}