/**
 * Focus Management Helpers
 * 焦點管理輔助工具 - 實施完整的焦點控制和管理
 */

import { isElementFocusable, getFocusableElements } from './wcag-helpers';

/**
 * 焦點管理類 - 提供完整的焦點控制功能
 */
export class FocusManager {
  private focusHistory: HTMLElement[] = [];
  private focusTraps: Map<string, FocusTrap> = new Map();
  private activeElementBeforeTrap: HTMLElement | null = null;

  /**
   * 設置焦點到指定元素
   * @param target 目標元素或選擇器
   * @param options 焦點選項
   */
  setFocus(
    target: HTMLElement | string,
    options: {
      preventScroll?: boolean;
      saveHistory?: boolean;
      force?: boolean;
    } = {}
  ): boolean {
    const element =
      typeof target === 'string' ? (document.querySelector(target) as HTMLElement) : target;

    if (!element) {
      console.warn('Focus target not found:', target);
      return false;
    }

    if (!isElementFocusable(element) && !options.force) {
      console.warn('Element is not focusable:', element);
      return false;
    }

    // 保存當前焦點到歷史記錄
    if (options.saveHistory && document.activeElement && document.activeElement !== element) {
      this.focusHistory.push(document.activeElement as HTMLElement);
    }

    try {
      element.focus({ preventScroll: options.preventScroll });
      return document.activeElement === element;
    } catch (error) {
      console.error('Failed to set focus:', error);
      return false;
    }
  }

  /**
   * 恢復之前的焦點
   */
  restoreFocus(): boolean {
    const previousElement = this.focusHistory.pop();

    if (previousElement && isElementFocusable(previousElement)) {
      return this.setFocus(previousElement);
    }

    return false;
  }

  /**
   * 清除焦點歷史
   */
  clearFocusHistory(): void {
    this.focusHistory = [];
  }

  /**
   * 創建焦點陷阱
   * @param container 容器元素
   * @param options 陷阱選項
   * @returns 焦點陷阱實例
   */
  createFocusTrap(container: HTMLElement, options: FocusTrapOptions = {}): FocusTrap {
    const trapId = options.id || `trap-${Date.now()}`;

    if (this.focusTraps.has(trapId)) {
      console.warn('Focus trap already exists:', trapId);
      return this.focusTraps.get(trapId)!;
    }

    const trap = new FocusTrap(container, options);
    this.focusTraps.set(trapId, trap);

    return trap;
  }

  /**
   * 啟動焦點陷阱
   * @param trapId 陷阱ID
   */
  activateFocusTrap(trapId: string): boolean {
    const trap = this.focusTraps.get(trapId);

    if (!trap) {
      console.warn('Focus trap not found:', trapId);
      return false;
    }

    // 保存當前活動元素
    this.activeElementBeforeTrap = document.activeElement as HTMLElement;

    return trap.activate();
  }

  /**
   * 停用焦點陷阱
   * @param trapId 陷阱ID
   * @param restoreFocus 是否恢復之前的焦點
   */
  deactivateFocusTrap(trapId: string, restoreFocus: boolean = true): boolean {
    const trap = this.focusTraps.get(trapId);

    if (!trap) {
      console.warn('Focus trap not found:', trapId);
      return false;
    }

    const result = trap.deactivate();

    // 恢復之前的焦點
    if (restoreFocus && this.activeElementBeforeTrap) {
      this.setFocus(this.activeElementBeforeTrap);
      this.activeElementBeforeTrap = null;
    }

    return result;
  }

  /**
   * 移除焦點陷阱
   * @param trapId 陷阱ID
   */
  removeFocusTrap(trapId: string): void {
    const trap = this.focusTraps.get(trapId);

    if (trap) {
      trap.destroy();
      this.focusTraps.delete(trapId);
    }
  }

  /**
   * 獲取下一個可聚焦元素
   * @param current 當前元素
   * @param container 搜尋容器
   * @returns 下一個可聚焦元素
   */
  getNextFocusableElement(
    current: HTMLElement,
    container: HTMLElement = document.body
  ): HTMLElement | null {
    const focusableElements = getFocusableElements(container);
    const currentIndex = focusableElements.indexOf(current);

    if (currentIndex === -1) return focusableElements[0] || null;

    const nextIndex = (currentIndex + 1) % focusableElements.length;
    return focusableElements[nextIndex] || null;
  }

