/**
 * 防抖函數
 * @param func 要執行的函數
 * @param wait 等待時間（毫秒）
 * @returns 防抖後的函數
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function debounced(this: unknown, ...args: Parameters<T>) {
    const context = this;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func.apply(context, args);
      timeout = null;
    }, wait);
  };
}

/**
 * 帶取消功能的防抖函數
 */
export function debounceWithCancel<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): {
  debounced: (...args: Parameters<T>) => void;
  cancel: () => void;
} {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = function (this: unknown, ...args: Parameters<T>) {
    const context = this;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func.apply(context, args);
      timeout = null;
    }, wait);
  };

  const cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return { debounced, cancel };
}
