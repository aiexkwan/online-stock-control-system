/**
 * Loading Utilities
 * 載入系統輔助工具
 */

import { LoadingType, LoadingPriority, LoadingStrategy } from '../types';

/**
 * 防抖載入函數
 */
export function debounceLoading<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number
): (...args: T) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * 節流載入函數
 */
export function throttleLoading<T extends unknown[]>(
  fn: (...args: T) => void,
  limit: number
): (...args: T) => void {
  let inThrottle: boolean;

  return (...args: T) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 創建載入狀態 ID
 */
export function createLoadingId(prefix: string, suffix?: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}-${timestamp}-${random}${suffix ? `-${suffix}` : ''}`;
}

/**
 * 格式化載入時間
 */
export function formatLoadingDuration(duration: number): string {
  if (duration < 1000) {
    return `${Math.round(duration)}ms`;
  } else if (duration < 60000) {
    return `${(duration / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}

/**
 * 計算載入進度
 */
export function calculateProgress(
  currentStep: number,
  totalSteps: number,
  stepProgress: number = 100
): number {
  const baseProgress = (currentStep / totalSteps) * 100;
  const currentStepProgress = (stepProgress / 100) * (100 / totalSteps);
  return Math.min(100, baseProgress + currentStepProgress);
}

/**
 * 載入狀態優先級比較
 */
export function comparePriority(a: LoadingPriority, b: LoadingPriority): number {
  const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
  return priorityOrder[b] - priorityOrder[a];
}

/**
 * 檢查載入狀態是否過期
 */
export function isLoadingExpired(startTime: number, timeout: number = 30000): boolean {
  return Date.now() - startTime > timeout;
}

/**
 * 生成載入提示訊息
 */
export function generateLoadingMessage(type: LoadingType, progress?: number): string {
  const messages = {
    page: ['Loading page...', 'Preparing content...', 'Almost there...'],
    component: ['Loading component...', 'Initializing...', 'Ready soon...'],
    data: ['Fetching data...', 'Processing...', 'Loading complete...'],
    image: ['Loading image...', 'Processing image...', 'Image ready...'],
    api: ['Connecting...', 'Fetching data...', 'Processing response...'],
    widget: ['Loading widget...', 'Preparing display...', 'Widget ready...'],
    background: ['Working in background...', 'Processing...', 'Task complete...'],
  };

  const typeMessages = messages[type] || messages.component;

  if (typeof progress === 'number') {
    if (progress < 30) {
      return typeMessages[0];
    } else if (progress < 80) {
      return typeMessages[1];
    } else {
      return typeMessages[2];
    }
  }

  return typeMessages[0];
}

/**
 * 估算剩餘載入時間
 */
export function estimateRemainingTime(startTime: number, progress: number): number | null {
  if (progress <= 0 || progress >= 100) return null;

  const elapsed = Date.now() - startTime;
  const estimatedTotal = elapsed / (progress / 100);
  return Math.max(0, estimatedTotal - elapsed);
}

/**
 * 載入重試延遲計算（指數退避）
 */
export function calculateRetryDelay(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000,
  jitter: boolean = true
): number {
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

  if (jitter) {
    // 添加 ±25% 的隨機延遲
    const jitterAmount = exponentialDelay * 0.25;
    const randomJitter = (Math.random() - 0.5) * 2 * jitterAmount;
    return Math.max(0, exponentialDelay + randomJitter);
  }

  return exponentialDelay;
}

/**
 * 載入狀態合併
 */
export function mergeLoadingStates(
  states: Array<{ isLoading: boolean; progress?: number; error?: string }>
): {
  isLoading: boolean;
  progress: number;
  hasError: boolean;
  errors: string[];
} {
  const isLoading = states.some(state => state.isLoading);
  const errors = states
    .map(state => state.error)
    .filter((error): error is string => error !== undefined);

  const progressValues = states
    .map(state => state.progress)
    .filter((progress): progress is number => progress !== undefined);

  const averageProgress =
    progressValues.length > 0
      ? progressValues.reduce((sum, progress) => sum + progress, 0) / progressValues.length
      : 0;

  return {
    isLoading,
    progress: averageProgress,
    hasError: errors.length > 0,
    errors,
  };
}

/**
 * 性能友好的載入狀態更新
 */
export function shouldUpdateLoadingState(
  currentProgress: number,
  newProgress: number,
  threshold: number = 1
): boolean {
  return Math.abs(newProgress - currentProgress) >= threshold;
}

/**
 * 載入狀態快照
 */
export interface LoadingSnapshot {
  timestamp: number;
  isLoading: boolean;
  progress?: number;
  duration: number;
  type: LoadingType;
  priority: LoadingPriority;
}

/**
 * 創建載入狀態快照
 */
export function createLoadingSnapshot(
  startTime: number,
  isLoading: boolean,
  progress: number | undefined,
  type: LoadingType,
  priority: LoadingPriority
): LoadingSnapshot {
  return {
    timestamp: Date.now(),
    isLoading,
    progress,
    duration: Date.now() - startTime,
    type,
    priority,
  };
}

/**
 * 載入策略優化建議
 */
export function getLoadingOptimizationSuggestions(snapshots: LoadingSnapshot[]): {
  averageDuration: number;
  suggestedDebounceTime: number;
  suggestedTimeout: number;
  shouldUseSkeleton: boolean;
} {
  if (snapshots.length === 0) {
    return {
      averageDuration: 1000,
      suggestedDebounceTime: 200,
      suggestedTimeout: 15000,
      shouldUseSkeleton: true,
    };
  }

  const durations = snapshots.map(s => s.duration);
  const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;

  // 根據平均載入時間調整建議
  const suggestedDebounceTime = averageDuration < 500 ? 100 : 200;
  const suggestedTimeout = Math.max(15000, averageDuration * 3);
  const shouldUseSkeleton = averageDuration > 300;

  return {
    averageDuration,
    suggestedDebounceTime,
    suggestedTimeout,
    shouldUseSkeleton,
  };
}