  /**
   * 獲取前一個可聚焦元素
   * @param current 當前元素
   * @param container 搜尋容器
   * @returns 前一個可聚焦元素
   */
  getPreviousFocusableElement(
    current: HTMLElement,
    container: HTMLElement = document.body
  ): HTMLElement | null {
    const focusableElements = getFocusableElements(container);
    const currentIndex = focusableElements.indexOf(current);

    if (currentIndex === -1) return focusableElements[focusableElements.length - 1] || null;

    const previousIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
    return focusableElements[previousIndex] || null;
  }

  /**
   * 循環焦點導航
   * @param direction 導航方向
   * @param container 容器
   */
  cycleFocus(direction: 'next' | 'previous', container?: HTMLElement): boolean {
    const current = document.activeElement as HTMLElement;
    const target =
      direction === 'next'
        ? this.getNextFocusableElement(current, container)
        : this.getPreviousFocusableElement(current, container);

    if (target) {
      return this.setFocus(target, { saveHistory: true });
    }

    return false;
  }

  /**
   * 移動到第一個可聚焦元素
   * @param container 容器
   */
  focusFirst(container: HTMLElement = document.body): boolean {
    const firstElement = getFocusableElements(container)[0];

    if (firstElement) {
      return this.setFocus(firstElement, { saveHistory: true });
    }

    return false;
  }

  /**
   * 移動到最後一個可聚焦元素
   * @param container 容器
   */
  focusLast(container: HTMLElement = document.body): boolean {
    const focusableElements = getFocusableElements(container);
    const lastElement = focusableElements[focusableElements.length - 1];

    if (lastElement) {
      return this.setFocus(lastElement, { saveHistory: true });
    }

    return false;
  }

