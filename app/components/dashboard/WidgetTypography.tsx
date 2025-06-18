/**
 * Widget Typography Component
 * 統一管理所有 widget 的字體樣式和發光效果
 */

import React from 'react';
import { cn } from '@/lib/utils';

// 定義不同層級的字體樣式
export const WidgetTextStyles = {
  // 標題樣式
  title: {
    large: 'text-xl font-medium',
    medium: 'text-lg font-medium', 
    small: 'text-sm font-medium',
    xs: 'text-xs font-medium'
  },
  
  // 內容樣式
  body: {
    large: 'text-base',
    medium: 'text-sm',
    small: 'text-xs',
    xs: 'text-[10px]'
  },
  
  // 標籤樣式
  label: {
    large: 'text-sm',
    medium: 'text-xs',
    small: 'text-[10px]',
    xs: 'text-[9px]'
  },
  
  // 數值樣式
  value: {
    xxl: 'text-4xl font-bold',
    xl: 'text-3xl font-semibold',
    large: 'text-2xl font-medium',
    medium: 'text-xl font-medium',
    small: 'text-lg font-medium'
  }
};

// 定義發光效果樣式
export const GlowStyles = {
  // 白色發光
  white: 'text-white [text-shadow:_0_0_10px_rgba(255,255,255,0.5),_0_0_20px_rgba(255,255,255,0.3)]',
  
  // 藍色發光
  blue: 'text-blue-400 [text-shadow:_0_0_10px_rgba(96,165,250,0.5),_0_0_20px_rgba(96,165,250,0.3)]',
  
  // 綠色發光
  green: 'text-emerald-400 [text-shadow:_0_0_10px_rgba(52,211,153,0.5),_0_0_20px_rgba(52,211,153,0.3)]',
  
  // 紫色發光
  purple: 'text-purple-400 [text-shadow:_0_0_10px_rgba(192,132,252,0.5),_0_0_20px_rgba(192,132,252,0.3)]',
  
  // 紅色發光
  red: 'text-red-400 [text-shadow:_0_0_10px_rgba(248,113,113,0.5),_0_0_20px_rgba(248,113,113,0.3)]',
  
  // 黃色發光
  yellow: 'text-yellow-400 [text-shadow:_0_0_10px_rgba(250,204,21,0.5),_0_0_20px_rgba(250,204,21,0.3)]',
  
  // 橙色發光
  orange: 'text-orange-400 [text-shadow:_0_0_10px_rgba(251,146,60,0.5),_0_0_20px_rgba(251,146,60,0.3)]',
  
  // 灰色（無發光）
  gray: 'text-slate-400',
  
  // 輕微發光（適合小字體）
  subtle: 'text-white [text-shadow:_0_0_8px_rgba(255,255,255,0.3)]',
  
  // 強烈發光（適合重要數值）
  strong: 'text-white [text-shadow:_0_0_15px_rgba(255,255,255,0.6),_0_0_30px_rgba(255,255,255,0.4)]'
};

// Widget 標題組件
interface WidgetTitleProps {
  children: React.ReactNode;
  size?: 'large' | 'medium' | 'small' | 'xs';
  glow?: keyof typeof GlowStyles;
  className?: string;
}

export function WidgetTitle({ 
  children, 
  size = 'medium', 
  glow = 'white',
  className 
}: WidgetTitleProps) {
  return (
    <h3 className={cn(
      WidgetTextStyles.title[size],
      GlowStyles[glow],
      className
    )}>
      {children}
    </h3>
  );
}

// Widget 文字組件
interface WidgetTextProps {
  children: React.ReactNode;
  size?: 'large' | 'medium' | 'small' | 'xs';
  glow?: keyof typeof GlowStyles;
  className?: string;
}

export function WidgetText({ 
  children, 
  size = 'medium', 
  glow = 'subtle',
  className 
}: WidgetTextProps) {
  return (
    <p className={cn(
      WidgetTextStyles.body[size],
      GlowStyles[glow],
      className
    )}>
      {children}
    </p>
  );
}

// Widget 標籤組件
interface WidgetLabelProps {
  children: React.ReactNode;
  size?: 'large' | 'medium' | 'small' | 'xs';
  glow?: keyof typeof GlowStyles;
  className?: string;
}

export function WidgetLabel({ 
  children, 
  size = 'medium', 
  glow = 'gray',
  className 
}: WidgetLabelProps) {
  return (
    <span className={cn(
      WidgetTextStyles.label[size],
      GlowStyles[glow],
      className
    )}>
      {children}
    </span>
  );
}

// Widget 數值組件
interface WidgetValueProps {
  children: React.ReactNode;
  size?: 'xxl' | 'xl' | 'large' | 'medium' | 'small';
  glow?: keyof typeof GlowStyles;
  className?: string;
}

export function WidgetValue({ 
  children, 
  size = 'large', 
  glow = 'strong',
  className 
}: WidgetValueProps) {
  return (
    <div className={cn(
      WidgetTextStyles.value[size],
      GlowStyles[glow],
      className
    )}>
      {children}
    </div>
  );
}

// 輔助函數：獲取適合的發光顏色
export function getGlowColorForWidget(widgetType: string): keyof typeof GlowStyles {
  const colorMap: Record<string, keyof typeof GlowStyles> = {
    // Statistics 類
    'OUTPUT_STATS': 'green',
    'BOOKED_OUT_STATS': 'blue',
    'VOID_STATS': 'red',
    
    // Operations 類
    'ACO_ORDER_PROGRESS': 'orange',
    'FINISHED_PRODUCT': 'purple',
    'MATERIAL_RECEIVED': 'yellow',
    
    // System 類
    'DATABASE_UPDATE': 'orange',
    'VIEW_HISTORY': 'blue',
    'VOID_PALLET': 'red',
    
    // Documents 類
    'UPLOAD_FILES': 'purple',
    'REPORTS': 'green',
    
    // 預設
    'default': 'white'
  };
  
  return colorMap[widgetType] || colorMap.default;
}

// 輔助函數：根據數值大小自動選擇字體大小
export function getAutoFontSize(value: number | string, containerSize: 'small' | 'medium' | 'large') {
  const numValue = typeof value === 'string' ? value.length : value;
  
  if (containerSize === 'small') {
    return numValue > 999 ? 'small' : 'medium';
  } else if (containerSize === 'medium') {
    return numValue > 9999 ? 'medium' : 'large';
  } else {
    return numValue > 99999 ? 'large' : 'xl';
  }
}