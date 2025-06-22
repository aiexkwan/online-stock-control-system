/**
 * Responsive Widget Wrapper
 * 根據 Widget 大小自動調整內容顯示
 */

'use client';

import React, { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { ContentLevel, getContentLevel, ContentLevelConfig } from '@/app/admin/types/widgetContentLevel';

interface ResponsiveWidgetWrapperProps extends WidgetComponentProps {
  children: (contentLevel: ContentLevel, config: typeof ContentLevelConfig[ContentLevel]) => React.ReactNode;
}

// 自定義比較函數，確保 gridProps 變化時重新渲染
const arePropsEqual = (
  prevProps: ResponsiveWidgetWrapperProps,
  nextProps: ResponsiveWidgetWrapperProps
) => {
  // 檢查 gridProps 是否改變 (只有 WidgetConfig 才有 gridProps)
  const prevGridProps = 'gridProps' in prevProps.widget ? prevProps.widget.gridProps : null;
  const nextGridProps = 'gridProps' in nextProps.widget ? nextProps.widget.gridProps : null;
  
  if (prevGridProps && nextGridProps && 
      (prevGridProps.w !== nextGridProps.w || prevGridProps.h !== nextGridProps.h)) {
    return false;
  }
  
  // 檢查編輯模式是否改變
  if (prevProps.isEditMode !== nextProps.isEditMode) {
    return false;
  }
  
  return true;
};

export const ResponsiveWidgetWrapper = ({ 
  widget, 
  isEditMode,
  children 
}: ResponsiveWidgetWrapperProps) => {
  // 計算內容級別
  const contentLevel = useMemo(() => {
    const gridProps = 'gridProps' in widget ? widget.gridProps : null;
    const width = gridProps?.w || 3;
    const height = gridProps?.h || 3;
    return getContentLevel(width, height);
  }, [widget]);

  // 獲取對應的配置
  const config = ContentLevelConfig[contentLevel];

  // 編輯模式下顯示簡化版本
  if (isEditMode) {
    const gridProps = 'gridProps' in widget ? widget.gridProps : null;
    const actualWidth = gridProps?.w || 3;
    const actualHeight = gridProps?.h || 3;
    
    return (
      <div className={cn(
        "w-full h-full flex flex-col items-center justify-center",
        "bg-slate-800 border border-slate-600 rounded-lg",
        config.padding
      )}>
        <div className="text-white/60 text-sm">
          {widget.type.replace(/_/g, ' ')}
        </div>
        <div className="text-white text-lg font-bold mt-1">
          {actualWidth} × {actualHeight}
        </div>
      </div>
    );
  }

  // 正常模式下根據級別渲染內容
  return (
    <div 
      className={cn(
        "w-full h-full",
        config.padding,
        config.fontSize
      )}
      style={{
        pointerEvents: 'none' // wrapper 不攔截事件
      }}
    >
      <div style={{ pointerEvents: 'auto', width: '100%', height: '100%' }}>
        {children(contentLevel, config)}
      </div>
    </div>
  );
};

ResponsiveWidgetWrapper.displayName = 'ResponsiveWidgetWrapper';

// 輔助組件：響應式文字
export const ResponsiveText = memo<{
  level: ContentLevel;
  minimal?: React.ReactNode;
  compact?: React.ReactNode;
  standard?: React.ReactNode;
  detailed?: React.ReactNode;
  full?: React.ReactNode;
}>(({ level, minimal, compact, standard, detailed, full }) => {
  switch (level) {
    case ContentLevel.MINIMAL:
      return <>{minimal}</>;
    case ContentLevel.COMPACT:
      return <>{compact || minimal}</>;
    case ContentLevel.STANDARD:
      return <>{standard || compact || minimal}</>;
    case ContentLevel.DETAILED:
      return <>{detailed || standard || compact || minimal}</>;
    case ContentLevel.FULL:
      return <>{full || detailed || standard || compact || minimal}</>;
    default:
      return <>{minimal}</>;
  }
});

ResponsiveText.displayName = 'ResponsiveText';

// 輔助 hook：使用內容級別
export const useContentLevel = (width?: number, height?: number): ContentLevel => {
  return useMemo(() => {
    return getContentLevel(width || 3, height || 3);
  }, [width, height]);
};