/**
 * Dialog 預設配置
 * 提供常用嘅 Dialog 配置組合
 */

import type { DialogProps, DialogContentProps } from './Dialog';

export interface DialogPreset {
  variant?: DialogContentProps['variant'];
  size?: DialogContentProps['size'];
  animation?: DialogContentProps['animation'];
  showAnimatedBorder?: boolean;
  showCloseButton?: boolean;
  mobileFullscreen?: boolean;
  severity?: DialogProps['severity'];
}

export const dialogPresets = {
  // 通知類型
  notification: {
    variant: 'notification',
    size: 'sm',
    animation: 'scale',
    showAnimatedBorder: true,
    showCloseButton: false,
  } as DialogPreset,

  // 成功通知
  success: {
    variant: 'notification',
    size: 'sm',
    animation: 'scale',
    showAnimatedBorder: true,
    showCloseButton: false,
    severity: 'success',
  } as DialogPreset,

  // 錯誤通知
  error: {
    variant: 'notification',
    size: 'sm',
    animation: 'scale',
    showAnimatedBorder: true,
    showCloseButton: false,
    severity: 'error',
  } as DialogPreset,

  // 警告通知
  warning: {
    variant: 'notification',
    size: 'sm',
    animation: 'scale',
    showAnimatedBorder: true,
    showCloseButton: false,
    severity: 'warning',
  } as DialogPreset,

  // 確認對話框
  confirmation: {
    variant: 'confirmation',
    size: 'sm',
    animation: 'fade',
    showCloseButton: false,
  } as DialogPreset,

  // 表單對話框
  form: {
    variant: 'form',
    size: 'md',
    animation: 'slide',
    mobileFullscreen: true,
  } as DialogPreset,

  // 大型表單
  largeForm: {
    variant: 'form',
    size: 'lg',
    animation: 'slide',
    mobileFullscreen: true,
  } as DialogPreset,

  // 報表查看
  report: {
    variant: 'default',
    size: 'xl',
    animation: 'fade',
    mobileFullscreen: true,
  } as DialogPreset,

  // 全屏模式
  fullscreen: {
    variant: 'fullscreen',
    size: 'full',
    animation: 'fade',
    showCloseButton: true,
  } as DialogPreset,

  // 移動端優化
  mobile: {
    variant: 'default',
    size: 'md',
    animation: 'slide',
    mobileFullscreen: true,
  } as DialogPreset,
} as const;

// 輔助函數：合併預設配置
export const mergeDialogProps = (
  preset: keyof typeof dialogPresets | DialogPreset,
  props?: Partial<DialogProps & DialogContentProps>
): DialogProps & DialogContentProps => {
  const presetConfig = typeof preset === 'string' ? dialogPresets[preset] : preset;

  return {
    ...presetConfig,
    ...props,
  };
};

// 類型定義
export type DialogPresetName = keyof typeof dialogPresets;
