/**
 * Loading Provider
 * 載入狀態 Provider 管理器
 *
 * 提供全局載入狀態管理、性能感知和智能載入策略
 * 與 NewPennine 現有的性能監控系統整合
 */

'use client';

import React, { ReactNode, useCallback, useMemo, useReducer, useRef, useEffect } from 'react';
import { LoadingContext } from '../contexts/LoadingContext';
import { LoadingState, LoadingContextValue, StartLoadingOptions } from '../types';
import { createLoadingStrategy } from '../strategies/LoadingStrategy';
import { PerformanceDetector } from '../utils/performanceDetector';
import { logger } from '@/lib/logger';

// Loading State Actions
type LoadingAction =
  | { type: 'START_LOADING'; payload: LoadingState }
  | { type: 'STOP_LOADING'; payload: string }
  | { type: 'UPDATE_PROGRESS'; payload: { id: string; progress: number } }
  | { type: 'UPDATE_TEXT'; payload: { id: string; text: string } }
  | { type: 'SET_ERROR'; payload: { id: string; error: string } }
  | { type: 'CLEAR_ALL' }
  | { type: 'CLEANUP_EXPIRED' };

// Loading State Reducer
function loadingReducer(
  state: Map<string, LoadingState>,
  action: LoadingAction
): Map<string, LoadingState> {
  const newState = new Map(state);

  switch (action.type) {
    case 'START_LOADING':
      newState.set(action.payload.id, action.payload);
      break;

    case 'STOP_LOADING':
      newState.delete(action.payload);
      break;

    case 'UPDATE_PROGRESS':
      const progressState = newState.get(action.payload.id);
      if (progressState) {
        newState.set(action.payload.id, {
          ...progressState,
          progress: action.payload.progress,
        });
      }
      break;

    case 'UPDATE_TEXT':
      const textState = newState.get(action.payload.id);
      if (textState) {
        newState.set(action.payload.id, {
          ...textState,
          text: action.payload.text,
        });
      }
      break;

    case 'SET_ERROR':
      const errorState = newState.get(action.payload.id);
      if (errorState) {
        newState.set(action.payload.id, {
          ...errorState,
          error: action.payload.error,
          isLoading: false,
        });
      }
      break;

    case 'CLEAR_ALL':
      newState.clear();
      break;

    case 'CLEANUP_EXPIRED':
      const now = Date.now();
      const expiredKeys: string[] = [];

      newState.forEach((loadingState, key) => {
        // 清理超過 5 分鐘的載入狀態
        if (now - loadingState.startTime > 5 * 60 * 1000) {
          expiredKeys.push(key);
        }
      });

      expiredKeys.forEach(key => newState.delete(key));
      break;

    default:
      return state;
  }

  return newState;
}

interface LoadingProviderProps {
  children: ReactNode;
  /** 是否啟用性能感知載入 */
  enablePerformanceAware?: boolean;
  /** 是否啟用自動清理 */
  enableAutoCleanup?: boolean;
  /** 清理間隔 (ms) */
  cleanupInterval?: number;
}

