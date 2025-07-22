/**
 * Adaptive Skeleton Loader
 * 適應性骨架載入器
 *
 * 根據性能指標和載入類型自動調整骨架複雜度和動畫
 */

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SkeletonLoaderProps, PerformanceMetrics } from '../types';
import { useSmartLoading } from '../hooks/useSmartLoading';

interface AdaptiveSkeletonLoaderProps extends SkeletonLoaderProps {
  /** 是否啟用性能感知 */
  enablePerformanceAware?: boolean;
  /** 自定義性能指標 */
  performanceMetrics?: PerformanceMetrics;
  /** 最大渲染行數 (性能優化) */
  maxRows?: number;
}

export function AdaptiveSkeletonLoader({
  id = 'skeleton-loader',
  type = 'card',
  rows = 3,
  avatar = false,
  title = true,
  size = 'md',
  className,
  enablePerformanceAware = true,
  performanceMetrics,
  maxRows = 10,
  isLoading = true,
  ...props
}: AdaptiveSkeletonLoaderProps) {
  // 使用智能載入 Hook 獲取性能指標
  const smartLoading = useSmartLoading({
    id,
    type: 'component',
    enablePerformanceAware,
  });

  // 使用提供的性能指標或從 Hook 獲取
  const metrics = performanceMetrics || smartLoading.performanceMetrics;
  const adaptiveConfig = smartLoading.adaptiveConfig;

  // 根據性能調整行數
  const adjustedRows = useMemo(() => {
    if (!enablePerformanceAware || !metrics) return rows;

    let adjustedRowCount = rows;

    // 低端設備減少行數
    if (metrics.isLowEndDevice) {
      adjustedRowCount = Math.max(1, Math.floor(rows * 0.7));
    }

    // 慢速網絡進一步減少
    if (metrics.isSlowNetwork) {
      adjustedRowCount = Math.max(1, Math.floor(adjustedRowCount * 0.8));
    }

    return Math.min(adjustedRowCount, maxRows);
  }, [enablePerformanceAware, metrics, rows, maxRows]);

  // 動畫配置
  const animationConfig = useMemo(() => {
    if (!enablePerformanceAware || !adaptiveConfig) {
      return {
        animation: 'pulse' as const,
        duration: 1.5,
        useMotion: true,
      };
    }

    const { skeleton } = adaptiveConfig;

    return {
      animation: skeleton.animation,
      duration: skeleton.animation === 'wave' ? 2 : 1.5,
      useMotion: skeleton.animation !== 'none' && !metrics?.isLowEndDevice,
    };
  }, [enablePerformanceAware, adaptiveConfig, metrics]);

  // 尺寸配置
  const sizeConfig = {
    sm: { height: 'h-3', spacing: 'space-y-2', avatarSize: 'h-8 w-8' },
    md: { height: 'h-4', spacing: 'space-y-3', avatarSize: 'h-10 w-10' },
    lg: { height: 'h-5', spacing: 'space-y-4', avatarSize: 'h-12 w-12' },
    xl: { height: 'h-6', spacing: 'space-y-5', avatarSize: 'h-16 w-16' },
  }[size];

  // 渲染骨架項目
  const renderSkeletonItem = (index: number, width?: string) => {
    const itemClass = cn(sizeConfig.height, 'bg-slate-700/40 rounded', width || 'w-full');

    if (!animationConfig.useMotion) {
      return (
        <div
          key={index}
          className={cn(itemClass, animationConfig.animation === 'pulse' && 'animate-pulse')}
        />
      );
    }

    const motionProps = {
      initial: { opacity: 0.4 },
      animate: { opacity: [0.4, 0.8, 0.4] },
      transition: {
        duration: animationConfig.duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: animationConfig.animation === 'wave' ? index * 0.1 : 0,
      },
    };

    return <motion.div key={index} className={itemClass} {...motionProps} />;
  };

  // 渲染不同類型的骨架
  const renderSkeletonContent = () => {
    switch (type) {
      case 'avatar':
        return (
          <div className='flex items-center space-x-4'>
            <div className={cn('rounded-full bg-slate-700/40', sizeConfig.avatarSize)} />
            <div className='space-y-2'>
              {renderSkeletonItem(0, 'w-24')}
              {renderSkeletonItem(1, 'w-16')}
            </div>
          </div>
        );

      case 'text':
        return (
          <div className={sizeConfig.spacing}>
            {Array.from({ length: adjustedRows }, (_, i) =>
              renderSkeletonItem(i, i === adjustedRows - 1 ? 'w-3/4' : 'w-full')
            )}
          </div>
        );

      case 'list':
        return (
          <div className={sizeConfig.spacing}>
            {Array.from({ length: adjustedRows }, (_, i) => (
              <div key={i} className='flex items-center space-x-3'>
                <div className='h-2 w-2 rounded-full bg-slate-700/40' />
                {renderSkeletonItem(i, `w-${Math.floor(Math.random() * 3) + 3}/4`)}
              </div>
            ))}
          </div>
        );

      case 'table':
        return (
          <div className={sizeConfig.spacing}>
            {/* 表頭 */}
            <div className='grid grid-cols-3 gap-4'>
              {Array.from({ length: 3 }, (_, i) => renderSkeletonItem(i, 'w-full'))}
            </div>
            {/* 表格行 */}
            {Array.from({ length: Math.min(adjustedRows, 5) }, (_, rowIndex) => (
              <div key={rowIndex} className='grid grid-cols-3 gap-4'>
                {Array.from({ length: 3 }, (_, colIndex) =>
                  renderSkeletonItem(rowIndex * 3 + colIndex, 'w-full')
                )}
              </div>
            ))}
          </div>
        );

      case 'chart':
        return (
          <div className='space-y-4'>
            {title && renderSkeletonItem(0, 'w-1/3')}
            <div className='flex h-48 items-end justify-between rounded-lg bg-slate-700/20 p-4'>
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className='rounded-t bg-slate-700/40'
                  style={{
                    height: `${30 + Math.random() * 60}%`,
                    width: '10%',
                  }}
                />
              ))}
            </div>
          </div>
        );

      case 'card':
      default:
        return (
          <div className={cn('p-4', sizeConfig.spacing)}>
            {/* 頭部區域 */}
            <div className='flex items-center space-x-4'>
              {avatar && (
                <div className={cn('rounded-full bg-slate-700/40', sizeConfig.avatarSize)} />
              )}
              <div className='flex-1'>
                {title && renderSkeletonItem(0, 'w-1/2')}
                {renderSkeletonItem(1, 'w-1/3')}
              </div>
            </div>

            {/* 內容區域 */}
            <div className={sizeConfig.spacing}>
              {Array.from({ length: adjustedRows }, (_, i) =>
                renderSkeletonItem(i + 10, i === adjustedRows - 1 ? 'w-2/3' : 'w-full')
              )}
            </div>
          </div>
        );
    }
  };

  if (!isLoading) return null;

  return (
    <div
      className={cn(
        'animate-pulse',
        type === 'card' && 'rounded-lg border border-slate-700/20 bg-slate-800/30',
        className
      )}
      {...(props as React.HTMLAttributes<HTMLDivElement>)}
    >
      {renderSkeletonContent()}
    </div>
  );
}

