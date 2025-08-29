/**
 * useFocusManagement Hook
 * 焦點管理Hook - 提供完整的焦點控制和管理功能
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { UseFocusManagementReturn, FocusManagementConfig } from '../types';
import {
  globalFocusManager,
  globalFocusObserver,
  // FocusTrap, // Unused import
  createSimpleFocusTrap,
} from '../utils/focus-helpers';
import { useAccessibility } from '../providers/AccessibilityProvider';

/**
 * 焦點管理Hook
 * @param config 焦點管理配置
 * @returns 焦點管理功能
 */
export function useFocusManagement(
  config?: Partial<FocusManagementConfig>
): UseFocusManagementReturn {
  const { focusConfig, updateFocusConfig: _updateFocusConfig } = useAccessibility(); // Renamed unused variable
  const [currentFocus, setCurrentFocus] = useState<HTMLElement | null>(null);
  const [focusHistory, setFocusHistory] = useState<HTMLElement[]>([]);

  // 合併配置
  const mergedConfig = { ...focusConfig, ...config };

  // 焦點陷阱引用
  const focusTrapsRef = useRef<Map<string, () => void>>(new Map());

  /**
   * 監聽焦點變化
   */
  useEffect(() => {
    const handleFocusChange = (element: HTMLElement) => {
      setCurrentFocus(element);
    };

    // 註冊焦點觀察器
    const observerId = `focus-management-${Date.now()}`;
    globalFocusObserver.onFocusEnter(observerId, handleFocusChange);

    return () => {
      globalFocusObserver.removeCallback(observerId);
    };
  }, []);

  /**
   * 設置焦點
   * @param element 目標元素或選擇器
   * @returns 是否成功設置焦點
   */
  const setFocus = useCallback((element: HTMLElement | string): boolean => {
    const result = globalFocusManager.setFocus(element, {
      saveHistory: true,
      preventScroll: false,
    });

    if (result) {
      const targetElement =
        typeof element === 'string' ? (document.querySelector(element) as HTMLElement) : element;

      if (targetElement) {
        setCurrentFocus(targetElement);

        // 自動滾動到視口
        globalFocusManager.scrollIntoView(targetElement);

        // 更新歷史記錄
        setFocusHistory(prev => {
          const newHistory = [...prev];
          if (newHistory[newHistory.length - 1] !== targetElement) {
            newHistory.push(targetElement);
            // 限制歷史記錄長度
            return newHistory.slice(-10);
          }
          return newHistory;
        });
      }
    }

    return result;
  }, []);

  /**
   * 恢復焦點
   * @returns 是否成功恢復焦點
   */
  const restoreFocus = useCallback((): boolean => {
    const result = globalFocusManager.restoreFocus();

    if (result) {
      // 從歷史記錄中移除最後一個元素
      setFocusHistory(prev => prev.slice(0, -1));
    }

    return result;
  }, []);

  /**
   * 創建焦點陷阱
   * @param container 容器元素
   * @returns 清理函數
   */
  const trapFocus = useCallback(
    (container: HTMLElement): (() => void) => {
      const trapId = `trap-${Date.now()}`;

      const cleanup = createSimpleFocusTrap(container, {
        id: trapId,
        autoFocus: mergedConfig.autoFocus,
        restoreFocusOnDeactivate: mergedConfig.restoreFocusOnExit,
        escapeDeactivates: true,
        allowOutsideClick: false,
      });

      // 保存清理函數
      focusTrapsRef.current.set(trapId, cleanup);

      // 返回包裝的清理函數
      return () => {
        cleanup();
        focusTrapsRef.current.delete(trapId);
      };
    },
    [mergedConfig.autoFocus, mergedConfig.restoreFocusOnExit]
  );

  /**
   * 釋放所有焦點陷阱
   */
  const releaseFocusTrap = useCallback((): void => {
    focusTrapsRef.current.forEach(cleanup => cleanup());
    focusTrapsRef.current.clear();
  }, []);

  /**
   * 獲取可聚焦元素
   * @param container 容器元素
   * @returns 可聚焦元素陣列
   */
  const getFocusableElements = useCallback((container: HTMLElement): HTMLElement[] => {
    // Import getFocusableElements from wcag-helpers directly
    const { getFocusableElements: getElements } = require('../utils/wcag-helpers');
    return getElements(container) || [];
  }, []);

  /**
   * 獲取下一個可聚焦元素
   * @param current 當前元素
   * @returns 下一個可聚焦元素
   */
  const getNextFocusableElement = useCallback((current: HTMLElement): HTMLElement | null => {
    return globalFocusManager.getNextFocusableElement(current);
  }, []);

  /**
   * 獲取前一個可聚焦元素
   * @param current 當前元素
   * @returns 前一個可聚焦元素
   */
  const getPreviousFocusableElement = useCallback((current: HTMLElement): HTMLElement | null => {
    return globalFocusManager.getPreviousFocusableElement(current);
  }, []);

  /**
   * 焦點進入回調
   * @param callback 回調函數
   */
  const onFocusEnter = useCallback((callback: (element: HTMLElement) => void): void => {
    const callbackId = `enter-${Date.now()}`;
    globalFocusObserver.onFocusEnter(callbackId, callback);
  }, []);

  /**
   * 焦點離開回調
   * @param callback 回調函數
   */
  const onFocusLeave = useCallback((callback: (element: HTMLElement) => void): void => {
    const callbackId = `leave-${Date.now()}`;
    globalFocusObserver.onFocusLeave(callbackId, callback);
  }, []);

  // 清理所有焦點陷阱
  useEffect(() => {
    return () => {
      releaseFocusTrap();
    };
  }, [releaseFocusTrap]);

  return {
    currentFocus,
    focusHistory,
    setFocus,
    restoreFocus,
    trapFocus,
    releaseFocusTrap,
    getFocusableElements,
    getNextFocusableElement,
    getPreviousFocusableElement,
    onFocusEnter,
    onFocusLeave,
  };
}

