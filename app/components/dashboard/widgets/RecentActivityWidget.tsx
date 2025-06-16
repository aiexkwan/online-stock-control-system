/**
 * 最近活動小部件
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Package2, TruckIcon, Users, Clock } from 'lucide-react';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { createClient } from '@/app/utils/supabase/client';
import { dialogStyles, iconColors } from '@/app/utils/dialogStyles';
import { format } from 'date-fns';
import { fromDbTime } from '@/app/utils/timezone';

interface ActivityItem {
  id: string;
  type: 'transfer' | 'qc' | 'grn' | 'order';
  description: string;
  timestamp: string;
  user?: string;
  icon?: React.ReactNode;
}

export function RecentActivityWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActivities();
    
    // 設置自動刷新
    if (widget.config.refreshInterval) {
      const interval = setInterval(loadActivities, widget.config.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [widget.config]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const activities: ActivityItem[] = [];
      
      // 獲取最近的轉移記錄
      const { data: transfers } = await supabase
        .from('record_transfer')
        .select('plt_num, f_loc, t_loc, tran_date, operator_name')
        .order('tran_date', { ascending: false })
        .limit(5);
      
      if (transfers) {
        transfers.forEach(t => {
          activities.push({
            id: `transfer-${t.plt_num}-${t.tran_date}`,
            type: 'transfer',
            description: `Pallet ${t.plt_num} moved from ${t.f_loc} to ${t.t_loc}`,
            timestamp: t.tran_date,
            user: t.operator_name,
            icon: <TruckIcon className={`h-4 w-4 ${iconColors.blue}`} />
          });
        });
      }
      
      // 獲取最近的 QC 記錄
      const { data: qcLabels } = await supabase
        .from('qc_label')
        .select('pallet_number, product_code, print_time, operator')
        .order('print_time', { ascending: false })
        .limit(3);
      
      if (qcLabels) {
        qcLabels.forEach(q => {
          activities.push({
            id: `qc-${q.pallet_number}`,
            type: 'qc',
            description: `QC Label printed for ${q.product_code}`,
            timestamp: q.print_time,
            user: q.operator,
            icon: <Package2 className={`h-4 w-4 ${iconColors.green}`} />
          });
        });
      }
      
      // 排序並取最新的活動
      activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setActivities(activities.slice(0, widget.config.maxItems || 8));
      setError(null);
    } catch (err: any) {
      console.error('Error loading activities:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = fromDbTime(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
      
      return format(date, 'MMM d, HH:mm');
    } catch {
      return 'Unknown';
    }
  };

  return (
    <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl overflow-hidden ${isEditMode ? 'border-dashed border-2 border-blue-500/50' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text text-transparent flex items-center gap-2">
          <Activity className={`h-4 w-4 ${iconColors.cyan}`} />
          {widget.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 bg-slate-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-700 rounded w-3/4"></div>
                    <div className="h-2 bg-slate-700 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm text-center py-4">{error}</div>
        ) : activities.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-8">
            No recent activities
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                  {activity.icon || <Activity className="h-4 w-4 text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 line-clamp-2">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-slate-500" />
                    <span className="text-xs text-slate-500">
                      {formatTime(activity.timestamp)}
                    </span>
                    {activity.user && (
                      <>
                        <Users className="h-3 w-3 text-slate-500 ml-2" />
                        <span className="text-xs text-slate-500">
                          {activity.user}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}