  /**
   * 檢查元素是否在視口內
   * @param element 元素
   * @returns 是否在視口內
   */
  isElementInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * 滾動元素到視口內
   * @param element 元素
   * @param behavior 滾動行為
   */
  scrollIntoView(element: HTMLElement, behavior: ScrollBehavior = 'smooth'): void {
    if (!this.isElementInViewport(element)) {
      element.scrollIntoView({
        behavior,
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }
}

/**
 * 焦點陷阱選項
 */
export interface FocusTrapOptions {
  id?: string;
  autoFocus?: boolean;
  restoreFocusOnDeactivate?: boolean;
  allowOutsideClick?: boolean;
  escapeDeactivates?: boolean;
  returnFocusOnDeactivate?: boolean;
  onActivate?: () => void;
  onDeactivate?: () => void;
}

/**
 * 焦點陷阱類
 */
export class FocusTrap {
  private container: HTMLElement;
  private options: Required<FocusTrapOptions>;
  private isActive: boolean = false;
  private previousActiveElement: HTMLElement | null = null;

  constructor(container: HTMLElement, options: FocusTrapOptions = {}) {
    this.container = container;
    this.options = {
      id: options.id || `trap-${Date.now()}`,
      autoFocus: options.autoFocus ?? true,
      restoreFocusOnDeactivate: options.restoreFocusOnDeactivate ?? true,
      allowOutsideClick: options.allowOutsideClick ?? false,
      escapeDeactivates: options.escapeDeactivates ?? true,
      returnFocusOnDeactivate: options.returnFocusOnDeactivate ?? true,
      onActivate: options.onActivate || (() => {}),
      onDeactivate: options.onDeactivate || (() => {}),
    };
  }

  /**
   * 啟動焦點陷阱
   */
  activate(): boolean {
    if (this.isActive) return true;

    // 保存當前活動元素
    this.previousActiveElement = document.activeElement as HTMLElement;

    // 添加事件監聽器
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('mousedown', this.handleMouseDown);

    // 自動聚焦到第一個可聚焦元素
    if (this.options.autoFocus) {
      const firstFocusable = getFocusableElements(this.container)[0];
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }

    this.isActive = true;
    this.options.onActivate();

    return true;
  }

  /**
   * 停用焦點陷阱
   */
  deactivate(): boolean {
    if (!this.isActive) return true;

    // 移除事件監聽器
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('mousedown', this.handleMouseDown);

    // 恢復之前的焦點
    if (this.options.returnFocusOnDeactivate && this.previousActiveElement) {
      this.previousActiveElement.focus();
    }

    this.isActive = false;
    this.options.onDeactivate();

    return true;
  }

  /**
   * 銷毀焦點陷阱
   */
  destroy(): void {
    this.deactivate();
  }

  /**
   * 處理鍵盤事件
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.isActive) return;

    // ESC 鍵停用陷阱
    if (this.options.escapeDeactivates && event.key === 'Escape') {
      event.preventDefault();
      this.deactivate();
      return;
    }

    // Tab 鍵循環焦點
    if (event.key === 'Tab') {
      this.handleTabKey(event);
    }
  };

  /**
   * 處理滑鼠事件
   */
  private handleMouseDown = (event: MouseEvent): void => {
    if (!this.isActive) return;

    const target = event.target as HTMLElement;

    // 檢查點擊是否在容器外
    if (!this.container.contains(target) && !this.options.allowOutsideClick) {
      event.preventDefault();

      // 將焦點返回到容器內的第一個可聚焦元素
      const firstFocusable = getFocusableElements(this.container)[0];
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  };

  /**
   * 處理 Tab 鍵導航
   */
  private handleTabKey(event: KeyboardEvent): void {
    const focusableElements = getFocusableElements(this.container);

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      // Shift + Tab - 向後循環
      if (activeElement === firstElement || !this.container.contains(activeElement)) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab - 向前循環
      if (activeElement === lastElement || !this.container.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
}

/**
 * 焦點觀察器 - 監控焦點變化
 */
export class FocusObserver {
  private callbacks: Map<string, (element: HTMLElement) => void> = new Map();
  private isObserving: boolean = false;

  /**
   * 開始觀察焦點變化
   */
  startObserving(): void {
    if (this.isObserving) return;

    document.addEventListener('focusin', this.handleFocusIn);
    document.addEventListener('focusout', this.handleFocusOut);

    this.isObserving = true;
  }

  /**
   * 停止觀察
   */
  stopObserving(): void {
    if (!this.isObserving) return;

    document.removeEventListener('focusin', this.handleFocusIn);
    document.removeEventListener('focusout', this.handleFocusOut);

    this.isObserving = false;
  }

  /**
   * 註冊焦點進入回調
   * @param id 回調ID
   * @param callback 回調函數
   */
  onFocusEnter(id: string, callback: (element: HTMLElement) => void): void {
    this.callbacks.set(`enter-${id}`, callback);
  }

  /**
   * 註冊焦點離開回調
   * @param id 回調ID
   * @param callback 回調函數
   */
  onFocusLeave(id: string, callback: (element: HTMLElement) => void): void {
    this.callbacks.set(`leave-${id}`, callback);
  }

  /**
   * 移除回調
   * @param id 回調ID
   */
  removeCallback(id: string): void {
    this.callbacks.delete(`enter-${id}`);
    this.callbacks.delete(`leave-${id}`);
  }

  /**
   * 處理焦點進入
   */
  private handleFocusIn = (event: FocusEvent): void => {
    const element = event.target as HTMLElement;

    this.callbacks.forEach((callback, id) => {
      if (id.startsWith('enter-')) {
        callback(element);
      }
    });
  };

  /**
   * 處理焦點離開
   */
  private handleFocusOut = (event: FocusEvent): void => {
    const element = event.target as HTMLElement;

    this.callbacks.forEach((callback, id) => {
      if (id.startsWith('leave-')) {
        callback(element);
      }
    });
  };
}

// 創建全域焦點管理器實例
export const globalFocusManager = new FocusManager();
export const globalFocusObserver = new FocusObserver();

// 自動啟動焦點觀察器
if (typeof window !== 'undefined') {
  globalFocusObserver.startObserving();
}

/**
 * 便利函數：創建簡單的焦點陷阱
 * @param container 容器元素或選擇器
 * @param options 選項
 * @returns 清理函數
 */
export function createSimpleFocusTrap(
  container: HTMLElement | string,
  options: FocusTrapOptions = {}
): () => void {
  const element =
    typeof container === 'string' ? (document.querySelector(container) as HTMLElement) : container;

  if (!element) {
    throw new Error('Focus trap container not found');
  }

  const trap = globalFocusManager.createFocusTrap(element, options);
  trap.activate();

  return () => {
    trap.deactivate();
    globalFocusManager.removeFocusTrap(options.id || '');
  };
}

/**
 * 便利函數：自動聚焦第一個可聚焦元素
 * @param container 容器
 * @param delay 延遲時間 (毫秒)
 */
export function autoFocusFirst(container: HTMLElement, delay: number = 0): Promise<boolean> {
  return new Promise(resolve => {
    const focus = () => {
      const result = globalFocusManager.focusFirst(container);
      resolve(result);
    };

    if (delay > 0) {
      setTimeout(focus, delay);
    } else {
      focus();
    }
  });
}

/**
 * 便利函數：保存並恢復焦點
 * @param action 要執行的動作
 * @returns Promise
 */
export async function withFocusRestore<T>(action: () => Promise<T> | T): Promise<T> {
  const activeElement = document.activeElement as HTMLElement;

  try {
    const result = await action();
    return result;
  } finally {
    if (activeElement && isElementFocusable(activeElement)) {
      globalFocusManager.setFocus(activeElement);
    }
  }
}
