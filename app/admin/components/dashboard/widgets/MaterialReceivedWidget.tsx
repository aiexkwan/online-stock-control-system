/**
 * Material Received Widget
 * 支援三種尺寸：
 * - Small: 只顯示當天 GRN 記錄數
 * - Medium: 顯示最近收貨列表
 * - Large: 完整功能包括GRN歷史
 */

'use client';

import React, { useEffect, useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetCard } from '../WidgetCard';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import MaterialReceived from '@/app/components/GrnHistory';
import { createClient } from '@/app/utils/supabase/client';
import { getTodayRange } from '@/app/utils/timezone';
import { WidgetTitle, WidgetText, WidgetLabel, WidgetValue } from '../WidgetTypography';

export function MaterialReceivedWidget({ widget, isEditMode }: WidgetComponentProps) {
  const size = widget.config.size || WidgetSize.SMALL;
  const [todayGrnCount, setTodayGrnCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (size === WidgetSize.SMALL) {
      fetchTodayGrnCount();
      
      // 設置自動刷新
      const interval = setInterval(fetchTodayGrnCount, widget.config.refreshInterval || 60000);
      return () => clearInterval(interval);
    }
  }, [size, widget.config.refreshInterval]);

  const fetchTodayGrnCount = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { start, end } = getTodayRange();
      
      const { count, error } = await supabase
        .from('record_grn')
        .select('*', { count: 'exact', head: true })
        .gte('creat_time', start)
        .lte('creat_time', end);
      
      if (error) throw error;
      
      setTodayGrnCount(count || 0);
    } catch (error) {
      console.error('Error fetching GRN count:', error);
      setTodayGrnCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Small size - only show today's GRN count
  if (size === WidgetSize.SMALL) {
    return (
      <WidgetCard widgetType="MATERIAL_RECEIVED" isEditMode={isEditMode}>
        <CardContent className="p-2 h-full flex flex-col justify-center items-center">
          <WidgetTitle size="xs" glow="gray" className="mb-1">Material Received</WidgetTitle>
          {loading ? (
            <div className="h-8 w-16 bg-white/10 rounded animate-pulse"></div>
          ) : (
            <>
              <WidgetValue size="large" glow="yellow">{todayGrnCount}</WidgetValue>
              <WidgetLabel size="xs" glow="gray" className="mt-0.5">Today's GRN</WidgetLabel>
            </>
          )}
        </CardContent>
      </WidgetCard>
    );
  }

  // Medium and Large sizes - show full component
  return (
    <WidgetCard widgetType="MATERIAL_RECEIVED" isEditMode={isEditMode}>
      <div className="h-full overflow-auto p-4">
        <MaterialReceived />
      </div>
    </WidgetCard>
  );
}