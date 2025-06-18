/**
 * Widget 尺寸選擇器組件
 * 統一管理所有 widget 嘅尺寸選擇
 */

import React from 'react';
import { WidgetSize, WidgetType } from '@/app/types/dashboard';
import { isWidgetSizeSupported } from './WidgetSizeConfig';

interface WidgetSizeSelectorProps {
  currentSize: WidgetSize;
  widgetType: WidgetType;
  onChange: (size: WidgetSize) => void;
  className?: string;
}

// 定義每個尺寸嘅顯示名稱
const SIZE_LABELS = {
  [WidgetSize.SMALL]: '1×1',
  [WidgetSize.MEDIUM]: '3×3',
  [WidgetSize.LARGE]: '5×5'
};

export function WidgetSizeSelector({ 
  currentSize, 
  widgetType, 
  onChange, 
  className = "" 
}: WidgetSizeSelectorProps) {
  // 獲取該 widget 類型支援嘅尺寸
  const supportedSizes = Object.values(WidgetSize).filter(size => 
    isWidgetSizeSupported(widgetType, size)
  );
  
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
            className={!isSupported ? 'text-gray-500' : ''}
          >
            {label} {!isSupported ? '(N/A)' : ''}
          </option>
        );
      })}
    </select>
  );
}