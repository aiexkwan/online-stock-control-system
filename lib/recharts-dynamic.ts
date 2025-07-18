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

// 基礎圖表組件類型
interface BaseChartProps {
  width?: number;
  height?: number;
  data?: any[];
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  children?: React.ReactNode;
  layout?: 'horizontal' | 'vertical' | 'centric' | 'radial';
}

// 軸組件類型
interface AxisProps {
  type?: 'number' | 'category';
  dataKey?: string;
  tick?: boolean | object;
  tickLine?: boolean | object;
  axisLine?: boolean | object;
  orientation?: 'top' | 'bottom' | 'left' | 'right';
  domain?: [number | string, number | string];
  scale?: 'auto' | 'linear' | 'pow' | 'sqrt' | 'log' | 'identity' | 'time' | 'band' | 'point' | 'ordinal' | 'quantile' | 'quantize' | 'threshold' | 'category';
  tickFormatter?: (value: any) => string;
  interval?: number | 'preserveStart' | 'preserveEnd' | 'preserveStartEnd';
  angle?: number;
  textAnchor?: 'start' | 'middle' | 'end' | 'inherit';
  height?: number;
  width?: number;
  mirror?: boolean;
  reversed?: boolean;
  label?: string | number | React.ReactElement | ((props: any) => React.ReactElement) | { value?: string | number; angle?: number; position?: string; style?: React.CSSProperties; };
  unit?: string | number;
  name?: string | number;
  tickCount?: number;
  minTickGap?: number;
  allowDecimals?: boolean;
  allowDataOverflow?: boolean;
  hide?: boolean;
  includeHidden?: boolean;
  tickSize?: number;
  tickMargin?: number;
  stroke?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fill?: string;
  yAxisId?: string;
}

// 圖表元素類型
interface ChartElementProps {
  dataKey?: string | ((item: any) => any);
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  radius?: number | number[];
  barSize?: number;
  maxBarSize?: number;
  minPointSize?: number;
  stackId?: string;
  name?: string;
  type?: 'linear' | 'monotone' | 'step' | 'stepBefore' | 'stepAfter' | 'basis' | 'cardinal' | 'monotoneX' | 'monotoneY';
  connectNulls?: boolean;
  activeDot?: boolean | object;
  dot?: boolean | object;
  legendType?: 'line' | 'square' | 'rect' | 'circle' | 'cross' | 'diamond' | 'star' | 'triangle' | 'wye' | 'none';
  hide?: boolean;
  isAnimationActive?: boolean;
  animationBegin?: number;
  animationDuration?: number;
  animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  onClick?: (data: any, index: number) => void;
  onMouseEnter?: (data: any, index: number) => void;
  onMouseLeave?: (data: any, index: number) => void;
  yAxisId?: string;
  children?: React.ReactNode;
  data?: any[];
  cx?: string | number;
  cy?: string | number;
  labelLine?: boolean;
  label?: ((props: any) => string) | boolean;
  outerRadius?: number;
  innerRadius?: number;
  fillOpacity?: number;
  paddingAngle?: number;
  layout?: 'horizontal' | 'vertical' | 'centric' | 'radial';
}

// Tooltip 類型
interface TooltipProps<TValue = any, TName = any> {
  active?: boolean;
  payload?: Array<{
    value: TValue;
    name: TName;
    color?: string;
    dataKey?: string;
    type?: string;
    unit?: string;
    payload?: any;
  }>;
  label?: string;
  separator?: string;
  cursor?: boolean | object;
  viewBox?: { x: number; y: number; width: number; height: number };
  coordinate?: { x: number; y: number };
  position?: { x: number; y: number };
  content?: ComponentType<any>;
  formatter?: (value: TValue, name: TName, props: any) => [React.ReactNode, React.ReactNode];
  labelFormatter?: (label: string, payload: any[]) => React.ReactNode;
  labelStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  itemStyle?: React.CSSProperties;
  wrapperStyle?: React.CSSProperties;
  itemSorter?: (item: any) => number;
  filter?: (label: string, payload: any[]) => boolean;
  allowEscapeViewBox?: { x?: boolean; y?: boolean };
  animationDuration?: number;
  animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  isAnimationActive?: boolean;
  offset?: number;
  reverseDirection?: { x?: boolean; y?: boolean };
  useTranslate3d?: boolean;
}

