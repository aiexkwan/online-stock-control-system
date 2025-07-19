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
  data?: Record<string, unknown>[];
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  children?: React.ReactNode;
  layout?: 'horizontal' | 'vertical' | 'centric' | 'radial';
}

// 圖表標籤類型
interface ChartLabelProps {
  value?: string | number;
  angle?: number;
  position?: string;
  style?: React.CSSProperties;
}

// 圖表座標類型
interface ChartCoordinate {
  x: number;
  y: number;
}

// 圖表視窗類型
interface ChartViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 圖表事件處理器類型
type ChartEventHandler<T = unknown> = (data: T, index: number) => void;

// 圖表格式化函數類型
type ChartFormatter<T = unknown, R = React.ReactNode> = (value: T, name: string, props: Record<string, unknown>) => R;

// 標籤格式化函數類型
type LabelFormatter = (value: string | number, props: Record<string, unknown>) => string;

// 圖表內容組件類型
type ChartContentComponent<T = Record<string, unknown>> = ComponentType<T>;

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
  tickFormatter?: (value: unknown) => string;
  interval?: number | 'preserveStart' | 'preserveEnd' | 'preserveStartEnd';
  angle?: number;
  textAnchor?: 'start' | 'middle' | 'end' | 'inherit';
  height?: number;
  width?: number;
  mirror?: boolean;
  reversed?: boolean;
  label?: string | number | React.ReactElement | ((props: Record<string, unknown>) => React.ReactElement) | ChartLabelProps;
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
  dataKey?: string | ((item: Record<string, unknown>) => string | number);
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
  onClick?: (data: Record<string, unknown>[], index: number) => void;
  onMouseEnter?: (data: Record<string, unknown>[], index: number) => void;
  onMouseLeave?: (data: Record<string, unknown>[], index: number) => void;
  yAxisId?: string;
  children?: React.ReactNode;
  data?: Record<string, unknown>[];
  cx?: string | number;
  cy?: string | number;
  labelLine?: boolean;
  label?: ((props: Record<string, unknown>) => string) | boolean;
  outerRadius?: number;
  innerRadius?: number;
  fillOpacity?: number;
  paddingAngle?: number;
  layout?: 'horizontal' | 'vertical' | 'centric' | 'radial';
}

// Tooltip 類型
interface TooltipProps<TValue = string | number, TName = string> {
  active?: boolean;
  payload?: Array<{
    value: TValue;
    name: TName;
    color?: string;
    dataKey?: string;
    type?: string;
    unit?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string;
  separator?: string;
  cursor?: boolean | object;
  viewBox?: ChartViewBox;
  coordinate?: ChartCoordinate;
  position?: ChartCoordinate;
  content?: ChartContentComponent;
  formatter?: (value: TValue, name: TName, props: Record<string, unknown>) => [React.ReactNode, React.ReactNode];
  labelFormatter?: (label: string, payload: Record<string, unknown>[]) => React.ReactNode;
  labelStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  itemStyle?: React.CSSProperties;
  wrapperStyle?: React.CSSProperties;
  itemSorter?: (item: Record<string, unknown>) => number;
  filter?: (label: string, payload: Record<string, unknown>[]) => boolean;
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
    value: unknown;
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
  content?: ChartContentComponent;
  formatter?: (value: unknown, entry: Record<string, unknown>, index: number) => React.ReactNode;
  wrapperStyle?: React.CSSProperties;
  iconSize?: number;
  onClick?: (data: Record<string, unknown>[], index: number) => void;
  onMouseEnter?: (data: Record<string, unknown>[], index: number) => void;
  onMouseLeave?: (data: Record<string, unknown>[], index: number) => void;
}

// 動態導入的組件類型定義
type DynamicChartComponent<T = BaseChartProps> = ComponentType<T>;
type DynamicAxisComponent = ComponentType<AxisProps>;
type DynamicElementComponent = ComponentType<ChartElementProps>;
type DynamicTooltipComponent = ComponentType<TooltipProps>;
type DynamicLegendComponent = ComponentType<LegendProps>;

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

export const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod: typeof import('recharts')) => mod.ResponsiveContainer),
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
  () => import('recharts').then((mod: typeof import('recharts')) => mod.XAxis),
  { ssr: false }
) as DynamicAxisComponent;

export const YAxis = dynamic(
  () => import('recharts').then((mod: typeof import('recharts')) => mod.YAxis),
  { ssr: false }
) as DynamicAxisComponent;

// 圖表元素
export const Bar = dynamic(
  () => import('recharts').then((mod: typeof import('recharts')) => mod.Bar),
  { ssr: false }
) as DynamicElementComponent;

export const Line = dynamic(
  () => import('recharts').then((mod: typeof import('recharts')) => mod.Line),
  { ssr: false }
) as DynamicElementComponent;

export const Area = dynamic(
  () => import('recharts').then((mod: typeof import('recharts')) => mod.Area),
  { ssr: false }
) as DynamicElementComponent;

export const Pie = dynamic(
  () => import('recharts').then((mod: typeof import('recharts')) => mod.Pie),
  { ssr: false }
) as DynamicElementComponent;

export const Cell = dynamic(
  () => import('recharts').then((mod: typeof import('recharts')) => mod.Cell),
  { ssr: false }
) as ComponentType<{
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  key?: string | number;
}>;

// 輔助組件
export const CartesianGrid = dynamic(
  () => import('recharts').then((mod: typeof import('recharts')) => mod.CartesianGrid),
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
  () => import('recharts').then((mod: typeof import('recharts')) => mod.Tooltip),
  { ssr: false }
) as ComponentType<TooltipProps>;

export const Legend = dynamic(
  () => import('recharts').then((mod: typeof import('recharts')) => mod.Legend),
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
  ChartLabelProps,
  ChartCoordinate,
  ChartViewBox,
  ChartEventHandler,
  ChartFormatter,
  LabelFormatter,
  ChartContentComponent,
};