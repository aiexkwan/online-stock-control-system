/**
 * 記憶體監控儀表板組件 - MemoryDashboard.tsx
 *
 * 職責：
 * - 顯示即時記憶體使用情況
 * - 監控組件記憶體指標
 * - 提供記憶體洩漏警告
 * - 支援手動記憶體清理操作
 *
 * 注意：此組件僅在開發環境中顯示
 */

'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  RotateCcw,
  Trash2,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  Minus,
  Database,
  Timer,
  Headphones,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { memoryManager, type MemoryLeakWarning } from '../utils/memoryManager';
import { leakDetector, type DetectionResult } from '../utils/leakDetector';

// 組件屬性
export interface MemoryDashboardProps {
  /** 是否顯示儀表板 */
  visible?: boolean;
  /** 自定義className */
  className?: string;
  /** 位置 */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * 記憶體監控儀表板組件
 *
 * 僅在開發環境中渲染，提供即時的記憶體監控和調試功能
 */
export const MemoryDashboard: React.FC<MemoryDashboardProps> = memo(
  ({ visible = true, className, position = 'bottom-right' }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [memoryReport, setMemoryReport] = useState<any>(null);
    const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
    const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

    // 刷新記憶體數據
    const refreshData = useCallback(() => {
      const report = memoryManager.getMemoryReport();
      const detection = leakDetector.getLatestResult();

      setMemoryReport(report);
      setDetectionResult(detection);
    }, []);

    // 手動觸發檢測
    const runDetection = useCallback(() => {
      const result = leakDetector.detectNow();
      setDetectionResult(result);
    }, []);

    // 清理所有記憶體
    const cleanupAll = useCallback(() => {
      memoryManager.clearAll();
      refreshData();
    }, [refreshData]);

    // 啟動自動刷新
    useEffect(() => {
      refreshData();

      if (isExpanded) {
        const interval = setInterval(refreshData, 2000); // 每2秒刷新
        setRefreshInterval(interval);

        return () => {
          if (interval) {
            clearInterval(interval);
          }
        };
      }
    }, [isExpanded, refreshData]);

    // 清理定時器
    useEffect(() => {
      return () => {
        if (refreshInterval) {
          clearInterval(refreshInterval);
        }
      };
    }, [refreshInterval]);

    // 只在開發環境顯示
    if (process.env.NODE_ENV !== 'development' || !visible) {
      return null;
    }

    // 獲取位置樣式
    const getPositionStyles = () => {
      const base = 'fixed z-50';
      switch (position) {
        case 'top-left':
          return `${base} top-4 left-4`;
        case 'top-right':
          return `${base} top-4 right-4`;
        case 'bottom-left':
          return `${base} bottom-4 left-4`;
        case 'bottom-right':
        default:
          return `${base} bottom-4 right-4`;
      }
    };

    // 獲取健康狀態顏色
    const getHealthColor = (score: number) => {
      if (score >= 80) return 'text-green-400';
      if (score >= 60) return 'text-yellow-400';
      if (score >= 40) return 'text-orange-400';
      return 'text-red-400';
    };

    // 獲取嚴重性顏色
    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case 'low':
          return 'text-blue-400';
        case 'medium':
          return 'text-yellow-400';
        case 'high':
          return 'text-orange-400';
        case 'critical':
          return 'text-red-400';
        default:
          return 'text-gray-400';
      }
    };

    // 獲取趨勢圖標
    const getTrendIcon = (trend: string) => {
      switch (trend) {
        case 'increasing':
          return <TrendingUp className='h-3 w-3 text-red-400' />;
        case 'decreasing':
          return <TrendingDown className='h-3 w-3 text-green-400' />;
        default:
          return <Minus className='h-3 w-3 text-gray-400' />;
      }
    };

    const healthScore = detectionResult?.healthScore || 100;
    const totalMemory = memoryReport?.totalMemoryUsage || 0;
    const warningCount = memoryReport?.warnings?.length || 0;

