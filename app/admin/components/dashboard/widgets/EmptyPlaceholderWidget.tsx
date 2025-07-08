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
  timeFrame,
}: WidgetComponentProps) {
  if (isEditMode) {
    return (
      <div className='flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-500'>
        <p className='text-sm text-gray-400'>Empty Placeholder</p>
      </div>
    );
  }

  // 完全透明和隱藏的組件
  return <div className='invisible h-full w-full opacity-0' />;
});

export default EmptyPlaceholderWidget;
