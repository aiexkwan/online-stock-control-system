/**
 * Recent Activity 小部件
 * 支援三種尺寸：
 * - Small (2x2): 不支援
 * - Medium (4x4): 顯示最近 10 條記錄
 * - Large (6x6): 顯示最近 15 條記錄
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Package2, TruckIcon } from 'lucide-react';
import { DocumentArrowDownIcon, ClipboardDocumentListIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { createClient } from '@/app/utils/supabase/client';
import { dialogStyles, iconColors } from '@/app/utils/dialogStyles';
import { format } from 'date-fns';
import { fromDbTime } from '@/app/utils/timezone';

interface ActivityItem {
  time: string;
  action: string;
  id: string;
  plt_num: string;
  remark?: string;
  icon?: React.ReactNode;
}

export function RecentActivityWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const size = widget.config.size || WidgetSize.MEDIUM;
  const itemsPerPage = size === WidgetSize.LARGE ? 15 : 10;
  
  // 根據 action 類型返回對應的圖標
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Finished QC':
        return <Package2 className={`h-4 w-4 ${iconColors.green}`} />;
      case 'Stock Transfer':
        return <TruckIcon className={`h-4 w-4 ${iconColors.blue}`} />;
      case 'GRN Receiving':
        return <DocumentArrowDownIcon className={`h-4 w-4 ${iconColors.purple}`} />;
      case 'Order Load':
        return <ClipboardDocumentListIcon className={`h-4 w-4 ${iconColors.orange}`} />;
      default:
        return <Activity className={`h-4 w-4 ${iconColors.cyan}`} />;
    }
  };

  useEffect(() => {
    loadActivities();
    
    // 設置自動刷新
    if (widget.config.refreshInterval && !isEditMode) {
      const interval = setInterval(loadActivities, widget.config.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [widget.config, size, isEditMode]);

  const loadActivities = async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
        setPage(0);
      }
      
      const supabase = createClient();
      const offset = loadMore ? page * itemsPerPage : 0;
      
      // 查詢 record_history 表，只顯示指定的 action 類型
      const { data, error, count } = await supabase
        .from('record_history')
        .select('*', { count: 'exact' })
        .in('action', ['Finished QC', 'Stock Transfer', 'GRN Receiving', 'Order Load'])
        .order('time', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);
      
      if (error) throw error;
      
      if (data) {
        const formattedActivities: ActivityItem[] = data.map(record => ({
          time: record.time,
          action: record.action,
          id: record.id || '',
          plt_num: record.plt_num || '',
          remark: record.remark || '',
          icon: getActionIcon(record.action)
        }));
        
        if (loadMore) {
          setActivities(prev => [...prev, ...formattedActivities]);
          setPage(prev => prev + 1);
        } else {
          setActivities(formattedActivities);
          setPage(1);
        }
        
        // 檢查是否還有更多數據
        const totalLoaded = loadMore ? activities.length + formattedActivities.length : formattedActivities.length;
        setHasMore(count ? totalLoaded < count : false);
      }
      
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
      return format(date, 'MMM dd HH:mm');
    } catch {
      return 'Unknown';
    }
  };
  
  // Small size (2x2) - 不支援
  if (size === WidgetSize.SMALL) {
    return (
      <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-blue-500/30 shadow-2xl ${isEditMode ? 'border-dashed border-2 border-blue-500/50' : ''}`}>
        <CardContent className="p-4 h-full flex flex-col justify-center items-center">
          <ExclamationCircleIcon className="w-12 h-12 text-slate-500 mb-3" />
          <h3 className="text-sm font-medium text-slate-400 mb-1">Not Supported</h3>
          <p className="text-xs text-slate-500 text-center">
            Please resize to Medium or Large
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-blue-500/30 shadow-2xl flex flex-col ${isEditMode ? 'border-dashed border-2 border-blue-500/50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <CardTitle className={`${size === WidgetSize.LARGE ? 'text-lg' : 'text-sm'} font-medium bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text text-transparent`}>
              Recent Activity
            </CardTitle>
          </div>
          {activities.length > 0 && (
            <span className="text-xs text-slate-400">
              Showing {activities.length} records
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden px-4 pb-4">
        {loading && activities.length === 0 ? (
          <div className="space-y-3">
            {[...Array(size === WidgetSize.LARGE ? 6 : 4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-slate-700 rounded-full"></div>
                  <div className="flex-1 h-4 bg-slate-700 rounded"></div>
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
          <div className="h-full flex flex-col">
            {/* 欄位標題 */}
            <div className="border-b border-slate-700 pb-2 mb-2">
              <div className="flex items-center gap-3 px-2 text-xs font-medium text-slate-400">
                <div className="w-8"></div>
                <div className="flex-1">
                  <span className="inline-block min-w-[100px]">Time</span>
                  <span className="inline-block min-w-[120px] ml-4">Action</span>
                  <span className="inline-block min-w-[80px] ml-4">ID</span>
                  <span className="inline-block min-w-[100px] ml-4">Pallet No.</span>
                  {size === WidgetSize.LARGE && (
                    <span className="inline-block ml-4">Remark</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* 活動列表 */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-1" style={{ maxHeight: 'calc(100% - 3rem)' }}>
              {activities.map((activity, index) => (
                <div
                  key={`${activity.time}-${activity.plt_num}-${index}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center text-sm text-slate-200">
                      <span className="inline-block min-w-[100px] text-slate-400">{formatTime(activity.time)}</span>
                      <span className="inline-block min-w-[120px] ml-4 font-medium">{activity.action}</span>
                      <span className="inline-block min-w-[80px] ml-4 text-slate-300">{activity.id || '-'}</span>
                      <span className="inline-block min-w-[100px] ml-4 text-blue-400">{activity.plt_num || '-'}</span>
                      {size === WidgetSize.LARGE && (
                        <span className="inline-block ml-4 text-slate-300 italic flex-1">{activity.remark || '-'}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* 加載更多按鈕 */}
              {hasMore && !loading && (
                <button
                  onClick={() => loadActivities(true)}
                  className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  disabled={isEditMode}
                >
                  Load more...
                </button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}