// Legend 類型
interface LegendProps {
  width?: number;
  height?: number;
  layout?: 'horizontal' | 'vertical' | 'centric' | 'radial';
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  iconType?: 'line' | 'square' | 'rect' | 'circle' | 'cross' | 'diamond' | 'star' | 'triangle' | 'wye';
  payload?: Array<{
    value: any;
    type?: string;
    color?: string;
    inactive?: boolean;
  }>;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  content?: ComponentType<any>;
  formatter?: (value: any, entry: any, index: number) => React.ReactNode;
  wrapperStyle?: React.CSSProperties;
  iconSize?: number;
  onClick?: (data: any, index: number) => void;
  onMouseEnter?: (data: any, index: number) => void;
  onMouseLeave?: (data: any, index: number) => void;
}

// 動態導入的組件類型定義
type DynamicChartComponent<T = BaseChartProps> = ComponentType<T>;
type DynamicAxisComponent = ComponentType<AxisProps>;
type DynamicElementComponent = ComponentType<ChartElementProps>;
type DynamicTooltipComponent = ComponentType<TooltipProps>;
type DynamicLegendComponent = ComponentType<LegendProps>;

// 圖表組件
export const BarChart = dynamic(
  () => import('recharts').then((mod) => mod.BarChart),
  { ssr: false }
) as DynamicChartComponent;

export const LineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  { ssr: false }
) as DynamicChartComponent;

export const AreaChart = dynamic(
  () => import('recharts').then((mod) => mod.AreaChart),
  { ssr: false }
) as DynamicChartComponent;

export const PieChart = dynamic(
  () => import('recharts').then((mod) => mod.PieChart),
  { ssr: false }
) as DynamicChartComponent;

export const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer as any),
  { ssr: false }
) as ComponentType<{
  width?: string | number;
  height?: string | number;
  aspect?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
  debounce?: number;
  children?: React.ReactNode;
}>;

// 軸組件
export const XAxis = dynamic(
  () => import('recharts').then((mod) => mod.XAxis as any),
  { ssr: false }
) as DynamicAxisComponent;

export const YAxis = dynamic(
  () => import('recharts').then((mod) => mod.YAxis as any),
  { ssr: false }
) as DynamicAxisComponent;

// 圖表元素
export const Bar = dynamic(
  () => import('recharts').then((mod) => mod.Bar as any),
  { ssr: false }
) as DynamicElementComponent;

export const Line = dynamic(
  () => import('recharts').then((mod) => mod.Line as any),
  { ssr: false }
) as DynamicElementComponent;

export const Area = dynamic(
  () => import('recharts').then((mod) => mod.Area as any),
  { ssr: false }
) as DynamicElementComponent;

export const Pie = dynamic(
  () => import('recharts').then((mod) => mod.Pie as any),
  { ssr: false }
) as DynamicElementComponent;

export const Cell = dynamic(
  () => import('recharts').then((mod) => mod.Cell as any),
  { ssr: false }
) as ComponentType<{
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  key?: string | number;
}>;

// 輔助組件
export const CartesianGrid = dynamic(
  () => import('recharts').then((mod) => mod.CartesianGrid as any),
  { ssr: false }
) as ComponentType<{
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  horizontal?: boolean;
  vertical?: boolean;
  horizontalPoints?: number[];
  verticalPoints?: number[];
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  fill?: string;
  fillOpacity?: number;
  opacity?: number;
}>;

export const Tooltip = dynamic(
  () => import('recharts').then((mod) => mod.Tooltip as any),
  { ssr: false }
) as ComponentType<TooltipProps>;

export const Legend = dynamic(
  () => import('recharts').then((mod) => mod.Legend as any),
  { ssr: false }
) as ComponentType<LegendProps>;

// 輔助函數：檢查組件是否已載入
export const isRechartsLoaded = () => {
  return typeof window !== 'undefined';
};

// 輔助函數：創建 Loading 組件
export const createChartSkeleton = (className?: string) => {
  return React.createElement('div', {
    className: `animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className || 'h-64 w-full'}`
  });
};

// 導出類型供外部使用
export type {
  BaseChartProps,
  AxisProps,
  ChartElementProps,
  TooltipProps,
  LegendProps,
  DynamicChartComponent,
  DynamicAxisComponent,
  DynamicElementComponent,
  DynamicTooltipComponent,
  DynamicLegendComponent,
};