/**
 * 簡化的焦點陷阱Hook
 * @param containerRef 容器引用
 * @param active 是否活動
 * @param options 選項
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  active: boolean = false,
  options: {
    autoFocus?: boolean;
    restoreFocusOnExit?: boolean;
    escapeToExit?: boolean;
  } = {}
) {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) {
      // 清理現有的焦點陷阱
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      return;
    }

    // 創建新的焦點陷阱
    try {
      const cleanup = createSimpleFocusTrap(containerRef.current, {
        autoFocus: options.autoFocus ?? true,
        restoreFocusOnDeactivate: options.restoreFocusOnExit ?? true,
        escapeDeactivates: options.escapeToExit ?? true,
      });

      cleanupRef.current = cleanup;
    } catch (error) {
      console.error('Failed to create focus trap:', error);
    }

    // 清理函數
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [active, containerRef, options.autoFocus, options.restoreFocusOnExit, options.escapeToExit]);

  // 手動釋放焦點陷阱
  const release = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
  }, []);

  return { release };
}

/**
 * 自動聚焦Hook
 * @param elementRef 元素引用
 * @param condition 聚焦條件
 * @param delay 延遲時間
 */
export function useAutoFocus(
  elementRef: React.RefObject<HTMLElement>,
  condition: boolean = true,
  delay: number = 0
) {
  useEffect(() => {
    if (!condition || !elementRef.current) return undefined;

    const focusElement = () => {
      if (elementRef.current) {
        globalFocusManager.setFocus(elementRef.current);
      }
    };

    if (delay > 0) {
      const timer = setTimeout(focusElement, delay);
      return () => clearTimeout(timer);
    } else {
      focusElement();
      return undefined;
    }
  }, [condition, elementRef, delay]);
}

/**
 * 焦點可見性Hook
 * @param elementRef 元素引用
 * @returns 焦點是否可見
 */
export function useFocusVisible(elementRef: React.RefObject<HTMLElement>) {
  const [focusVisible, setFocusVisible] = useState(false);
  const [keyboardActive, setKeyboardActive] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // 監聽鍵盤活動
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setKeyboardActive(true);
      }
    };

    const handleMouseDown = () => {
      setKeyboardActive(false);
    };

    const handleFocus = () => {
      setFocusVisible(keyboardActive);
    };

    const handleBlur = () => {
      setFocusVisible(false);
    };

    // 添加事件監聽器
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('focus', handleFocus);
    element.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('focus', handleFocus);
      element.removeEventListener('blur', handleBlur);
    };
  }, [elementRef, keyboardActive]);

  return { focusVisible, keyboardActive };
}

/**
 * 焦點管理器Hook - 用於管理多個焦點區域
 * @param areas 焦點區域配置
 */
export function useFocusAreas(
  areas: Array<{
    id: string;
    containerRef: React.RefObject<HTMLElement>;
    priority?: number;
  }>
) {
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
  const { setFocus } = useFocusManagement();

  /**
   * 移動到指定區域
   * @param areaId 區域ID
   */
  const moveToArea = useCallback(
    (areaId: string) => {
      const area = areas.find(a => a.id === areaId);
      if (!area || !area.containerRef.current) return false;

      // Use focusFirst method instead
      const success = globalFocusManager.focusFirst(area.containerRef.current);
      if (success) {
        setActiveAreaId(areaId);
      }
      return success;
    },
    [areas]
  );

  /**
   * 移動到下一個區域
   */
  const moveToNextArea = useCallback(() => {
    const sortedAreas = [...areas].sort((a, b) => (a.priority || 0) - (b.priority || 0));
    const currentIndex = activeAreaId ? sortedAreas.findIndex(a => a.id === activeAreaId) : -1;
    const nextIndex = (currentIndex + 1) % sortedAreas.length;
    const nextArea = sortedAreas[nextIndex];

    if (nextArea) {
      return moveToArea(nextArea.id);
    }

    return false;
  }, [areas, activeAreaId, moveToArea]);

  /**
   * 移動到前一個區域
   */
  const moveToPreviousArea = useCallback(() => {
    const sortedAreas = [...areas].sort((a, b) => (a.priority || 0) - (b.priority || 0));
    const currentIndex = activeAreaId ? sortedAreas.findIndex(a => a.id === activeAreaId) : -1;
    const previousIndex = currentIndex === 0 ? sortedAreas.length - 1 : currentIndex - 1;
    const previousArea = sortedAreas[previousIndex];

    if (previousArea) {
      return moveToArea(previousArea.id);
    }

    return false;
  }, [areas, activeAreaId, moveToArea]);

  return {
    activeAreaId,
    moveToArea,
    moveToNextArea,
    moveToPreviousArea,
  };
}

export default useFocusManagement;
