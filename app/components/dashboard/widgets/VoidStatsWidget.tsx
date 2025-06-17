/**
 * Void Statistics Widget
 * 支援三種尺寸：
 * - Small: 只顯示總計void數量
 * - Medium: 顯示今日和本週統計
 * - Large: 完整統計卡片
 */

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { NoSymbolIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { VoidStatisticsCard } from '@/app/components/VoidStatisticsCard';

export function VoidStatsWidget({ widget, isEditMode }: WidgetComponentProps) {
  const size = widget.config.size || WidgetSize.SMALL;

  // Small size - only show icon and label
  if (size === WidgetSize.SMALL) {
    return (
      <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-red-500/30 shadow-2xl ${isEditMode ? 'border-dashed border-2 border-red-500/50' : ''}`}>
        <CardContent className="p-4 h-full flex flex-col justify-center items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg flex items-center justify-center mb-2">
            <NoSymbolIcon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-sm font-medium text-slate-400 mb-1">Void Stats</h3>
          <p className="text-xs text-slate-400 text-center">Resize to view stats</p>
        </CardContent>
      </Card>
    );
  }

  // Medium and Large sizes - show full component
  return (
    <div className={`h-full ${isEditMode ? 'border-2 border-dashed border-red-500/50 rounded-2xl' : ''}`}>
      <VoidStatisticsCard />
    </div>
  );
}