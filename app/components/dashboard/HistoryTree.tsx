/**
 * History Tree Component
 * 顯示系統所有操作歷史的樹狀結構
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { format } from 'date-fns';
import { 
  ChevronDownIcon, 
  ChevronRightIcon,
  ClockIcon,
  UserIcon,
  CubeIcon,
  TruckIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface HistoryItem {
  id: string;
  time: string;
  action: string;
  user_name?: string;
  plt_num?: string;
  location?: string;
  remark?: string;
  details?: any;
}

interface GroupedHistory {
  date: string;
  items: HistoryItem[];
}

export const HistoryTree: React.FC = () => {
  const [history, setHistory] = useState<GroupedHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 根據 action 類型返回對應的圖標
  const getActionIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    
    if (actionLower.includes('transfer') || actionLower.includes('move')) {
      return <TruckIcon className="w-4 h-4 text-orange-500" />;
    }
    if (actionLower.includes('receive') || actionLower.includes('grn')) {
      return <DocumentArrowDownIcon className="w-4 h-4 text-green-500" />;
    }
    if (actionLower.includes('qc') || actionLower.includes('quality')) {
      return <CubeIcon className="w-4 h-4 text-blue-500" />;
    }
    if (actionLower.includes('void') || actionLower.includes('delete')) {
      return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
    }
    return <ArrowPathIcon className="w-4 h-4 text-gray-400" />;
  };

  // 載入歷史記錄
  const loadHistory = useCallback(async () => {
    try {
      setError(null);
      const supabase = createClient();
      
      // 查詢最近的歷史記錄
      const { data, error: queryError } = await supabase
        .from('record_history')
        .select(`
          *,
          data_id!inner(user_name, clock_num)
        `)
        .order('time', { ascending: false })
        .limit(100);

      if (queryError) throw queryError;

      // 按日期分組
      const grouped = data?.reduce((acc: GroupedHistory[], item: any) => {
        const date = format(new Date(item.time), 'yyyy-MM-dd');
        
        const historyItem: HistoryItem = {
          id: item.history_id || `${item.time}-${item.action}`,
          time: item.time,
          action: item.action,
          user_name: item.data_id?.user_name,
          plt_num: item.plt_num,
          location: item.loc,
          remark: item.remark
        };

        const existingGroup = acc.find(g => g.date === date);
        if (existingGroup) {
          existingGroup.items.push(historyItem);
        } else {
          acc.push({
            date,
            items: [historyItem]
          });
        }
        
        return acc;
      }, []) || [];

      setHistory(grouped);
      
      // 默認展開今天的記錄
      const today = format(new Date(), 'yyyy-MM-dd');
      setExpandedDates(new Set([today]));
      
    } catch (err: any) {
      console.error('Error loading history:', err);
      setError(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始載入和自動刷新
  useEffect(() => {
    loadHistory();
    
    if (autoRefresh) {
      const interval = setInterval(loadHistory, 30000); // 每 30 秒刷新
      return () => clearInterval(interval);
    }
  }, [loadHistory, autoRefresh]);

  // 切換日期展開/收起
  const toggleDate = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  // 格式化時間
  const formatTime = (time: string) => {
    return format(new Date(time), 'HH:mm:ss');
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-400 text-sm text-center">
          <ExclamationTriangleIcon className="w-6 h-6 mx-auto mb-2" />
          <p>Failed to load history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 標題欄 */}
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClockIcon className="w-5 h-5 text-gray-400" />
          <h3 className="text-sm font-semibold text-white">History</h3>
        </div>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={cn(
            "p-1 rounded transition-colors",
            autoRefresh 
              ? "text-green-400 hover:bg-green-400/20" 
              : "text-gray-400 hover:bg-gray-400/20"
          )}
          title={autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
        >
          <ArrowPathIcon className={cn(
            "w-4 h-4",
            autoRefresh && "animate-spin"
          )} />
        </button>
      </div>

      {/* 歷史記錄列表 */}
      <div className="flex-1 overflow-y-auto p-2">
        {history.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            No history records found
          </div>
        ) : (
          <div className="space-y-1">
            {history.map((group) => (
              <div key={group.date} className="border border-slate-700 rounded-lg overflow-hidden">
                {/* 日期標題 */}
                <button
                  onClick={() => toggleDate(group.date)}
                  className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {expandedDates.has(group.date) ? (
                      <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-white">
                      {group.date === format(new Date(), 'yyyy-MM-dd') ? 'Today' : group.date}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {group.items.length} records
                  </span>
                </button>

                {/* 展開的記錄 */}
                {expandedDates.has(group.date) && (
                  <div className="bg-slate-900/50">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="px-3 py-2 border-t border-slate-700 hover:bg-slate-800/50 transition-colors"
                      >
                        {/* 時間和操作 */}
                        <div className="flex items-start gap-2">
                          {getActionIcon(item.action)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-500">
                                {formatTime(item.time)}
                              </span>
                              <span className="text-sm text-white font-medium">
                                {item.action}
                              </span>
                            </div>

                            {/* 詳細信息 */}
                            <div className="text-xs text-gray-400 space-y-0.5">
                              {item.user_name && (
                                <div className="flex items-center gap-1">
                                  <UserIcon className="w-3 h-3" />
                                  <span>{item.user_name}</span>
                                </div>
                              )}
                              {item.plt_num && (
                                <div className="flex items-center gap-1">
                                  <CubeIcon className="w-3 h-3" />
                                  <span className="font-mono">{item.plt_num}</span>
                                </div>
                              )}
                              {item.location && (
                                <div>Location: {item.location}</div>
                              )}
                              {item.remark && (
                                <div className="text-gray-300 mt-1">{item.remark}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};