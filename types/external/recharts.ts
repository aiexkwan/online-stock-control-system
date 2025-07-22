/**
 * Recharts 圖表庫類型定義
 * 統一管理 recharts 相關類型，避免散落在各處
 */

import { ComponentType } from 'react';

// ResponsiveContainer 類型
export interface ResponsiveContainerProps {
  aspect?: number;
  width?: string | number;
  height?: string | number;
  minWidth?: string | number;
  minHeight?: string | number;
  maxHeight?: number;
  children: React.ReactElement;
  debounce?: number;
  id?: string | number;
  className?: string | number;
  style?: React.CSSProperties;
  onResize?: (width: number, height: number) => void;
}

// 軸組件類型
export interface AxisProps {
  dataKey?: string | number | ((obj: unknown) => unknown);
  xAxisId?: string | number;
  yAxisId?: string | number;
  axisLine?: boolean | object;
  tickLine?: boolean | object;
  tickSize?: number;
  tickFormatter?: (value: unknown, index: number) => string;
  tick?: boolean | object | React.ComponentType<unknown>;
  type?: 'number' | 'category' | string;
  domain?: [
    string | number | 'auto' | 'dataMin' | 'dataMax',
    string | number | 'auto' | 'dataMin' | 'dataMax',
  ];
  allowDataOverflow?: boolean;
  allowDecimals?: boolean;
  allowDuplicatedCategory?: boolean;
  hide?: boolean;
  label?: string | number | object | React.ComponentType<unknown>;
  orientation?: 'top' | 'bottom' | 'left' | 'right' | string;
  scale?:
    | 'auto'
    | 'linear'
    | 'pow'
    | 'sqrt'
    | 'log'
    | 'identity'
    | 'time'
    | 'band'
    | 'point'
    | 'ordinal'
    | 'quantile'
    | 'quantize'
    | 'utc'
    | 'sequential'
    | 'threshold'
    | string;
  ticks?: (string | number)[];
  tickCount?: number;
  angle?: number;
  width?: number;
  height?: number;
  mirror?: boolean;
  interval?: 'preserveStart' | 'preserveEnd' | 'preserveStartEnd' | number;
  textAnchor?: 'start' | 'middle' | 'end' | 'inherit';
  fontSize?: number;
}

// 圖表基礎類型
export interface BaseChartProps {
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

// 圖表元素類型
export interface ChartElementProps {
  dataKey?: string | ((item: Record<string, unknown>) => string | number);
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  name?: string;
  type?: string;
  stackId?: string;
  connectNulls?: boolean;
  animationDuration?: number;
  animationBegin?: number;
  // 添加缺少的屬性
  children?: React.ReactNode;
  radius?: number[];
  dot?: boolean | object | { r?: number };
  yAxisId?: string | number;
  strokeDasharray?: string;
  fillOpacity?: number;
  cx?: string | number;
  cy?: string | number;
  innerRadius?: number;
  outerRadius?: number;
  paddingAngle?: number;
  labelLine?: boolean;
  label?: string | boolean | object | ((props: Record<string, unknown>) => string);
  // 餅圖相關屬性
  data?: Array<Record<string, unknown>>;
}

// Tooltip 類型
export interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: unknown;
    name: string;
    color: string;
    dataKey: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string;
  labelFormatter?: (label: unknown) => React.ReactNode;
  formatter?: (value: unknown, name: string) => [React.ReactNode, string];
  separator?: string;
  itemStyle?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
  wrapperStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  cursor?: boolean | object;
  content?: React.ComponentType<{
    active?: boolean;
    payload?: Array<{
      value: unknown;
      name: string;
      color: string;
      dataKey: string;
      payload?: Record<string, unknown>;
    }>;
    label?: string;
  }>;
  viewBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Legend 類型
export interface LegendProps {
  content?: React.ComponentType<unknown>;
  wrapperStyle?: React.CSSProperties;
  chartWidth?: number;
  chartHeight?: number;
  width?: number;
  height?: number;
  iconType?:
    | 'line'
    | 'square'
    | 'rect'
    | 'circle'
    | 'cross'
    | 'diamond'
    | 'star'
    | 'triangle'
    | 'wye';
  layout?: 'horizontal' | 'vertical';
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

// 動態導入的組件類型
export type DynamicChartComponent = ComponentType<BaseChartProps>;
export type DynamicAxisComponent = ComponentType<AxisProps>;
export type DynamicElementComponent = ComponentType<ChartElementProps>;

// 圖表標籤類型
export interface ChartLabelProps {
  value?: string | number;
  angle?: number;
  position?: string;
  style?: React.CSSProperties;
}

// 圖表座標類型
export interface ChartCoordinate {
  x: number;
  y: number;
}

// 圖表視窗類型
export interface ChartViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 圖表事件處理器類型
export interface ChartEventHandler {
  onClick?: (data: unknown, index: number) => void;
  onMouseEnter?: (data: unknown, index: number) => void;
  onMouseLeave?: (data: unknown, index: number) => void;
}

// 圖表動畫配置
export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  begin?: number;
}

// 顏色配置
export interface ColorConfig {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  gradient?: {
    start: string;
    end: string;
    direction?: 'horizontal' | 'vertical' | 'radial';
  };
}
