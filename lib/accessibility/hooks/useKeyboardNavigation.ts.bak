/**
 * useKeyboardNavigation Hook
 * 鍵盤導航Hook - 提供完整的鍵盤導航和快捷鍵管理
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { DatabaseRecord } from '@/types/database/tables';
import { UseKeyboardNavigationReturn, KeyboardNavigationConfig } from '../types';
import { useAccessibility } from '../providers/AccessibilityProvider';
import { globalFocusManager } from '../utils/focus-helpers';

/**
 * 鍵盤導航Hook
 * @param config 鍵盤導航配置
 * @param containerRef 容器引用
 * @returns 鍵盤導航功能
 */
export function useKeyboardNavigation(
  config?: Partial<KeyboardNavigationConfig>,
  containerRef?: React.RefObject<HTMLElement>
): UseKeyboardNavigationReturn {
  const { keyboardConfig, updateKeyboardConfig } = useAccessibility();
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);
  const [lastKeyPressed, setLastKeyPressed] = useState<string | null>(null);
  const [modifierKeys, setModifierKeys] = useState({
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
  });

  // 合併配置
  const mergedConfig = useMemo(() => ({ ...keyboardConfig, ...config }), [keyboardConfig, config]);

  // 快捷鍵註冊表
  const shortcutsRef = useRef<Map<string, () => void>>(new Map());

  /**
   * 導航到下一個元素
   */
  const navigateToNext = useCallback((): void => {
    const container = containerRef?.current || document.body;
    const result = globalFocusManager.cycleFocus('next', container);

    if (!result) {
      // 如果沒有下一個元素，循環到第一個
      globalFocusManager.focusFirst(container);
    }
  }, [containerRef]);

  /**
   * 導航到前一個元素
   */
  const navigateToPrevious = useCallback((): void => {
    const container = containerRef?.current || document.body;
    const result = globalFocusManager.cycleFocus('previous', container);

    if (!result) {
      // 如果沒有前一個元素，循環到最後一個
      globalFocusManager.focusLast(container);
    }
  }, [containerRef]);

  /**
   * 導航到第一個元素
   */
  const navigateToFirst = useCallback((): void => {
    const container = containerRef?.current || document.body;
    globalFocusManager.focusFirst(container);
  }, [containerRef]);

  /**
   * 導航到最後一個元素
   */
  const navigateToLast = useCallback((): void => {
    const container = containerRef?.current || document.body;
    globalFocusManager.focusLast(container);
  }, [containerRef]);

  /**
   * 檢測鍵盤使用
   */
  useEffect(() => {
    const handleKeyDown = () => {
      setIsKeyboardActive(true);
    };

    const handleMouseDown = () => {
      setIsKeyboardActive(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  /**
   * 處理鍵盤按下事件
   * @param event 鍵盤事件
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      setLastKeyPressed(event.key);
      setModifierKeys({
        ctrl: event.ctrlKey,
        alt: event.altKey,
        shift: event.shiftKey,
        meta: event.metaKey,
      });

      const container = containerRef?.current || document.body;

      // 處理方向鍵導航
      if (mergedConfig.arrowKeys) {
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            navigateToNext();
            break;
          case 'ArrowUp':
            event.preventDefault();
            navigateToPrevious();
            break;
          case 'ArrowRight':
            // 在水平佈局中向右導航
            if (!event.ctrlKey) {
              event.preventDefault();
              navigateToNext();
            }
            break;
          case 'ArrowLeft':
            // 在水平佈局中向左導航
            if (!event.ctrlKey) {
              event.preventDefault();
              navigateToPrevious();
            }
            break;
        }
      }

      // 處理Home/End鍵
      if (mergedConfig.homeEndKeys) {
        switch (event.key) {
          case 'Home':
            event.preventDefault();
            navigateToFirst();
            break;
          case 'End':
            event.preventDefault();
            navigateToLast();
            break;
        }
      }

      // 處理Page Up/Down鍵
      if (mergedConfig.pageUpDownKeys) {
        switch (event.key) {
          case 'PageUp':
            event.preventDefault();
            // 向上移動5個元素
            for (let i = 0; i < 5; i++) {
              navigateToPrevious();
            }
            break;
          case 'PageDown':
            event.preventDefault();
            // 向下移動5個元素
            for (let i = 0; i < 5; i++) {
              navigateToNext();
            }
            break;
        }
      }

      // 處理Tab導航
      if (mergedConfig.tabNavigation && event.key === 'Tab') {
        if (event.shiftKey && mergedConfig.shiftTabNavigation) {
          // Shift+Tab 向前導航
          if (container !== document.body) {
            event.preventDefault();
            navigateToPrevious();
          }
        } else {
          // Tab 向後導航
          if (container !== document.body) {
            event.preventDefault();
            navigateToNext();
          }
        }
      }

      // 處理Enter和Space鍵
      if (event.key === 'Enter' && mergedConfig.enterAction) {
        event.preventDefault();
        mergedConfig.enterAction();
      }

      if (event.key === ' ' && mergedConfig.spaceAction) {
        event.preventDefault();
        mergedConfig.spaceAction();
      }

      // 處理Escape鍵
      if (event.key === 'Escape' && mergedConfig.escapeAction) {
        event.preventDefault();
        mergedConfig.escapeAction();
      }

      // 處理快捷鍵
      const shortcutKey = getShortcutKey(event);
      const shortcutAction = shortcutsRef.current.get(shortcutKey);
      if (shortcutAction) {
        event.preventDefault();
        shortcutAction();
      }
    },
    [
      mergedConfig,
      containerRef,
      navigateToFirst,
      navigateToLast,
      navigateToNext,
      navigateToPrevious,
    ]
  );

  /**
   * 處理鍵盤釋放事件
   * @param event 鍵盤事件
   */
  const handleKeyUp = useCallback((event: KeyboardEvent): void => {
    setModifierKeys({
      ctrl: event.ctrlKey,
      alt: event.altKey,
      shift: event.shiftKey,
      meta: event.metaKey,
    });
  }, []);

  /**
   * 註冊快捷鍵
   * @param key 快捷鍵組合
   * @param action 動作函數
   */
  const registerShortcut = useCallback((key: string, action: () => void): void => {
    shortcutsRef.current.set(key, action);
  }, []);

  /**
   * 取消註冊快捷鍵
   * @param key 快捷鍵組合
   */
  const unregisterShortcut = useCallback((key: string): void => {
    shortcutsRef.current.delete(key);
  }, []);

  /**
   * 列出所有快捷鍵
   * @returns 快捷鍵對應表
   */
  const listShortcuts = useCallback((): Record<string, string> => {
    const shortcuts: Record<string, string> = {};
    shortcutsRef.current.forEach((action, key) => {
      shortcuts[key] = action.name || '自定義動作';
    });
    return shortcuts;
  }, []);

  /**
   * 生成快捷鍵字符串
   * @param event 鍵盤事件
   * @returns 快捷鍵字符串
   */
  const getShortcutKey = (event: KeyboardEvent): string => {
    const parts: string[] = [];

    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push('Meta');

    // 排除修飾鍵本身
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
      parts.push(event.key);
    }

    return parts.join('+');
  };

  // 設置事件監聽器
  useEffect(() => {
    const element = containerRef?.current || document;

    element.addEventListener('keydown', handleKeyDown as EventListener);
    element.addEventListener('keyup', handleKeyUp as EventListener);

    return () => {
      element.removeEventListener('keydown', handleKeyDown as EventListener);
      element.removeEventListener('keyup', handleKeyUp as EventListener);
    };
  }, [handleKeyDown, handleKeyUp, containerRef]);

  return {
    handleKeyDown,
    handleKeyUp,
    navigateToNext,
    navigateToPrevious,
    navigateToFirst,
    navigateToLast,
    registerShortcut,
    unregisterShortcut,
    listShortcuts,
    isKeyboardActive,
    lastKeyPressed,
    modifierKeys,
  };
}

/**
 * 簡化的鍵盤導航Hook - 用於特定組件
 * @param options 配置選項
 */
export function useSimpleKeyboardNavigation(
  options: {
    containerRef?: React.RefObject<HTMLElement>;
    onEnter?: () => void;
    onEscape?: () => void;
    onSpace?: () => void;
    enableArrowKeys?: boolean;
    enableTabNavigation?: boolean;
  } = {}
) {
  const {
    containerRef,
    onEnter,
    onEscape,
    onSpace,
    enableArrowKeys = true,
    enableTabNavigation = true,
  } = options;

  return useKeyboardNavigation(
    {
      arrowKeys: enableArrowKeys,
      tabNavigation: enableTabNavigation,
      enterAction: onEnter,
      escapeAction: onEscape,
      spaceAction: onSpace,
    },
    containerRef
  );
}

/**
 * 快捷鍵管理Hook
 * @param shortcuts 快捷鍵配置
 */
export function useShortcuts(shortcuts: Record<string, () => void>) {
  const { registerShortcut, unregisterShortcut } = useKeyboardNavigation();

  useEffect(() => {
    // 註冊快捷鍵
    Object.entries(shortcuts).forEach(([key, action]) => {
      registerShortcut(key, action);
    });

    // 清理函數
    return () => {
      Object.keys(shortcuts).forEach(key => {
        unregisterShortcut(key);
      });
    };
  }, [shortcuts, registerShortcut, unregisterShortcut]);
}

/**
 * 方向鍵導航Hook - 用於網格和列表
 * @param options 配置選項
 */
export function useDirectionalNavigation(options: {
  containerRef: React.RefObject<HTMLElement>;
  itemSelector?: string;
  columns?: number;
  wrap?: boolean;
  onNavigate?: (index: number) => void;
}) {
  const {
    containerRef,
    itemSelector = '[tabindex]',
    columns = 1,
    wrap = true,
    onNavigate,
  } = options;
  const [currentIndex, setCurrentIndex] = useState(0);

  const getItems = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(containerRef.current.querySelectorAll(itemSelector)) as HTMLElement[];
  }, [containerRef, itemSelector]);

  const moveToIndex = useCallback(
    (index: number) => {
      const items = getItems();
      if (items.length === 0) return;

      let newIndex = index;

      if (wrap) {
        newIndex = ((index % items.length) + items.length) % items.length;
      } else {
        newIndex = Math.max(0, Math.min(items.length - 1, index));
      }

      const targetItem = items[newIndex];
      if (targetItem) {
        targetItem.focus();
        setCurrentIndex(newIndex);
        onNavigate?.(newIndex);
      }
    },
    [getItems, wrap, onNavigate]
  );

  const { handleKeyDown } = useKeyboardNavigation(
    {
      arrowKeys: false, // 我們自己處理方向鍵
      tabNavigation: false,
    },
    containerRef
  );

  const handleDirectionalKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const items = getItems();
      if (items.length === 0) return;

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          if (columns === 1) {
            moveToIndex(currentIndex + 1);
          } else {
            const nextIndex = currentIndex + 1;
            const row = Math.floor(currentIndex / columns);
            const nextRow = Math.floor(nextIndex / columns);
            if (row === nextRow || wrap) {
              moveToIndex(nextIndex);
            }
          }
          break;

        case 'ArrowLeft':
          event.preventDefault();
          if (columns === 1) {
            moveToIndex(currentIndex - 1);
          } else {
            const prevIndex = currentIndex - 1;
            const row = Math.floor(currentIndex / columns);
            const prevRow = Math.floor(prevIndex / columns);
            if (row === prevRow || wrap) {
              moveToIndex(prevIndex);
            }
          }
          break;

        case 'ArrowDown':
          event.preventDefault();
          if (columns === 1) {
            moveToIndex(currentIndex + 1);
          } else {
            moveToIndex(currentIndex + columns);
          }
          break;

        case 'ArrowUp':
          event.preventDefault();
          if (columns === 1) {
            moveToIndex(currentIndex - 1);
          } else {
            moveToIndex(currentIndex - columns);
          }
          break;

        case 'Home':
          event.preventDefault();
          moveToIndex(0);
          break;

        case 'End':
          event.preventDefault();
          moveToIndex(items.length - 1);
          break;

        default:
          handleKeyDown(event);
          break;
      }
    },
    [getItems, columns, wrap, currentIndex, moveToIndex, handleKeyDown]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleDirectionalKeyDown);

    return () => {
      container.removeEventListener('keydown', handleDirectionalKeyDown);
    };
  }, [containerRef, handleDirectionalKeyDown]);

  return {
    currentIndex,
    moveToIndex,
    totalItems: getItems().length,
  };
}

