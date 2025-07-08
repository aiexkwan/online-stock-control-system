/**
 * Universal Layout System Types
 * 統一佈局系統類型定義
 */

export type BreakpointSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type SpacingSize = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type MaxWidthSize =
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '6xl'
  | '7xl'
  | 'full';

export interface ResponsiveBreakpoints {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  '2xl'?: number;
}

export interface ResponsiveColumns {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  '2xl'?: number;
}

export interface UniversalTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    border: string;
    shadow: string;
  };
  effects: {
    blur: boolean;
    glow: boolean;
    gradient: boolean;
    animation: boolean;
  };
}

export interface LayoutVariant {
  container: 'page' | 'section' | 'widget' | 'modal' | 'card' | 'form';
  background: 'starfield' | 'gradient' | 'solid' | 'glass' | 'transparent';
  padding: SpacingSize;
  margin: SpacingSize;
  maxWidth: MaxWidthSize;
  responsive: boolean;
}

export interface GridConfig {
  columns: ResponsiveColumns;
  gap: SpacingSize;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

export interface CardConfig {
  variant: 'default' | 'widget' | 'form' | 'data' | 'action' | 'feature';
  theme: 'admin' | 'warehouse' | 'production' | 'neutral' | 'qc' | 'grn';
  elevation: 'none' | 'low' | 'medium' | 'high';
  border: boolean;
  glass: boolean;
  glow: boolean;
  animation: boolean;
}

export interface StackConfig {
  direction: 'vertical' | 'horizontal' | 'responsive';
  spacing: SpacingSize;
  align: 'start' | 'center' | 'end' | 'stretch';
  wrap: boolean;
}

// 兼容現有 ResponsiveLayout 接口
export interface LegacyResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export interface LegacyResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export interface LegacyResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
  className?: string;
}

export interface LegacyResponsiveCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: boolean;
  headerAction?: React.ReactNode;
}
