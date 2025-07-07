/**
 * Analytics Dashboard Widget
 * 1x1: 顯示關鍵指標
 * 3x3: 顯示迷你圖表和統計
 * 5x5: 顯示完整分析儀表板
 * 
 * 暫時註釋，未有實際用途
 */

'use client';

import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { Card, CardContent } from "@/components/ui/card";

export const AnalyticsDashboardWidget = React.memo(function AnalyticsDashboardWidget({ widget, isEditMode }: WidgetComponentProps) {
  return (
    <Card className="h-full bg-slate-800/40 backdrop-blur-xl border-gray-500/30">
      <CardContent className="p-4 h-full flex flex-col items-center justify-center">
        <ChartBarIcon className="w-12 h-12 text-gray-400 mb-2" />
        <p className="text-sm text-gray-400">Analytics Dashboard</p>
        <p className="text-xs text-gray-500 mt-1">Coming Soon</p>
      </CardContent>
    </Card>
  );
});

export default AnalyticsDashboardWidget;