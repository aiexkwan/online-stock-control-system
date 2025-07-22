import Redis from 'ioredis';
import { DatabaseRecord } from '@/types/database/tables';
import { cacheLogger } from './logger';

// Upstash Redis 配置類型
export interface UpstashRedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  tls?: boolean;
  enableAutoPipelining?: boolean;
}

// Redis 客戶端單例
let redisClient: Redis | null = null;

/**
 * 創建並配置 Redis 客戶端（適用於 Upstash 和 Vercel）
 */
export function createRedisClient(config?: UpstashRedisConfig): Redis {
  if (redisClient) {
    return redisClient;
  }

  // 優先使用 REDIS_URL 環境變數
  const redisUrl = config?.url || process.env.REDIS_URL;

  if (redisUrl) {
    // 使用 URL 連接（Upstash 模式）
    redisClient = new Redis(redisUrl, {
      // Upstash 的 TLS 配置
      tls: {
        rejectUnauthorized: false, // Upstash 需要這個設定
      },
      // 優化 Vercel 無伺服器環境
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      lazyConnect: true,
      enableAutoPipelining: config?.enableAutoPipelining ?? true,
      // 無伺服器環境優化
      keepAlive: 0,
      enableOfflineQueue: false,
    });
  } else {
    // 傳統配置模式（本地開發）
    const redisConfig: DatabaseRecord = {
      host: config?.host || process.env.REDIS_HOST || 'localhost',
      port: config?.port || parseInt(process.env.REDIS_PORT || '6379'),
      password: config?.password || process.env.REDIS_PASSWORD,
      db: config?.db || parseInt(process.env.REDIS_DB || '0'),

      // 基本配置
      connectTimeout: 10000,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
      enableOfflineQueue: false,

      // TLS 配置（如果需要）
      ...(config?.tls && {
        tls: {
          rejectUnauthorized: false,
        },
      }),
    };

    redisClient = new Redis(redisConfig);
  }

  // 設定事件監聽器
  setupRedisEventListeners(redisClient);

  return redisClient;
}

/**
 * 設定 Redis 事件監聽器
 */
function setupRedisEventListeners(client: Redis): void {
  client.on('connect', () => {
    cacheLogger.info(
      {
        service: 'Redis',
        event: 'connect',
      },
      'Redis 連接成功'
    );
  });

  client.on('ready', () => {
    cacheLogger.info(
      {
        service: 'Redis',
        event: 'ready',
      },
      'Redis 準備就緒'
    );
  });

  client.on('error', error => {
    cacheLogger.error(
      {
        service: 'Redis',
        event: 'error',
        error: error.message,
        stack: error.stack,
      },
      'Redis 連接錯誤'
    );
  });

  client.on('close', () => {
    cacheLogger.warn(
      {
        service: 'Redis',
        event: 'close',
      },
      'Redis 連接已關閉'
    );
  });

  client.on('reconnecting', (time: number) => {
    cacheLogger.info(
      {
        service: 'Redis',
        event: 'reconnecting',
        timeMs: time,
      },
      `Redis 重新連接中... (${time}ms)`
    );
  });

  client.on('end', () => {
    cacheLogger.info(
      {
        service: 'Redis',
        event: 'end',
      },
      'Redis 連接結束'
    );
  });
}

/**
 * 獲取 Redis 客戶端實例
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

/**
 * 測試 Redis 連接
 */
export async function testRedisConnection(): Promise<boolean> {
  const startTime = Date.now();

  try {
    const client = getRedisClient();
    const result = await client.ping();

    cacheLogger.info(
      {
        service: 'Redis',
        operation: 'testConnection',
        result,
        responseTime: Date.now() - startTime,
      },
      'Redis ping 測試成功'
    );

    return true;
  } catch (error) {
    cacheLogger.error(
      {
        service: 'Redis',
        operation: 'testConnection',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      },
      'Redis ping 測試失敗'
    );
    return false;
  }
}

/**
 * 優雅關閉 Redis 連接
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();

      cacheLogger.info(
        {
          service: 'Redis',
          operation: 'close',
          graceful: true,
        },
        'Redis 連接已優雅關閉'
      );
    } catch (error) {
      cacheLogger.error(
        {
          service: 'Redis',
          operation: 'close',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        '關閉 Redis 連接時發生錯誤'
      );
    } finally {
      redisClient = null;
    }
  }
}

/**
 * 重置 Redis 連接（用於開發環境熱重載）
 */
export function resetRedisConnection(): void {
  if (redisClient) {
    redisClient.disconnect();
    redisClient = null;
  }
}

// 針對 Vercel 的無伺服器環境優化
if (process.env.VERCEL) {
  // 在 Vercel 環境中，進程結束時自動關閉連接
  process.on('beforeExit', closeRedisConnection);
  process.on('SIGINT', closeRedisConnection);
  process.on('SIGTERM', closeRedisConnection);
}

// 預設匯出 Redis 客戶端
export const redis = getRedisClient();
export default redis;
