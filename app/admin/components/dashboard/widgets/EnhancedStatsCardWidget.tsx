/**
 * 優化版統計卡片小部件 - 支援不同尺寸顯示
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Package, AlertCircle, Calendar } from 'lucide-react';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { useWidgetData } from '@/app/admin/hooks/useWidgetData';
import { createClient } from '@/app/utils/supabase/client';
import { dialogStyles, iconColors } from '@/app/utils/dialogStyles';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StatsData {
  value: number | string;
  trend?: number;
  label?: string;
  history?: { date: string; value: number }[];
}

export const EnhancedStatsCardWidget = React.memo(function EnhancedStatsCardWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [data, setData] = useState<StatsData>({ value: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(widget.config.timeRange || '7d');
  
  const size = widget.config.size || WidgetSize.MEDIUM;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      // 根據數據源獲取數據
      switch (widget.config.dataSource) {
        case 'total_pallets':
          const { count: palletCount } = await supabase
            .from('record_palletinfo')
            .select('*', { count: 'exact', head: true });
          
          // 大尺寸時獲取歷史數據
          let history;
          if (size === WidgetSize.LARGE) {
            const days = parseInt(timeRange) || 7;
            const historyData = [];
            
            for (let i = days - 1; i >= 0; i--) {
              const date = new Date();
              date.setDate(date.getDate() - i);
              date.setHours(0, 0, 0, 0);
              const nextDate = new Date(date);
              nextDate.setDate(nextDate.getDate() + 1);
              
              const { count } = await supabase
                .from('record_palletinfo')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', date.toISOString())
                .lt('created_at', nextDate.toISOString());
              
              historyData.push({
                date: date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
                value: count || 0
              });
            }
            history = historyData;
          }
          
          setData({
            value: palletCount || 0,
            label: 'Total Pallets',
            trend: 5.2, // 示例趨勢
            history
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
            label: 'Today\'s Transfers',
            trend: -2.1
          });
          break;
          
        case 'active_products':
          const { count: productCount } = await supabase
            .from('data_code')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');
          
          setData({
            value: productCount || 0,
            label: 'Active Products',
            trend: 0
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
  }, [widget.config, timeRange, size]);

  useWidgetData({ loadFunction: loadData, isEditMode });


  const getIcon = () => {
    const iconClass = size === WidgetSize.SMALL ? 'h-4 w-4' : 'h-5 w-5';
    
    switch (widget.config.icon) {
      case 'package':
        return <Package className={`${iconClass} ${iconColors.blue}`} />;
      case 'trending-up':
        return <TrendingUp className={`${iconClass} ${iconColors.green}`} />;
      case 'trending-down':
        return <TrendingDown className={`${iconClass} ${iconColors.red}`} />;
      case 'alert':
        return <AlertCircle className={`${iconClass} ${iconColors.yellow}`} />;
      default:
        return <Package className={`${iconClass} ${iconColors.blue}`} />;
    }
  };

  // 小尺寸 - 只顯示數值
  if (size === WidgetSize.SMALL) {
    return (
      <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl overflow-hidden ${isEditMode ? 'border-dashed border-2 border-blue-500/50' : ''}`}>
        <CardContent className="h-full flex flex-col items-center justify-center p-4 overflow-hidden">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-slate-700 rounded w-16 mb-2"></div>
              <div className="h-4 bg-slate-700 rounded w-12"></div>
            </div>
          ) : error ? (
            <div className="text-red-400 text-xs text-center">{error}</div>
          ) : (
            <div className="text-center">
              {getIcon()}
              <div className="text-xl font-bold text-white mt-1">{data.value}</div>
              <p className="text-xs text-slate-400 truncate px-2">{data.label}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // 中尺寸 - 顯示數值、趨勢和時間選擇器
  if (size === WidgetSize.MEDIUM) {
    return (
      <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl overflow-hidden ${isEditMode ? 'border-dashed border-2 border-blue-500/50' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            {getIcon()}
            <CardTitle className="text-sm font-medium bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text text-transparent">
              {'title' in widget ? widget.title : 'Stats'}
            </CardTitle>
          </div>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-20 h-7 text-xs bg-slate-800 border-slate-700 rounded-md text-white"
          >
            <option value="1d">1D</option>
            <option value="7d">7D</option>
            <option value="30d">30D</option>
          </select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-10 bg-slate-700 rounded w-24 mb-2"></div>
              <div className="h-4 bg-slate-700 rounded w-32"></div>
            </div>
          ) : error ? (
            <div className="text-red-400 text-sm">{error}</div>
          ) : (
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-3xl font-bold text-white">{data.value}</div>
                {data.label && (
                  <p className="text-sm text-slate-400">{data.label}</p>
                )}
              </div>
              {data.trend !== undefined && (
                <div className={`flex items-center gap-1 ${data.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {data.trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="text-sm font-medium">{Math.abs(data.trend)}%</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // 大尺寸 - 完整功能包括圖表
  return (
    <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl overflow-hidden ${isEditMode ? 'border-dashed border-2 border-blue-500/50' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          {getIcon()}
          <CardTitle className="text-base font-medium bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text text-transparent">
            {'title' in widget ? widget.title : 'Stats'}
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-24 h-8 text-sm bg-slate-800 border-slate-700 rounded-md text-white"
          >
            <option value="1d">Today</option>
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
            <option value="90d">90 Days</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse">
            <div className="h-12 bg-slate-700 rounded w-32 mb-4"></div>
            <div className="h-32 bg-slate-700 rounded"></div>
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex items-baseline gap-3">
                <div className="text-4xl font-bold text-white">{data.value}</div>
                {data.trend !== undefined && (
                  <div className={`flex items-center gap-1 ${data.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {data.trend > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    <span className="text-lg font-medium">{Math.abs(data.trend)}%</span>
                  </div>
                )}
              </div>
              {data.label && (
                <p className="text-sm text-slate-400 mt-1">{data.label}</p>
              )}
            </div>
            
            {data.history && (
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#64748b"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#64748b"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
});