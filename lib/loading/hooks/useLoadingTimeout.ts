/**
 * useLoadingTimeout Hook
 * 載入超時管理 Hook
 * 
 * 提供載入超時檢測、重試機制和錯誤處理
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLoading } from './useLoading';
import { UseLoadingOptions } from '../types';
import { logger } from '@/lib/logger';

interface UseLoadingTimeoutOptions extends UseLoadingOptions {
  /** 超時時間 (ms) */
  timeout?: number;
  /** 重試次數 */
  retryCount?: number;
  /** 重試間隔 (ms) */
  retryDelay?: number;
  /** 超時回調 */
  onTimeout?: (attempt: number) => void;
  /** 重試回調 */
  onRetry?: (attempt: number) => void;
  /** 最終失敗回調 */
  onFinalFailure?: (error: string) => void;
  /** 是否啟用指數退避 */
  exponentialBackoff?: boolean;
}

interface UseLoadingTimeoutResult {
  isLoading: boolean;
  progress?: number;
  text?: string;
  error?: string;
  startLoading: (text?: string) => Promise<void>;
  stopLoading: () => void;
  updateProgress: (progress: number) => void;
  updateText: (text: string) => void;
  setError: (error: string) => void;
  // 超時管理特有功能
  isTimedOut: boolean;
  currentAttempt: number;
  maxAttempts: number;
  timeRemaining?: number;
  retry: () => Promise<void>;
  cancel: () => void;
}

export function useLoadingTimeout(options: UseLoadingTimeoutOptions): UseLoadingTimeoutResult {
  const {
    timeout = 15000,
    retryCount = 3,
    retryDelay = 1000,
    onTimeout,
    onRetry,
    onFinalFailure,
    exponentialBackoff = true,
    ...loadingOptions
  } = options;

  const [isTimedOut, setIsTimedOut] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number>();
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>();
  const countdownRef = useRef<NodeJS.Timeout>();

  const loadingHook = useLoading(loadingOptions);

  const maxAttempts = retryCount + 1; // 包含初始嘗試

  // 清理所有計時器
  const cleanupTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = undefined;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = undefined;
    }
  }, []);

  // 開始倒計時
  const startCountdown = useCallback(() => {
    if (!startTimeRef.current) return;

    setTimeRemaining(timeout);
    
    countdownRef.current = setInterval(() => {
      if (!startTimeRef.current) return;
      
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, timeout - elapsed);
      
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = undefined;
        }
      }
    }, 100); // 每 100ms 更新一次
  }, [timeout]);

  // 處理超時
  const handleTimeout = useCallback(async () => {
    setIsTimedOut(true);
    setTimeRemaining(0);
    
    logger.warn('Loading timeout occurred', {
      id: loadingOptions.id,
      attempt: currentAttempt + 1,
      timeout,
    });

    onTimeout?.(currentAttempt + 1);

    // 如果還有重試次數，自動重試
    if (currentAttempt < retryCount) {
      const nextAttempt = currentAttempt + 1;
      setCurrentAttempt(nextAttempt);
      
      // 計算重試延遲（指數退避）
      const delay = exponentialBackoff 
        ? retryDelay * Math.pow(2, currentAttempt)
        : retryDelay;

      logger.info('Scheduling retry', {
        id: loadingOptions.id,
        attempt: nextAttempt + 1,
        delay,
      });

      retryTimeoutRef.current = setTimeout(async () => {
        onRetry?.(nextAttempt + 1);
        await executeLoading();
      }, delay);
    } else {
      // 達到最大重試次數，最終失敗
      const errorMessage = `Loading failed after ${maxAttempts} attempts (timeout: ${timeout}ms)`;
      loadingHook.setError(errorMessage);
      onFinalFailure?.(errorMessage);
      
      logger.error('Loading finally failed', {
        id: loadingOptions.id,
        maxAttempts,
        timeout,
      });
    }
  }, [currentAttempt, retryCount, retryDelay, exponentialBackoff, timeout, onTimeout, onRetry, onFinalFailure, loadingOptions.id, maxAttempts, loadingHook]);

  // 執行載入邏輯
  const executeLoading = useCallback(async () => {
    cleanupTimers();
    setIsTimedOut(false);
    startTimeRef.current = Date.now();
    
    // 開始載入
    loadingHook.startLoading();
    
    // 開始倒計時
    startCountdown();
    
    // 設置超時
    timeoutRef.current = setTimeout(handleTimeout, timeout);
  }, [cleanupTimers, loadingHook, startCountdown, handleTimeout, timeout]);

  // 開始載入（返回 Promise）
  const startLoading = useCallback(async (text?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 重置狀態
      setCurrentAttempt(0);
      setIsTimedOut(false);
      
      if (text) {
        loadingHook.updateText(text);
      }
      
      executeLoading().then(resolve).catch(reject);
    });
  }, [executeLoading, loadingHook]);

  // 停止載入
  const stopLoading = useCallback(() => {
    cleanupTimers();
    setIsTimedOut(false);
    setTimeRemaining(undefined);
    startTimeRef.current = undefined;
    loadingHook.stopLoading();
  }, [cleanupTimers, loadingHook]);

  // 手動重試
  const retry = useCallback(async (): Promise<void> => {
    if (currentAttempt >= retryCount) {
      logger.warn('Retry called but max attempts reached', {
        id: loadingOptions.id,
        currentAttempt,
        retryCount,
      });
      return;
    }

    const nextAttempt = currentAttempt + 1;
    setCurrentAttempt(nextAttempt);
    
    logger.info('Manual retry triggered', {
      id: loadingOptions.id,
      attempt: nextAttempt + 1,
    });

    onRetry?.(nextAttempt + 1);
    await executeLoading();
  }, [currentAttempt, retryCount, loadingOptions.id, onRetry, executeLoading]);

  // 取消載入
  const cancel = useCallback(() => {
    cleanupTimers();
    setIsTimedOut(false);
    setTimeRemaining(undefined);
    setCurrentAttempt(0);
    startTimeRef.current = undefined;
    loadingHook.stopLoading();
    
    logger.debug('Loading cancelled', {
      id: loadingOptions.id,
    });
  }, [cleanupTimers, loadingOptions.id, loadingHook]);

  // 清理效果
  useEffect(() => {
    return () => {
      cleanupTimers();
    };
  }, [cleanupTimers]);

  // 當載入成功完成時，清理計時器
  useEffect(() => {
    if (!loadingHook.isLoading && !loadingHook.error && startTimeRef.current) {
      cleanupTimers();
      setTimeRemaining(undefined);
      setIsTimedOut(false);
      
      logger.debug('Loading completed successfully', {
        id: loadingOptions.id,
        duration: Date.now() - startTimeRef.current,
        attempt: currentAttempt + 1,
      });
    }
  }, [loadingHook.isLoading, loadingHook.error, cleanupTimers, loadingOptions.id, currentAttempt]);

  return {
    ...loadingHook,
    startLoading,
    stopLoading,
    isTimedOut,
    currentAttempt,
    maxAttempts,
    timeRemaining,
    retry,
    cancel,
  };
}

/**
 * 簡化版超時載入 Hook
 */
export function useSimpleTimeout(
  id: string,
  timeout: number = 10000,
  retryCount: number = 2
) {
  return useLoadingTimeout({
    id,
    timeout,
    retryCount,
    type: 'component',
  });
}

/**
 * API 超時載入 Hook
 */
export function useApiTimeout(
  id: string,
  timeout: number = 15000,
  retryCount: number = 3
) {
  return useLoadingTimeout({
    id,
    type: 'api',
    timeout,
    retryCount,
    exponentialBackoff: true,
  });
}