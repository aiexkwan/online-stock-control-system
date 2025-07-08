/**
 * UnifiedWidgetWrapper - 統一全系統 Widget 視覺效果
 * 支援 admin dashboard 及其他頁面使用
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// 預設主題配置
const THEME_CONFIG = {
  // Admin themes
  injection: {
    ring: 'ring-blue-500/30',
    border: 'border-blue-700/50',
    shadow: 'shadow-[0_0_30px_rgba(59,130,246,0.15)]',
    hoverRing: 'hover:ring-blue-400/40',
    hoverShadow: 'hover:shadow-[0_0_40px_rgba(59,130,246,0.25)]',
  },
  pipeline: {
    ring: 'ring-purple-500/30',
    border: 'border-purple-700/50',
    shadow: 'shadow-[0_0_30px_rgba(168,85,247,0.15)]',
    hoverRing: 'hover:ring-purple-400/40',
    hoverShadow: 'hover:shadow-[0_0_40px_rgba(168,85,247,0.25)]',
  },
  warehouse: {
    ring: 'ring-green-500/30',
    border: 'border-green-700/50',
    shadow: 'shadow-[0_0_30px_rgba(34,197,94,0.15)]',
    hoverRing: 'hover:ring-green-400/40',
    hoverShadow: 'hover:shadow-[0_0_40px_rgba(34,197,94,0.25)]',
  },
  analysis: {
    ring: 'ring-cyan-500/30',
    border: 'border-cyan-700/50',
    shadow: 'shadow-[0_0_30px_rgba(6,182,212,0.15)]',
    hoverRing: 'hover:ring-cyan-400/40',
    hoverShadow: 'hover:shadow-[0_0_40px_rgba(6,182,212,0.25)]',
  },
  upload: {
    ring: 'ring-indigo-500/30',
    border: 'border-indigo-700/50',
    shadow: 'shadow-[0_0_30px_rgba(99,102,241,0.15)]',
    hoverRing: 'hover:ring-indigo-400/40',
    hoverShadow: 'hover:shadow-[0_0_40px_rgba(99,102,241,0.25)]',
  },
  update: {
    ring: 'ring-orange-500/30',
    border: 'border-orange-700/50',
    shadow: 'shadow-[0_0_30px_rgba(251,146,60,0.15)]',
    hoverRing: 'hover:ring-orange-400/40',
    hoverShadow: 'hover:shadow-[0_0_40px_rgba(251,146,60,0.25)]',
  },
  'stock-management': {
    ring: 'ring-yellow-500/30',
    border: 'border-yellow-700/50',
    shadow: 'shadow-[0_0_30px_rgba(250,204,21,0.15)]',
    hoverRing: 'hover:ring-yellow-400/40',
    hoverShadow: 'hover:shadow-[0_0_40px_rgba(250,204,21,0.25)]',
  },
  system: {
    ring: 'ring-red-500/30',
    border: 'border-red-700/50',
    shadow: 'shadow-[0_0_30px_rgba(239,68,68,0.15)]',
    hoverRing: 'hover:ring-red-400/40',
    hoverShadow: 'hover:shadow-[0_0_40px_rgba(239,68,68,0.25)]',
  },
  // Page-specific themes
  'print-label': {
    ring: 'ring-blue-500/20',
    border: 'border-blue-600/30',
    shadow: 'shadow-lg shadow-blue-500/10',
    hoverRing: 'hover:ring-blue-400/30',
    hoverShadow: 'hover:shadow-blue-400/20',
  },
  'print-grnlabel': {
    ring: 'ring-orange-500/20',
    border: 'border-orange-600/30',
    shadow: 'shadow-lg shadow-orange-500/10',
    hoverRing: 'hover:ring-orange-400/30',
    hoverShadow: 'hover:shadow-orange-400/20',
  },
  'stock-transfer': {
    ring: 'ring-blue-500/20',
    border: 'border-slate-700/50',
    shadow: 'shadow-2xl shadow-blue-900/20',
    hoverRing: 'hover:ring-blue-400/30',
    hoverShadow: 'hover:shadow-blue-400/30',
  },
  'order-loading': {
    ring: 'ring-slate-500/20',
    border: 'border-slate-700/50',
    shadow: 'shadow-xl shadow-slate-900/30',
    hoverRing: 'hover:ring-slate-400/30',
    hoverShadow: 'hover:shadow-slate-800/40',
  },
  // Transparent variant
  transparent: {
    ring: '',
    border: '',
    shadow: '',
    hoverRing: '',
    hoverShadow: '',
  },
  // Default fallback
  default: {
    ring: 'ring-slate-500/30',
    border: 'border-slate-600/50',
    shadow: 'shadow-[0_0_30px_rgba(100,150,200,0.15)]',
    hoverRing: 'hover:ring-slate-400/40',
    hoverShadow: 'hover:shadow-[0_0_40px_rgba(100,150,200,0.25)]',
  },
};

export type WidgetTheme = keyof typeof THEME_CONFIG;

interface UnifiedWidgetWrapperProps {
  children: React.ReactNode;
  theme?: WidgetTheme;
  variant?: 'default' | 'transparent' | 'glass' | 'minimal';
  className?: string;
  style?: React.CSSProperties;
  hasError?: boolean;
  disableBorder?: boolean;
  disableHover?: boolean;
  preserveBackground?: boolean;
  borderRadius?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export function UnifiedWidgetWrapper({
  children,
  theme = 'default',
  variant = 'default',
  className,
  style,
  hasError = false,
  disableBorder = false,
  disableHover = false,
  preserveBackground = false,
  borderRadius = 'xl',
}: UnifiedWidgetWrapperProps) {
  // 獲取主題配置
  const themeConfig = THEME_CONFIG[theme] || THEME_CONFIG.default;

  // 圓角映射
  const radiusMap = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
  };

  // 根據 variant 決定基礎樣式
  const getVariantStyles = () => {
    switch (variant) {
      case 'transparent':
        return 'bg-transparent';
      case 'glass':
        return 'bg-slate-800/40 backdrop-blur-xl';
      case 'minimal':
        return 'bg-slate-900/30 backdrop-blur-sm';
      default:
        return preserveBackground ? '' : 'bg-slate-900/50 backdrop-blur-sm';
    }
  };

  // 組合樣式
  const baseStyles = cn(
    // 基礎樣式
    'h-full w-full transition-all duration-300',
    radiusMap[borderRadius],

    // Variant 樣式
    getVariantStyles(),

    // 邊框效果（可禁用）
    !disableBorder &&
      variant !== 'transparent' && [
        themeConfig.ring,
        themeConfig.border,
        themeConfig.shadow,
        !disableHover && themeConfig.hoverRing,
        !disableHover && themeConfig.hoverShadow,
      ],

    // 錯誤狀態
    hasError && 'ring-2 ring-red-500 border-red-500',

    // 防止內容溢出
    'overflow-hidden'
  );

  const finalStyles = cn(baseStyles, className);

  if (hasError) {
    return (
      <div className={finalStyles} style={style}>
        <div className='p-4 text-sm text-red-400'>{children}</div>
      </div>
    );
  }

  return (
    <div className={finalStyles} style={style}>
      {children}
    </div>
  );
}

// 為了兼容性，導出原有函數名
export const UnifiedWidgetWrapperLegacy = UnifiedWidgetWrapper;