/**
 * 搜尋鍵盤導航Hook - 用於可搜尋列表
 * @param options 配置選項
 */
export function useSearchableNavigation(options: {
  items: Array<{ id: string; text: string; element?: HTMLElement }>;
  onSelect?: (item: DatabaseRecord) => void;
  searchDelay?: number;
}) {
  const { items, onSelect, searchDelay = 1000 } = options;
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // 過濾項目
  useEffect(() => {
    if (!searchQuery) {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item =>
        item.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [items, searchQuery]);

  // 清除搜尋
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery('');
    }, searchDelay);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchDelay]);

  const handleSearchKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // 字母數字鍵用於搜尋
      if (event.key.length === 1 && /[a-zA-Z0-9]/.test(event.key)) {
        setSearchQuery(prev => prev + event.key);

        // 聚焦到第一個匹配項
        if (filteredItems.length > 0 && filteredItems[0].element) {
          filteredItems[0].element.focus();
        }
      }

      // Enter鍵選擇當前項
      if (event.key === 'Enter' && filteredItems.length > 0) {
        const currentItem = filteredItems.find(item => item.element === document.activeElement);
        if (currentItem && onSelect) {
          onSelect(currentItem);
        }
      }
    },
    [filteredItems, onSelect]
  );

  return {
    searchQuery,
    filteredItems,
    handleSearchKeyDown,
  };
}

export default useKeyboardNavigation;
