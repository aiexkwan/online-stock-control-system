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
        // 基礎樣式 - 移除背景，由 AdminWidgetRenderer 統一控制
        'h-full',
        // Widget 專屬邊框（已移除）
        borderStyle,
        // 編輯模式樣式（保留編輯模式邊框）
        isEditMode && 'border-dashed border-2 border-blue-500/50 rounded-xl',
        // 確保內容不會溢出 + 直接處理 overflow
        'overflow-y-auto widget-content',
        // Flex 佈局
        'flex flex-col',
        // 額外的自定義樣式
        className
      )}
    >
      {children}
    </div>
  );
}

// 完全兼容的舊 API 包裝器
export function WidgetCard(props: UniversalWidgetCardProps) {
  return <UniversalWidgetCard {...props} />;
}