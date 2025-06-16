/**
 * Finished Product Widget
 * 支援三種尺寸：
 * - Small: 只顯示最近打印數量
 * - Medium: 顯示最近打印列表
 * - Large: 完整功能包括打印歷史
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PrinterIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import FinishedProduct from '@/app/components/PrintHistory';

export function FinishedProductWidget({ widget, isEditMode }: WidgetComponentProps) {
  const size = widget.config.size || WidgetSize.SMALL;

  // Small size - only show stats
  if (size === WidgetSize.SMALL) {
    return (
      <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-green-500/30 shadow-2xl ${isEditMode ? 'border-dashed border-2 border-green-500/50' : ''}`}>
        <CardContent className="p-4 h-full flex flex-col justify-center items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-2">
            <PrinterIcon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-sm font-medium text-slate-400 mb-1">Print History</h3>
          <p className="text-xs text-slate-400 text-center">Resize to view history</p>
        </CardContent>
      </Card>
    );
  }

  // Medium and Large sizes - show full component
  return (
    <div className={`h-full relative group ${isEditMode ? 'border-2 border-dashed border-green-500/50 rounded-2xl' : ''}`}>
      {/* 卡片背景 */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-green-900/30 rounded-3xl blur-xl"></div>
      
      <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl shadow-green-900/20 hover:border-green-500/30 transition-all duration-300 h-full">
        {/* 卡片內部光效 */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
        
        {/* 頂部邊框光效 */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-3xl"></div>
        
        <div className="relative z-10 h-full overflow-auto">
          <FinishedProduct />
        </div>
      </div>
    </div>
  );
}