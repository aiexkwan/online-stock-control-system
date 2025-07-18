/**
 * useLoading Hook
 * 智能載入狀態管理 Hook
 * 
 * 提供簡單易用的載入狀態管理接口
 */

'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useLoadingContext } from '../contexts/LoadingContext';
import { UseLoadingOptions, UseLoadingResult, LoadingType, LoadingPriority } from '../types';

/**
 * 主要載入 Hook
 */
export function useLoading(options: UseLoadingOptions): UseLoadingResult {
  const {
    id,
    type = 'component',
    priority = 'medium',
    strategy,
    autoStart = false,
  } = options;

  const {
    startLoading: contextStartLoading,
    stopLoading: contextStopLoading,
    updateProgress: contextUpdateProgress,
    updateText: contextUpdateText,
    setError: contextSetError,
    getLoadingState,
  } = useLoadingContext();

  // 獲取當前載入狀態
  const loadingState = useMemo(() => {
    return getLoadingState(id);
  }, [getLoadingState, id]);

  // 開始載入
  const startLoading = useCallback((text?: string) => {
    contextStartLoading({
      id,
      type,
      priority,
      text,
      strategy,
    });
  }, [contextStartLoading, id, type, priority, strategy]);

  // 結束載入
  const stopLoading = useCallback(() => {
    contextStopLoading(id);
  }, [contextStopLoading, id]);

  // 更新進度
  const updateProgress = useCallback((progress: number) => {
    contextUpdateProgress(id, progress);
  }, [contextUpdateProgress, id]);

  // 更新文字
  const updateText = useCallback((text: string) => {
    contextUpdateText(id, text);
  }, [contextUpdateText, id]);

  // 設置錯誤
  const setError = useCallback((error: string) => {
    contextSetError(id, error);
  }, [contextSetError, id]);

  // 自動開始載入
  useEffect(() => {
    if (autoStart) {
      startLoading();
    }
  }, [autoStart, startLoading]);

  // 組件卸載時清理
  useEffect(() => {
    return () => {
      if (loadingState?.isLoading) {
        stopLoading();
      }
    };
  }, [loadingState?.isLoading, stopLoading]);

  return {
    isLoading: loadingState?.isLoading || false,
    progress: loadingState?.progress,
    text: loadingState?.text,
    error: loadingState?.error,
    startLoading,
    stopLoading,
    updateProgress,
    updateText,
    setError,
    loadingState,
  };
}

/**
 * 簡化版載入 Hook - 用於快速載入狀態
 */
export function useSimpleLoading(
  id: string,
  type: LoadingType = 'component',
  autoStart: boolean = false
) {
  return useLoading({
    id,
    type,
    autoStart,
  });
}

/**
 * API 載入 Hook - 專門用於 API 請求
 */
export function useApiLoading(id: string, priority: LoadingPriority = 'medium') {
  return useLoading({
    id,
    type: 'api',
    priority,
    strategy: {
      useSkeleton: false,
      showProgress: false,
    },
  });
}

/**
 * 頁面載入 Hook - 專門用於頁面級載入
 */
export function usePageLoading(id: string = 'page-loading') {
  return useLoading({
    id,
    type: 'page',
    priority: 'high',
    strategy: {
      useSkeleton: true,
      showProgress: true,
    },
  });
}

/**
 * Widget 載入 Hook - 專門用於 Widget 組件
 */
export function useWidgetLoading(widgetId: string, priority: LoadingPriority = 'medium') {
  return useLoading({
    id: `widget-${widgetId}`,
    type: 'widget',
    priority,
    strategy: {
      useSkeleton: true,
      showProgress: false,
    },
  });
}

/**
 * 圖片載入 Hook - 專門用於圖片載入
 */
export function useImageLoading(imageId: string) {
  return useLoading({
    id: `image-${imageId}`,
    type: 'image',
    priority: 'low',
    strategy: {
      useSkeleton: true,
      showProgress: false,
    },
  });
}

/**
 * 批量載入 Hook - 管理多個載入狀態
 */
export function useBatchLoading(ids: string[], type: LoadingType = 'component') {
  const {
    startLoading: contextStartLoading,
    stopLoading: contextStopLoading,
    updateProgress: contextUpdateProgress,
    updateText: contextUpdateText,
    setError: contextSetError,
    getLoadingState,
  } = useLoadingContext();

  const loadingStates = useMemo(() => {
    return ids.map(id => getLoadingState(id));
  }, [ids, getLoadingState]);

  const isAnyLoading = useMemo(() => {
    return loadingStates.some(state => state?.isLoading ?? false);
  }, [loadingStates]);

  const isAllLoading = useMemo(() => {
    return loadingStates.length > 0 && loadingStates.every(state => state?.isLoading ?? false);
  }, [loadingStates]);

  const totalProgress = useMemo(() => {
    const progressValues = loadingStates
      .map(state => state?.progress)
      .filter((progress): progress is number => progress !== undefined);
    
    if (progressValues.length === 0) return undefined;
    
    return progressValues.reduce((sum, progress) => sum + progress, 0) / progressValues.length;
  }, [loadingStates]);

  const startAll = useCallback((text?: string) => {
    ids.forEach(id => {
      contextStartLoading({
        id,
        type,
        text,
      });
    });
  }, [ids, type, contextStartLoading]);

  const stopAll = useCallback(() => {
    ids.forEach(id => {
      contextStopLoading(id);
    });
  }, [ids, contextStopLoading]);

  const errors = useMemo(() => {
    return loadingStates
      .map(state => state?.error)
      .filter((error): error is string => error !== undefined);
  }, [loadingStates]);

  return {
    states: loadingStates,
    isAnyLoading,
    isAllLoading,
    totalProgress,
    startAll,
    stopAll,
    errors,
  };
}