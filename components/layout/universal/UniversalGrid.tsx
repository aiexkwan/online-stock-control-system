/**
 * UniversalGrid - 統一網格組件
 * 支援所有現有網格模式，完全向後兼容
 */

'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ResponsiveColumns, GridConfig, SpacingSize, LegacyResponsiveGridProps } from './types';
import { SPACING_CLASSES, GRID_PRESETS } from './constants';

interface UniversalGridProps {
  children: React.ReactNode;
  preset?: keyof typeof GRID_PRESETS;
  columns?: ResponsiveColumns;
  gap?: SpacingSize;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  className?: string;
  // 向後兼容性 props
  legacy?: boolean;
}

// 完全兼容現有 ResponsiveGrid
interface ResponsiveGridCompatProps extends LegacyResponsiveGridProps {
  __legacy?: true;
}

export const UniversalGrid = forwardRef<HTMLDivElement, UniversalGridProps>(
  (
    {
      children,
      preset,
      columns,
      gap = 'md',
      align = 'stretch',
      justify = 'start',
      className = '',
      legacy = false,
    },
    ref
  ) => {
    // 獲取配置 (預設優先於直接 props)
    const config = preset
      ? GRID_PRESETS[preset]
      : { columns: columns || ({} as ResponsiveColumns), gap };
    const finalColumns = columns || config.columns;
    const finalGap = gap || config.gap;

    // 生成網格列類名的輔助函數
    const getGridColsClass = (cols: number): string => {
      const gridColsMap: Record<number, string> = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
        6: 'grid-cols-6',
        7: 'grid-cols-7',
        8: 'grid-cols-8',
        9: 'grid-cols-9',
        10: 'grid-cols-10',
        11: 'grid-cols-11',
        12: 'grid-cols-12',
      };
      return gridColsMap[cols] || 'grid-cols-1';
    };

    // 構建響應式網格類名
    const buildResponsiveGridClasses = (): string[] => {
      const classes: string[] = [];
      const cols = finalColumns as Record<string, number>; // Type assertion for flexibility

      // 基礎網格 (xs/預設)
      if ('xs' in cols && cols.xs) {
        classes.push(getGridColsClass(cols.xs));
      } else if ('sm' in cols && cols.sm) {
        classes.push(getGridColsClass(cols.sm));
      } else {
        classes.push('grid-cols-1'); // 預設
      }

      // 響應式斷點
      if ('sm' in cols && cols.sm) {
        classes.push(`sm:${getGridColsClass(cols.sm)}`);
      }
      if ('md' in cols && cols.md) {
        classes.push(`md:${getGridColsClass(cols.md)}`);
      }
      if ('lg' in cols && cols.lg) {
        classes.push(`lg:${getGridColsClass(cols.lg)}`);
      }
      if ('xl' in cols && cols.xl) {
        classes.push(`xl:${getGridColsClass(cols.xl)}`);
      }
      if ('2xl' in cols && cols['2xl']) {
        classes.push(`2xl:${getGridColsClass(cols['2xl'])}`);
      }

      return classes;
    };

    // 對齊類名
    const alignClasses = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    };

    // 內容分布類名
    const justifyClasses = {
      start: 'justify-items-start',
      center: 'justify-items-center',
      end: 'justify-items-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    };

    const gridClasses = cn(
      // 基礎網格
      'grid',

      // 響應式列數
      ...buildResponsiveGridClasses(),

      // 間距
      `gap-${SPACING_CLASSES[finalGap]}`,

      // 對齊
      alignClasses[align],
      justifyClasses[justify],

      // 自定義類名
      className
    );

    return (
      <div ref={ref} className={gridClasses}>
        {children}
      </div>
    );
  }
);

// 完全兼容現有 ResponsiveGrid 的包裝器
export const ResponsiveGrid = forwardRef<HTMLDivElement, ResponsiveGridCompatProps>(
  ({ children, columns = { sm: 1, md: 2, lg: 2, xl: 3 }, gap = 6, className = '' }, ref) => {
    // 轉換舊格式的 gap 數字到新的 SpacingSize
    const convertGapToSpacing = (gapNum: number): SpacingSize => {
      const gapMap: Record<number, SpacingSize> = {
        0: 'none',
        1: 'xs',
        2: 'sm',
        3: 'sm',
        4: 'md',
        5: 'md',
        6: 'lg',
        7: 'lg',
        8: 'xl',
        9: 'xl',
        10: '2xl',
        11: '2xl',
        12: '2xl',
      };
      return gapMap[gapNum] || 'md';
    };

    return (
      <UniversalGrid
        ref={ref}
        columns={columns}
        gap={convertGapToSpacing(gap)}
        className={className}
        legacy={true}
      >
        {children}
      </UniversalGrid>
    );
  }
);

// 設置 displayName 以便調試
UniversalGrid.displayName = 'UniversalGrid';
ResponsiveGrid.displayName = 'ResponsiveGrid';

export default UniversalGrid;
