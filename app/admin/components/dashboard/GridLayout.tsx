/**
 * 網格佈局組件
 * 提供響應式網格系統的視覺化展示
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { GridConfig } from '../../config/gridConfig';

interface GridLayoutProps {
  children?: React.ReactNode;
  showGrid?: boolean; // 是否顯示網格線（用於調試）
  className?: string;
  gridConfig?: GridConfig & { cellWidth: number; cellHeight: number };
}

export function GridLayout({ 
  children, 
  showGrid = false,
  className,
  gridConfig
}: GridLayoutProps) {

  // 生成網格線（用於調試）
  const renderGridLines = () => {
    if (!showGrid || !gridConfig) return null;

    const lines = [];
    const { maxCols, maxRows, gap, padding, cellWidth, cellHeight } = gridConfig;
    
    // 垂直線
    for (let i = 0; i <= maxCols; i++) {
      const x = padding + i * (cellWidth + gap) - gap / 2;
      lines.push(
        <div
          key={`v-${i}`}
          className="absolute top-0 bottom-0 w-px bg-slate-700/30"
          style={{ left: `${x}px` }}
        />
      );
    }
    
    // 水平線
    for (let i = 0; i <= maxRows; i++) {
      const y = padding + i * (cellHeight + gap) - gap / 2;
      lines.push(
        <div
          key={`h-${i}`}
          className="absolute left-0 right-0 h-px bg-slate-700/30"
          style={{ top: `${y}px` }}
        />
      );
    }

    return (
      <div className="absolute inset-0 pointer-events-none">
        {lines}
      </div>
    );
  };

  // 顯示網格資訊（用於調試）
  const renderGridInfo = () => {
    if (!showGrid || !gridConfig) return null;

    return (
      <div className="absolute top-2 right-2 bg-black/80 text-white p-2 rounded text-xs z-50">
        <div>Grid: {gridConfig.maxCols} × {gridConfig.maxRows}</div>
        <div>Cell: {Math.round(gridConfig.cellWidth)} × {Math.round(gridConfig.cellHeight)}px</div>
        <div>Gap: {gridConfig.gap}px</div>
      </div>
    );
  };

  return (
    <div 
      className={cn(
        "relative w-full h-full overflow-hidden",
        className
      )}
      style={{
        padding: gridConfig?.padding || 20,
        minHeight: '100%'
      }}
    >
      {renderGridLines()}
      {renderGridInfo()}
      {children}
    </div>
  );
}