/**
 * 測試數據庫連接池管理
 * 優化測試環境中的 Supabase 連接複用和性能
 */

import { createClient } from '@supabase/supabase-js';

export interface TestDbPoolConfig {
  maxConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export class TestDbPool {
  private static instance: TestDbPool;
  private connections: Map<string, any> = new Map();
  private config: TestDbPoolConfig;
  private activeConnections = 0;
  private stats = {
    created: 0,
    reused: 0,
    errors: 0,
    timeouts: 0,
  };

  private constructor(config: TestDbPoolConfig) {
    this.config = config;
  }

  static getInstance(config?: TestDbPoolConfig): TestDbPool {
    if (!TestDbPool.instance) {
      const defaultConfig: TestDbPoolConfig = {
        maxConnections: process.env.CI ? 2 : 5,
        connectionTimeout: 5000,
        idleTimeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
      };
      TestDbPool.instance = new TestDbPool(config || defaultConfig);
    }
    return TestDbPool.instance;
  }

  async getConnection(key = 'default'): Promise<any> {
    // 檢查是否已有連接
    if (this.connections.has(key)) {
      this.stats.reused++;
      return this.connections.get(key);
    }

    // 檢查連接池限制
    if (this.activeConnections >= this.config.maxConnections) {
      await this.waitForAvailableConnection();
    }

    try {
      const client = this.createTestClient();
      this.connections.set(key, client);
      this.activeConnections++;
      this.stats.created++;

      // 設置空閒超時
      setTimeout(() => {
        this.releaseConnection(key);
      }, this.config.idleTimeout);

      return client;
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }

  private createTestClient() {
    // 為測試環境創建優化的 Supabase 客戶端
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        realtime: {
          params: {
            eventsPerSecond: 1, // 限制實時事件頻率
          },
        },
        global: {
          headers: {
            'x-test-environment': 'true',
          },
        },
      }
    );
  }

  private async waitForAvailableConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.stats.timeouts++;
        reject(new Error('Connection pool timeout'));
      }, this.config.connectionTimeout);

      const checkAvailability = () => {
        if (this.activeConnections < this.config.maxConnections) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(checkAvailability, 100);
        }
      };

      checkAvailability();
    });
  }

  releaseConnection(key: string): void {
    if (this.connections.has(key)) {
      this.connections.delete(key);
      this.activeConnections = Math.max(0, this.activeConnections - 1);
    }
  }

  async releaseAllConnections(): Promise<void> {
    for (const [key] of this.connections) {
      this.releaseConnection(key);
    }
    this.connections.clear();
    this.activeConnections = 0;
  }

  getStats() {
    return {
      ...this.stats,
      activeConnections: this.activeConnections,
      poolSize: this.connections.size,
    };
  }

  resetStats(): void {
    this.stats = {
      created: 0,
      reused: 0,
      errors: 0,
      timeouts: 0,
    };
  }
}

// 導出便利函數
export async function getTestDbConnection(key?: string) {
  const pool = TestDbPool.getInstance();
  return pool.getConnection(key);
}

export function releaseTestDbConnection(key: string) {
  const pool = TestDbPool.getInstance();
  pool.releaseConnection(key);
}

export function getTestDbStats() {
  const pool = TestDbPool.getInstance();
  return pool.getStats();
}

// Jest 清理 hooks
export function setupTestDbCleanup() {
  afterEach(async () => {
    const pool = TestDbPool.getInstance();
    await pool.releaseAllConnections();
  });

  afterAll(async () => {
    const pool = TestDbPool.getInstance();
    await pool.releaseAllConnections();
    pool.resetStats();
  });
}

// 性能監控中間件
export function withDbPerformanceTracking<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: any[]) => {
    const start = performance.now();
    const result = fn(...args);

    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;
        if (duration > 1000) {
          console.warn(`Slow DB operation detected: ${name} took ${duration}ms`);
        }
      });
    } else {
      const duration = performance.now() - start;
      if (duration > 100) {
        console.warn(`Slow DB operation detected: ${name} took ${duration}ms`);
      }
      return result;
    }
  }) as T;
}