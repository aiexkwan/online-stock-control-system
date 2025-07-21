/**
 * Loading Overlay
 * 載入遮罩組件
 *
 * 提供全螢幕或容器級載入遮罩，支援性能感知和可取消功能
 */

'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingOverlayProps, PerformanceMetrics } from '../types';
import { useSmartLoading } from '../hooks/useSmartLoading';
import { SmartLoadingSpinner } from './SmartLoadingSpinner';
import { ProgressIndicator } from './ProgressIndicator';

interface LoadingOverlayExtendedProps extends LoadingOverlayProps {
  /** 是否啟用性能感知 */
  enablePerformanceAware?: boolean;
  /** 自定義性能指標 */
  performanceMetrics?: PerformanceMetrics;
  /** 載入器變體 */
  variant?: 'spinner' | 'progress' | 'custom';
  /** 背景模糊 */
  blur?: boolean;
  /** 動畫效果 */
  animation?: 'fade' | 'scale' | 'slide' | 'none';
  /** 遮罩主題 */
  theme?: 'dark' | 'light' | 'glass';
  /** 是否顯示關閉按鈕 */
  showCloseButton?: boolean;
  /** 最小顯示時間 (ms) */
  minShowTime?: number;
}

export function LoadingOverlay({
  id = 'loading-overlay',
  isLoading = true,
  text,
  progress,
  size = 'md',
  className,
  error,
  fullscreen = false,
  opacity = 0.8,
  cancellable = false,
  onCancel,
  onComplete,
  onError,
  children,
  enablePerformanceAware = true,
  performanceMetrics,
  variant = 'spinner',
  blur = true,
  animation = 'fade',
  theme = 'dark',
  showCloseButton = false,
  minShowTime = 300,
}: LoadingOverlayExtendedProps) {
  // 使用智能載入 Hook
  const smartLoading = useSmartLoading({
    id,
    type: fullscreen ? 'page' : 'component',
    enablePerformanceAware,
  });

  // 使用提供的性能指標或從 Hook 獲取
  const metrics = performanceMetrics || smartLoading.performanceMetrics;

  // 性能感知配置
  const performanceConfig = useMemo(() => {
    if (!enablePerformanceAware || !metrics) {
      return {
        useMotion: animation !== 'none',
        reducedMotion: false,
        simplifiedUI: false,
      };
    }

    const isLowPerformance = metrics.isLowEndDevice || metrics.isSlowNetwork;

    return {
      useMotion: animation !== 'none' && !isLowPerformance,
      reducedMotion: isLowPerformance,
      simplifiedUI: isLowPerformance,
    };
  }, [enablePerformanceAware, metrics, animation]);

  // 主題配置
  const themeConfig = {
    dark: {
      background: 'bg-black',
      text: 'text-white',
      accent: 'text-blue-400',
    },
    light: {
      background: 'bg-white',
      text: 'text-gray-900',
      accent: 'text-blue-600',
    },
    glass: {
      background: 'bg-slate-900/90',
      text: 'text-white',
      accent: 'text-blue-400',
    },
  }[theme];

  // 動畫變體
  const animationVariants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: performanceConfig.reducedMotion ? 0.15 : 0.3 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.9 },
      transition: { duration: performanceConfig.reducedMotion ? 0.15 : 0.3 },
    },
    slide: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: { duration: performanceConfig.reducedMotion ? 0.15 : 0.3 },
    },
    none: {
      initial: {},
      animate: {},
      exit: {},
      transition: { duration: 0 },
    },
  };

  const currentVariants = animationVariants[animation] || animationVariants.fade;

  // 處理取消
  const handleCancel = useCallback(() => {
    if (cancellable && onCancel) {
      onCancel();
    }
  }, [cancellable, onCancel]);

  // 處理鍵盤事件
  useEffect(() => {
    if (!isLoading || !cancellable) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, cancellable, handleCancel]);

  // 渲染載入內容
  const renderLoadingContent = () => {
    if (children) {
      return children;
    }

    switch (variant) {
      case 'progress':
        return (
          <ProgressIndicator
            id={`${id}-progress`}
            isLoading={isLoading}
            progress={progress}
            text={text}
            error={error}
            size={size}
            enablePerformanceAware={enablePerformanceAware}
            performanceMetrics={metrics}
          />
        );

      case 'spinner':
      default:
        return (
          <SmartLoadingSpinner
            id={`${id}-spinner`}
            isLoading={isLoading}
            text={text}
            progress={progress}
            error={error}
            size={size}
            enablePerformanceAware={enablePerformanceAware}
            performanceMetrics={metrics}
            showBackground={!performanceConfig.simplifiedUI}
          />
        );
    }
  };

  // 渲染錯誤狀態
  const renderError = () => {
    if (!error) return null;

    return (
      <div className='mt-4 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4'>
        <AlertCircle className='h-5 w-5 flex-shrink-0 text-red-400' />
        <div className='flex-1'>
          <p className='text-sm font-medium text-red-400'>Error</p>
          <p className='text-xs text-red-300'>{error}</p>
        </div>
      </div>
    );
  };

  // 容器樣式
  const containerClass = cn(
    'flex items-center justify-center',
    fullscreen ? 'fixed inset-0 z-50' : 'absolute inset-0',
    themeConfig.background,
    blur && 'backdrop-blur-sm',
    className
  );

  const overlayStyle = {
    backgroundColor: `rgba(0, 0, 0, ${opacity})`,
  };

  // 內容容器
  const contentContainer = (
    <div
      className='mx-auto flex max-w-md flex-col items-center justify-center p-6'
      onClick={e => e.stopPropagation()}
    >
      {/* 關閉按鈕 */}
      {(showCloseButton || cancellable) && (
        <button
          onClick={handleCancel}
          className={cn(
            'absolute right-4 top-4 rounded-full p-2 transition-colors',
            'hover:bg-white/10 focus:bg-white/10 focus:outline-none',
            themeConfig.text
          )}
          aria-label='Close loading overlay'
        >
          <X className='h-5 w-5' />
        </button>
      )}

      {/* 載入內容 */}
      {renderLoadingContent()}

      {/* 錯誤訊息 */}
      {renderError()}

      {/* 取消提示 */}
      {cancellable && !showCloseButton && (
        <p className={cn('mt-4 text-xs opacity-70', themeConfig.text)}>Press ESC to cancel</p>
      )}
    </div>
  );

  if (!isLoading) return null;

  return (
    <AnimatePresence>
      {isLoading && (
        <>
          {performanceConfig.useMotion ? (
            <motion.div
              className={containerClass}
              style={overlayStyle}
              onClick={cancellable ? handleCancel : undefined}
              {...currentVariants}
            >
              <motion.div
                initial={currentVariants.initial}
                animate={currentVariants.animate}
                exit={currentVariants.exit}
                transition={{
                  ...currentVariants.transition,
                  delay: 0.1,
                }}
              >
                {contentContainer}
              </motion.div>
            </motion.div>
          ) : (
            <div
              className={containerClass}
              style={overlayStyle}
              onClick={cancellable ? handleCancel : undefined}
            >
              {contentContainer}
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

// 預設變體
export const SpinnerOverlay = (props: Omit<LoadingOverlayExtendedProps, 'variant'>) => (
  <LoadingOverlay variant='spinner' {...props} />
);

export const ProgressOverlay = (props: Omit<LoadingOverlayExtendedProps, 'variant'>) => (
  <LoadingOverlay variant='progress' {...props} />
);

// 專用遮罩
export const PageLoadingOverlay = (props: Omit<LoadingOverlayExtendedProps, 'fullscreen'>) => (
  <LoadingOverlay fullscreen theme='dark' blur {...props} />
);

export const ModalLoadingOverlay = (
  props: Omit<LoadingOverlayExtendedProps, 'fullscreen' | 'theme'>
) => <LoadingOverlay fullscreen={false} theme='glass' {...props} />;

export const CancellableOverlay = (props: Omit<LoadingOverlayExtendedProps, 'cancellable'>) => (
  <LoadingOverlay cancellable showCloseButton {...props} />
);
