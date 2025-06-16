import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsOptions {
  onSearch?: () => void;
  onReset?: () => void;
  onHelp?: () => void;
  enabled?: boolean;
}

/**
 * 鍵盤快捷鍵 Hook
 * 提供常用的鍵盤快捷鍵功能
 */
export const useKeyboardShortcuts = (options: KeyboardShortcutsOptions = {}) => {
  const {
    onSearch,
    onReset,
    onHelp,
    enabled = true
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // 檢查是否在輸入框中
    const isInputFocused = 
      document.activeElement?.tagName === 'INPUT' ||
      document.activeElement?.tagName === 'TEXTAREA';

    // Ctrl/Cmd + K: 聚焦搜尋
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      onSearch?.();
      return;
    }

    // 只在非輸入狀態下觸發的快捷鍵
    if (!isInputFocused) {
      switch (event.key) {
        case '/':
          // 斜線鍵：聚焦搜尋
          event.preventDefault();
          onSearch?.();
          break;

        case 'Escape':
          // ESC 鍵：重置操作
          event.preventDefault();
          onReset?.();
          break;

        case '?':
          // 問號鍵：顯示幫助
          event.preventDefault();
          onHelp?.();
          break;

        case 'r':
          // R 鍵：重置（需要配合 Ctrl/Cmd）
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onReset?.();
          }
          break;
      }
    }
  }, [enabled, onSearch, onReset, onHelp]);

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);

  // 返回快捷鍵列表（用於顯示幫助）
  return {
    shortcuts: [
      { key: 'Ctrl/Cmd + K', description: 'Focus search input' },
      { key: '/', description: 'Focus search input' },
      { key: 'Escape', description: 'Reset/Clear operation' },
      { key: 'Ctrl/Cmd + R', description: 'Reset page' },
      { key: '?', description: 'Show keyboard shortcuts' }
    ]
  };
};