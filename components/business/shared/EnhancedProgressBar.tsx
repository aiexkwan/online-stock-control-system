'use client';

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useMediaQuery } from '@/app/components/qc-label-form/hooks/useMediaQuery';
import { useProgressDebounce } from '@/lib/hooks/useProgressDebounce';
import { ComponentPerformanceMetrics } from '@/lib/types/component-props';

/**
 * 進度狀態類型
 *
 * @description 定義進度項目的四種狀態
 */
export type ProgressStatus = 'Pending' | 'Processing' | 'Success' | 'Failed';

/**
 * 進度項目介面
 *
 * @description 單個進度項目的資料結構
 */
interface ProgressItem {
  /** 項目唯一識別符 */
  id: string;
  /** 項目標籤或名稱 */
  label: string;
  /** 項目當前狀態 */
  status: ProgressStatus;
  /** 可選的詳細資訊 */
  details?: string;
  /** 可選的時間戳記 */
  timestamp?: string;
}

/**
 * 增強型進度條組件屬性介面
 *
 * @description 統一的進度條組件屬性，整合了基礎功能與性能優化功能
 */
interface EnhancedProgressBarProps {
  /** 當前完成項目數 */
  current: number;
  /** 總項目數 */
  total: number;
  /** 狀態陣列 */
  status: ProgressStatus[];
  /** 可選的項目詳細資訊陣列 */
  items?: ProgressItem[];
  /** 進度條標題 */
  title?: string;
  /** 是否顯示百分比 */
  showPercentage?: boolean;
  /** 是否顯示項目詳細資訊 */
  showItemDetails?: boolean;
  /** 顯示變體 */
  variant?: 'default' | 'compact' | 'detailed';
  /** 額外的 CSS 類名 */
  className?: string;
  /** 啟用防抖更新以提升性能 (預設: true) */
  enableDebounce?: boolean;
  /** 防抖延遲時間 (預設: 100ms) */
  debounceDelay?: number;
  /** 啟用性能監控 */
  enablePerformanceMonitoring?: boolean;
  /** 性能指標回調函數 */
  onPerformanceMetrics?: (metrics: ComponentPerformanceMetrics) => void;
}

/**
 * 進度步驟組件屬性介面
 */
interface ProgressStepProps {
  /** 狀態 */
  status: ProgressStatus;
  /** 標籤 */
  label: string;
  /** 詳細資訊 */
  details?: string;
  /** 索引 */
  index: number;
  /** 是否為緊湊模式 */
  isCompact?: boolean;
}

/**
 * 進度步驟子組件
 *
 * @description 渲染單個進度步驟的子組件，支援緊湊和詳細兩種顯示模式
 */
const ProgressStep: React.FC<ProgressStepProps> = React.memo(
  ({ status, label, details, index, isCompact = false }) => {
    const getStatusIcon = () => {
      switch (status) {
        case 'Success':
          return <CheckCircleIcon className='h-5 w-5 text-green-500' />;
        case 'Failed':
          return <XCircleIcon className='h-5 w-5 text-red-500' />;
        case 'Processing':
          return (
            <div className='h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent' />
          );
        default:
          return <ClockIcon className='h-5 w-5 text-gray-400' />;
      }
    };

    const getStatusColor = () => {
      switch (status) {
        case 'Success':
          return 'bg-green-500 border-green-500';
        case 'Failed':
          return 'bg-red-500 border-red-500';
        case 'Processing':
          return 'bg-blue-500 border-blue-500 animate-pulse';
        default:
          return 'bg-gray-400 border-gray-400';
      }
    };

    const getTextColor = () => {
      switch (status) {
        case 'Success':
          return 'text-green-400';
        case 'Failed':
          return 'text-red-400';
        case 'Processing':
          return 'text-blue-400';
        default:
          return 'text-gray-400';
      }
    };

    if (isCompact) {
      return (
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-300 ${getStatusColor()} `}
          title={`${label}: ${status}${details ? ` - ${details}` : ''}`}
        >
          <span className='text-xs font-bold text-white'>
            {status === 'Success' ? '✓' : status === 'Failed' ? '✗' : index + 1}
          </span>
        </div>
      );
    }

    return (
      <div className='flex items-center space-x-3 rounded-xl border border-slate-600/30 bg-gradient-to-r from-slate-800/60 to-slate-700/40 p-4 backdrop-blur-sm transition-all duration-300 hover:border-slate-500/50'>
        <div className='flex-shrink-0'>{getStatusIcon()}</div>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center space-x-2'>
            <span className={`text-sm font-medium ${getTextColor()}`}>{label}</span>
            <span className='rounded-full bg-slate-700/50 px-2 py-1 text-xs text-slate-500'>
              #{index + 1}
            </span>
          </div>
          {details && <p className='mt-1 truncate text-xs text-slate-400'>{details}</p>}
        </div>
        <div className='flex-shrink-0'>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm ${
              status === 'Success'
                ? 'border border-green-500/30 bg-green-500/20 text-green-300'
                : status === 'Failed'
                  ? 'border border-red-500/30 bg-red-500/20 text-red-300'
                  : status === 'Processing'
                    ? 'border border-blue-500/30 bg-blue-500/20 text-blue-300'
                    : 'border border-slate-500/30 bg-slate-500/20 text-slate-300'
            }`}
          >
            {status}
          </span>
        </div>
      </div>
    );
  }
);

