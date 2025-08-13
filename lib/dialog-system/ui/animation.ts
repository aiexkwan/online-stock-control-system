/**
 * 統一的 UI Dialog 動畫配置
 * 使用淡入淡出效果，保持 admin 頁面風格
 * Renamed DialogType to UIDialogVariant to avoid naming conflicts
 */

import { type VariantProps, cva } from 'class-variance-authority';

// 動畫類定義
export const dialogAnimationClasses = {
  // 背景遮罩動畫
  overlay: {
    base: 'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm',
    animation: 'data-[state=open]:animate-fadeIn data-[state=closed]:animate-fadeOut',
  },

  // 內容容器動畫
  content: {
    base: 'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
    animation: 'data-[state=open]:animate-dialogFadeIn data-[state=closed]:animate-dialogFadeOut',
  },
};

// UI Dialog 類型變體
export const dialogVariants = cva(
  // 基礎樣式 - 使用 admin 風格
  'bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 text-white rounded-3xl shadow-2xl',
  {
    variants: {
      type: {
        // 通知類型 - 藍色主題
        notification: 'border-blue-500/30',

        // 錯誤類型 - 紅色主題
        error: 'border-red-500/30',

        // 警告類型 - 黃色主題
        warning: 'border-yellow-500/30',

        // 表單類型 - 保持原樣式
        form: '',

        // 報表類型 - 紫色主題
        report: 'border-purple-500/30',

        // 信息展示類型 - 青色主題
        information: 'border-cyan-500/30',
      },

      size: {
        sm: 'max-w-lg w-full',
        md: 'max-w-2xl w-full',
        lg: 'max-w-4xl w-full',
        xl: 'max-w-6xl w-full',
        full: 'max-w-[90vw] w-full',
      },
    },
    defaultVariants: {
      type: 'form',
      size: 'md',
    },
  }
);

// 圖標顏色映射
export const dialogIconColors = {
  notification: 'text-blue-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  form: 'text-slate-400',
  report: 'text-purple-400',
  information: 'text-cyan-400',
} as const;

// 標題樣式映射
export const dialogTitleStyles = {
  notification: 'bg-gradient-to-r from-blue-300 to-cyan-300',
  error: 'bg-gradient-to-r from-red-300 to-rose-300',
  warning: 'bg-gradient-to-r from-yellow-300 to-amber-300',
  form: 'bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200',
  report: 'bg-gradient-to-r from-purple-300 to-indigo-300',
  information: 'bg-gradient-to-r from-cyan-300 to-teal-300',
} as const;

// 按鈕樣式映射
export const dialogButtonStyles = {
  primary: {
    notification:
      'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500',
    error: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500',
    warning:
      'bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500',
    form: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500',
    report:
      'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500',
    information: 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500',
  },
  secondary:
    'bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 hover:border-slate-500/70',
} as const;

export type DialogVariants = VariantProps<typeof dialogVariants>;
export type UIDialogVariant = keyof typeof dialogIconColors;