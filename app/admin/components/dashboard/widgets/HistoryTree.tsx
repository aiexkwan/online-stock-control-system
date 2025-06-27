/**
 * 統一歷史記錄組件
 * 顯示來自 record_history 表的歷史記錄，並合併相似事件
 */

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ClockIcon, Package2, TruckIcon, PrinterIcon, CheckCircleIcon, XCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { DocumentArrowDownIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { Timeline } from '@/components/ui/timeline';
import { createClient } from '@/app/utils/supabase/client';
import { format } from 'date-fns';
import { fromDbTime } from '@/app/utils/timezone';
import { WidgetTitle, WidgetText, WidgetLabel, WidgetTextStyles, GlowStyles } from '../WidgetTypography';
import { cn } from '@/lib/utils';

interface HistoryRecord {
  id: number;
  time: string;
  action: string;
  plt_num: string | null;
  loc: string | null;
  remark: string;
  uuid: string;
}

interface MergedEvent {
  time: string;
  action: string;
  count: number;
  palletNumbers: string[];
  location: string | null;
  remark: string;
  operatorId: number | null;
  operatorName?: string;
}

// 根據 action 類型返回對應的圖標
const getActionIcon = (action: string) => {
  const iconClass = "h-3 w-3 text-white";
  
  if (action.includes('Print') || action.includes('Label')) {
    return <PrinterIcon className={iconClass} />;
  } else if (action.includes('QC') || action.includes('Finished')) {
    return <CheckCircleIcon className={iconClass} />;
  } else if (action.includes('Transfer') || action.includes('Move')) {
    return <TruckIcon className={iconClass} />;
  } else if (action.includes('GRN') || action.includes('Receiving')) {
    return <DocumentArrowDownIcon className={iconClass} />;
  } else if (action.includes('Order') || action.includes('Load')) {
    return <ClipboardDocumentListIcon className={iconClass} />;
  } else if (action.includes('Void') || action.includes('Delete')) {
    return <XCircleIcon className={iconClass} />;
  } else {
    return <ArrowRightIcon className={iconClass} />;
  }
};

// 合併相似事件的邏輯
const mergeEvents = (records: HistoryRecord[]): MergedEvent[] => {
  const merged: MergedEvent[] = [];
  const timeWindow = 5 * 60 * 1000; // 5分鐘時間窗口
  
  records.forEach((record) => {
    const recordTime = new Date(record.time).getTime();
    
    // 查找是否有可以合併的事件
    const existingIndex = merged.findIndex((event) => {
      const eventTime = new Date(event.time).getTime();
      return (
        event.action === record.action &&
        event.operatorId === record.id &&
        Math.abs(recordTime - eventTime) <= timeWindow
      );
    });
    
    if (existingIndex >= 0) {
      // 合併到現有事件
      merged[existingIndex].count++;
      if (record.plt_num) {
        merged[existingIndex].palletNumbers.push(record.plt_num);
      }
      // 更新時間為最新的
      if (recordTime > new Date(merged[existingIndex].time).getTime()) {
        merged[existingIndex].time = record.time;
      }
    } else {
      // 創建新事件
      merged.push({
        time: record.time,
        action: record.action,
        count: 1,
        palletNumbers: record.plt_num ? [record.plt_num] : [],
        location: record.loc,
        remark: record.remark,
        operatorId: record.id,
      });
    }
  });
  
  return merged;
};

// 格式化合併後的事件標題
const formatEventTitle = (event: MergedEvent): string => {
  const userName = event.operatorName || `User ${event.operatorId || 'Unknown'}`;
  
  if (event.count > 1) {
    // 批量操作
    if (event.action.includes('Print') || event.action.includes('Label')) {
      return `Print Labels By ${userName}`;
    } else if (event.action.includes('Transfer')) {
      return `Transfer Done By ${userName}`;
    } else if (event.action.includes('QC')) {
      return `QC Done By ${userName}`;
    } else if (event.action.includes('GRN') || event.action.includes('Receiving')) {
      return `GRN Received By ${userName}`;
    } else {
      return `${event.action} By ${userName}`;
    }
  } else {
    // 單個操作
    if (event.action.includes('Order') && event.action.includes('Upload')) {
      return `Order Upload By ${userName}`;
    } else if (event.action.includes('GRN') || event.action.includes('Receiving')) {
      return `GRN Received By ${userName}`;
    } else if (event.action.includes('QC')) {
      return `QC Done By ${userName}`;
    } else if (event.action.includes('Transfer')) {
      return `Transfer Done By ${userName}`;
    } else if (event.action.includes('Product') && event.action.includes('Update')) {
      return `Product Update By ${userName}`;
    } else {
      return `${event.action} By ${userName}`;
    }
  }
};

// 格式化事件描述
const formatEventDescription = (event: MergedEvent): string => {
  const parts: string[] = [];
  
  // 根據事件類型添加具體信息
  if (event.action.includes('Order') && event.action.includes('Upload')) {
    // Order Upload - 顯示訂單號
    const orderMatch = event.remark?.match(/\d{6}/);
    if (orderMatch) {
      parts.push(`Order: ${orderMatch[0]}`);
    } else if (event.palletNumbers.length > 0) {
      parts.push(`Order: ${event.palletNumbers[0]}`);
    }
  } else if (event.action.includes('GRN') || event.action.includes('Receiving')) {
    // GRN - 顯示 GRN 號碼和數量
    const grnMatch = event.remark?.match(/GRN:\s*(\w+)/i);
    if (grnMatch) {
      if (event.count > 1) {
        parts.push(`GRN: ${grnMatch[1]}, ${event.count} PLT`);
      } else {
        parts.push(`GRN: ${grnMatch[1]}`);
      }
    } else if (event.count > 1) {
      parts.push(`${event.count} PLT`);
    }
  } else if (event.action.includes('QC')) {
    // QC - 顯示棧板數量
    if (event.count > 1) {
      parts.push(`${event.count} pallets`);
    } else if (event.palletNumbers.length > 0) {
      parts.push(`PLT: ${event.palletNumbers[0]}`);
    }
    // 顯示其他 QC 信息
    if (event.remark && event.remark !== '-' && !event.remark.includes('Material:')) {
      parts.push(event.remark);
    }
  } else if (event.action.includes('Transfer')) {
    // Transfer - 顯示轉移數量
    if (event.count > 1) {
      parts.push(`${event.count} pallets`);
    } else if (event.palletNumbers.length > 0) {
      parts.push(`PLT: ${event.palletNumbers[0]}`);
    }
  } else if (event.action.includes('Print') || event.action.includes('Label')) {
    // Print - 顯示打印數量
    if (event.count > 1) {
      parts.push(`${event.count} labels`);
    } else {
      parts.push(`1 label`);
    }
  } else {
    // 其他操作 - 顯示基本信息
    if (event.palletNumbers.length > 0) {
      parts.push(`PLT: ${event.palletNumbers[0]}`);
    }
    if (event.remark && event.remark !== '-') {
      parts.push(event.remark);
    }
  }
  
  return parts.join(' • ');
};

export const HistoryTree = React.memo(function HistoryTree({ widget, isEditMode }: WidgetComponentProps) {
  const [events, setEvents] = useState<MergedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      // 查詢最近的歷史記錄
      const { data, error } = await supabase
        .from('record_history')
        .select('*')
        .order('time', { ascending: false })
        .limit(100); // 獲取較多記錄以便合併
      
      if (error) throw error;
      
      if (data) {
        // 合併相似事件
        const mergedEvents = mergeEvents(data);
        
        // 獲取所有唯一的操作員ID
        const operatorIds = [...new Set(mergedEvents.map(e => e.operatorId).filter(id => id))];
        
        // 批量查詢用戶名稱
        if (operatorIds.length > 0) {
          const { data: users, error: userError } = await supabase
            .from('data_id')
            .select('id, name')
            .in('id', operatorIds);
          
          if (!userError && users) {
            const userMap = new Map(users.map(u => [u.id, u.name]));
            mergedEvents.forEach(event => {
              if (event.operatorId) {
                event.operatorName = userMap.get(event.operatorId);
              }
            });
          }
        }
        
        // 只取前30個合併後的事件
        setEvents(mergedEvents.slice(0, 30));
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error loading history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      loadHistory();
    }
  }, [loadHistory, isEditMode]);

  // 將事件轉換為 Timeline 組件需要的格式
  const timelineItems = useMemo(() => {
    return events.map(event => ({
      date: event.time,
      title: formatEventTitle(event),
      description: formatEventDescription(event),
      icon: getActionIcon(event.action),
    }));
  }, [events]);

  // Small size (1x1) - 顯示簡單統計

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <WidgetCard widgetType="history-tree" isEditMode={isEditMode}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
          </CardTitle>
        </CardHeader>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-white/10 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-white/10 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <WidgetText size="xs" glow="red" className="text-center py-4">{error}</WidgetText>
          ) : events.length === 0 ? (
            <WidgetText size="xs" glow="gray" className="text-center py-8">
              No history records found
            </WidgetText>
          ) : (
            <Timeline
              items={timelineItems}
              initialCount={30}
              className="h-full"
              showMoreText="Show More"
              showLessText="Show Less"
              dotClassName="bg-gradient-to-r from-indigo-500 to-purple-500 border-2 border-slate-800"
              lineClassName="border-slate-600"
              titleClassName="text-slate-200 text-xs font-medium"
              descriptionClassName="text-slate-400 text-[10px] font-medium"
              dateClassName="text-slate-400 text-[10px] font-medium"
              buttonVariant="ghost"
              buttonSize="sm"
              showAnimation={!isEditMode}
            />
          )}
      </WidgetCard>
    </motion.div>
  );
});