// 預設骨架變體
export const TextSkeleton = (props: Omit<AdaptiveSkeletonLoaderProps, 'type'>) => (
  <AdaptiveSkeletonLoader type='text' {...props} />
);

export const AvatarSkeleton = (props: Omit<AdaptiveSkeletonLoaderProps, 'type'>) => (
  <AdaptiveSkeletonLoader type='avatar' {...props} />
);

export const CardSkeleton = (props: Omit<AdaptiveSkeletonLoaderProps, 'type'>) => (
  <AdaptiveSkeletonLoader type='card' {...props} />
);

export const ListSkeleton = (props: Omit<AdaptiveSkeletonLoaderProps, 'type'>) => (
  <AdaptiveSkeletonLoader type='list' {...props} />
);

export const TableSkeleton = (props: Omit<AdaptiveSkeletonLoaderProps, 'type'>) => (
  <AdaptiveSkeletonLoader type='table' {...props} />
);

export const ChartSkeleton = (props: Omit<AdaptiveSkeletonLoaderProps, 'type'>) => (
  <AdaptiveSkeletonLoader type='chart' {...props} />
);

// 智能骨架組件 - 自動檢測內容類型
export function SmartSkeleton({
  children,
  fallbackType = 'card',
  ...props
}: AdaptiveSkeletonLoaderProps & {
  children?: React.ReactNode;
  fallbackType?: SkeletonLoaderProps['type'];
}) {
  // 如果有子組件，嘗試檢測類型
  const detectedType = useMemo(() => {
    if (!children) return fallbackType;

    // 這裡可以根據子組件的類型或 props 來檢測
    // 簡化實現，直接使用 fallbackType
    return fallbackType;
  }, [children, fallbackType]);

  return <AdaptiveSkeletonLoader type={detectedType} {...props} />;
}
