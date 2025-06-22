/**
 * Responsive Recent Activity Widget
 * 根據大小顯示不同數量的活動記錄
 */

'use client';

import React, { useState, useCallback, useEffect, memo, useRef } from 'react';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { ResponsiveWidgetWrapper } from '../ResponsiveWidgetWrapper';
import { ContentLevel } from '@/app/admin/types/widgetContentLevel';
import { Clock, Package, User, Truck, CheckCircle, RefreshCw, Activity, AlertCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/app/utils/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useAdminRefresh } from '@/app/admin/contexts/AdminRefreshContext';

interface ActivityData {
  id: string;
  time: string;
  action: string;
  plt_num: string | null;
  loc: string | null;
  remark: string | null;
  formattedTime?: string;
}

// 活動類型映射
const getActivityIcon = React.memo((action: string) => {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('transfer') || actionLower.includes('move')) return Truck;
  if (actionLower.includes('void') || actionLower.includes('damage')) return AlertCircle;
  if (actionLower.includes('production') || actionLower.includes('finish')) return CheckCircle;
  if (actionLower.includes('update') || actionLower.includes('edit')) return RefreshCw;
  if (actionLower.includes('scan') || actionLower.includes('check')) return Package;
  return Activity;
});;

const getActivityColor = (action: string) => {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('transfer') || actionLower.includes('move')) return 'text-blue-500';
  if (actionLower.includes('void') || actionLower.includes('damage')) return 'text-red-500';
  if (actionLower.includes('production') || actionLower.includes('finish')) return 'text-green-500';
  if (actionLower.includes('update') || actionLower.includes('edit')) return 'text-yellow-500';
  return 'text-gray-400';
};

