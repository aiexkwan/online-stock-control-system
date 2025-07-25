/**
 * Recharts Dynamic Import Module
 * 統一的 Recharts 動態導入模組 - 解決 TypeScript 類型問題
 *
 * 此模組提供了類型安全的 Recharts 組件動態導入，
 * 避免了 SSR 問題並提供正確的 TypeScript 類型支持。
 */

import dynamic from 'next/dynamic';
import React from 'react';
import { ComponentType } from 'react';
import type {
  ResponsiveContainerProps,
  AxisProps,
  BaseChartProps,
  ChartElementProps,
  TooltipProps,
  LegendProps,
  DynamicChartComponent,
  DynamicAxisComponent,
  DynamicElementComponent,
} from '../types/external/recharts';

// 使用統一的類型定義，移除重複定義

// 軸組件類型已移至 types/external/recharts.ts

// 圖表元素類型已移至 types/external/recharts.ts

// Tooltip 類型已移至 types/external/recharts.ts

// Legend 類型已移至 types/external/recharts.ts

// 動態導入的組件類型已移至 types/external/recharts.ts

// 圖表組件
export const BarChart = dynamic(
  () => import('recharts').then((mod: typeof import('recharts')) => mod.BarChart),
  { ssr: false }
) as DynamicChartComponent;

export const LineChart = dynamic(
  () => import('recharts').then((mod: typeof import('recharts')) => mod.LineChart),
  { ssr: false }
) as DynamicChartComponent;

export const AreaChart = dynamic(
  () => import('recharts').then((mod: typeof import('recharts')) => mod.AreaChart),
  { ssr: false }
) as DynamicChartComponent;

export const PieChart = dynamic(
  () => import('recharts').then((mod: typeof import('recharts')) => mod.PieChart),
  { ssr: false }
) as DynamicChartComponent;

// ResponsiveContainer 類型已移至 types/external/recharts.ts

// @ts-ignore
export const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })),
  { ssr: false }
);

// 軸組件類型已移至 types/external/recharts.ts

// @ts-ignore
export const XAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.XAxis })), {
  ssr: false,
});

// @ts-ignore
export const YAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.YAxis })), {
  ssr: false,
});

// 圖表元素
// @ts-ignore
export const Bar = dynamic(() => import('recharts').then(mod => ({ default: mod.Bar })), {
  ssr: false,
});

// @ts-ignore
export const Line = dynamic(() => import('recharts').then(mod => ({ default: mod.Line })), {
  ssr: false,
});

// @ts-ignore
export const Area = dynamic(() => import('recharts').then(mod => ({ default: mod.Area })), {
  ssr: false,
});

// @ts-ignore
export const Pie = dynamic(() => import('recharts').then(mod => ({ default: mod.Pie })), {
  ssr: false,
});

// @ts-ignore
export const Cell = dynamic(() => import('recharts').then(mod => ({ default: mod.Cell })), {
  ssr: false,
});

// 輔助組件
// @ts-ignore
export const CartesianGrid = dynamic(
  () => import('recharts').then(mod => ({ default: mod.CartesianGrid })),
  { ssr: false }
);

// @ts-ignore
export const Tooltip = dynamic(() => import('recharts').then(mod => ({ default: mod.Tooltip })), {
  ssr: false,
});

// @ts-ignore
export const Legend = dynamic(() => import('recharts').then(mod => ({ default: mod.Legend })), {
  ssr: false,
});

// 輔助函數：檢查組件是否已載入
export const isRechartsLoaded = () => {
  return typeof window !== 'undefined';
};

// 輔助函數：創建 Loading 組件
export const createChartSkeleton = (className?: string) => {
  return React.createElement('div', {
    className: `animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className || 'h-64 w-full'}`,
  });
};

// 類型已統一管理，從 types/external/recharts.ts 導出
export type {
  ResponsiveContainerProps,
  AxisProps,
  BaseChartProps,
  ChartElementProps,
  TooltipProps,
  LegendProps,
  DynamicChartComponent,
  DynamicAxisComponent,
  DynamicElementComponent,
} from '../types/external/recharts';
