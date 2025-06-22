/**
 * Widget Size Warning Component
 * 當 widget 尺寸太細時顯示警告提示
 */

'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { WidgetConfig } from '@/app/types/dashboard';
import { cn } from '@/lib/utils';

interface WidgetSizeWarningProps {
  widget: WidgetConfig;
  currentSize: { w: number; h: number };
  minimumSize: { w: number; h: number };
  recommendedSize?: { w: number; h: number };
  className?: string;
}

export function WidgetSizeWarning({ 
  widget, 
  currentSize, 
  minimumSize,
  recommendedSize,
  className 
}: WidgetSizeWarningProps) {
  const isTooSmall = currentSize.w < minimumSize.w || currentSize.h < minimumSize.h;
  const isBelowRecommended = recommendedSize && 
    (currentSize.w < recommendedSize.w || currentSize.h < recommendedSize.h);

  if (!isTooSmall && !isBelowRecommended) return null;

  return (
    <div className={cn(
      "absolute inset-0 flex items-center justify-center z-10",
      "bg-black/50 backdrop-blur-sm rounded-lg",
      className
    )}>
      <div className="text-center p-4 max-w-xs">
        <AlertTriangle className={cn(
          "w-8 h-8 mx-auto mb-2",
          isTooSmall ? "text-red-400" : "text-yellow-400"
        )} />
        
        <p className={cn(
          "text-sm font-medium mb-2",
          isTooSmall ? "text-red-300" : "text-yellow-300"
        )}>
          {isTooSmall ? "Widget Too Small To Show Content" : "Resize Recommended"}
        </p>
        
        {isTooSmall && (
          <>
            <p className="text-xs text-gray-300 mb-1">
              Minimum size: {minimumSize.w}×{minimumSize.h}
            </p>
            <p className="text-xs text-gray-400 mb-2">
              Current: {currentSize.w}×{currentSize.h}
            </p>
            <p className="text-sm text-white font-medium">
              Drag Corner To Resize
            </p>
          </>
        )}
        
        {!isTooSmall && isBelowRecommended && (
          <>
            <p className="text-xs text-gray-300">
              Recommended: {recommendedSize?.w}×{recommendedSize?.h}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Current: {currentSize.w}×{currentSize.h}
            </p>
          </>
        )}
      </div>
    </div>
  );
}