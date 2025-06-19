/**
 * 統一的 Widget 佈局組件
 * 控制數據表和圖表的顯示規範
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { WidgetSize } from '@/app/types/dashboard';

interface UnifiedWidgetLayoutProps {
  size: WidgetSize;
  // 數據表部分
  tableContent?: React.ReactNode;
  tableData?: any[];
  renderTableRow?: (item: any, index: number) => React.ReactNode;
  // 圖表部分
  chartContent?: React.ReactNode;
  // 只有表格或只有圖表的情況
  singleContent?: React.ReactNode;
  className?: string;
}

export function UnifiedWidgetLayout({
  size,
  tableContent,
  tableData,
  renderTableRow,
  chartContent,
  singleContent,
  className
}: UnifiedWidgetLayoutProps) {
  // 1x1 尺寸特殊處理
  if (size === WidgetSize.SMALL) {
    return <div className={cn("h-full", className)}>{singleContent}</div>;
  }

  // 只有單一內容（只有表格或只有圖表）
  if (singleContent) {
    return (
      <div className={cn("h-full overflow-hidden", className)}>
        {singleContent}
      </div>
    );
  }

  // 有表格和圖表的情況（主要是 5x5）
  if (tableContent || (tableData && renderTableRow)) {
    return (
      <div className={cn("h-full flex flex-col", className)}>
        {/* 數據表區域 - 40% 高度 */}
        <div className="h-[40%] mb-2">
          {tableContent || (
            <div className="h-full bg-black/20 rounded-lg p-3 overflow-hidden">
              <div className="h-full overflow-y-auto">
                <div className="space-y-1">
                  {/* 預設顯示 4 條記錄 */}
                  {tableData?.slice(0, 4).map((item, index) => 
                    renderTableRow?.(item, index)
                  )}
                  {/* 如果超過 4 條，顯示剩餘數量提示 */}
                  {tableData && tableData.length > 4 && (
                    <div className="text-xs text-slate-500 text-center pt-2">
                      Scroll to see {tableData.length - 4} more records
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 圖表區域 - 60% 高度 */}
        <div className="h-[60%] overflow-hidden">
          {chartContent}
        </div>
      </div>
    );
  }

  // 預設返回
  return <div className={cn("h-full", className)}>{chartContent}</div>;
}

// 統一的表格行樣式
export function TableRow({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string 
}) {
  return (
    <div className={cn(
      "flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors",
      className
    )}>
      {children}
    </div>
  );
}

// 統一的圖表容器
export function ChartContainer({ 
  children, 
  className,
  title
}: { 
  children: React.ReactNode; 
  className?: string;
  title?: string;
}) {
  return (
    <div className={cn(
      "h-full bg-black/20 rounded-lg p-4 overflow-hidden",
      className
    )}>
      {title && (
        <h4 className="text-sm font-medium text-slate-300 mb-2">{title}</h4>
      )}
      <div className="h-[calc(100%-2rem)]">
        {children}
      </div>
    </div>
  );
}