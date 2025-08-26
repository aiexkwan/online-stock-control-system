/**
 * useSmartLoading Hook
 * 智能性能感知載入 Hook
 *
 * 根據網絡狀況和設備性能自動調整載入策略
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLoading } from './useLoading';
import { PerformanceDetector } from '../utils/performanceDetector';
import { getPerformanceAwareStrategySuggestion } from '../strategies/LoadingStrategy';
import { UseLoadingOptions, AdaptiveLoadingConfig, PerformanceMetrics } from '../types';
import { logger } from '@/lib/logger';

interface UseSmartLoadingOptions extends Omit<UseLoadingOptions, 'strategy'> {
  /** 是否啟用性能感知 */
  enablePerformanceAware?: boolean;
  /** 是否啟用網絡監控 */
  enableNetworkMonitoring?: boolean;
  /** 自定義性能閾值 */
  performanceThresholds?: {
    slowNetworkThreshold?: number; // Mbps
    lowMemoryThreshold?: number; // GB
    highRttThreshold?: number; // ms
  };
  /** 載入策略覆蓋 */
  strategyOverride?: Partial<AdaptiveLoadingConfig['strategy']>;
}

interface UseSmartLoadingResult {
  isLoading: boolean;
  progress?: number;
  text?: string;
  error?: string;
  startLoading: (text?: string) => void;
  stopLoading: () => void;
  updateProgress: (progress: number) => void;
  updateText: (text: string) => void;
  setError: (error: string) => void;
  // 智能載入特有功能
  performanceMetrics?: PerformanceMetrics;
  adaptiveConfig: AdaptiveLoadingConfig;
  refreshPerformanceMetrics: () => void;
  estimatedLoadTime?: number;
  networkStatus: 'fast' | 'slow' | 'unknown';
  deviceStatus: 'high-end' | 'low-end' | 'unknown';
}

export function useSmartLoading(options: UseSmartLoadingOptions): UseSmartLoadingResult {
  const {
    enablePerformanceAware = true,
    enableNetworkMonitoring = true,
    performanceThresholds = {},
    strategyOverride,
    ...loadingOptions
  } = options;

  const performanceDetector = useRef<PerformanceDetector>();
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>();
  const [adaptiveConfig, setAdaptiveConfig] = useState<AdaptiveLoadingConfig>(() =>
    createDefaultAdaptiveConfig()
  );

  // 更新適應性配置
  const updateAdaptiveConfig = useCallback(
    (metrics: PerformanceMetrics) => {
      const suggestion = getPerformanceAwareStrategySuggestion(metrics);

      const newConfig: AdaptiveLoadingConfig = {
        performanceMetrics: metrics,
        skeleton: {
          enabled: suggestion.useSkeleton,
          complexity: suggestion.complexity,
          animation: suggestion.animation,
        },
        strategy: {
          debounceTime: calculateAdaptiveDebounceTime(metrics),
          timeout: calculateAdaptiveTimeout(metrics),
          minShowTime: calculateAdaptiveMinShowTime(metrics),
          showProgress: suggestion.showProgress,
          ...strategyOverride,
        },
      };

      setAdaptiveConfig(newConfig);
    },
    [strategyOverride]
  );

  // 初始化性能檢測器
  useEffect(() => {
    if (enablePerformanceAware) {
      performanceDetector.current = new PerformanceDetector();
      const metrics = performanceDetector.current.getMetrics();
      if (metrics) {
        setPerformanceMetrics(metrics);
        updateAdaptiveConfig(metrics);
      }
    }
  }, [enablePerformanceAware, updateAdaptiveConfig]);

  // 網絡監控
  useEffect(() => {
    if (!enableNetworkMonitoring || !performanceDetector.current) return;

    const stopMonitoring = performanceDetector.current.startNetworkMonitoring(metrics => {
      setPerformanceMetrics(metrics);
      updateAdaptiveConfig(metrics);

      logger.debug(
        {
          networkType: metrics.networkType,
          effectiveType: metrics.effectiveType,
          downlink: metrics.downlink,
          rtt: metrics.rtt,
        },
        'Network performance updated'
      );
    });

    return stopMonitoring;
  }, [enableNetworkMonitoring, updateAdaptiveConfig]);

  // 創建動態載入策略
  const dynamicStrategy = useMemo(() => {
    return {
      debounceTime: adaptiveConfig.strategy.debounceTime,
      timeout: adaptiveConfig.strategy.timeout,
      minShowTime: adaptiveConfig.strategy.minShowTime,
      useSkeleton: adaptiveConfig.skeleton.enabled,
      showProgress: adaptiveConfig.strategy.showProgress,
      performanceAware: true,
    };
  }, [adaptiveConfig]);

  // 使用基礎載入 Hook
  const loadingResult = useLoading({
    ...loadingOptions,
    strategy: dynamicStrategy,
  });

  // 刷新性能指標
  const refreshPerformanceMetrics = useCallback(() => {
    if (performanceDetector.current) {
      performanceDetector.current.forceUpdate();
      const metrics = performanceDetector.current.getMetrics();
      if (metrics) {
        setPerformanceMetrics(metrics);
        updateAdaptiveConfig(metrics);
      }
    }
  }, [updateAdaptiveConfig]);

  // 計算預估載入時間
  const estimatedLoadTime = useMemo(() => {
    if (!performanceDetector.current || !loadingOptions.type) return undefined;

    // 根據類型估算數據大小
    const estimatedSize = getEstimatedDataSize(loadingOptions.type || 'component');
    return performanceDetector.current.estimateLoadTime(
      estimatedSize,
      loadingOptions.type as 'api' | 'image' | 'component'
    );
  }, [loadingOptions.type]);

  // 網絡狀態
  const networkStatus = useMemo((): 'fast' | 'slow' | 'unknown' => {
    if (!performanceMetrics) return 'unknown';

    const { downlink, networkType, rtt } = performanceMetrics;
    const slowThreshold = performanceThresholds.slowNetworkThreshold || 1;
    const highRttThreshold = performanceThresholds.highRttThreshold || 300;

    if (
      networkType === 'slow-2g' ||
      networkType === '2g' ||
      downlink < slowThreshold ||
      rtt > highRttThreshold
    ) {
      return 'slow';
    } else if (networkType === '4g' && downlink > 5 && rtt < 100) {
      return 'fast';
    }

    return 'unknown';
  }, [performanceMetrics, performanceThresholds]);

  // 設備狀態
  const deviceStatus = useMemo((): 'high-end' | 'low-end' | 'unknown' => {
    if (!performanceMetrics) return 'unknown';

    const { deviceMemory, hardwareConcurrency } = performanceMetrics;
    const lowMemoryThreshold = performanceThresholds.lowMemoryThreshold || 2;

    if (deviceMemory < lowMemoryThreshold || hardwareConcurrency < 2) {
      return 'low-end';
    } else if (deviceMemory >= 4 && hardwareConcurrency >= 4) {
      return 'high-end';
    }

    return 'unknown';
  }, [performanceMetrics, performanceThresholds]);

  return {
    ...loadingResult,
    performanceMetrics,
    adaptiveConfig,
    refreshPerformanceMetrics,
    estimatedLoadTime,
    networkStatus,
    deviceStatus,
  };
}