export function LoadingProvider({
  children,
  enablePerformanceAware = true,
  enableAutoCleanup = true,
  cleanupInterval = 60000, // 1 分鐘
}: LoadingProviderProps) {
  const [loadingStates, dispatch] = useReducer(loadingReducer, new Map<string, LoadingState>());
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const performanceDetector = useRef<PerformanceDetector>();

  // 初始化性能檢測器
  useEffect(() => {
    if (enablePerformanceAware) {
      performanceDetector.current = new PerformanceDetector();
    }
  }, [enablePerformanceAware]);

  // 自動清理過期載入狀態
  useEffect(() => {
    if (!enableAutoCleanup) return;

    const interval = setInterval(() => {
      dispatch({ type: 'CLEANUP_EXPIRED' });
    }, cleanupInterval);

    return () => clearInterval(interval);
  }, [enableAutoCleanup, cleanupInterval]);

  // 計算全局載入狀態
  const isGlobalLoading = useMemo(() => {
    return Array.from(loadingStates.values()).some(state => state.isLoading);
  }, [loadingStates]);

  // 開始載入
  const startLoading = useCallback(
    (options: StartLoadingOptions) => {
      const {
        id,
        type,
        priority = 'medium',
        text,
        strategy: userStrategy,
        estimatedDuration,
      } = options;

      // 清除現有的超時計時器
      const existingTimeout = timeoutsRef.current.get(id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        timeoutsRef.current.delete(id);
      }

      // 創建載入策略
      const strategy = createLoadingStrategy(
        type,
        priority,
        userStrategy,
        enablePerformanceAware ? performanceDetector.current?.getMetrics() : undefined
      );

      const loadingState: LoadingState = {
        id,
        isLoading: true,
        type,
        priority,
        text,
        startTime: Date.now(),
        estimatedDuration,
        strategy,
      };

      // 防抖處理
      if (strategy.debounceTime && strategy.debounceTime > 0) {
        const debounceTimeout = setTimeout(() => {
          dispatch({ type: 'START_LOADING', payload: loadingState });
          timeoutsRef.current.delete(id);

          logger.debug(
            {
              id,
              type,
              priority,
              debounceTime: strategy.debounceTime,
            },
            'Loading started after debounce'
          );
        }, strategy.debounceTime);

        timeoutsRef.current.set(id, debounceTimeout);
        return;
      }

      // 立即開始載入
      dispatch({ type: 'START_LOADING', payload: loadingState });

      // 設置超時處理
      if (strategy.timeout && strategy.timeout > 0) {
        const timeoutId = setTimeout(() => {
          dispatch({
            type: 'SET_ERROR',
            payload: {
              id,
              error: 'Loading timeout',
            },
          });
          timeoutsRef.current.delete(id);

          logger.warn({ id, timeout: strategy.timeout }, 'Loading timeout');
        }, strategy.timeout);

        timeoutsRef.current.set(id, timeoutId);
      }

      logger.debug({ id, type, priority, strategy }, 'Loading started');
    },
    [enablePerformanceAware]
  );

  // 結束載入
  const stopLoading = useCallback(
    (id: string) => {
      const state = loadingStates.get(id);
      if (!state) return;

      // 清除超時計時器
      const timeout = timeoutsRef.current.get(id);
      if (timeout) {
        clearTimeout(timeout);
        timeoutsRef.current.delete(id);
      }

      // 檢查最小顯示時間
      const minShowTime = state.strategy?.minShowTime || 0;
      const elapsedTime = Date.now() - state.startTime;

      if (minShowTime > 0 && elapsedTime < minShowTime) {
        const remainingTime = minShowTime - elapsedTime;

        setTimeout(() => {
          dispatch({ type: 'STOP_LOADING', payload: id });
          logger.debug({ id, elapsedTime, minShowTime }, 'Loading stopped after min show time');
        }, remainingTime);

        return;
      }

      // 立即結束載入
      dispatch({ type: 'STOP_LOADING', payload: id });

      logger.debug(
        {
          id,
          elapsedTime,
          estimatedDuration: state.estimatedDuration,
        },
        'Loading stopped'
      );
    },
    [loadingStates]
  );

  // 更新進度
  const updateProgress = useCallback((id: string, progress: number) => {
    const clampedProgress = Math.max(0, Math.min(100, progress));
    dispatch({
      type: 'UPDATE_PROGRESS',
      payload: { id, progress: clampedProgress },
    });

    logger.debug({ id, progress: clampedProgress }, 'Loading progress updated');
  }, []);

  // 更新文字
  const updateText = useCallback((id: string, text: string) => {
    dispatch({ type: 'UPDATE_TEXT', payload: { id, text } });
  }, []);

  // 設置錯誤
  const setError = useCallback((id: string, error: string) => {
    dispatch({ type: 'SET_ERROR', payload: { id, error } });

    // 清除超時計時器
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }

    logger.error({ id, error }, 'Loading error set');
  }, []);

  // 清除所有載入狀態
  const clearAll = useCallback(() => {
    // 清除所有超時計時器
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();

    dispatch({ type: 'CLEAR_ALL' });

    logger.debug('All loading states cleared');
  }, []);

  // 獲取載入狀態
  const getLoadingState = useCallback(
    (id: string) => {
      return loadingStates.get(id);
    },
    [loadingStates]
  );

  // Context Value
  const contextValue: LoadingContextValue = useMemo(
    () => ({
      loadingStates,
      isGlobalLoading,
      startLoading,
      stopLoading,
      updateProgress,
      updateText,
      setError,
      clearAll,
      getLoadingState,
    }),
    [
      loadingStates,
      isGlobalLoading,
      startLoading,
      stopLoading,
      updateProgress,
      updateText,
      setError,
      clearAll,
      getLoadingState,
    ]
  );

  // 清理效果
  useEffect(() => {
    // 在 effect 內部捕獲 ref
    const timeouts = timeoutsRef;

    return () => {
      // 使用捕獲的 ref
      timeouts.current.forEach(timeout => clearTimeout(timeout));
      timeouts.current.clear();
    };
  }, []);

  return <LoadingContext.Provider value={contextValue}>{children}</LoadingContext.Provider>;
}
