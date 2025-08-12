/**
 * Card System Theme Configuration
 * 統一 Card 系統主題配置 - 適用於所有 Cards
 * 
 * Created: 2025-08-12
 * Purpose: Centralized theme system for all Card components
 */

import { type ClassValue } from 'clsx';

/**
 * Card 類別配色方案
 * 每個類別都有專屬嘅顏色主題
 */
export const cardThemes = {
  // 操作類 Cards (Operation Cards)
  operation: {
    gradient: 'from-blue-500 to-cyan-500',
    icon: 'text-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    hover: 'hover:bg-blue-500/20',
    accent: '#06b6d4',
  },
  
  // 分析類 Cards (Analysis Cards)
  analysis: {
    gradient: 'from-purple-500 to-pink-500',
    icon: 'text-purple-400',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
    hover: 'hover:bg-purple-500/20',
    accent: '#c084fc',
  },
  
  // 數據類 Cards (Data Cards)
  data: {
    gradient: 'from-green-500 to-emerald-500',
    icon: 'text-green-400',
    border: 'border-green-500/30',
    bg: 'bg-green-500/10',
    hover: 'hover:bg-green-500/20',
    accent: '#34d399',
  },
  
  // 報表類 Cards (Report Cards)
  report: {
    gradient: 'from-orange-500 to-red-500',
    icon: 'text-orange-400',
    border: 'border-orange-500/30',
    bg: 'bg-orange-500/10',
    hover: 'hover:bg-orange-500/20',
    accent: '#f97316',
  },
  
  // 圖表類 Cards (Chart Cards)
  chart: {
    gradient: 'from-indigo-500 to-purple-500',
    icon: 'text-indigo-400',
    border: 'border-indigo-500/30',
    bg: 'bg-indigo-500/10',
    hover: 'hover:bg-indigo-500/20',
    accent: '#6366f1',
  },
  
  // 特殊類 Cards (Special Cards)
  special: {
    gradient: 'from-violet-500 to-purple-500',
    icon: 'text-violet-400',
    border: 'border-violet-500/30',
    bg: 'bg-violet-500/10',
    hover: 'hover:bg-violet-500/20',
    accent: '#a78bfa',
  },
} as const;

/**
 * Card 文字樣式預設
 * 統一文字大小同樣式
 */
export const cardTextStyles = {
  // 標題
  title: 'text-lg font-semibold leading-tight text-white',
  subtitle: 'text-sm font-normal leading-normal text-white/70',
  
  // 內容
  body: 'text-base font-normal leading-normal',
  bodySmall: 'text-sm font-normal leading-normal',
  
  // 標籤
  label: 'text-xs font-medium leading-tight tracking-wide',
  labelSmall: 'text-xs font-normal leading-tight',
  
  // 數值
  metric: 'text-2xl font-bold leading-tight',
  metricSmall: 'text-xl font-semibold leading-tight',
  
  // 狀態
  success: 'text-green-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
  info: 'text-blue-400',
} as const;

/**
 * Card 容器樣式預設
 */
export const cardContainerStyles = {
  // 基礎容器
  base: 'rounded-lg bg-slate-800/50 backdrop-blur-sm border border-slate-700/50',
  elevated: 'rounded-lg bg-slate-800/70 backdrop-blur-md border border-slate-600/50 shadow-lg',
  glass: 'rounded-lg bg-white/5 backdrop-blur-xl border border-white/10',
  
  // 內邊距
  padding: {
    none: '',
    small: 'p-3',
    base: 'p-4',
    large: 'p-6',
  },
  
  // 間距
  spacing: {
    tight: 'space-y-2',
    base: 'space-y-4',
    loose: 'space-y-6',
  },
} as const;

/**
 * Card 動畫預設
 */
export const cardAnimations = {
  // 進入動畫
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  },
  
  // Hover 效果
  hover: {
    whileHover: { scale: 1.02 },
    transition: { type: 'spring', stiffness: 300 },
  },
  
  // 載入動畫
  skeleton: 'animate-pulse bg-slate-700/50',
} as const;

/**
 * Card 狀態顏色
 */
export const cardStatusColors = {
  online: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    dot: 'bg-green-400',
  },
  offline: {
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
    text: 'text-gray-400',
    dot: 'bg-gray-400',
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    dot: 'bg-red-400',
  },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    dot: 'bg-yellow-400',
  },
} as const;

/**
 * Helper Functions
 */

/**
 * 獲取 Card 主題
 */
export function getCardTheme(type: keyof typeof cardThemes) {
  return cardThemes[type] || cardThemes.operation;
}

/**
 * 獲取 Card 文字樣式
 */
export function getCardTextStyle(style: keyof typeof cardTextStyles) {
  return cardTextStyles[style] || '';
}

/**
 * 獲取 Card 容器樣式
 */
export function getCardContainerStyle(
  variant: keyof typeof cardContainerStyles = 'base',
  padding: keyof typeof cardContainerStyles.padding = 'base'
): string {
  const baseStyle = typeof cardContainerStyles[variant] === 'string' 
    ? cardContainerStyles[variant] 
    : cardContainerStyles.base;
  const paddingStyle = cardContainerStyles.padding[padding];
  return `${baseStyle} ${paddingStyle}`;
}

/**
 * 獲取 Card 狀態樣式
 */
export function getCardStatusStyle(status: keyof typeof cardStatusColors) {
  return cardStatusColors[status] || cardStatusColors.offline;
}

/**
 * Card Component Type Definitions
 */
export interface CardTheme {
  gradient: string;
  icon: string;
  border: string;
  bg: string;
  hover: string;
  accent: string;
}

export interface CardBaseProps {
  className?: ClassValue;
  theme?: keyof typeof cardThemes;
  variant?: keyof typeof cardContainerStyles;
  padding?: keyof typeof cardContainerStyles.padding;
  animate?: boolean;
}

/**
 * 預設 Card Props 擴展
 * 所有 Card components 都可以 extend 呢個 interface
 */
export interface CardProps extends CardBaseProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  onAction?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Card 圖表顏色配置
 */
export const cardChartColors = {
  primary: ['#f97316', '#0ea5e9', '#22c55e', '#a855f7', '#facc15', '#f87171'],
  extended: [
    '#f97316', // orange
    '#0ea5e9', // sky
    '#22c55e', // green
    '#a855f7', // purple
    '#facc15', // yellow
    '#f87171', // red
    '#60a5fa', // blue
    '#34d399', // emerald
    '#c084fc', // purple
    '#fbbf24', // yellow
  ],
  
  // 獲取圖表顏色
  getColor: (index: number, extended = false): string => {
    const colors = extended ? cardChartColors.extended : cardChartColors.primary;
    return colors[index % colors.length];
  },
} as const;

/**
 * Responsive Breakpoints
 */
export const cardBreakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Export all theme constants for external use
 */
const cardSystemTheme = {
  themes: cardThemes,
  text: cardTextStyles,
  container: cardContainerStyles,
  animations: cardAnimations,
  status: cardStatusColors,
  chart: cardChartColors,
  breakpoints: cardBreakpoints,
};

export default cardSystemTheme;