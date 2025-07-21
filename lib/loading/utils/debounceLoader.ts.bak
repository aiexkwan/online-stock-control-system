/**
 * Debounce Loader Utility
 * 防抖載入工具
 *
 * 提供高級防抖載入功能，避免頻繁的載入狀態切換
 */

export interface DebounceLoaderOptions {
  /** 防抖延遲時間 (ms) */
  delay: number;
  /** 最大等待時間 (ms) */
  maxWait?: number;
  /** 是否在首次調用時立即執行 */
  leading?: boolean;
  /** 是否在最後一次調用後執行 */
  trailing?: boolean;
}

export class DebounceLoader {
  private timeoutId: NodeJS.Timeout | null = null;
  private maxTimeoutId: NodeJS.Timeout | null = null;
  private lastCallTime = 0;
  private lastInvokeTime = 0;
  public readonly options: Required<DebounceLoaderOptions>;

  constructor(
    private readonly func: (...args: Record<string, unknown>[]) => void,
    options: DebounceLoaderOptions
  ) {
    this.options = {
      delay: options.delay,
      maxWait: options.maxWait ?? Number.MAX_SAFE_INTEGER,
      leading: options.leading ?? false,
      trailing: options.trailing ?? true,
    };
  }

  /**
   * 執行防抖載入
   */
  public invoke(...args: Record<string, unknown>[]): void {
    const time = Date.now();
    const isInvoking = this.shouldInvoke(time);

    this.lastCallTime = time;

    if (isInvoking) {
      return this.invokeFunc(time, ...args);
    }

    this.startTimer(time, ...args);
  }

  /**
   * 取消待執行的載入
   */
  public cancel(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.maxTimeoutId !== null) {
      clearTimeout(this.maxTimeoutId);
      this.maxTimeoutId = null;
    }
    this.lastInvokeTime = 0;
    this.lastCallTime = 0;
  }

  /**
   * 立即執行載入（忽略防抖）
   */
  public flush(...args: Record<string, unknown>[]): void {
    if (this.timeoutId !== null) {
      return this.invokeFunc(Date.now(), ...args);
    }
  }

  /**
   * 檢查是否有待執行的載入
   */
  public isPending(): boolean {
    return this.timeoutId !== null;
  }

  private shouldInvoke(time: number): boolean {
    const timeSinceLastCall = time - this.lastCallTime;
    const timeSinceLastInvoke = time - this.lastInvokeTime;

    return (
      this.lastCallTime === 0 ||
      timeSinceLastCall >= this.options.delay ||
      timeSinceLastCall < 0 ||
      (this.options.maxWait !== Number.MAX_SAFE_INTEGER &&
        timeSinceLastInvoke >= this.options.maxWait)
    );
  }

  private invokeFunc(time: number, ...args: Record<string, unknown>[]): void {
    const lastArgs = args;
    this.cancel();
    this.lastInvokeTime = time;
    this.func(...lastArgs);
  }

  private startTimer(time: number, ...args: Record<string, unknown>[]): void {
    this.timeoutId = setTimeout(() => {
      this.invokeFunc(Date.now(), ...args);
    }, this.options.delay);

    if (this.options.maxWait !== Number.MAX_SAFE_INTEGER) {
      this.maxTimeoutId = setTimeout(() => {
        this.invokeFunc(Date.now(), ...args);
      }, this.options.maxWait);
    }
  }
}

/**
 * 創建防抖載入函數
 */
export function createDebounceLoader<T extends (...args: Record<string, unknown>[]) => void>(
  func: T,
  options: DebounceLoaderOptions
): {
  invoke: T;
  cancel: () => void;
  flush: T;
  isPending: () => boolean;
} {
  const debouncer = new DebounceLoader(func, options);

  return {
    invoke: ((...args: Record<string, unknown>[]) => debouncer.invoke(...args)) as T,
    cancel: () => debouncer.cancel(),
    flush: ((...args: Record<string, unknown>[]) => debouncer.flush(...args)) as T,
    isPending: () => debouncer.isPending(),
  };
}

/**
 * 智能防抖載入 - 根據載入頻率自動調整防抖時間
 */
export class SmartDebounceLoader {
  private debouncer: DebounceLoader;
  private callHistory: number[] = [];
  private readonly maxHistorySize = 10;
  private readonly baseDelay: number;
  private readonly maxDelay: number;
  private readonly minDelay: number;

