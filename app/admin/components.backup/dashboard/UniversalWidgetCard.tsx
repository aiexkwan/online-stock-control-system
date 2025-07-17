/**
 * Universal Widget Card Component
 * 使用新的 Universal Layout 系統，但 100% 保持現有外觀和行為
 * 包含自動錯誤邊界保護
 */

'use client';

import React from 'react';
import { WidgetStyles } from '@/app/utils/widgetStyles';
import { cn } from '@/lib/utils';
import { UniversalCard } from '@/components/layout/universal';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';

interface UniversalWidgetCardProps {
  widgetType: keyof typeof WidgetStyles.borders;
  isEditMode?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disableErrorBoundary?: boolean; // 允許某些 widgets 禁用錯誤邊界
}

export function UniversalWidgetCard({
  widgetType,
  isEditMode = false,
  className = '',
  children,
  onClick,
  disableErrorBoundary = false,
}: UniversalWidgetCardProps) {
  const borderStyle = WidgetStyles.borders[widgetType] || '';

  // 基礎卡片組件
  const cardContent = (
    <div
      onClick={onClick}
      className={cn(
        // 基礎樣式 - 移除背景，由 AdminWidgetRenderer 統一控制
        'h-full',
        // Widget 專屬邊框（已移除）
        borderStyle,
        // 編輯模式樣式（保留編輯模式邊框）
        isEditMode && 'rounded-xl border-2 border-dashed border-blue-500/50',
        // 確保內容不會溢出 + 直接處理 overflow
        'widget-content overflow-y-auto',
        // Flex 佈局
        'flex flex-col',
        // 額外的自定義樣式
        className
      )}
    >
      {children}
    </div>
  );

  // 如果禁用錯誤邊界，直接返回卡片內容
  if (disableErrorBoundary) {
    return cardContent;
  }

  // 否則包裹錯誤邊界
  return <WidgetErrorBoundary widgetName={widgetType}>{cardContent}</WidgetErrorBoundary>;
}

// 完全兼容的舊 API 包裝器
export function WidgetCard(props: UniversalWidgetCardProps) {
  return <UniversalWidgetCard {...props} />;
}