const ResponsiveRecentActivityWidget = memo<WidgetComponentProps>(({ widget, isEditMode }) => {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { refreshTrigger } = useAdminRefresh();

  // Get date range based on time range selection
  const getDateRange = useCallback(() => {
    const now = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case '1h':
        start.setHours(now.getHours() - 1);
        break;
      case '6h':
        start.setHours(now.getHours() - 6);
        break;
      case '24h':
        start.setDate(now.getDate() - 1);
        break;
      case '7d':
        start.setDate(now.getDate() - 7);
        break;
    }
    
    return start.toISOString();
  }, [timeRange]);

  // 載入活動數據
  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      const startDate = getDateRange();
      
      // 查詢最近的活動記錄
      const { data, error: queryError } = await supabase
        .from('record_history')
        .select('*')
        .gte('time', startDate)
        .order('time', { ascending: false })
        .limit(50); // 獲取更多記錄以備不同顯示級別使用

      if (queryError) throw queryError;

      if (data) {
        // 格式化數據
        const formattedActivities = data.map(record => ({
          id: record.uuid,
          time: record.time,
          action: record.action,
          plt_num: record.plt_num,
          loc: record.loc,
          remark: record.remark,
          formattedTime: formatDistanceToNow(new Date(record.time), { addSuffix: true })
        }));

        setActivities(formattedActivities);
      }

    } catch (err: any) {
      console.error('Error loading activities:', err);
      setError(err.message || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  // 初始載入和刷新觸發
  useEffect(() => {
    if (!isEditMode) {
      loadActivities();
    }
  }, [isEditMode, loadActivities, refreshTrigger, timeRange]);

  // Handle click outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <ResponsiveWidgetWrapper widget={widget} isEditMode={isEditMode}>
      {(level) => {
        // 根據級別決定顯示多少項
        const getItemCount = () => {
          switch (level) {
            case ContentLevel.MINIMAL: return 0;
            case ContentLevel.COMPACT: return 3;
            case ContentLevel.STANDARD: return 5;
            case ContentLevel.DETAILED: return 10;
            case ContentLevel.FULL: return 15;
            default: return 3;
          }
        };

        const itemCount = getItemCount();
        const displayActivities = activities.slice(0, itemCount);

        // MINIMAL - 只顯示計數
        if (level === ContentLevel.MINIMAL) {
          return (
            <div className="flex items-center justify-center h-full">
              {loading ? (
                <div className="h-8 w-16 bg-white/10 rounded animate-pulse"></div>
              ) : error ? (
                <span className="text-red-400 text-xs">Error</span>
              ) : (
                <div className="text-center">
                  <Activity className="w-6 h-6 text-purple-500 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-white">{activities.length}</div>
                  <div className="text-xs text-gray-400 mt-1">Activities</div>
                </div>
              )}
            </div>
          );
        }

        // COMPACT - 簡單列表
        if (level === ContentLevel.COMPACT) {
          return (
            <div className="flex flex-col h-full p-3">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-purple-500" />
                <h3 className="text-sm text-gray-400">Recent Activity</h3>
              </div>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 w-full bg-white/10 rounded animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse"></div>
                  <div className="h-4 w-5/6 bg-white/10 rounded animate-pulse"></div>
                </div>
              ) : error ? (
                <span className="text-red-400 text-xs">{error}</span>
              ) : (
                <div className="flex-1 space-y-1 overflow-hidden">
                  {displayActivities.length > 0 ? (
                    displayActivities.map((activity) => (
                      <div key={activity.id} className="text-xs text-gray-300 truncate">
                        • {activity.action}
                        {activity.plt_num && <span className="text-gray-500"> - {activity.plt_num}</span>}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500 text-center py-2">No recent activities</div>
                  )}
                </div>
              )}
            </div>
          );
        }

        // STANDARD - 帶圖標的列表
        if (level === ContentLevel.STANDARD) {
          return (
            <div className="flex flex-col h-full p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-6 h-6 text-purple-500" />
                <h3 className="text-base text-gray-400">Recent Activity</h3>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex gap-2">
                      <div className="w-4 h-4 bg-white/10 rounded animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-3 w-3/4 bg-white/10 rounded animate-pulse mb-1"></div>
                        <div className="h-3 w-1/3 bg-white/10 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <span className="text-red-400 text-sm">{error}</span>
              ) : (
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {displayActivities.length > 0 ? (
                    displayActivities.map((activity) => {
                      const Icon = getActivityIcon(activity.action);
                      const color = getActivityColor(activity.action);
                      return (
                        <div key={activity.id} className="flex items-start gap-2 p-2 bg-slate-800/50 rounded">
                          <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", color)} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-300">
                              {activity.action}
                              {activity.plt_num && (
                                <span className="text-gray-500"> - PLT: {activity.plt_num}</span>
                              )}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {activity.loc && <span>📍 {activity.loc}</span>}
                              <span>{activity.formattedTime}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-4">No recent activities</div>
                  )}
                </div>
              )}
            </div>
          );
        }

        // DETAILED & FULL - 完整信息
        return (
          <div className="flex flex-col h-full p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                  <p className="text-sm text-gray-400">Operation history</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Time Range Selector */}
                <div className="relative" ref={dropdownRef} style={{ zIndex: 100 }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDropdownOpen(!isDropdownOpen);
                    }}
                    disabled={loading || isEditMode}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm",
                      isEditMode && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-white">
                      {timeRange === '1h' && 'Last hour'}
                      {timeRange === '6h' && 'Last 6 hours'}
                      {timeRange === '24h' && 'Last 24 hours'}
                      {timeRange === '7d' && 'Last 7 days'}
                    </span>
                    <ChevronDown className={cn(
                      "w-4 h-4 text-gray-400 transition-transform",
                      isDropdownOpen && "rotate-180"
                    )} />
                  </button>

                  {isDropdownOpen && (
                    <div 
                      className="absolute right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl min-w-[150px]"
                      style={{ zIndex: 1000 }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setTimeRange('1h');
                          setIsDropdownOpen(false);
                        }}
                        className={cn(
                          "block w-full px-4 py-2 text-left text-sm hover:bg-slate-800 transition-colors",
                          timeRange === '1h' && "bg-slate-800 text-purple-400"
                        )}
                      >
                        Last hour
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setTimeRange('6h');
                          setIsDropdownOpen(false);
                        }}
                        className={cn(
                          "block w-full px-4 py-2 text-left text-sm hover:bg-slate-800 transition-colors",
                          timeRange === '6h' && "bg-slate-800 text-purple-400"
                        )}
                      >
                        Last 6 hours
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setTimeRange('24h');
                          setIsDropdownOpen(false);
                        }}
                        className={cn(
                          "block w-full px-4 py-2 text-left text-sm hover:bg-slate-800 transition-colors",
                          timeRange === '24h' && "bg-slate-800 text-purple-400"
                        )}
                      >
                        Last 24 hours
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setTimeRange('7d');
                          setIsDropdownOpen(false);
                        }}
                        className={cn(
                          "block w-full px-4 py-2 text-left text-sm hover:bg-slate-800 transition-colors",
                          timeRange === '7d' && "bg-slate-800 text-purple-400"
                        )}
                      >
                        Last 7 days
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  type="button"
                  onClick={loadActivities}
                  disabled={loading}
                  className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                  Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="bg-slate-800 rounded-lg p-3 animate-pulse">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 w-3/4 bg-white/10 rounded mb-2"></div>
                        <div className="h-3 w-1/2 bg-white/10 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-red-400 text-sm">{error}</div>
            ) : (
              <div className="flex-1 space-y-3 overflow-y-auto">
                {displayActivities.length > 0 ? (
                  displayActivities.map((activity) => {
                    const Icon = getActivityIcon(activity.action);
                    const color = getActivityColor(activity.action);
                    return (
                      <div key={activity.id} className="bg-slate-800 rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded-lg bg-slate-700")}>
                            <Icon className={cn("w-4 h-4", color)} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-white font-medium">{activity.action}</p>
                            {activity.plt_num && (
                              <p className="text-xs text-gray-400 mt-0.5">Pallet: {activity.plt_num}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1">
                              {activity.loc && (
                                <>
                                  <span className="text-xs text-gray-500">📍 {activity.loc}</span>
                                  <span className="text-xs text-gray-600">•</span>
                                </>
                              )}
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {activity.formattedTime}
                              </span>
                            </div>
                            {activity.remark && (
                              <p className="text-xs text-gray-400 mt-2 italic">&quot;{activity.remark}&quot;</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-gray-500 text-center py-8">No recent activities found</div>
                )}
              </div>
            )}
          </div>
        );
      }}
    </ResponsiveWidgetWrapper>
  );
});

ResponsiveRecentActivityWidget.displayName = 'ResponsiveRecentActivityWidget';

export default ResponsiveRecentActivityWidget;