/**
 * 增強型進度條組件
 *
 * @description 統一的進度條組件，整合了基礎功能與性能優化功能
 *
 * @features
 * - 支援四種進度狀態：Pending、Processing、Success、Failed
 * - 響應式設計，支援移動端和桌面端
 * - 防抖更新機制，提升大量數據更新時的性能
 * - 性能監控功能，可追蹤渲染性能
 * - 緊湊和詳細兩種顯示模式
 * - 完整的視覺反饋和動畫效果
 *
 * @example
 * ```tsx
 * <EnhancedProgressBar
 *   current={5}
 *   total={10}
 *   status={['Success', 'Success', 'Processing', 'Pending', 'Pending']}
 *   title="Processing Items"
 *   showPercentage={true}
 *   enableDebounce={true}
 * />
 * ```
 */
export const EnhancedProgressBar: React.FC<EnhancedProgressBarProps> = React.memo(
  ({
    current,
    total,
    status,
    items,
    title = 'Progress',
    showPercentage = true,
    showItemDetails = true,
    variant = 'default',
    className = '',
    enableDebounce = true,
    debounceDelay = 100,
    enablePerformanceMonitoring = false,
    onPerformanceMetrics,
  }) => {
    const isMobile = useMediaQuery('(max-width: 768px)');

    // Performance tracking
    const renderCountRef = useRef(0);
    const lastRenderTimeRef = useRef(Date.now());

    // Internal state for debounced values
    const [debouncedState, setDebouncedState] = React.useState({
      current,
      total,
      status,
    });

    // Setup debounced progress updates
    const handleProgressUpdate = useCallback(
      (update: { current?: number; total?: number; status?: ProgressStatus[] }) => {
        setDebouncedState(prev => ({
          ...prev,
          ...update,
        }));
      },
      []
    );

    // Always call the hook to follow React Hooks rules
    const progressDebounceResult = useProgressDebounce(handleProgressUpdate, {
      progressDelay: debounceDelay,
      statusDelay: debounceDelay * 0.5, // Status updates are more frequent
      enableSmartBatching: true,
      maxBatchSize: 5,
    });

    const { updateProgress, flushUpdates, getMetrics } = progressDebounceResult || {
      updateProgress: () => {},
      flushUpdates: () => {},
      getMetrics: () => ({}) as any,
    };

    // Update debounced state when props change
    useEffect(() => {
      if (enableDebounce && updateProgress) {
        updateProgress({ current, total, status });
      } else {
        setDebouncedState({ current, total, status });
      }
    }, [current, total, status, enableDebounce, updateProgress]);

    // Use debounced values for calculations
    const activeState = enableDebounce ? debouncedState : { current, total, status };

    const percentage =
      activeState.total > 0 ? Math.round((activeState.current / activeState.total) * 100) : 0;

    const statusCounts = useMemo(() => {
      const successCount = activeState.status.filter(s => s === 'Success').length;
      const failedCount = activeState.status.filter(s => s === 'Failed').length;
      const processingCount = activeState.status.filter(s => s === 'Processing').length;
      const pendingCount = activeState.status.filter(s => s === 'Pending').length;

      return { successCount, failedCount, processingCount, pendingCount };
    }, [activeState.status]);

    const { successCount, failedCount, processingCount, pendingCount } = statusCounts;

    // Performance monitoring
    useEffect(() => {
      if (enablePerformanceMonitoring) {
        renderCountRef.current++;
        const now = Date.now();
        const renderTime = now - lastRenderTimeRef.current;
        lastRenderTimeRef.current = now;

        if (onPerformanceMetrics && renderCountRef.current % 10 === 0) {
          try {
            const metrics = getMetrics ? getMetrics() : {};
            onPerformanceMetrics({
              ...metrics,
              renderCount: renderCountRef.current,
              averageRenderTime: renderTime,
              renderTime: renderTime,
              updateCount: renderCountRef.current,
              errorCount: 0,
            });
          } catch (error) {
            console.error('[EnhancedProgressBar] Performance monitoring error:', error);
          }
        }
      }
    });

    // Cleanup effect
    useEffect(() => {
      return () => {
        if (flushUpdates) {
          flushUpdates();
        }
      };
    }, [flushUpdates]);

    const getProgressColor = () => {
      if (failedCount > 0) return 'bg-red-500';
      if (processingCount > 0) return 'bg-blue-500';
      if (current === total && total > 0) return 'bg-green-500';
      return 'bg-blue-500';
    };

    if (activeState.total === 0) {
      return null;
    }

    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <h3 className='bg-gradient-to-r from-white to-blue-200 bg-clip-text text-lg font-semibold text-transparent'>
            {title}
          </h3>
          {showPercentage && (
            <div className='flex items-center space-x-3'>
              <span className='rounded-full bg-slate-700/50 px-3 py-1 text-sm text-slate-400'>
                {activeState.current} / {activeState.total}
              </span>
              <span className='bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-xl font-bold text-transparent'>
                {percentage}%
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className='space-y-3'>
          <div className='relative h-4 w-full overflow-hidden rounded-full border border-slate-600/30 bg-slate-700/50 backdrop-blur-sm'>
            {/* 背景光效 */}
            <div className='absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/5 to-blue-500/10'></div>

            {/* 進度條 */}
            <div
              className={`relative h-full overflow-hidden transition-all duration-700 ease-out ${getProgressColor()}`}
              style={{ width: `${percentage}%` }}
            >
              {/* 進度條內部光效 */}
              <div className='absolute inset-0 animate-pulse bg-gradient-to-r from-white/20 via-white/10 to-white/20'></div>

              {/* 移動光效 */}
              {processingCount > 0 && (
                <div className='absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/30 to-transparent'></div>
              )}
            </div>
          </div>

          {/* Status Summary */}
          <div className='flex items-center justify-between text-xs'>
            <div className='flex items-center space-x-4'>
              {successCount > 0 && (
                <div className='flex items-center space-x-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1'>
                  <CheckCircleIcon className='h-4 w-4 text-green-400' />
                  <span className='text-green-300'>{successCount} completed</span>
                </div>
              )}
              {failedCount > 0 && (
                <div className='flex items-center space-x-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1'>
                  <XCircleIcon className='h-4 w-4 text-red-400' />
                  <span className='text-red-300'>{failedCount} failed</span>
                </div>
              )}
              {processingCount > 0 && (
                <div className='flex items-center space-x-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1'>
                  <div className='h-3 w-3 animate-spin rounded-full border border-blue-400 border-t-transparent' />
                  <span className='text-blue-300'>{processingCount} processing</span>
                </div>
              )}
            </div>
            {pendingCount > 0 && (
              <span className='rounded-full bg-slate-700/30 px-3 py-1 text-slate-400'>
                {pendingCount} pending
              </span>
            )}
          </div>
        </div>

        {/* Items Display */}
        {showItemDetails && (
          <div className='space-y-3'>
            {variant === 'compact' || isMobile ? (
              // Compact view for mobile or when specified
              <div className='flex flex-wrap gap-3'>
                {activeState.status.map((itemStatus, index) => (
                  <ProgressStep
                    key={`progress-step-${index}`}
                    status={itemStatus}
                    label={items?.[index]?.label || `Item ${index + 1}`}
                    details={items?.[index]?.details}
                    index={index}
                    isCompact
                  />
                ))}
              </div>
            ) : (
              // Detailed view
              <div className='scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 max-h-64 space-y-3 overflow-y-auto'>
                {activeState.status.map((itemStatus, index) => (
                  <ProgressStep
                    key={`progress-step-detail-${index}`}
                    status={itemStatus}
                    label={items?.[index]?.label || `Pallet ${index + 1}`}
                    details={items?.[index]?.details}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Overall Status */}
        {activeState.current === activeState.total && activeState.total > 0 && (
          <div
            className={`flex items-center justify-center rounded-2xl border p-4 backdrop-blur-sm ${
              failedCount > 0
                ? 'border-red-500/30 bg-gradient-to-r from-red-900/40 to-rose-900/30 text-red-200'
                : 'border-green-500/30 bg-gradient-to-r from-green-900/40 to-emerald-900/30 text-green-200'
            } `}
          >
            {failedCount > 0 ? (
              <>
                <ExclamationTriangleIcon className='mr-3 h-6 w-6 text-red-400' />
                <span className='font-semibold'>
                  Completed with {failedCount} error{failedCount > 1 ? 's' : ''}
                </span>
              </>
            ) : (
              <>
                <CheckCircleIcon className='mr-3 h-6 w-6 text-green-400' />
                <span className='font-semibold'>All items completed successfully!</span>
              </>
            )}
          </div>
        )}
      </div>
    );
  }
);

// Set display names for debugging
ProgressStep.displayName = 'ProgressStep';
EnhancedProgressBar.displayName = 'EnhancedProgressBar';

export default EnhancedProgressBar;
