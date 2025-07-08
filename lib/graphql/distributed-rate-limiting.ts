/**
 * 分散式限流系統
 * 支持多個服務實例之間的協調限流
 */

import { RedisCacheAdapter } from './redis-cache-adapter';

interface DistributedRateLimitConfig {
  instanceId: string;
  maxInstances: number;
  coordinationKey: string;
  leaderElectionTTL: number; // 領導者選舉 TTL
  syncInterval: number; // 同步間隔（毫秒）
}

interface RateLimitRule {
  key: string;
  maxRequests: number;
  windowMs: number;
  perInstance?: boolean; // 是否是每實例限制
}

interface InstanceStatus {
  instanceId: string;
  lastHeartbeat: number;
  requestCount: number;
  isLeader: boolean;
  load: number; // 負載指標 (0-1)
}

interface DistributedLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number;
  distributedInfo: {
    totalInstances: number;
    activeInstances: number;
    currentInstance: string;
    loadBalancing: boolean;
  };
}

class DistributedRateLimiter {
  private cacheAdapter: RedisCacheAdapter;
  private config: DistributedRateLimitConfig;
  private heartbeatInterval?: NodeJS.Timeout;
  private syncInterval?: NodeJS.Timeout;
  private isLeader = false;
  private activeInstances = new Map<string, InstanceStatus>();

  constructor(cacheAdapter: RedisCacheAdapter, config: DistributedRateLimitConfig) {
    this.cacheAdapter = cacheAdapter;
    this.config = config;
    this.startHeartbeat();
    this.startLeaderElection();
    this.startInstanceSync();
  }

  /**
   * 檢查分散式限流
   */
  async checkLimit(rule: RateLimitRule, identifier: string): Promise<DistributedLimitResult> {
    const window = Math.floor(Date.now() / rule.windowMs);
    const distributedKey = `distributed_limit:${rule.key}:${identifier}:${window}`;
    const instanceKey = `instance_limit:${this.config.instanceId}:${rule.key}:${identifier}:${window}`;

    if (rule.perInstance) {
      // 每實例獨立限流
      return this.checkInstanceLimit(rule, identifier, instanceKey);
    } else {
      // 分散式協調限流
      return this.checkDistributedLimit(rule, identifier, distributedKey, instanceKey);
    }
  }

  /**
   * 分散式協調限流檢查
   */
  private async checkDistributedLimit(
    rule: RateLimitRule,
    identifier: string,
    distributedKey: string,
    instanceKey: string
  ): Promise<DistributedLimitResult> {
    const activeInstanceCount = this.getActiveInstanceCount();
    const perInstanceLimit = Math.ceil(rule.maxRequests / Math.max(1, activeInstanceCount));

    // 使用 Lua 腳本確保原子性
    const luaScript = `
      local distributed_key = KEYS[1]
      local instance_key = KEYS[2]
      local instance_id = ARGV[1]
      local max_requests = tonumber(ARGV[2])
      local per_instance_limit = tonumber(ARGV[3])
      local window_ms = tonumber(ARGV[4])
      local current_time = tonumber(ARGV[5])
      
      -- 獲取分散式總計數
      local distributed_count = tonumber(redis.call('GET', distributed_key) or 0)
      
      -- 獲取當前實例計數
      local instance_count = tonumber(redis.call('GET', instance_key) or 0)
      
      -- 檢查分散式限制
      if distributed_count >= max_requests then
        return {0, max_requests - distributed_count, current_time + window_ms}
      end
      
      -- 檢查實例限制
      if instance_count >= per_instance_limit then
        return {0, per_instance_limit - instance_count, current_time + window_ms}
      end
      
      -- 增加計數
      redis.call('INCR', distributed_key)
      redis.call('EXPIRE', distributed_key, math.ceil(window_ms / 1000))
      
      redis.call('INCR', instance_key)
      redis.call('EXPIRE', instance_key, math.ceil(window_ms / 1000))
      
      return {1, max_requests - distributed_count - 1, current_time + window_ms}
    `;

    try {
      const result = await this.cacheAdapter.eval(luaScript, [
        distributedKey,
        instanceKey,
        this.config.instanceId,
        rule.maxRequests.toString(),
        perInstanceLimit.toString(),
        rule.windowMs.toString(),
        Date.now().toString(),
      ]);

      const [allowed, remaining, resetTime] = result as [number, number, number];

      return {
        allowed: allowed === 1,
        remainingRequests: Math.max(0, remaining),
        resetTime,
        distributedInfo: {
          totalInstances: this.config.maxInstances,
          activeInstances: activeInstanceCount,
          currentInstance: this.config.instanceId,
          loadBalancing: true,
        },
      };
    } catch (error) {
      console.error('[DistributedRateLimiter] 限流檢查失敗:', error);
      // 降級到本地限流
      return this.checkInstanceLimit(rule, identifier, instanceKey);
    }
  }

