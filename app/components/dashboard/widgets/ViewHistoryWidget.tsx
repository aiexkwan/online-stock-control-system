/**
 * View History Widget
 * 2x2: 顯示今日查詢次數
 * 4x4: 顯示最近查詢記錄
 * 6x6: 顯示查詢統計圖表和搜尋功能
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClockIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDialog } from '@/app/contexts/DialogContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { getTodayRange, getDateRange, formatDbTime } from '@/app/utils/timezone';

interface HistoryStats {
  today_queries: number;
  week_queries: number;
  total_queries: number;
  popular_searches: Array<{ plt_num: string; count: number }>;
}

interface RecentSearch {
  id: string;
  plt_num: string;
  searched_at: string;
  searched_by: string;
}

interface HistoryRecord {
  uuid: string;
  time: string;
  action: string;
  plt_num: string;
  loc: string;
  remark: string;
}

// 最近活動列表組件
function RecentActivityList() {
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadRecentActivity();
  }, []);

  const loadRecentActivity = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('record_history')
        .select('*')
        .order('time', { ascending: false })
        .limit(10);

      if (error) throw error;
      setHistoryRecords(data || []);
    } catch (error) {
      console.error('Error loading recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-14 bg-slate-700/30 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (historyRecords.length === 0) {
    return (
      <div className="text-center py-6 text-slate-500">
        <ClockIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p>No history records</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-52 overflow-y-auto">
      {historyRecords.map((record) => (
        <div key={record.uuid} className="bg-slate-700/30 rounded-lg p-3 hover:bg-slate-700/40 transition-colors">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium text-white">{record.plt_num}</div>
              <div className="text-sm text-slate-400">{record.action} • {record.loc}</div>
              {record.remark && (
                <div className="text-xs text-slate-500 mt-1">{record.remark}</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">{formatDbTime(record.time, 'MMM dd')}</div>
              <div className="text-xs text-slate-500">{formatDbTime(record.time, 'HH:mm')}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ViewHistoryWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [stats, setStats] = useState<HistoryStats>({
    today_queries: 0,
    week_queries: 0,
    total_queries: 0,
    popular_searches: []
  });
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = createClient();
  const { openDialog } = useDialog();
  
  const size = widget.config.size || WidgetSize.MEDIUM;

  // 載入歷史查詢統計
  const loadHistoryStats = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 7);

      // 獲取查詢統計（這裡假設有一個查詢記錄表，實際可能需要調整）
      const [todayResult, weekResult, totalResult] = await Promise.all([
        supabase.from('record_transfer').select('*', { count: 'exact', head: true }).gte('updated_at', todayStart),
        supabase.from('record_transfer').select('*', { count: 'exact', head: true }).gte('updated_at', weekStart.toISOString()),
        supabase.from('record_transfer').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        today_queries: todayResult.count || 0,
        week_queries: weekResult.count || 0,
        total_queries: totalResult.count || 0,
        popular_searches: []
      });

      // 如果是 MEDIUM 或 LARGE size，載入最近的查詢記錄
      if (size !== WidgetSize.SMALL) {
        const { data: transferData } = await supabase
          .from('record_transfer')
          .select('transfer_id, plt_num, updated_at, location_to')
          .order('updated_at', { ascending: false })
          .limit(size === WidgetSize.MEDIUM ? 5 : 10);

        const searches = (transferData || []).map(item => ({
          id: item.transfer_id.toString(),
          plt_num: item.plt_num,
          searched_at: item.updated_at,
          searched_by: item.location_to
        }));

        setRecentSearches(searches);
      }

      // 如果是 LARGE size，載入圖表資料
      if (size === WidgetSize.LARGE) {
        const { data: chartHistoryData } = await supabase
          .from('record_transfer')
          .select('updated_at')
          .gte('updated_at', weekStart.toISOString())
          .order('updated_at', { ascending: true });

        // 按日期分組統計
        const groupedData = (chartHistoryData || []).reduce((acc: any, record) => {
          const date = format(new Date(record.updated_at), 'MM/dd');
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
      console.error('Error loading history statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistoryStats();
    
    // 設置自動刷新
    const interval = setInterval(loadHistoryStats, widget.config.refreshInterval || 60000);
    return () => clearInterval(interval);
  }, [size]);

  const handleOpenHistoryDialog = () => {
    openDialog('viewHistory');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      openDialog('viewHistory');
    }
  };

  // 2x2 - 只顯示數值
  if (size === WidgetSize.SMALL) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <Card className="h-full bg-slate-800/40 backdrop-blur-xl border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 cursor-pointer" onClick={handleOpenHistoryDialog}>
          <CardContent className="p-4 h-full flex flex-col items-center justify-center">
            <ClockIcon className="w-8 h-8 text-blue-400 mb-2" />
            <div className="text-3xl font-bold text-white">{stats.today_queries}</div>
            <div className="text-xs text-slate-400 mt-1">Today's Queries</div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // 4x4 - 顯示資料明細
  if (size === WidgetSize.MEDIUM) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <Card className="h-full bg-slate-800/40 backdrop-blur-xl border-blue-500/30 hover:border-blue-400/50 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-blue-400" />
                <span className="text-lg">View History</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleOpenHistoryDialog}
                className="text-blue-400 hover:text-blue-300"
              >
                Search
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 統計摘要 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="text-2xl font-bold text-white">{stats.today_queries}</div>
                <div className="text-xs text-slate-400">Today</div>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="text-2xl font-bold text-white">{stats.week_queries}</div>
                <div className="text-xs text-slate-400">This Week</div>
              </div>
            </div>

            {/* 最近查詢記錄 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-400">Recent Searches</h4>
              {loading ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-slate-700/30 rounded-lg"></div>
                  ))}
                </div>
              ) : recentSearches.length === 0 ? (
                <div className="text-center py-4 text-slate-500">No recent searches</div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {recentSearches.map((search) => (
                    <div key={search.id} className="bg-slate-700/30 rounded-lg p-2 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-white">{search.plt_num}</div>
                          <div className="text-slate-400">To: {search.searched_by}</div>
                        </div>
                        <div className="text-slate-500 text-right">
                          <div>{format(new Date(search.searched_at), 'MM/dd')}</div>
                          <div>{format(new Date(search.searched_at), 'HH:mm')}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // 6x6 - 顯示圖表統計和搜尋功能
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <Card className="h-full bg-slate-800/40 backdrop-blur-xl border-blue-500/30 hover:border-blue-400/50 transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-6 h-6 text-blue-400" />
              <span className="text-xl">Pallet History</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 搜尋欄 */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter pallet number..."
              className="flex-1 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
            />
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <MagnifyingGlassIcon className="w-4 h-4" />
            </Button>
          </form>


          {/* 最近活動列表 - 從 record_history 取資料 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-400">Recent Activity</h4>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleOpenHistoryDialog}
                className="text-blue-400 hover:text-blue-300 text-xs"
              >
                View All
              </Button>
            </div>
            <RecentActivityList />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}