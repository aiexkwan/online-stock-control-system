/**
 * 網格 Widget 容器
 * 處理 widget 在網格系統中的定位和大小
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { WIDGET_GRID_SIZES } from '../../config/gridConfig';
import { WidgetSize } from '@/app/types/dashboard';

interface GridWidgetProps {
  id: string;
  x: number; // 網格 X 座標
  y: number; // 網格 Y 座標
  size: WidgetSize; // Widget 尺寸
  children: React.ReactNode;
  isEditMode?: boolean;
  onPositionChange?: (id: string, x: number, y: number) => void;
  gridConfig?: {
    cellWidth: number;
    cellHeight: number;
    gap: number;
    padding: number;
    maxCols: number;
    maxRows: number;
  };
  className?: string;
}

export function GridWidget({
  id,
  x,
  y,
  size,
  children,
  isEditMode = false,
  onPositionChange,
  gridConfig,
  className
}: GridWidgetProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  // 獲取 widget 的網格尺寸
  const getWidgetGridSize = (size: WidgetSize) => {
    switch (size) {
      case WidgetSize.SMALL:
        return WIDGET_GRID_SIZES['1x1'];
      case WidgetSize.MEDIUM:
        return WIDGET_GRID_SIZES['3x3'];
      case WidgetSize.LARGE:
        return WIDGET_GRID_SIZES['5x5'];
      case WidgetSize.XLARGE:
        return WIDGET_GRID_SIZES['6x6']; // ASK_DATABASE 專用
      default:
        return WIDGET_GRID_SIZES['3x3'];
    }
  };

  const { cols, rows } = getWidgetGridSize(size);

  // 計算 widget 的實際位置和大小
  const calculateStyle = useCallback(() => {
    if (!gridConfig) return {};

    const { cellWidth, cellHeight, gap, padding } = gridConfig;
    
    return {
      left: `${padding + (x * (cellWidth + gap))}px`,
      top: `${padding + (y * (cellHeight + gap))}px`,
      width: `${cols * cellWidth + (cols - 1) * gap}px`,
      height: `${rows * cellHeight + (rows - 1) * gap}px`
    };
  }, [x, y, cols, rows, gridConfig]);

  // 處理拖動開始
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (!isEditMode || !widgetRef.current || !gridConfig) return;

    const rect = widgetRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    
    e.preventDefault();
  }, [isEditMode, gridConfig]);

  // 處理拖動
  const handleDrag = useCallback((e: MouseEvent) => {
    if (!isDragging || !gridConfig || !onPositionChange) return;

    const { cellWidth, cellHeight, gap, padding, maxCols, maxRows } = gridConfig;
    
    // 計算新的網格位置
    const container = widgetRef.current?.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const relativeX = e.clientX - containerRect.left - dragOffset.x;
    const relativeY = e.clientY - containerRect.top - dragOffset.y;

    // 轉換為網格座標
    const newX = Math.round((relativeX - padding) / (cellWidth + gap));
    const newY = Math.round((relativeY - padding) / (cellHeight + gap));

    // 確保在邊界內
    const clampedX = Math.max(0, Math.min(newX, maxCols - cols));
    const clampedY = Math.max(0, Math.min(newY, maxRows - rows));

    if (clampedX !== x || clampedY !== y) {
      onPositionChange(id, clampedX, clampedY);
    }
  }, [isDragging, dragOffset, x, y, cols, rows, id, onPositionChange, gridConfig]);

  // 處理拖動結束
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 設置拖動事件監聽
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDrag, handleDragEnd]);

  return (
    <motion.div
      ref={widgetRef}
      className={cn(
        "absolute transition-all duration-300",
        isDragging && "z-50 cursor-grabbing",
        isEditMode && !isDragging && "cursor-grab hover:shadow-lg",
        className
      )}
      style={calculateStyle()}
      animate={{
        scale: isDragging ? 1.05 : 1,
        opacity: isDragging ? 0.8 : 1
      }}
      onMouseDown={handleDragStart}
    >
      {/* 編輯模式下的控制手柄 */}
      {isEditMode && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-500/50 rounded-lg pointer-events-none" />
      )}
      
      {/* Widget 內容 */}
      <div className="w-full h-full">
        {children}
      </div>

      {/* 顯示網格位置（調試用） */}
      {isEditMode && (
        <div className="absolute -top-6 left-0 text-xs text-slate-400">
          {x},{y} ({cols}×{rows})
        </div>
      )}
    </motion.div>
  );
}