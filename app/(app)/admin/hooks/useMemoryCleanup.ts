/**
 * 通用記憶體清理 Hook - useMemoryCleanup
 *
 * 職責：
 * - 提供統一的記憶體清理介面
 * - 自動管理組件生命週期中的資源清理
 * - 整合記憶體管理器進行追蹤和監控
 * - 支援 AbortController 和各種清理策略
 */

import { useEffect, useRef, useCallback } from 'react';
import { memoryManager } from '../utils/memoryManager';

// 清理項目類型
export type CleanupItem =
  | (() => void)
  | (() => Promise<void>)
  | AbortController
  | NodeJS.Timeout
  | { cleanup: () => void | Promise<void> };

// Hook 選項
export interface UseMemoryCleanupOptions {
  /** 組件名稱（用於除錯和監控） */
  componentName?: string;
  /** 是否啟用自動記憶體監控 */
  enableMonitoring?: boolean;
  /** 是否在開發環境顯示除錯資訊 */
  enableDebug?: boolean;
  /** 清理超時時間（毫秒） */
  cleanupTimeout?: number;
}

// Hook 返回值
export interface UseMemoryCleanupReturn {
  /** 註冊需要清理的資源 */
  registerCleanup: (item: CleanupItem, id?: string) => string;
  /** 手動移除特定清理項目 */
  removeCleanup: (id: string) => void;
  /** 立即執行所有清理 */
  cleanupNow: () => Promise<void>;
  /** 創建 AbortController 並自動註冊清理 */
  createAbortController: () => AbortController;
  /** 創建定時器並自動註冊清理 */
  createTimer: (
    callback: () => void,
    delay: number,
    type?: 'timeout' | 'interval'
  ) => NodeJS.Timeout;
  /** 註冊 Promise 並自動處理取消 */
  registerPromise: <T>(promise: Promise<T>, onCancel?: () => void) => Promise<T>;
  /** 註冊事件監聽器並自動清理 */
  registerEventListener: <K extends keyof WindowEventMap>(
    target: Window | Document | EventTarget,
    type: K | string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) => void;
  /** 獲取當前註冊的清理項目數量 */
  getCleanupCount: () => number;
}

/**
 * 通用記憶體清理 Hook
 *
 * 使用範例：
 * ```typescript
 * const cleanup = useMemoryCleanup({
 *   componentName: 'MyComponent',
 *   enableMonitoring: true
 * });
 *
 * useEffect(() => {
 *   // 創建 AbortController
 *   const controller = cleanup.createAbortController();
 *
 *   // 創建定時器
 *   const timer = cleanup.createTimer(() => console.log('tick'), 1000, 'interval');
 *
 *   // 註冊事件監聽器
 *   cleanup.registerEventListener(window, 'resize', handleResize);
 *
 *   // 註冊自定義清理
 *   cleanup.registerCleanup(() => {
 *     console.log('Custom cleanup');
 *   });
 * }, []);
 * ```
 */
