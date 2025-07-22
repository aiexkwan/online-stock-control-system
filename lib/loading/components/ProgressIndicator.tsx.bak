/**
 * Progress Indicator
 * 進度指示器組件
 *
 * 支援線性、圓形和步驟式進度顯示，具備性能感知功能
 */

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProgressIndicatorProps, PerformanceMetrics } from '../types';
import { useSmartLoading } from '../hooks/useSmartLoading';

interface ProgressIndicatorExtendedProps extends ProgressIndicatorProps {
  /** 是否啟用性能感知 */
  enablePerformanceAware?: boolean;
  /** 自定義性能指標 */
  performanceMetrics?: PerformanceMetrics;
  /** 顏色主題 */
  theme?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  /** 是否顯示動畫 */
  animated?: boolean;
  /** 進度條高度（僅線性） */
  height?: 'thin' | 'normal' | 'thick';
  /** 圓形進度條大小（僅圓形） */
  circularSize?: number;
  /** 進度條背景透明度 */
  backgroundOpacity?: number;
}

export function ProgressIndicator({
  id = 'progress-indicator',
  isLoading = true,
  progress = 0,
  text,
  type = 'linear',
  showPercentage = true,
  showSteps = false,
  steps = [],
  currentStep = 0,
  size = 'md',
  className,
  error,
  enablePerformanceAware = true,
  performanceMetrics,
  theme = 'primary',
  animated = true,
  height = 'normal',
  circularSize = 100,
  backgroundOpacity = 0.2,
  onComplete,
  onError,
}: ProgressIndicatorExtendedProps) {
  // 使用智能載入 Hook
  const smartLoading = useSmartLoading({
    id,
    type: 'component',
    enablePerformanceAware,
  });

  // 使用提供的性能指標或從 Hook 獲取
  const metrics = performanceMetrics || smartLoading.performanceMetrics;

  // 性能感知動畫配置
  const animationConfig = useMemo(() => {
    if (!enablePerformanceAware || !metrics) {
      return { useMotion: animated, duration: 0.5 };
    }

    const isLowPerformance = metrics.isLowEndDevice || metrics.isSlowNetwork;

    return {
      useMotion: animated && !isLowPerformance,
      duration: isLowPerformance ? 0.2 : 0.5,
    };
  }, [enablePerformanceAware, metrics, animated]);

  // 主題配置
  const themeConfig = {
    primary: {
      progress: 'bg-blue-500',
      background: 'bg-blue-500',
      text: 'text-blue-400',
      step: 'border-blue-500',
    },
    secondary: {
      progress: 'bg-slate-400',
      background: 'bg-slate-500',
      text: 'text-slate-400',
      step: 'border-slate-500',
    },
    success: {
      progress: 'bg-green-500',
      background: 'bg-green-500',
      text: 'text-green-400',
      step: 'border-green-500',
    },
    warning: {
      progress: 'bg-yellow-500',
      background: 'bg-yellow-500',
      text: 'text-yellow-400',
      step: 'border-yellow-500',
    },
    error: {
      progress: 'bg-red-500',
      background: 'bg-red-500',
      text: 'text-red-400',
      step: 'border-red-500',
    },
  }[theme];

  // 高度配置
  const heightConfig = {
    thin: 'h-1',
    normal: 'h-2',
    thick: 'h-3',
  }[height];

  // 確保進度在有效範圍內
  const clampedProgress = Math.max(0, Math.min(100, progress));

  // 渲染線性進度條
  const renderLinearProgress = () => {
    const backgroundStyle = {
      backgroundColor: `${themeConfig.background.replace('bg-', '')}`,
      opacity: backgroundOpacity,
    };

    return (
      <div className='w-full space-y-2'>
        {/* 標題和百分比 */}
        {(text || showPercentage) && (
          <div className='flex items-center justify-between'>
            {text && <span className={cn('text-sm', themeConfig.text)}>{text}</span>}
            {showPercentage && (
              <span className={cn('text-sm font-medium', themeConfig.text)}>
                {Math.round(clampedProgress)}%
              </span>
            )}
          </div>
        )}

        {/* 進度條 */}
        <div
          className={cn('w-full overflow-hidden rounded-full', heightConfig)}
          style={backgroundStyle}
        >
          {animationConfig.useMotion ? (
            <motion.div
              className={cn('h-full rounded-full', themeConfig.progress)}
              initial={{ width: 0 }}
              animate={{ width: `${clampedProgress}%` }}
              transition={{
                duration: animationConfig.duration,
                ease: 'easeOut',
              }}
            />
          ) : (
            <div
              className={cn('h-full rounded-full', themeConfig.progress)}
              style={{ width: `${clampedProgress}%` }}
            />
          )}
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className='flex items-center gap-2 text-sm text-red-400'>
            <AlertCircle className='h-4 w-4' />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  };

  // 渲染圓形進度條
  const renderCircularProgress = () => {
    const radius = (circularSize - 8) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

    return (
      <div className='flex flex-col items-center space-y-4'>
        <div className='relative'>
          <svg width={circularSize} height={circularSize} className='-rotate-90 transform'>
            {/* 背景圓環 */}
            <circle
              cx={circularSize / 2}
              cy={circularSize / 2}
              r={radius}
              stroke='currentColor'
              strokeWidth='4'
              fill='transparent'
              className={cn('opacity-20', themeConfig.text)}
            />

            {/* 進度圓環 */}
            {animationConfig.useMotion ? (
              <motion.circle
                cx={circularSize / 2}
                cy={circularSize / 2}
                r={radius}
                stroke='currentColor'
                strokeWidth='4'
                fill='transparent'
                strokeLinecap='round'
                className={themeConfig.text}
                style={{ strokeDasharray }}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{
                  duration: animationConfig.duration,
                  ease: 'easeOut',
                }}
              />
            ) : (
              <circle
                cx={circularSize / 2}
                cy={circularSize / 2}
                r={radius}
                stroke='currentColor'
                strokeWidth='4'
                fill='transparent'
                strokeLinecap='round'
                className={themeConfig.text}
                style={{ strokeDasharray, strokeDashoffset }}
              />
            )}
          </svg>

          {/* 中心內容 */}
          <div className='absolute inset-0 flex flex-col items-center justify-center'>
            {showPercentage && (
              <span className={cn('text-lg font-bold', themeConfig.text)}>
                {Math.round(clampedProgress)}%
              </span>
            )}
            {text && <span className={cn('text-center text-xs', themeConfig.text)}>{text}</span>}
          </div>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className='flex items-center gap-2 text-sm text-red-400'>
            <AlertCircle className='h-4 w-4' />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  };

  // 渲染步驟進度
  const renderStepProgress = () => {
    const totalSteps = steps.length || 5;
    const activeStep = Math.min(currentStep, totalSteps - 1);

    return (
      <div className='w-full space-y-4'>
        {/* 步驟指示器 */}
        <div className='flex items-center justify-between'>
          {Array.from({ length: totalSteps }, (_, index) => {
            const isCompleted = index < activeStep;
            const isActive = index === activeStep;
            const isFuture = index > activeStep;

            return (
              <div key={index} className='flex items-center'>
                {/* 步驟圓圈 */}
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all duration-200',
                    isCompleted && cn('text-white', themeConfig.progress),
                    isActive && cn('border-2', themeConfig.step, 'bg-opacity-20 text-white'),
                    isFuture && 'border-2 border-slate-600 text-slate-400'
                  )}
                >
                  {isCompleted ? <Check className='h-4 w-4' /> : <span>{index + 1}</span>}
                </div>

                {/* 連接線 */}
                {index < totalSteps - 1 && (
                  <div
                    className={cn(
                      'mx-2 h-0.5 flex-1 transition-all duration-200',
                      isCompleted ? themeConfig.progress : 'bg-slate-600'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* 步驟標籤 */}
        {showSteps && steps.length > 0 && (
          <div className='text-center'>
            <span className={cn('text-sm', themeConfig.text)}>
              {steps[activeStep] || `Step ${activeStep + 1}`}
            </span>
          </div>
        )}

        {/* 進度文字 */}
        {text && (
          <div className='text-center'>
            <span className={cn('text-sm', themeConfig.text)}>{text}</span>
          </div>
        )}

        {/* 錯誤訊息 */}
        {error && (
          <div className='flex items-center justify-center gap-2 text-sm text-red-400'>
            <AlertCircle className='h-4 w-4' />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  };

  // 主渲染邏輯
  const renderProgress = () => {
    switch (type) {
      case 'circular':
        return renderCircularProgress();
      case 'step':
        return renderStepProgress();
      case 'linear':
      default:
        return renderLinearProgress();
    }
  };

  if (!isLoading && progress !== 100) return null;

  return <div className={cn('w-full', className)}>{renderProgress()}</div>;
}

// 預設變體
export const LinearProgress = (props: Omit<ProgressIndicatorExtendedProps, 'type'>) => (
  <ProgressIndicator type='linear' {...props} />
);

export const CircularProgress = (props: Omit<ProgressIndicatorExtendedProps, 'type'>) => (
  <ProgressIndicator type='circular' {...props} />
);

export const StepProgress = (props: Omit<ProgressIndicatorExtendedProps, 'type'>) => (
  <ProgressIndicator type='step' {...props} />
);

// 專用進度指示器
export const ApiProgress = (props: Omit<ProgressIndicatorExtendedProps, 'type' | 'size'>) => (
  <ProgressIndicator type='linear' size='sm' height='thin' {...props} />
);

export const UploadProgress = (props: Omit<ProgressIndicatorExtendedProps, 'type' | 'theme'>) => (
  <ProgressIndicator type='linear' theme='primary' showPercentage {...props} />
);

export const WizardProgress = (props: Omit<ProgressIndicatorExtendedProps, 'type'>) => (
  <ProgressIndicator type='step' showSteps {...props} />
);
