import { DatabaseRecord } from '@/types/database/tables';

/**
 * 報表緩存系統
 * 減少重複查詢，提升報表生成性能
 */

interface CacheEntry {
  data: DatabaseRecord[];
  timestamp: number;
  ttl: number;
}

export class ReportCache {
  private static instance: ReportCache;
  private cache: Map<string, CacheEntry>;
  private defaultTTL = 300000; // 5 分鐘

  private constructor() {
    this.cache = new Map();

    // 定期清理過期緩存
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 60000); // 每分鐘清理一次
    }
  }

  static getInstance(): ReportCache {
    if (!ReportCache.instance) {
      ReportCache.instance = new ReportCache();
    }
    return ReportCache.instance;
  }

  /**
   * 生成緩存鍵
   */
  generateKey(reportId: string, filters: Record<string, unknown>): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce(
        (acc, key) => {
          if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
            acc[key] = filters[key];
          }
          return acc;
        },
        {} as Record<string, unknown>
      );

    return `${reportId}:${JSON.stringify(sortedFilters)}`;
  }

  /**
   * 獲取緩存數據
   */
  get(reportId: string, filters: Record<string, unknown>): DatabaseRecord[] | null {
    const key = this.generateKey(reportId, filters);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // 檢查是否過期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    (process.env.NODE_ENV as string) !== 'production' &&
      (process.env.NODE_ENV as string) !== 'production' &&
      console.log(`[ReportCache] Cache hit for ${reportId}`);
    return entry.data;
  }

  /**
   * 設置緩存數據
   */
  set(
    reportId: string,
    filters: Record<string, unknown>,
    data: DatabaseRecord[],
    ttl?: number
  ): void {
    const key = this.generateKey(reportId, filters);

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });

    (process.env.NODE_ENV as string) !== 'production' &&
      (process.env.NODE_ENV as string) !== 'production' &&
      console.log(`[ReportCache] Cached data for ${reportId}`);
  }

  /**
   * 清除特定報表的緩存
   */
  clearReport(reportId: string): void {
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (key.startsWith(`${reportId}:`)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
    (process.env.NODE_ENV as string) !== 'production' &&
      (process.env.NODE_ENV as string) !== 'production' &&
      console.log(`[ReportCache] Cleared ${keysToDelete.length} entries for ${reportId}`);
  }

  /**
   * 清除所有緩存
   */
  clearAll(): void {
    const size = this.cache.size;
    this.cache.clear();
    (process.env.NODE_ENV as string) !== 'production' &&
      (process.env.NODE_ENV as string) !== 'production' &&
      console.log(`[ReportCache] Cleared all ${size} entries`);
  }

  /**
   * 清理過期緩存
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      (process.env.NODE_ENV as string) !== 'production' &&
        (process.env.NODE_ENV as string) !== 'production' &&
        console.log(`[ReportCache] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * 獲取緩存統計
   */
  getStats(): {
    totalEntries: number;
    totalSize: number;
    reportBreakdown: Record<string, number>;
  } {
    const reportBreakdown: Record<string, number> = {};
    let totalSize = 0;

    this.cache.forEach((entry, key) => {
      const reportId = key.split(':')[0];
      reportBreakdown[reportId] = (reportBreakdown[reportId] || 0) + 1;

      // 估算大小
      totalSize += JSON.stringify(entry.data).length;
    });

    return {
      totalEntries: this.cache.size,
      totalSize,
      reportBreakdown,
    };
  }
}
