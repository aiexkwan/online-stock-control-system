/**
 * Request Deduplicator
 * 防止相同請求在短時間內重複發送
 */

interface PendingRequest<T = unknown> {
  promise: Promise<T>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest>();
  private readonly TTL = 5000; // 5 秒內的相同請求會被去重

  /**
   * 執行去重請求
   * @param key 請求的唯一標識
   * @param requestFn 實際的請求函數
   * @returns 請求結果
   */
  async dedupe<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // 檢查是否有進行中的請求
    const pending = this.pendingRequests.get(key) as PendingRequest<T> | undefined;
    
    if (pending) {
      const age = Date.now() - pending.timestamp;
      if (age < this.TTL) {
        console.log(`[RequestDeduplicator] Reusing pending request for key: ${key}`);
        return pending.promise;
      }
      // 請求過期，移除它
      this.pendingRequests.delete(key);
    }

    // 創建新請求
    const promise = requestFn()
      .then((result) => {
        // 請求完成後清理
        this.pendingRequests.delete(key);
        return result;
      })
      .catch((error) => {
        // 錯誤時也要清理
        this.pendingRequests.delete(key);
        throw error;
      });

    // 存儲請求
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    } as PendingRequest<T>);

    return promise;
  }

  /**
   * 清除所有待處理的請求
   */
  clear() {
    this.pendingRequests.clear();
  }

  /**
   * 獲取當前待處理請求數量
   */
  get pendingCount() {
    return this.pendingRequests.size;
  }
}

// 創建單例實例
export const requestDeduplicator = new RequestDeduplicator();