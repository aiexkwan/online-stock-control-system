/**
 * API 使用情況監控系統
 * 追踪 REST API endpoints 的使用頻率，為安全移除提供數據支援
 */

import { createClient } from '@/app/utils/supabase/server';

export interface APIUsageRecord {
  endpoint: string;
  method: string;
  timestamp: string;
  userAgent?: string;
  userId?: string;
  responseTime?: number;
  statusCode?: number;
  source: 'browser' | 'mobile' | 'api' | 'internal';
}

export interface APIUsageStats {
  endpoint: string;
  totalCalls: number;
  uniqueUsers: number;
  avgResponseTime: number;
  lastUsed: string;
  errorRate: number;
  usageByHour: Record<string, number>;
  usageByUser: Record<string, number>;
}

export class APIUsageMonitor {
  private supabase = createClient();

  /**
   * 記錄 API 使用情況
   */
  async recordUsage(record: APIUsageRecord): Promise<void> {
    try {
      const supabase = await this.supabase;

      const { error } = await supabase.from('api_usage_logs').insert({
        endpoint: record.endpoint,
        method: record.method,
        timestamp: record.timestamp,
        user_agent: record.userAgent,
        user_id: record.userId,
        response_time: record.responseTime,
        status_code: record.statusCode,
        source: record.source,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error('[APIUsageMonitor] Failed to record usage:', error);
      }
    } catch (error) {
      console.error('[APIUsageMonitor] Exception in recordUsage:', error);
    }
  }

  /**
   * 獲取 API 使用統計
   */
  async getUsageStats(
    endpoint?: string,
    timeRange: { from: string; to: string } = {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date().toISOString(),
    }
  ): Promise<APIUsageStats[]> {
    try {
      const supabase = await this.supabase;

      let query = supabase
        .from('api_usage_logs')
        .select('*')
        .gte('timestamp', timeRange.from)
        .lte('timestamp', timeRange.to);

      if (endpoint) {
        query = query.eq('endpoint', endpoint);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get usage stats: ${error.message}`);
      }

      // 聚合數據
      const statsMap = new Map<
        string,
        {
          calls: APIUsageRecord[];
          users: Set<string>;
          responseTimes: number[];
          errors: number;
          hourlyUsage: Map<string, number>;
        }
      >();

      // Define database record type
      interface APIUsageLogRecord {
        endpoint: string;
        method: string;
        timestamp: string;
        user_id?: string;
        response_time?: number;
        status_code?: number;
        [key: string]: unknown;
      }

      const records = (data || []) as APIUsageLogRecord[];
      records.forEach(record => {
        const key = `${record.method} ${record.endpoint}`;

        if (!statsMap.has(key)) {
          statsMap.set(key, {
            calls: [],
            users: new Set(),
            responseTimes: [],
            errors: 0,
            hourlyUsage: new Map(),
          });
        }

        const stats = statsMap.get(key)!;
        stats.calls.push({
          ...record,
          source: 'api' as const,
          userId: record.user_id,
          responseTime: record.response_time,
          statusCode: record.status_code,
          userAgent: undefined,
        } as APIUsageRecord);

        if (record.user_id) {
          stats.users.add(record.user_id);
        }

        if (record.response_time) {
          stats.responseTimes.push(record.response_time);
        }

        if (record.status_code && record.status_code >= 400) {
          stats.errors++;
        }

        // 按小時統計
        const hour = new Date(record.timestamp).toISOString().substring(0, 13);
        stats.hourlyUsage.set(hour, (stats.hourlyUsage.get(hour) || 0) + 1);
      });

      // 轉換為最終格式
      return Array.from(statsMap.entries()).map(([endpoint, stats]) => ({
        endpoint,
        totalCalls: stats.calls.length,
        uniqueUsers: stats.users.size,
        avgResponseTime:
          stats.responseTimes.length > 0
            ? stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length
            : 0,
        lastUsed:
          stats.calls.length > 0
            ? new Date(
                Math.max(...stats.calls.map(c => new Date(c.timestamp).getTime()))
              ).toISOString()
            : '',
        errorRate: stats.calls.length > 0 ? stats.errors / stats.calls.length : 0,
        usageByHour: Object.fromEntries(stats.hourlyUsage),
        usageByUser: Object.fromEntries(
          Array.from(stats.users).map(userId => [
            userId,
            stats.calls.filter(c => c.userId === userId).length,
          ])
        ),
      }));
    } catch (error) {
      console.error('[APIUsageMonitor] Failed to get usage stats:', error);
      return [];
    }
  }

  /**
   * 獲取未使用的 API endpoints
   */
  async getUnusedEndpoints(
    allEndpoints: string[],
    unusedThresholdDays: number = 7
  ): Promise<string[]> {
    const thresholdDate = new Date(Date.now() - unusedThresholdDays * 24 * 60 * 60 * 1000);
    const stats = await this.getUsageStats(undefined, {
      from: thresholdDate.toISOString(),
      to: new Date().toISOString(),
    });

    const usedEndpoints = new Set(stats.map(s => s.endpoint.split(' ')[1]));
    return allEndpoints.filter(endpoint => !usedEndpoints.has(endpoint));
  }

  /**
   * 檢查特定 endpoint 是否安全移除
   */
  async isSafeToRemove(endpoint: string): Promise<{
    safe: boolean;
    reason: string;
    stats: APIUsageStats | null;
  }> {
    const stats = await this.getUsageStats(endpoint);

    if (stats.length === 0) {
      return {
        safe: true,
        reason: 'No usage recorded in the last 7 days',
        stats: null,
      };
    }

    const endpointStats = stats[0];
    const lastUsedTime = new Date(endpointStats.lastUsed);
    const daysSinceLastUse = (Date.now() - lastUsedTime.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceLastUse > 7) {
      return {
        safe: true,
        reason: `Last used ${Math.floor(daysSinceLastUse)} days ago`,
        stats: endpointStats,
      };
    }

    if (endpointStats.totalCalls < 5 && daysSinceLastUse > 3) {
      return {
        safe: true,
        reason: `Low usage (${endpointStats.totalCalls} calls) and ${Math.floor(daysSinceLastUse)} days since last use`,
        stats: endpointStats,
      };
    }

    return {
      safe: false,
      reason: `Still in active use: ${endpointStats.totalCalls} calls, last used ${Math.floor(daysSinceLastUse)} days ago`,
      stats: endpointStats,
    };
  }

  /**
   * 生成監控報告
   */
  async generateReport(): Promise<{
    summary: {
      totalEndpoints: number;
      activeEndpoints: number;
      unusedEndpoints: number;
      highUsageEndpoints: number;
    };
    details: APIUsageStats[];
    recommendations: {
      safeToRemove: string[];
      needsAttention: string[];
      highPriority: string[];
    };
  }> {
    const allKnownEndpoints = [
      '/api/stats/dashboard',
      '/api/stats/inventory',
      '/api/charts/stock-distribution',
      '/api/charts/transfer-timeline',
      '/api/tables/stock-levels',
      '/api/tables/transfers',
      '/api/upload/orders',
      '/api/upload/photos',
      '/api/reports/grn',
      '/api/reports/transaction',
      '/api/reports/inventory-analysis',
      // 添加其他已知的 REST endpoints
    ];

    const stats = await this.getUsageStats();
    const unusedEndpoints = await this.getUnusedEndpoints(allKnownEndpoints);

    const safeToRemove: string[] = [];
    const needsAttention: string[] = [];
    const highPriority: string[] = [];

    for (const endpoint of allKnownEndpoints) {
      const safetyCheck = await this.isSafeToRemove(endpoint);

      if (safetyCheck.safe) {
        safeToRemove.push(endpoint);
      } else if (safetyCheck.stats && safetyCheck.stats.totalCalls > 100) {
        highPriority.push(endpoint);
      } else {
        needsAttention.push(endpoint);
      }
    }

    return {
      summary: {
        totalEndpoints: allKnownEndpoints.length,
        activeEndpoints: stats.length,
        unusedEndpoints: unusedEndpoints.length,
        highUsageEndpoints: stats.filter(s => s.totalCalls > 100).length,
      },
      details: stats,
      recommendations: {
        safeToRemove,
        needsAttention,
        highPriority,
      },
    };
  }
}

// Express middleware types
interface APIRequest {
  path: string;
  method: string;
  user?: { id: string };
  headers: Record<string, string | string[] | undefined>;
  get(header: string): string | undefined;
}

interface APIResponse {
  statusCode: number;
  send: (data: unknown) => void;
}

interface NextFunction {
  (): void;
}

// 中間件函數，用於自動記錄 API 使用情況
export function createAPIUsageMiddleware() {
  const monitor = new APIUsageMonitor();

  return (req: APIRequest, res: APIResponse, next: NextFunction) => {
    const startTime = Date.now();

    // 記錄請求開始
    const originalSend = res.send;
    res.send = function (data: unknown) {
      const responseTime = Date.now() - startTime;

      // 記錄使用情況
      monitor.recordUsage({
        endpoint: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        responseTime,
        statusCode: res.statusCode,
        source: detectSource(req),
      });

      return originalSend.call(this, data);
    };

    next();
  };
}

function detectSource(req: APIRequest): 'browser' | 'mobile' | 'api' | 'internal' {
  const userAgent = req.get('User-Agent')?.toLowerCase() || '';

  if (
    userAgent.includes('mobile') ||
    userAgent.includes('android') ||
    userAgent.includes('iphone')
  ) {
    return 'mobile';
  }

  if (
    userAgent.includes('curl') ||
    userAgent.includes('postman') ||
    userAgent.includes('insomnia')
  ) {
    return 'api';
  }

  if (req.headers['x-internal-request']) {
    return 'internal';
  }

  return 'browser';
}

export default APIUsageMonitor;
