/**
 * Universal Widget Card Component
 * 使用新的 Universal Layout 系統，但 100% 保持現有外觀和行為
 */

'use client';

import React from 'react';
import { WidgetStyles } from '@/app/utils/widgetStyles';
import { cn } from '@/lib/utils';
import { UniversalCard } from '@/components/layout/universal';

interface UniversalWidgetCardProps {
  widgetType: keyof typeof WidgetStyles.borders;
  isEditMode?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export function UniversalWidgetCard({ 
  widgetType, 
  isEditMode = false, 
  className = '', 
  children,
  onClick,
}: UniversalWidgetCardProps) {
  const borderStyle = WidgetStyles.borders[widgetType] || '';
  
  // 直接返回一個 div，完全保持現有行為
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
        isEditMode && 'border-dashed border-2 border-blue-500/50',
        // 確保內容不會溢出圓角
        'overflow-hidden',
        // Flex 佈局
        'flex flex-col',
        // 額外的自定義樣式
        className
      )}
    >
      <div className={cn(
        "flex-1 min-h-0",
        "overflow-auto widget-content"
      )}>
        {children}
      </div>
    </div>
  );
}

// 完全兼容的舊 API 包裝器
export function WidgetCard(props: UniversalWidgetCardProps) {
  return <UniversalWidgetCard {...props} />;
}