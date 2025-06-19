/**
 * Recent Activity 小部件
 * 支援三種尺寸：
 * - Small (1x1): 不支援
 * - Medium (3x3): 顯示最近 10 條記錄
 * - Large (5x5): 顯示最近 15 條記錄
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetCard } from '../WidgetCard';
import { Activity, Package2, TruckIcon } from 'lucide-react';
import { DocumentArrowDownIcon, ClipboardDocumentListIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { createClient } from '@/app/utils/supabase/client';
import { dialogStyles, iconColors } from '@/app/utils/dialogStyles';
import { format } from 'date-fns';
import { fromDbTime } from '@/app/utils/timezone';
import { WidgetTitle, WidgetText, WidgetLabel } from '../WidgetTypography';

interface ActivityItem {
  time: string;
  action: string;
  id: string;
  userName?: string;
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
        return <Package2 className={`h-2 w-2 ${iconColors.green}`} />;
      case 'Stock Transfer':
        return <TruckIcon className={`h-2 w-2 ${iconColors.blue}`} />;
      case 'GRN Receiving':
        return <DocumentArrowDownIcon className={`h-2 w-2 ${iconColors.purple}`} />;
      case 'Order Load':
        return <ClipboardDocumentListIcon className={`h-2 w-2 ${iconColors.orange}`} />;
      default:
        return <Activity className={`h-2 w-2 ${iconColors.cyan}`} />;
    }
  };

  const loadActivities = useCallback(async (loadMore = false) => {
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
        // 獲取所有唯一的 ID
        const userIds = [...new Set(data.map(record => record.id).filter(id => id))];
        
        // 批量查詢用戶名稱
        let userMap = new Map();
        if (userIds.length > 0) {
          const { data: users, error: userError } = await supabase
            .from('data_id')
            .select('id, name')
            .in('id', userIds);
          
          if (userError) {
            console.error('Error loading user names:', userError);
          } else if (users) {
            users.forEach(user => {
              userMap.set(String(user.id), user.name);
            });
          }
        }
        
        const formattedActivities: ActivityItem[] = data.map(record => ({
          time: record.time,
          action: record.action,
          id: record.id || '',
          userName: userMap.get(String(record.id)) || `User ${record.id || 'Unknown'}`,
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
  }, [page, itemsPerPage, activities.length]);

  useEffect(() => {
    if (!isEditMode) {
      loadActivities();
    }
  }, [loadActivities, isEditMode]);


  const formatTime = (timestamp: string) => {
    try {
      const date = fromDbTime(timestamp);
      // 在 3x3 模式下使用更精簡的時間格式
      if (size === WidgetSize.MEDIUM) {
        return format(date, 'MM/dd HH:mm');
      }
      return format(date, 'MMM dd HH:mm');
    } catch {
      return 'Unknown';
    }
  };
  
  // Small size (1x1) - 不支援
  if (size === WidgetSize.SMALL) {
    return (
      <WidgetCard size={widget.config.size} widgetType="RECENT_ACTIVITY" isEditMode={isEditMode}>
        <CardContent className="p-2 h-full flex flex-col justify-center items-center">
          <WidgetTitle size="xs" glow="gray" className="mb-1">Recent Activity</WidgetTitle>
          <WidgetText size="large" glow="gray" className="font-medium">(N/A)</WidgetText>
          <WidgetLabel size="xs" glow="gray" className="mt-1">1×1</WidgetLabel>
        </CardContent>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard size={widget.config.size} widgetType="RECENT_ACTIVITY" isEditMode={isEditMode}>
      <div className="h-full flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <WidgetTitle size="small" glow="blue" className="bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text text-transparent">
                Recent Activity
              </WidgetTitle>
            </div>
            {activities.length > 0 && (
              <WidgetLabel size="xs" glow="gray">
                Showing {activities.length} records
              </WidgetLabel>
            )}
          </div>
        </CardHeader>
        <CardContent className={`flex-1 overflow-hidden relative ${size === WidgetSize.MEDIUM ? 'px-2 pb-2' : 'px-4 pb-4'}`}>
        {loading && activities.length === 0 ? (
          <div className="space-y-3">
            {[...Array(size === WidgetSize.LARGE ? 6 : 4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-white/10 rounded-full"></div>
                  <div className="flex-1 h-4 bg-white/10 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <WidgetText size="xs" glow="red" className="text-center py-4">{error}</WidgetText>
        ) : activities.length === 0 ? (
          <WidgetText size="xs" glow="gray" className="text-center py-8">
            No recent activities
          </WidgetText>
        ) : (
          <div className="h-full flex flex-col overflow-hidden">
            {/* 欄位標題 - 固定在頂部 */}
            <div className="sticky top-0 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 pb-1 mb-1 z-10">
              <div className="flex items-center gap-1 px-1">
                <div className="w-4"></div>
                <div className={`flex-1 grid ${size === WidgetSize.LARGE ? 'grid-cols-[90px_100px_70px_90px_1fr]' : 'grid-cols-[55px_50px_55px_55px]'} gap-1`}>
                  <WidgetLabel size="xs" glow="purple" className="font-medium text-[10px]">Time</WidgetLabel>
                  <WidgetLabel size="xs" glow="purple" className="font-medium text-[10px]">Action</WidgetLabel>
                  <WidgetLabel size="xs" glow="purple" className="font-medium text-[10px]">Name</WidgetLabel>
                  <WidgetLabel size="xs" glow="purple" className="font-medium text-[10px]">Pallet No.</WidgetLabel>
                  {size === WidgetSize.LARGE && (
                    <WidgetLabel size="xs" glow="purple" className="font-medium text-[10px]">Remark</WidgetLabel>
                  )}
                </div>
              </div>
            </div>
            
            {/* 活動列表 */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-1">
              {activities.map((activity, index) => (
                <div
                  key={`${activity.time}-${activity.plt_num}-${index}`}
                  className="flex items-center gap-1 p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-black/20 flex items-center justify-center">
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`grid ${size === WidgetSize.LARGE ? 'grid-cols-[90px_100px_70px_90px_1fr]' : 'grid-cols-[55px_50px_55px_55px]'} gap-1 items-center`}>
                      <WidgetText size="xs" glow="subtle" className="truncate text-[10px]">{formatTime(activity.time)}</WidgetText>
                      <WidgetText size="xs" glow="purple" className="font-medium truncate text-[10px]">
                        {size === WidgetSize.MEDIUM ? 
                          activity.action.replace('Finished QC', 'Finished').replace('Stock Transfer', 'Transfer').replace('GRN Receiving', 'GRN').replace('Order Load', 'Load') 
                          : activity.action}
                      </WidgetText>
                      <WidgetText size="xs" glow="subtle" className="truncate text-[10px]">{activity.userName || '-'}</WidgetText>
                      <WidgetText size="xs" glow="subtle" className="truncate text-[10px]">{activity.plt_num || '-'}</WidgetText>
                      {size === WidgetSize.LARGE && (
                        <WidgetText size="xs" glow="subtle" className="italic truncate text-[10px]">{activity.remark || '-'}</WidgetText>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* 加載更多按鈕 */}
              {hasMore && !loading && (
                <button
                  onClick={() => loadActivities(true)}
                  className="w-full py-1 transition-colors"
                  disabled={isEditMode}
                >
                  <WidgetText size="xs" glow="blue" className="hover:brightness-125">
                    Load more...
                  </WidgetText>
                </button>
              )}
            </div>
          </div>
        )}
        </CardContent>
      </div>
    </WidgetCard>
  );
}