  /**
   * 實例級限流檢查
   */
  private async checkInstanceLimit(
    rule: RateLimitRule,
    identifier: string,
    instanceKey: string
  ): Promise<DistributedLimitResult> {
    try {
      const current = await this.cacheAdapter.get(instanceKey);
      const count = current ? parseInt(current) : 0;

      if (count >= rule.maxRequests) {
        return {
          allowed: false,
          remainingRequests: 0,
          resetTime: Date.now() + rule.windowMs,
          distributedInfo: {
            totalInstances: 1,
            activeInstances: 1,
            currentInstance: this.config.instanceId,
            loadBalancing: false,
          },
        };
      }

      await this.cacheAdapter.set(
        instanceKey,
        (count + 1).toString(),
        Math.ceil(rule.windowMs / 1000)
      );

      return {
        allowed: true,
        remainingRequests: rule.maxRequests - count - 1,
        resetTime: Date.now() + rule.windowMs,
        distributedInfo: {
          totalInstances: 1,
          activeInstances: 1,
          currentInstance: this.config.instanceId,
          loadBalancing: false,
        },
      };
    } catch (error) {
      console.error('[DistributedRateLimiter] 實例限流檢查失敗:', error);
      return {
        allowed: true, // 失敗時允許請求
        remainingRequests: rule.maxRequests,
        resetTime: Date.now() + rule.windowMs,
        distributedInfo: {
          totalInstances: 1,
          activeInstances: 1,
          currentInstance: this.config.instanceId,
          loadBalancing: false,
        },
      };
    }
  }

  /**
   * 開始心跳機制
   */
  private startHeartbeat(): void {
    const sendHeartbeat = async () => {
      try {
        const heartbeatKey = `instance_heartbeat:${this.config.instanceId}`;
        const status: InstanceStatus = {
          instanceId: this.config.instanceId,
          lastHeartbeat: Date.now(),
          requestCount: await this.getInstanceRequestCount(),
          isLeader: this.isLeader,
          load: await this.calculateInstanceLoad(),
        };

        await this.cacheAdapter.set(
          heartbeatKey,
          JSON.stringify(status),
          Math.ceil((this.config.syncInterval * 2) / 1000) // TTL 為同步間隔的兩倍
        );
      } catch (error) {
        console.error('[DistributedRateLimiter] 心跳發送失敗:', error);
      }
    };

    // 立即發送心跳
    sendHeartbeat();

    // 定期發送心跳
    this.heartbeatInterval = setInterval(sendHeartbeat, this.config.syncInterval / 2);
  }

  /**
   * 開始領導者選舉
   */
  private startLeaderElection(): void {
    const electLeader = async () => {
      try {
        const leaderKey = `leader:${this.config.coordinationKey}`;
        const acquired = await this.cacheAdapter.acquireLock(
          leaderKey,
          this.config.instanceId,
          this.config.leaderElectionTTL
        );

        if (acquired && !this.isLeader) {
          this.isLeader = true;
          console.log('[DistributedRateLimiter] 成為領導者實例');
          this.startLeaderTasks();
        } else if (!acquired && this.isLeader) {
          this.isLeader = false;
          console.log('[DistributedRateLimiter] 失去領導者地位');
          this.stopLeaderTasks();
        }
      } catch (error) {
        console.error('[DistributedRateLimiter] 領導者選舉失敗:', error);
      }
    };

    // 立即嘗試選舉
    electLeader();

    // 定期重新選舉
    setInterval(electLeader, this.config.leaderElectionTTL / 2);
  }

  /**
   * 開始實例同步
   */
  private startInstanceSync(): void {
    const syncInstances = async () => {
      try {
        const pattern = `instance_heartbeat:*`;
        const keys = await this.cacheAdapter.keys(pattern);

        this.activeInstances.clear();

        for (const key of keys) {
          const statusJson = await this.cacheAdapter.get(key);
          if (statusJson) {
            try {
              const status: InstanceStatus = JSON.parse(statusJson);
              // 檢查心跳是否新鮮
              if (Date.now() - status.lastHeartbeat < this.config.syncInterval * 2) {
                this.activeInstances.set(status.instanceId, status);
              }
            } catch (parseError) {
              console.warn('[DistributedRateLimiter] 解析實例狀態失敗:', parseError);
            }
          }
        }
      } catch (error) {
        console.error('[DistributedRateLimiter] 實例同步失敗:', error);
      }
    };

    // 立即同步
    syncInstances();

    // 定期同步
    this.syncInterval = setInterval(syncInstances, this.config.syncInterval);
  }

  /**
   * 開始領導者任務
   */
  private startLeaderTasks(): void {
    // 領導者負責清理過期實例
    const cleanupInterval = setInterval(async () => {
      if (!this.isLeader) {
        clearInterval(cleanupInterval);
        return;
      }

      try {
        await this.cleanupExpiredInstances();
        await this.rebalanceLoads();
      } catch (error) {
        console.error('[DistributedRateLimiter] 領導者任務執行失敗:', error);
      }
    }, this.config.syncInterval);
  }