    return (
      <div className={cn(getPositionStyles(), className)}>
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className='rounded-lg border border-white/20 bg-black/80 shadow-2xl backdrop-blur-lg'
          >
            {!isExpanded ? (
              // 收起狀態 - 顯示基本指標
              <motion.div
                className='cursor-pointer select-none p-3'
                onClick={() => setIsExpanded(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className='flex items-center gap-2'>
                  <Activity className='h-4 w-4 text-blue-400' />
                  <div className='flex items-center gap-3 text-xs'>
                    <div className='flex items-center gap-1'>
                      <span className='text-gray-300'>Health:</span>
                      <span className={cn('font-bold', getHealthColor(healthScore))}>
                        {healthScore}%
                      </span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Database className='h-3 w-3 text-purple-400' />
                      <span className='text-gray-300'>{totalMemory.toFixed(1)}MB</span>
                    </div>
                    {warningCount > 0 && (
                      <div className='flex items-center gap-1'>
                        <AlertTriangle className='h-3 w-3 text-orange-400' />
                        <span className='text-orange-400'>{warningCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              // 展開狀態 - 詳細儀表板
              <motion.div
                initial={{ height: 'auto', opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className='max-h-96 w-80 overflow-hidden'
              >
                {/* 標題列 */}
                <div className='border-b border-white/10 p-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Activity className='h-4 w-4 text-blue-400' />
                      <span className='text-sm font-semibold text-white'>Memory Monitor</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <button
                        onClick={runDetection}
                        className='rounded p-1 transition-colors hover:bg-white/10'
                        title='Run Detection'
                      >
                        <RotateCcw className='h-3 w-3 text-gray-400' />
                      </button>
                      <button
                        onClick={cleanupAll}
                        className='rounded p-1 transition-colors hover:bg-white/10'
                        title='Cleanup All'
                      >
                        <Trash2 className='h-3 w-3 text-red-400' />
                      </button>
                      <button
                        onClick={() => setIsExpanded(false)}
                        className='rounded p-1 transition-colors hover:bg-white/10'
                        title='Minimize'
                      >
                        <EyeOff className='h-3 w-3 text-gray-400' />
                      </button>
                    </div>
                  </div>
                </div>

                <div className='max-h-72 space-y-3 overflow-y-auto p-3'>
                  {/* 健康評分 */}
                  <div className='flex items-center justify-between'>
                    <span className='text-xs text-gray-300'>Health Score</span>
                    <div className='flex items-center gap-2'>
                      <span className={cn('text-sm font-bold', getHealthColor(healthScore))}>
                        {healthScore}%
                      </span>
                      {healthScore >= 80 ? (
                        <CheckCircle className='h-4 w-4 text-green-400' />
                      ) : (
                        <AlertTriangle className='h-4 w-4 text-orange-400' />
                      )}
                    </div>
                  </div>

                  {/* 記憶體指標 */}
                  {memoryReport && (
                    <div className='space-y-2'>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs text-gray-300'>Total Memory</span>
                        <div className='flex items-center gap-1'>
                          <span className='text-xs text-white'>{totalMemory.toFixed(1)} MB</span>
                          {detectionResult?.memorySnapshot &&
                            getTrendIcon(detectionResult.memorySnapshot.memoryTrend)}
                        </div>
                      </div>

                      <div className='flex items-center justify-between'>
                        <span className='text-xs text-gray-300'>Components</span>
                        <span className='text-xs text-white'>{memoryReport.totalComponents}</span>
                      </div>

                      {detectionResult?.memorySnapshot && (
                        <>
                          <div className='flex items-center justify-between'>
                            <span className='text-xs text-gray-300'>Active Listeners</span>
                            <div className='flex items-center gap-1'>
                              <Headphones className='h-3 w-3 text-blue-400' />
                              <span className='text-xs text-white'>
                                {detectionResult.memorySnapshot.activeListeners}
                              </span>
                            </div>
                          </div>

                          <div className='flex items-center justify-between'>
                            <span className='text-xs text-gray-300'>Active Timers</span>
                            <div className='flex items-center gap-1'>
                              <Timer className='h-3 w-3 text-purple-400' />
                              <span className='text-xs text-white'>
                                {detectionResult.memorySnapshot.activeTimers}
                              </span>
                            </div>
                          </div>

                          <div className='flex items-center justify-between'>
                            <span className='text-xs text-gray-300'>Pending Promises</span>
                            <div className='flex items-center gap-1'>
                              <Target className='h-3 w-3 text-yellow-400' />
                              <span className='text-xs text-white'>
                                {detectionResult.memorySnapshot.pendingPromises}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* 組件摘要 */}
                  {memoryReport?.componentSummary && memoryReport.componentSummary.length > 0 && (
                    <div className='space-y-1'>
                      <div className='border-b border-white/10 pb-1 text-xs text-gray-300'>
                        Components
                      </div>
                      <div className='max-h-16 space-y-1 overflow-y-auto'>
                        {memoryReport.componentSummary
                          .slice(0, 5)
                          .map((comp: any, index: number) => (
                            <div key={index} className='flex items-center justify-between text-xs'>
                              <span className='truncate text-gray-300'>{comp.name}</span>
                              <div className='flex items-center gap-1'>
                                <span className='text-white'>{comp.memoryUsage.toFixed(1)}MB</span>
                                <span className='text-gray-500'>({comp.renderCount} renders)</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* 問題警告 */}
                  {detectionResult?.issues && detectionResult.issues.length > 0 && (
                    <div className='space-y-1'>
                      <div className='border-b border-white/10 pb-1 text-xs text-gray-300'>
                        Issues
                      </div>
                      <div className='max-h-20 space-y-1 overflow-y-auto'>
                        {detectionResult.issues.slice(0, 3).map((issue, index) => (
                          <div key={index} className='text-xs'>
                            <div className='flex items-start gap-1'>
                              <AlertTriangle
                                className={cn('mt-0.5 h-3 w-3', getSeverityColor(issue.severity))}
                              />
                              <div className='flex-1'>
                                <div
                                  className={cn('font-medium', getSeverityColor(issue.severity))}
                                >
                                  {issue.component}
                                </div>
                                <div className='truncate text-xs text-gray-400'>
                                  {issue.description}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 建議 */}
                  {detectionResult?.recommendations &&
                    detectionResult.recommendations.length > 0 && (
                      <div className='space-y-1'>
                        <div className='border-b border-white/10 pb-1 text-xs text-gray-300'>
                          Recommendations
                        </div>
                        <div className='max-h-16 space-y-1 overflow-y-auto'>
                          {detectionResult.recommendations.slice(0, 2).map((rec, index) => (
                            <div key={index} className='text-xs text-gray-400'>
                              {rec.replace(/^[🔥🧹📊👂🛑⏰🎯🔄⚡📈💡]+\s*/, '')}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }
);

// 設置顯示名稱
MemoryDashboard.displayName = 'MemoryDashboard';

export default MemoryDashboard;
