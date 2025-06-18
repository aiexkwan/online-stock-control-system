/**
 * 統一的 Widget Card Component
 * 提供一致的透明背景和邊框樣式
 */

'use client';

import React from 'react';
import { WidgetStyles } from '@/app/utils/widgetStyles';
import { cn } from '@/lib/utils';

interface WidgetCardProps {
  widgetType: keyof typeof WidgetStyles.borders;
  isEditMode?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export function WidgetCard({ 
  widgetType, 
  isEditMode = false, 
  className = '', 
  children,
  onClick 
}: WidgetCardProps) {
  const borderStyle = WidgetStyles.borders[widgetType] || '';
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        // 基礎樣式
        'h-full rounded-xl border shadow transition-all duration-300',
        // 透明背景樣式 - 使用白色透明度讓效果更明顯
        'bg-white/3 backdrop-blur-md',
        // Widget 專屬邊框
        borderStyle,
        // 編輯模式樣式
        isEditMode && 'border-dashed border-2 border-blue-500/50',
        // 額外的自定義樣式
        className
      )}
    >
      {children}
    </div>
  );
}