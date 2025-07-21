/**
 * useInViewport Hook
 * 使用 Intersection Observer API 檢測元素是否在視窗內
 * Week 2 Day 3: Progressive Loading for Charts
 */

import { useState, useEffect, useRef, useCallback, RefObject } from 'react';

interface UseInViewportOptions {
  /**
   * 觸發的閾值 (0.0 - 1.0)
   * 0.0 = 任何部分可見時觸發
   * 1.0 = 完全可見時觸發
   */
  threshold?: number | number[];

  /**
   * 根元素的邊距，擴展或縮小根的邊界框
   * 例如: "10px" 或 "10px 20px 30px 40px"
   */
  rootMargin?: string;

  /**
   * 自訂根元素，默認為視窗
   */
  root?: Element | null;

  /**
   * 是否只觸發一次
   */
  triggerOnce?: boolean;

  /**
   * 延遲執行時間 (毫秒)
   */
  delay?: number;

  /**
   * 是否禁用觀察器
   */
  disabled?: boolean;

  /**
   * 進入視窗時的回調
   */
  onEnter?: (entry: IntersectionObserverEntry) => void;

  /**
   * 離開視窗時的回調
   */
  onLeave?: (entry: IntersectionObserverEntry) => void;
}

interface UseInViewportReturn {
  /**
   * 是否在視窗內
   */
  isInViewport: boolean;

  /**
   * 是否曾經進入過視窗 (用於 triggerOnce 模式)
   */
  hasBeenInViewport: boolean;

  /**
   * Intersection Observer Entry 對象
   */
  entry: IntersectionObserverEntry | null;

  /**
   * 手動重新觀察
   */
  observe: () => void;

  /**
   * 停止觀察
   */
  unobserve: () => void;
}

export function useInViewport<T extends Element = HTMLDivElement>(
  targetRef: RefObject<T>,
  options: UseInViewportOptions = {}
): UseInViewportReturn {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    root = null,
    triggerOnce = false,
    delay = 0,
    disabled = false,
    onEnter,
    onLeave,
  } = options;

  const [isInViewport, setIsInViewport] = useState(false);
  const [hasBeenInViewport, setHasBeenInViewport] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 處理 intersection 變化
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      setEntry(entry);

      const executeCallback = () => {
        const isCurrentlyInViewport = entry.isIntersecting;

        setIsInViewport(isCurrentlyInViewport);

        if (isCurrentlyInViewport) {
          setHasBeenInViewport(true);
          onEnter?.(entry);

          // 如果是 triggerOnce 模式，在進入後停止觀察
          if (triggerOnce && observerRef.current && targetRef.current) {
            observerRef.current.unobserve(targetRef.current);
          }
        } else {
          onLeave?.(entry);
        }
      };

      // 應用延遲
      if (delay > 0) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(executeCallback, delay);
      } else {
        executeCallback();
      }
    },
    [delay, onEnter, onLeave, triggerOnce, targetRef]
  );

  // 手動開始觀察
  const observe = useCallback(() => {
    if (!targetRef.current || disabled) return;

    // 清理現有的觀察器
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // 創建新的觀察器
    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
      root,
    });

    observerRef.current.observe(targetRef.current);
  }, [targetRef, disabled, handleIntersection, threshold, rootMargin, root]);

  // 停止觀察
  const unobserve = useCallback(() => {
    if (observerRef.current && targetRef.current) {
      observerRef.current.unobserve(targetRef.current);
    }
  }, [targetRef]);

  // 設置和清理觀察器
  useEffect(() => {
    if (disabled) return;

    // 檢查瀏覽器支援
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver is not supported');
      // Fallback: 假設元素總是可見
      setIsInViewport(true);
      setHasBeenInViewport(true);
      return;
    }

    observe();

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [observe, disabled]);

  // 處理 triggerOnce 模式
  useEffect(() => {
    if (triggerOnce && hasBeenInViewport && observerRef.current && targetRef.current) {
      observerRef.current.unobserve(targetRef.current);
    }
  }, [triggerOnce, hasBeenInViewport, targetRef]);

  return {
    isInViewport,
    hasBeenInViewport,
    entry,
    observe,
    unobserve,
  };
}

/**
 * 專門用於圖表懶加載的 hook
 * 預設配置適合圖表組件的需求
 */
export function useChartInViewport<T extends Element = HTMLDivElement>(
  targetRef: RefObject<T>,
  options: Omit<UseInViewportOptions, 'threshold' | 'rootMargin' | 'triggerOnce'> & {
    threshold?: number | number[];
    rootMargin?: string;
    triggerOnce?: boolean;
  } = {}
): UseInViewportReturn {
  return useInViewport(targetRef, {
    threshold: 0.1, // 10% 可見時觸發
    rootMargin: '50px', // 提前 50px 開始加載
    triggerOnce: true, // 只觸發一次，避免重複加載
    ...options,
  });
}

/**
 * 使用函數式組件的 ref 創建器
 * 當你需要動態創建 ref 時使用
 */
export function useInViewportWithRef<T extends Element = HTMLDivElement>(
  options: UseInViewportOptions = {}
): UseInViewportReturn & { ref: RefObject<T> } {
  const ref = useRef<T>(null);
  const viewport = useInViewport(ref, options);

  return {
    ...viewport,
    ref,
  };
}

/**
 * 多元素觀察 hook
 * 可以同時觀察多個元素
 */
export function useMultipleInViewport<T extends Element = HTMLDivElement>(
  refs: RefObject<T>[],
  options: UseInViewportOptions = {}
): Record<number, UseInViewportReturn> {
  const results: Record<number, UseInViewportReturn> = {};

  refs.forEach((ref, index) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[index] = useInViewport(ref, options);
  });

  return results;
}

/**
 * 預定義的常用配置
 */
export const InViewportPresets = {
  // 立即觸發 (任何部分可見)
  immediate: {
    threshold: 0,
    rootMargin: '0px',
    triggerOnce: true,
  },

  // 延遲觸發 (提前加載)
  preload: {
    threshold: 0,
    rootMargin: '200px',
    triggerOnce: true,
  },

  // 完全可見時觸發
  fullyVisible: {
    threshold: 1.0,
    rootMargin: '0px',
    triggerOnce: false,
  },

  // 圖表專用 (平衡性能和用戶體驗)
  chart: {
    threshold: 0.1,
    rootMargin: '50px',
    triggerOnce: true,
    delay: 100, // 稍微延遲避免頻繁觸發
  },

  // 重型組件 (更大的預加載範圍)
  heavy: {
    threshold: 0,
    rootMargin: '300px',
    triggerOnce: true,
    delay: 200,
  },
} as const;

export default useInViewport;
