/**
 * Widget 尺寸選擇器組件
 * 統一管理所有 widget 嘅尺寸選擇
 */

import React from 'react';
import { WidgetSize, WidgetType } from '@/app/types/dashboard';

interface WidgetSizeSelectorProps {
  currentSize: WidgetSize;
  widgetType: WidgetType;
  onChange: (size: WidgetSize) => void;
  className?: string;
}

// 定義每個尺寸嘅顯示名稱
const SIZE_LABELS = {
  [WidgetSize.SMALL]: '2×2',
  [WidgetSize.MEDIUM]: '4×4',
  [WidgetSize.LARGE]: '6×6'
};

// 定義哪些 widget 類型不支援某些尺寸
const SIZE_RESTRICTIONS: Record<WidgetType, WidgetSize[]> = {
  [WidgetType.ASK_DATABASE]: [WidgetSize.MEDIUM, WidgetSize.LARGE], // Ask Database 只支援 Medium 和 Large
  // 其他 widget 類型支援所有尺寸，所以不需要列出
} as Record<WidgetType, WidgetSize[]>;

export function WidgetSizeSelector({ 
  currentSize, 
  widgetType, 
  onChange, 
  className = "" 
}: WidgetSizeSelectorProps) {
  // 獲取該 widget 類型支援嘅尺寸
  const supportedSizes = SIZE_RESTRICTIONS[widgetType] || Object.values(WidgetSize);
  
  return (
    <select
      value={currentSize}
      onChange={(e) => onChange(e.target.value as WidgetSize)}
      className={`h-7 px-2 text-xs rounded bg-slate-800/90 border border-slate-600 text-white cursor-pointer hover:bg-slate-700/90 transition-colors ${className}`}
    >
      {Object.entries(SIZE_LABELS).map(([size, label]) => {
        const isSupported = supportedSizes.includes(size as WidgetSize);
        return (
          <option 
            key={size} 
            value={size} 
            disabled={!isSupported}
          >
            {label}
          </option>
        );
      })}
    </select>
  );
}