  /**
   * 停止領導者任務
   */
  private stopLeaderTasks(): void {
    // 領導者任務會在檢查 isLeader 時自動停止
  }

  /**
   * 清理過期實例
   */
  private async cleanupExpiredInstances(): Promise<void> {
    const expiredThreshold = Date.now() - this.config.syncInterval * 3;
    const expiredInstances: string[] = [];

    for (const [instanceId, status] of this.activeInstances) {
      if (status.lastHeartbeat < expiredThreshold) {
        expiredInstances.push(instanceId);
      }
    }

    for (const instanceId of expiredInstances) {
      this.activeInstances.delete(instanceId);
      await this.cacheAdapter.delete(`instance_heartbeat:${instanceId}`);
    }

    if (expiredInstances.length > 0) {
      console.log('[DistributedRateLimiter] 清理過期實例:', expiredInstances);
    }
  }

  /**
   * 負載重新平衡
   */
  private async rebalanceLoads(): Promise<void> {
    const instances = Array.from(this.activeInstances.values());
    if (instances.length <= 1) return;

    const avgLoad = instances.reduce((sum, inst) => sum + inst.load, 0) / instances.length;
    const highLoadInstances = instances.filter(inst => inst.load > avgLoad * 1.5);
    const lowLoadInstances = instances.filter(inst => inst.load < avgLoad * 0.5);

    if (highLoadInstances.length > 0 && lowLoadInstances.length > 0) {
      // 可以實施負載重新分配邏輯
      console.log('[DistributedRateLimiter] 檢測到負載不均衡，建議重新分配');
    }
  }

  /**
   * 獲取活躍實例數量
   */
  private getActiveInstanceCount(): number {
    return Math.max(1, this.activeInstances.size);
  }

  /**
   * 獲取實例請求計數
   */
  private async getInstanceRequestCount(): Promise<number> {
    try {
      const pattern = `instance_limit:${this.config.instanceId}:*`;
      const keys = await this.cacheAdapter.keys(pattern);
      let totalCount = 0;

      for (const key of keys) {
        const count = await this.cacheAdapter.get(key);
        if (count) {
          totalCount += parseInt(count);
        }
      }

      return totalCount;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 計算實例負載
   */
  private async calculateInstanceLoad(): Promise<number> {
    // 簡單的負載計算：基於請求數量和響應時間
    const requestCount = await this.getInstanceRequestCount();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // 標準化負載指標 (0-1)
    const requestLoad = Math.min(1, requestCount / 1000); // 假設 1000 為高負載閾值
    const memoryLoad = memoryUsage.heapUsed / memoryUsage.heapTotal;

    return requestLoad * 0.4 + memoryLoad * 0.6;
  }

  /**
   * 獲取集群狀態
   */
  async getClusterStatus(): Promise<{
    instances: InstanceStatus[];
    leader: string | null;
    totalLoad: number;
    isHealthy: boolean;
  }> {
    const instances = Array.from(this.activeInstances.values());
    const leader = instances.find(inst => inst.isLeader)?.instanceId || null;
    const totalLoad = instances.reduce((sum, inst) => sum + inst.load, 0);
    const isHealthy = instances.length > 0 && totalLoad < instances.length * 0.8;

    return {
      instances,
      leader,
      totalLoad,
      isHealthy,
    };
  }

  /**
   * 停止分散式限流器
   */
  stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // 釋放領導者地位
    if (this.isLeader) {
      const leaderKey = `leader:${this.config.coordinationKey}`;
      this.cacheAdapter.releaseLock(leaderKey, this.config.instanceId);
    }
  }
}

/**
 * 創建分散式限流器實例
 */
export function createDistributedRateLimiter(
  cacheAdapter: RedisCacheAdapter,
  options: Partial<DistributedRateLimitConfig> = {}
): DistributedRateLimiter {
  const config: DistributedRateLimitConfig = {
    instanceId: process.env.INSTANCE_ID || `instance-${Math.random().toString(36).substr(2, 9)}`,
    maxInstances: parseInt(process.env.MAX_INSTANCES || '10'),
    coordinationKey: process.env.COORDINATION_KEY || 'graphql-rate-limiter',
    leaderElectionTTL: parseInt(process.env.LEADER_ELECTION_TTL || '30000'), // 30 秒
    syncInterval: parseInt(process.env.SYNC_INTERVAL || '10000'), // 10 秒
    ...options,
  };

  return new DistributedRateLimiter(cacheAdapter, config);
}

export type { DistributedRateLimitConfig, RateLimitRule, InstanceStatus, DistributedLimitResult };
export { DistributedRateLimiter };
