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
  } as const satisfies DialogPreset,

  // 成功通知
  success: {
    variant: 'notification',
    size: 'sm',
    animation: 'scale',
    showAnimatedBorder: true,
    showCloseButton: false,
    severity: 'success',
  } as const satisfies DialogPreset,

  // 錯誤通知
  error: {
    variant: 'notification',
    size: 'sm',
    animation: 'scale',
    showAnimatedBorder: true,
    showCloseButton: false,
    severity: 'error',
  } as const satisfies DialogPreset,

  // 警告通知
  warning: {
    variant: 'notification',
    size: 'sm',
    animation: 'scale',
    showAnimatedBorder: true,
    showCloseButton: false,
    severity: 'warning',
  } as const satisfies DialogPreset,

  // 確認對話框
  confirmation: {
    variant: 'confirmation',
    size: 'sm',
    animation: 'fade',
    showCloseButton: false,
  } as const satisfies DialogPreset,

  // 表單對話框
  form: {
    variant: 'form',
    size: 'md',
    animation: 'slide',
    mobileFullscreen: true,
  } as const satisfies DialogPreset,

  // 大型表單
  largeForm: {
    variant: 'form',
    size: 'lg',
    animation: 'slide',
    mobileFullscreen: true,
  } as const satisfies DialogPreset,

  // 報表查看
  report: {
    variant: 'default',
    size: 'xl',
    animation: 'fade',
    mobileFullscreen: true,
  } as const satisfies DialogPreset,

  // 全屏模式
  fullscreen: {
    variant: 'fullscreen',
    size: 'full',
    animation: 'fade',
    showCloseButton: true,
  } as const satisfies DialogPreset,

  // 移動端優化
  mobile: {
    variant: 'default',
    size: 'md',
    animation: 'slide',
    mobileFullscreen: true,
  } as const satisfies DialogPreset,
} as const;

// 輔助函數：合併預設配置
export const mergeDialogProps = <T extends Partial<DialogProps & DialogContentProps>>(
  preset: keyof typeof dialogPresets | DialogPreset,
  props?: T
): DialogPreset & T => {
  const presetConfig = typeof preset === 'string' ? dialogPresets[preset] : preset;

  return {
    ...presetConfig,
    ...props,
  } as DialogPreset & T;
};

// 類型定義
export type DialogPresetName = keyof typeof dialogPresets;
