/**
 * 統一的 Widget 佈局組件
 * 控制數據表和圖表的顯示規範
 */

'use client';

import React from 'react';
import { DatabaseRecord } from '@/types/database/tables';
import { cn } from '@/lib/utils';
// WidgetSize 已移除 - admin dashboard 使用固定佈局

interface UnifiedWidgetLayoutProps {
  // size 已移除 - admin dashboard 使用固定佈局
  // 數據表部分
  tableContent?: React.ReactNode;
  tableData?: Record<string, unknown>[];
  renderTableRow?: (item: DatabaseRecord, index: number) => React.ReactNode;
  // 圖表部分
  chartContent?: React.ReactNode;
  // 只有表格或只有圖表的情況
  singleContent?: React.ReactNode;
  className?: string;
}

export function UnifiedWidgetLayout({
  // size parameter removed
  tableContent,
  tableData,
  renderTableRow,
  chartContent,
  singleContent,
  className,
}: UnifiedWidgetLayoutProps) {
  // 所有 widget 使用固定佈局，不再需要 size 判斷

  // 只有單一內容（只有表格或只有圖表）
  if (singleContent) {
    return <div className={cn('h-full overflow-hidden', className)}>{singleContent}</div>;
  }

  // 有表格和圖表的情況（主要是 5x5）
  if (tableContent || (tableData && renderTableRow)) {
    return (
      <div className={cn('flex h-full flex-col', className)}>
        {/* 數據表區域 - 40% 高度 */}
        <div className='mb-2 h-[40%]'>
          {tableContent || (
            <div className='h-full overflow-hidden rounded-lg bg-black/20 p-3'>
              <div className='h-full overflow-y-auto'>
                <div className='space-y-1'>
                  {/* 預設顯示 4 條記錄 */}
                  {tableData?.slice(0, 4).map((item, index) => renderTableRow?.(item, index))}
                  {/* 如果超過 4 條，顯示剩餘數量提示 */}
                  {tableData && tableData.length > 4 && (
                    <div className='pt-2 text-center text-xs text-slate-500'>
                      Scroll to see {tableData.length - 4} more records
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 圖表區域 - 60% 高度 */}
        <div className='h-[60%] overflow-hidden'>{chartContent}</div>
      </div>
    );
  }

  // 預設返回
  return <div className={cn('h-full', className)}>{chartContent}</div>;
}

// 統一的表格行樣式
export function TableRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded p-2 transition-colors hover:bg-white/5',
        className
      )}
    >
      {children}
    </div>
  );
}

// 統一的圖表容器
export function ChartContainer({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div className={cn('h-full overflow-hidden rounded-lg bg-black/20 p-4', className)}>
      {title && <h4 className='mb-2 text-sm font-medium text-slate-300'>{title}</h4>}
      <div className='h-[calc(100%-2rem)]'>{children}</div>
    </div>
  );
}
