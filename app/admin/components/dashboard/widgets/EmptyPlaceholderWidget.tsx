/**
 * Empty Placeholder Widget
 * 空白內容，設定成背景透明及隱藏
 */

'use client';

import React from 'react';
import { WidgetComponentProps } from '@/app/types/dashboard';

export const EmptyPlaceholderWidget = React.memo(function EmptyPlaceholderWidget({ 
  widget, 
  isEditMode,
  timeFrame 
}: WidgetComponentProps) {
  
  if (isEditMode) {
    return (
      <div className="h-full w-full border-2 border-dashed border-gray-500 rounded-lg flex items-center justify-center">
        <p className="text-gray-400 text-sm">Empty Placeholder</p>
      </div>
    );
  }

  // 完全透明和隱藏的組件
  return (
    <div className="h-full w-full opacity-0 invisible" />
  );
});