  constructor(
    private readonly func: (...args: Record<string, unknown>[]) => void,
    baseDelay: number = 300,
    minDelay: number = 50,
    maxDelay: number = 1000
  ) {
    this.baseDelay = baseDelay;
    this.minDelay = minDelay;
    this.maxDelay = maxDelay;

    this.debouncer = new DebounceLoader(func, {
      delay: baseDelay,
      trailing: true,
    });
  }

  /**
   * 執行智能防抖載入
   */
  public invoke(...args: Record<string, unknown>[]): void {
    this.recordCall();
    this.adjustDelay();
    this.debouncer.invoke(...args);
  }

  /**
   * 取消載入
   */
  public cancel(): void {
    this.debouncer.cancel();
  }

  /**
   * 立即執行載入
   */
  public flush(...args: Record<string, unknown>[]): void {
    this.debouncer.flush(...args);
  }

  /**
   * 獲取當前防抖延遲
   */
  public getCurrentDelay(): number {
    return this.debouncer.options.delay;
  }

  private recordCall(): void {
    const now = Date.now();
    this.callHistory.push(now);

    // 保持歷史記錄在限制範圍內
    if (this.callHistory.length > this.maxHistorySize) {
      this.callHistory.shift();
    }
  }

  private adjustDelay(): void {
    if (this.callHistory.length < 3) return;

    // 計算調用頻率
    const recentCalls = this.callHistory.slice(-5);
    const timeSpan = recentCalls[recentCalls.length - 1] - recentCalls[0];
    const avgInterval = timeSpan / (recentCalls.length - 1);

    // 根據調用頻率調整延遲
    let newDelay: number;

    if (avgInterval < 100) {
      // 高頻調用 - 增加延遲
      newDelay = Math.min(this.maxDelay, this.baseDelay * 2);
    } else if (avgInterval > 1000) {
      // 低頻調用 - 減少延遲
      newDelay = Math.max(this.minDelay, this.baseDelay * 0.5);
    } else {
      // 正常頻率 - 使用基礎延遲
      newDelay = this.baseDelay;
    }

    // 更新防抖器延遲
    // 需要重新創建防抖器以更新延遲
    // Strategy 4: unknown + type narrowing - 重新創建 debouncer
    this.debouncer = new DebounceLoader(this.func, {
      ...this.debouncer.options,
      delay: newDelay,
    });
  }
}

/**
 * 載入狀態防抖管理器
 */
export class LoadingStateDebouncer {
  private debouncers = new Map<string, DebounceLoader>();
  private readonly defaultOptions: DebounceLoaderOptions;

  constructor(defaultOptions: Partial<DebounceLoaderOptions> = {}) {
    this.defaultOptions = {
      delay: 300,
      leading: false,
      trailing: true,
      ...defaultOptions,
    };
  }

  /**
   * 註冊載入狀態防抖器
   */
  public register(
    id: string,
    func: (...args: Record<string, unknown>[]) => void,
    options?: Partial<DebounceLoaderOptions>
  ): void {
    const mergedOptions = { ...this.defaultOptions, ...options };
    this.debouncers.set(id, new DebounceLoader(func, mergedOptions));
  }

  /**
   * 執行指定的載入防抖
   */
  public invoke(id: string, ...args: Record<string, unknown>[]): boolean {
    const debouncer = this.debouncers.get(id);
    if (!debouncer) return false;

    debouncer.invoke(...args);
    return true;
  }

  /**
   * 取消指定的載入防抖
   */
  public cancel(id: string): boolean {
    const debouncer = this.debouncers.get(id);
    if (!debouncer) return false;

    debouncer.cancel();
    return true;
  }

  /**
   * 立即執行指定的載入
   */
  public flush(id: string, ...args: Record<string, unknown>[]): boolean {
    const debouncer = this.debouncers.get(id);
    if (!debouncer) return false;

    debouncer.flush(...args);
    return true;
  }

  /**
   * 取消所有載入防抖
   */
  public cancelAll(): void {
    this.debouncers.forEach(debouncer => debouncer.cancel());
  }

  /**
   * 移除指定的防抖器
   */
  public unregister(id: string): boolean {
    const debouncer = this.debouncers.get(id);
    if (!debouncer) return false;

    debouncer.cancel();
    this.debouncers.delete(id);
    return true;
  }

  /**
   * 清理所有防抖器
   */
  public clear(): void {
    this.cancelAll();
    this.debouncers.clear();
  }

  /**
   * 獲取活躍的防抖器數量
   */
  public getActiveCount(): number {
    return Array.from(this.debouncers.values()).filter(debouncer => debouncer.isPending()).length;
  }
}