// 輔助函數

function createDefaultAdaptiveConfig(): AdaptiveLoadingConfig {
  return {
    performanceMetrics: {
      networkType: 'unknown',
      effectiveType: 'unknown',
      downlink: 1,
      rtt: 100,
      deviceMemory: 2,
      hardwareConcurrency: 2,
      isLowEndDevice: false,
      isSlowNetwork: false,
    },
    skeleton: {
      enabled: true,
      complexity: 'medium',
      animation: 'pulse',
    },
    strategy: {
      debounceTime: 200,
      timeout: 15000,
      minShowTime: 200,
      showProgress: true,
    },
  };
}

function calculateAdaptiveDebounceTime(metrics: PerformanceMetrics): number {
  const { isLowEndDevice, isSlowNetwork } = metrics;

  let baseTime = 200;

  if (isLowEndDevice) baseTime *= 1.5;
  if (isSlowNetwork) baseTime *= 1.3;

  return Math.round(baseTime);
}

function calculateAdaptiveTimeout(metrics: PerformanceMetrics): number {
  const { isLowEndDevice, isSlowNetwork, rtt } = metrics;

  let baseTimeout = 15000;

  if (isLowEndDevice) baseTimeout *= 1.5;
  if (isSlowNetwork) baseTimeout *= 2;

  // 根據 RTT 調整
  if (rtt > 500) baseTimeout *= 1.5;

  return Math.round(baseTimeout);
}

function calculateAdaptiveMinShowTime(metrics: PerformanceMetrics): number {
  const { isLowEndDevice } = metrics;

  let baseTime = 200;

  if (isLowEndDevice) baseTime *= 1.2;

  return Math.round(baseTime);
}

function getEstimatedDataSize(type: string): number {
  // 返回估算的數據大小 (bytes)
  const sizes: Record<string, number> = {
    api: 5 * 1024, // 5KB
    component: 10 * 1024, // 10KB
    widget: 15 * 1024, // 15KB
    image: 100 * 1024, // 100KB
    page: 50 * 1024, // 50KB
    data: 8 * 1024, // 8KB
  };

  return sizes[type] || 10 * 1024;
}

/**
 * 性能感知 API 載入 Hook
 */
export function useSmartApiLoading(id: string) {
  return useSmartLoading({
    id,
    type: 'api',
    priority: 'medium',
    enablePerformanceAware: true,
    enableNetworkMonitoring: true,
  });
}

/**
 * 性能感知 Card 載入 Hook
 */
export function useSmartWidgetLoading(widgetId: string) {
  return useSmartLoading({
    id: `widget-${widgetId}`,
    type: 'widget',
    priority: 'medium',
    enablePerformanceAware: true,
    enableNetworkMonitoring: true,
  });
}
