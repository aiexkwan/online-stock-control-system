/**
 * Custom hook for using MutationObserver with Gridstack
 * 替代 setTimeout 等待 DOM 更新
 */

import { useEffect, useRef, useCallback } from 'react';

interface UseGridstackMutationObserverOptions {
  gridInstanceRef: React.MutableRefObject<any>;
  isEditMode: boolean;
  isInitialized: boolean;
}

export function useGridstackMutationObserver({
  gridInstanceRef,
  isEditMode,
  isInitialized
}: UseGridstackMutationObserverOptions) {
  const observerRef = useRef<MutationObserver | null>(null);

  // 啟用 widget 嘅拖拽同調整大小功能
  const enableWidgetInteractions = useCallback((widgets: NodeListOf<Element> | HTMLElement[]) => {
    if (!gridInstanceRef.current) {
      console.log('[MutationObserver] No grid instance available');
      return;
    }
    
    console.log('[MutationObserver] Enabling interactions for', widgets.length, 'widgets');
    
    widgets.forEach((widget, index) => {
      if (widget instanceof HTMLElement) {
        try {
          gridInstanceRef.current.movable(widget, true);
          gridInstanceRef.current.resizable(widget, true);
          console.log(`[MutationObserver] Widget ${index} enabled`);
        } catch (error) {
          console.error(`[MutationObserver] Error enabling widget ${index}:`, error);
        }
      }
    });
  }, [gridInstanceRef]);

  // 處理新增嘅 widgets
  const handleAddedNodes = useCallback((addedNodes: NodeList) => {
    const newWidgets: HTMLElement[] = [];
    
    addedNodes.forEach(node => {
      if (node instanceof HTMLElement) {
        // 檢查係咪 grid-stack-item
        if (node.classList.contains('grid-stack-item')) {
          newWidgets.push(node);
        }
        // 檢查子元素
        const childWidgets = node.querySelectorAll('.grid-stack-item');
        childWidgets.forEach(child => {
          if (child instanceof HTMLElement) {
            newWidgets.push(child);
          }
        });
      }
    });

    if (newWidgets.length > 0 && isEditMode) {
      // 使用 requestAnimationFrame 確保 DOM 渲染完成
      requestAnimationFrame(() => {
        enableWidgetInteractions(newWidgets);
      });
    }
  }, [isEditMode, enableWidgetInteractions]);

  // 設置 MutationObserver
  useEffect(() => {
    if (!isInitialized || !gridInstanceRef.current) return;

    const gridElement = document.querySelector('.grid-stack');
    if (!gridElement) return;

    // 創建 observer
    observerRef.current = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          handleAddedNodes(mutation.addedNodes);
        }
      });
    });

    // 開始觀察
    observerRef.current.observe(gridElement, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [isInitialized, gridInstanceRef, handleAddedNodes]);

  // 當編輯模式改變時，立即更新所有現有 widgets
  useEffect(() => {
    if (!gridInstanceRef.current || !isInitialized) return;

    if (isEditMode) {
      console.log('[MutationObserver] Entering edit mode');
      gridInstanceRef.current.enable();
      
      // 立即啟用所有現有 widgets
      const existingWidgets = document.querySelectorAll('.grid-stack-item');
      console.log('[MutationObserver] Found', existingWidgets.length, 'existing widgets');
      
      if (existingWidgets.length > 0) {
        requestAnimationFrame(() => {
          enableWidgetInteractions(existingWidgets);
        });
      }
    } else {
      console.log('[MutationObserver] Exiting edit mode');
      gridInstanceRef.current.disable();
    }
  }, [isEditMode, isInitialized, gridInstanceRef, enableWidgetInteractions]);

  // 返回手動觸發功能，用於特殊情況
  return {
    enableWidgetInteractions
  };
}