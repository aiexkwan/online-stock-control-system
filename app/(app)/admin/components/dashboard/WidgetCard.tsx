/**
 * 統一的 Widget Card Component
 * 提供一致的透明背景和邊框樣式
 */

'use client';

import React from 'react';
import { WidgetStyles } from '@/app/utils/widgetStyles';
import { cn } from '@/lib/utils';
// WidgetSize 已移除 - admin dashboard 使用固定佈局

interface WidgetCardProps {
  widgetType: keyof typeof WidgetStyles.borders;
  isEditMode?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  // size 已移除 - admin dashboard 使用固定佈局
}

export function WidgetCard({
  widgetType,
  isEditMode = false,
  className = '',
  children,
  onClick,
  // size parameter removed
}: WidgetCardProps) {
  const borderStyle = WidgetStyles.borders[widgetType as string] || '';

  // 所有 widget 使用固定佈局

  return (
    <div
      onClick={onClick}
      className={cn(
        // 基礎樣式
        'h-full rounded-xl transition-all duration-300',
        // 透明背景樣式 - 使用白色透明度讓效果更明顯
        'bg-white/3 backdrop-blur-md',
        // Widget 專屬邊框（已移除）
        borderStyle,
        // 編輯模式樣式（保留編輯模式邊框）
        isEditMode && 'border-2 border-dashed border-blue-500/50',
        // 確保內容不會溢出圓角
        'overflow-hidden',
        // Flex 佈局
        'flex flex-col',
        // 額外的自定義樣式
        className
      )}
    >
      <div className={cn('min-h-0 flex-1', 'widget-content overflow-auto')}>{children}</div>
    </div>
  );
}