export const useMemoryCleanup = (options: UseMemoryCleanupOptions = {}): UseMemoryCleanupReturn => {
  const {
    componentName = 'Unknown',
    enableMonitoring = true,
    enableDebug = process.env.NODE_ENV === 'development',
    cleanupTimeout = 5000,
  } = options;

  const cleanupItemsRef = useRef<Map<string, CleanupItem>>(new Map());
  const componentIdRef = useRef<string | null>(null);
  const nextCleanupIdRef = useRef(1);

  // 初始化記憶體監控
  useEffect(() => {
    if (enableMonitoring) {
      componentIdRef.current = memoryManager.registerComponent(componentName);

      if (enableDebug) {
        console.log(
          `🧠 Memory cleanup initialized for ${componentName} (${componentIdRef.current})`
        );
      }
    }

    return () => {
      if (componentIdRef.current) {
        memoryManager.cleanupComponent(componentIdRef.current);
        componentIdRef.current = null;
      }
    };
  }, [componentName, enableMonitoring, enableDebug]);

  /**
   * 執行單個清理項目
   */
  const executeCleanupItem = useCallback(
    async (item: CleanupItem, id: string): Promise<void> => {
      try {
        if (typeof item === 'function') {
          // 函數類型清理
          await item();
        } else if (item && typeof item === 'object') {
          if ('abort' in item && typeof item.abort === 'function') {
            // AbortController
            if (!item.signal.aborted) {
              item.abort();
            }
          } else if ('cleanup' in item && typeof item.cleanup === 'function') {
            // 自定義清理對象
            await item.cleanup();
          } else if (typeof item === 'object' && 'hasRef' in item) {
            // NodeJS.Timeout (定時器)
            clearTimeout(item);
            clearInterval(item);
          }
        }

        if (enableDebug) {
          console.log(`✅ Cleaned up item: ${id}`);
        }
      } catch (error) {
        console.warn(`❌ Failed to cleanup item ${id}:`, error);
      }
    },
    [enableDebug]
  );

  /**
   * 生成唯一的清理項目 ID
   */
  const generateCleanupId = useCallback(
    (customId?: string): string => {
      if (customId) {
        return `${componentName}_${customId}`;
      }
      return `${componentName}_cleanup_${nextCleanupIdRef.current++}`;
    },
    [componentName]
  );

  /**
   * 註冊需要清理的資源
   */
  const registerCleanup = useCallback(
    (item: CleanupItem, id?: string): string => {
      const cleanupId = generateCleanupId(id);
      cleanupItemsRef.current.set(cleanupId, item);

      // 更新記憶體監控
      if (componentIdRef.current && enableMonitoring) {
        const itemType =
          typeof item === 'function'
            ? 'subscription'
            : item && 'abort' in item
              ? 'subscription'
              : item && typeof item === 'object' && 'hasRef' in item
                ? 'timer'
                : 'subscription';

        memoryManager.trackMemoryItem(componentIdRef.current, itemType, cleanupId, () =>
          executeCleanupItem(item, cleanupId)
        );
      }

      if (enableDebug) {
        console.log(`📝 Registered cleanup item: ${cleanupId}`);
      }

      return cleanupId;
    },
    [generateCleanupId, enableMonitoring, enableDebug, executeCleanupItem]
  );

  /**
   * 手動移除特定清理項目
   */
  const removeCleanup = useCallback(
    async (id: string): Promise<void> => {
      const item = cleanupItemsRef.current.get(id);
      if (item) {
        await executeCleanupItem(item, id);
        cleanupItemsRef.current.delete(id);

        // 從記憶體監控中移除
        if (componentIdRef.current && enableMonitoring) {
          const itemType =
            typeof item === 'function'
              ? 'subscription'
              : item && 'abort' in item
                ? 'subscription'
                : item && typeof item === 'object' && 'hasRef' in item
                  ? 'timer'
                  : 'subscription';

          memoryManager.untrackMemoryItem(componentIdRef.current, itemType, id);
        }
      }
    },
    [executeCleanupItem, enableMonitoring]
  );

  /**
   * 立即執行所有清理
   */
  const cleanupNow = useCallback(async (): Promise<void> => {
    const cleanupPromises: Promise<void>[] = [];
    const cleanupEntries = Array.from(cleanupItemsRef.current.entries());

    if (enableDebug && cleanupEntries.length > 0) {
      console.log(`🧹 Starting cleanup of ${cleanupEntries.length} items for ${componentName}`);
    }

    // 並行執行所有清理，但設置超時
    cleanupEntries.forEach(([id, item]) => {
      const cleanupPromise = Promise.race([
        executeCleanupItem(item, id),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error(`Cleanup timeout for ${id}`)), cleanupTimeout)
        ),
      ]).catch(error => {
        console.warn(`Cleanup failed for ${id}:`, error);
      });

      cleanupPromises.push(cleanupPromise);
    });

    // 等待所有清理完成
    await Promise.allSettled(cleanupPromises);

    // 清空清理項目
    cleanupItemsRef.current.clear();

    if (enableDebug) {
      console.log(`✅ Cleanup completed for ${componentName}`);
    }
  }, [componentName, enableDebug, cleanupTimeout, executeCleanupItem]);

  /**
   * 創建 AbortController 並自動註冊清理
   */
  const createAbortController = useCallback((): AbortController => {
    const controller = new AbortController();
    const cleanupId = registerCleanup(controller, `abort_${Date.now()}`);

    if (enableDebug) {
      console.log(`🛑 Created AbortController: ${cleanupId}`);
    }

    return controller;
  }, [registerCleanup, enableDebug]);

  /**
   * 創建定時器並自動註冊清理
   */
  const createTimer = useCallback(
    (
      callback: () => void,
      delay: number,
      type: 'timeout' | 'interval' = 'timeout'
    ): NodeJS.Timeout => {
      const timer = type === 'timeout' ? setTimeout(callback, delay) : setInterval(callback, delay);

      const cleanupId = registerCleanup(() => {
        clearTimeout(timer);
        clearInterval(timer);
      }, `${type}_${Date.now()}`);

      if (enableDebug) {
        console.log(`⏰ Created ${type}: ${cleanupId}`);
      }

      return timer;
    },
    [registerCleanup, enableDebug]
  );

  /**
   * 註冊 Promise 並自動處理取消
   */
  const registerPromise = useCallback(
    <T>(promise: Promise<T>, onCancel?: () => void): Promise<T> => {
      const controller = createAbortController();

      // 創建可取消的 Promise
      const cancellablePromise = new Promise<T>((resolve, reject) => {
        promise.then(resolve).catch(reject);

        // 監聽取消信號
        controller.signal.addEventListener('abort', () => {
          if (onCancel) {
            onCancel();
          }
          reject(new Error('Promise cancelled'));
        });
      });

      if (enableDebug) {
        console.log(`🎯 Registered cancellable promise`);
      }

      return cancellablePromise;
    },
    [createAbortController, enableDebug]
  );

  /**
   * 註冊事件監聽器並自動清理
   */
  const registerEventListener = useCallback(
    <K extends keyof WindowEventMap>(
      target: Window | Document | EventTarget,
      type: K | string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ): void => {
      target.addEventListener(type as string, listener, options);

      const cleanupId = registerCleanup(() => {
        target.removeEventListener(type as string, listener, options);
      }, `event_${type}_${Date.now()}`);

      // 更新事件監聽器計數
      if (componentIdRef.current && enableMonitoring) {
        memoryManager.trackMemoryItem(componentIdRef.current, 'listener', cleanupId, () =>
          target.removeEventListener(type as string, listener, options)
        );
      }

      if (enableDebug) {
        console.log(`👂 Registered event listener: ${type} (${cleanupId})`);
      }
    },
    [registerCleanup, enableMonitoring, enableDebug]
  );

  /**
   * 獲取當前註冊的清理項目數量
   */
  const getCleanupCount = useCallback((): number => {
    return cleanupItemsRef.current.size;
  }, []);

  // 組件卸載時自動清理
  useEffect(() => {
    return () => {
      cleanupNow();
    };
  }, [cleanupNow]);

  return {
    registerCleanup,
    removeCleanup,
    cleanupNow,
    createAbortController,
    createTimer,
    registerPromise,
    registerEventListener,
    getCleanupCount,
  };
};
