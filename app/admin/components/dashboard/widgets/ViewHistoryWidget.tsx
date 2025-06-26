/**
 * View History Widget
 * 1x1: 顯示今日查詢次數
 * 3x3: 顯示最近查詢記錄
 * 5x5: 顯示查詢統計圖表和搜尋功能
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ClockIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDbTime } from '@/app/utils/timezone';
import { WidgetStyles } from '@/app/utils/widgetStyles';

interface HistoryRecord {
  uuid: string;
  time: string;
  action: string;
  plt_num: string;
  loc: string;
  remark: string;
}

// 搜尋結果列表組件
interface SearchResultsListProps {
  searchQuery: string;
}

function SearchResultsList({ searchQuery }: SearchResultsListProps) {
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const supabase = createClient();

  const searchPalletHistory = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      setSearched(true);
      
      let palletNumbers: string[] = [];
      
      // 判斷輸入類型
      if (searchQuery.includes('-') && !searchQuery.includes('/')) {
        // 輸入是 pallet series (例如: 140625-40X973)
        const { data: palletData, error: palletError } = await supabase
          .from('record_palletinfo')
          .select('plt_num')
          .eq('series', searchQuery);
        
        if (palletError) throw palletError;
        
        if (palletData && palletData.length > 0) {
          palletNumbers = palletData.map(p => p.plt_num);
        }
      } else if (searchQuery.includes('/')) {
        // 輸入是 pallet number (例如: 140625/4)
        palletNumbers = [searchQuery];
      }
      // 不支援部分關鍵字搜尋
      
      // 搜尋 record_history 中相關記錄
      if (palletNumbers.length > 0) {
        const { data: historyData, error: historyError } = await supabase
          .from('record_history')
          .select('*')
          .in('plt_num', palletNumbers)
          .order('time', { ascending: false });
        
        if (historyError) throw historyError;
        
        setHistoryRecords(historyData || []);
      } else {
        setHistoryRecords([]);
      }
    } catch (error) {
      console.error('Error searching pallet history:', error);
      setHistoryRecords([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, supabase]);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchPalletHistory();
    } else {
      setHistoryRecords([]);
      setSearched(false);
    }
  }, [searchQuery, searchPalletHistory]);

  if (!searched) {
    return (
      <div className="text-center py-8 text-slate-500">
        <MagnifyingGlassIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p>Enter complete pallet number or series to search</p>
        <p className="text-xs mt-2 text-slate-600">
          Examples: 140625/4 or 140625-40X973
        </p>
      </div>
    );
  }

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
        <p>No history found for &quot;{searchQuery}&quot;</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-2 pr-1">
      {historyRecords.map((record) => (
        <div key={record.uuid} className="bg-slate-700/30 rounded-lg p-3 hover:bg-slate-700/40 transition-colors">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-purple-400">{record.plt_num}</span>
                <span className="text-sm text-purple-300">• {record.action}</span>
              </div>
              <div className="text-sm text-purple-300 mt-1">Location: {record.loc || 'N/A'}</div>
              {record.remark && (
                <div className="text-xs text-purple-200 mt-1">Remark: {record.remark}</div>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-sm text-purple-300">{formatDbTime(record.time, 'MMM dd, yyyy')}</div>
              <div className="text-xs text-purple-200">{formatDbTime(record.time, 'HH:mm:ss')}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export const ViewHistoryWidget = React.memo(function ViewHistoryWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 搜尋由 SearchResultsList 組件自動處理
  };

  // 1x1 - 不支援

  // 3x3 - 不支援

  // 5x5 - 顯示 Pallet History 搜尋功能
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <WidgetCard widgetType="VIEW_HISTORY" isEditMode={isEditMode} className="hover:border-blue-400/50 transition-all duration-300 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <ClockIcon className="w-6 h-6 text-blue-400" />
            <span className="text-xl">View Pallet History</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-3 overflow-hidden">
          {/* 搜尋欄 */}
          <form onSubmit={handleSearch} className="flex gap-2 flex-shrink-0">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. 140625/4 or 140625-40X973"
              className="flex-1 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
            />
            <Button type="submit" className={`${WidgetStyles.quickAccess.viewHistory}`}>
              <MagnifyingGlassIcon className="w-4 h-4" />
            </Button>
          </form>

          {/* 搜尋結果列表 */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center mb-2 flex-shrink-0">
              <h4 className="text-sm font-medium text-slate-400">Search Results</h4>
            </div>
            <div className="flex-1 overflow-hidden">
              <SearchResultsList searchQuery={searchQuery} />
            </div>
          </div>
        </CardContent>
      </WidgetCard>
    </motion.div>
  );
});