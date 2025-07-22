/**
 * Alert System Health Checker
 * 告警系統健康檢查器 - 檢查系統各組件健康狀態
 */

import { Redis } from 'ioredis';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AlertMonitoringService } from '../services/AlertMonitoringService';
import { AlertResponse, HealthCheckDetails, SystemMetrics } from '../types';

interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message: string;
  responseTime?: number;
  details?: HealthCheckDetails;
}

export class AlertSystemHealthChecker {
  private redis: Redis;
  private supabase: SupabaseClient;
  private monitoringService: AlertMonitoringService;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.monitoringService = new AlertMonitoringService();
  }

  /**
   * 執行完整健康檢查
   */
  public async performHealthCheck(): Promise<AlertResponse> {
    try {
      const checks = await Promise.all([
        this.checkRedisHealth(),
        this.checkDatabaseHealth(),
        this.checkMonitoringServiceHealth(),
        this.checkAlertRulesHealth(),
        this.checkNotificationHealth(),
      ]);

      const overallStatus = this.calculateOverallStatus(checks);
      const unhealthyComponents = checks.filter(
        check => (check as { status: string }).status === 'unhealthy'
      );

      return {
        success: overallStatus !== 'unhealthy',
        message: `Alert system is ${overallStatus}`,
        data: {
          overallStatus,
          components: checks,
          unhealthyCount: unhealthyComponents.length,
          totalChecks: checks.length,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Health check failed',
        errors: [error instanceof Error ? (error as { message: string }).message : String(error)],
      };
    }
  }

  /**
   * 檢查 Redis 健康狀態
   */
  private async checkRedisHealth(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      const result = await this.redis.ping();
      const responseTime = Date.now() - start;

      if (result === 'PONG') {
        return {
          component: 'Redis',
          status: responseTime < 100 ? 'healthy' : 'degraded',
          message: `Redis is responding (${responseTime}ms)`,
          responseTime,
          details: {
            connected: true,
            responseTime,
          },
        };
      } else {
        return {
          component: 'Redis',
          status: 'unhealthy',
          message: 'Redis ping failed',
          responseTime,
        };
      }
    } catch (error) {
      return {
        component: 'Redis',
        status: 'unhealthy',
        message: `Redis connection failed: ${error instanceof Error ? (error as { message: string }).message : String(error)}`,
        responseTime: Date.now() - start,
      };
    }
  }

  /**
   * 檢查數據庫健康狀態
   */
  private async checkDatabaseHealth(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      // 檢查連接
      const { data, error } = await this.supabase.from('alert_rules').select('count').limit(1);

      const responseTime = Date.now() - start;

      if (error) {
        return {
          component: 'Database',
          status: 'unhealthy',
          message: `Database query failed: ${(error as { message: string }).message}`,
          responseTime,
        };
      }

      // 檢查表格完整性
      const tableCheck = await this.checkDatabaseTables();

      return {
        component: 'Database',
        status: responseTime < 200 && tableCheck.allTablesExist ? 'healthy' : 'degraded',
        message: `Database is responding (${responseTime}ms)`,
        responseTime,
        details: {
          connected: true,
          responseTime,
          tables: tableCheck,
        },
      };
    } catch (error) {
      return {
        component: 'Database',
        status: 'unhealthy',
        message: `Database connection failed: ${error instanceof Error ? (error as { message: string }).message : String(error)}`,
        responseTime: Date.now() - start,
      };
    }
  }

  /**
   * 檢查數據庫表格
   */
  private async checkDatabaseTables(): Promise<HealthCheckDetails> {
    const requiredTables = [
      'alert_rules',
      'alerts',
      'notification_history',
      'alert_templates',
      'alert_escalations',
      'alert_suppressions',
    ];

    const tableStatus: Record<string, boolean> = {};
    let allTablesExist = true;

    for (const table of requiredTables) {
      try {
        const { data, error } = await this.supabase.from(table).select('count').limit(1);

        tableStatus[table] = !error;
        if (error) allTablesExist = false;
      } catch (error) {
        tableStatus[table] = false;
        allTablesExist = false;
      }
    }

    return {
      allTablesExist,
      tables: tableStatus,
      missingTables: requiredTables.filter(table => !tableStatus[table]),
    };
  }

  /**
   * 檢查監控服務健康狀態
   */
  private async checkMonitoringServiceHealth(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      const status = await this.monitoringService.getStatus();
      const responseTime = Date.now() - start;

      if (status.running) {
        return {
          component: 'Monitoring Service',
          status: 'healthy',
          message: `Monitoring service is running (uptime: ${Math.round(status.uptime / 1000)}s)`,
          responseTime,
          details: {
            running: status.running,
            uptime: status.uptime,
            rulesCount: status.rulesCount,
            activeAlertsCount: status.activeAlertsCount,
            lastEvaluation: status.lastEvaluation,
          },
        };
      } else {
        return {
          component: 'Monitoring Service',
          status: 'unhealthy',
          message: 'Monitoring service is not running',
          responseTime,
          details: {
            running: status.running,
            uptime: status.uptime,
            rulesCount: status.rulesCount,
            activeAlertsCount: status.activeAlertsCount,
            lastEvaluation: status.lastEvaluation?.toISOString(),
            errors: status.errors,
          } as HealthCheckDetails,
        };
      }
    } catch (error) {
      return {
        component: 'Monitoring Service',
        status: 'unhealthy',
        message: `Monitoring service check failed: ${error instanceof Error ? (error as { message: string }).message : String(error)}`,
        responseTime: Date.now() - start,
      };
    }
  }

  /**
   * 檢查告警規則健康狀態
   */
  private async checkAlertRulesHealth(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      const { data: enabledRules, error: enabledError } = await this.supabase
        .from('alert_rules')
        .select('count')
        .eq('enabled', true);

      const { data: totalRules, error: totalError } = await this.supabase
        .from('alert_rules')
        .select('count');

      const responseTime = Date.now() - start;

      if (enabledError || totalError) {
        return {
          component: 'Alert Rules',
          status: 'unhealthy',
          message: 'Failed to query alert rules',
          responseTime,
        };
      }

      const enabledCount = enabledRules?.length || 0;
      const totalCount = totalRules?.length || 0;

      return {
        component: 'Alert Rules',
        status: enabledCount > 0 ? 'healthy' : 'degraded',
        message: `${enabledCount} of ${totalCount} rules are enabled`,
        responseTime,
        details: {
          enabled: enabledCount,
          total: totalCount,
          disabled: totalCount - enabledCount,
        },
      };
    } catch (error) {
      return {
        component: 'Alert Rules',
        status: 'unhealthy',
        message: `Alert rules check failed: ${error instanceof Error ? (error as { message: string }).message : String(error)}`,
        responseTime: Date.now() - start,
      };
    }
  }

  /**
   * 檢查通知健康狀態
   */
  private async checkNotificationHealth(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      // 檢查最近的通知發送情況
      const { data: recentNotifications, error } = await this.supabase
        .from('notification_history')
        .select('status, channel')
        .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(100);

      const responseTime = Date.now() - start;

      if (error) {
        return {
          component: 'Notifications',
          status: 'unhealthy',
          message: 'Failed to query notification history',
          responseTime,
        };
      }

      const notifications = recentNotifications || [];
      const successCount = notifications.filter(
        (n: { status: string; channel: string }) => (n as { status: string }).status === 'sent'
      ).length;
      const failureCount = notifications.filter(
        (n: { status: string; channel: string }) => (n as { status: string }).status === 'failed'
      ).length;
      const totalCount = notifications.length;

      const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 100;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let message = 'Notifications are working properly';

      if (successRate < 50) {
        status = 'unhealthy';
        message = `High notification failure rate (${successRate.toFixed(1)}%)`;
      } else if (successRate < 80) {
        status = 'degraded';
        message = `Moderate notification failure rate (${successRate.toFixed(1)}%)`;
      } else {
        message = `Notification success rate: ${successRate.toFixed(1)}%`;
      }

      return {
        component: 'Notifications',
        status,
        message,
        responseTime,
        details: {
          last24h: {
            total: totalCount,
            successful: successCount,
            failed: failureCount,
            successRate: successRate.toFixed(1) + '%',
          },
        },
      };
    } catch (error) {
      return {
        component: 'Notifications',
        status: 'unhealthy',
        message: `Notification check failed: ${error instanceof Error ? (error as { message: string }).message : String(error)}`,
        responseTime: Date.now() - start,
      };
    }
  }

  /**
   * 計算整體狀態
   */
  private calculateOverallStatus(
    checks: HealthCheckResult[]
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const unhealthyCount = checks.filter(
      check => (check as { status: string }).status === 'unhealthy'
    ).length;
    const degradedCount = checks.filter(
      check => (check as { status: string }).status === 'degraded'
    ).length;

    if (unhealthyCount > 0) {
      return 'unhealthy';
    } else if (degradedCount > 0) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * 檢查單個組件
   */
  public async checkComponent(component: string): Promise<HealthCheckResult> {
    switch (component.toLowerCase()) {
      case 'redis':
        return await this.checkRedisHealth();

      case 'database':
        return await this.checkDatabaseHealth();

      case 'monitoring':
        return await this.checkMonitoringServiceHealth();

      case 'rules':
        return await this.checkAlertRulesHealth();

      case 'notifications':
        return await this.checkNotificationHealth();

      default:
        return {
          component: component,
          status: 'unhealthy',
          message: 'Unknown component',
        };
    }
  }

  /**
   * 獲取系統指標
   */
  public async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const [redisCheck, dbCheck, monitoringCheck, rulesCheck, notificationCheck] =
        await Promise.all([
          this.checkRedisHealth(),
          this.checkDatabaseHealth(),
          this.checkMonitoringServiceHealth(),
          this.checkAlertRulesHealth(),
          this.checkNotificationHealth(),
        ]);

      const systemMetrics: SystemMetrics = {
        alertsCount: 0,
        rulesCount: 0,
        notificationsCount: 0,
        errorRate: 0,
        avgResponseTime: 0,
        uptime: 0,
        memoryUsage: 0,
        timestamp: new Date().toISOString(),
        components: {
          redis: redisCheck,
          database: dbCheck,
          monitoring: monitoringCheck,
          rules: rulesCheck,
          notifications: notificationCheck,
        },
        summary: {
          healthy: [redisCheck, dbCheck, monitoringCheck, rulesCheck, notificationCheck].filter(
            check => (check as { status: string }).status === 'healthy'
          ).length,
          degraded: [redisCheck, dbCheck, monitoringCheck, rulesCheck, notificationCheck].filter(
            check => (check as { status: string }).status === 'degraded'
          ).length,
          unhealthy: [redisCheck, dbCheck, monitoringCheck, rulesCheck, notificationCheck].filter(
            check => (check as { status: string }).status === 'unhealthy'
          ).length,
        },
      };

      return systemMetrics;
    } catch (error) {
      const errorMetrics: SystemMetrics = {
        alertsCount: 0,
        rulesCount: 0,
        notificationsCount: 0,
        errorRate: 100,
        avgResponseTime: 0,
        uptime: 0,
        memoryUsage: 0,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? (error as { message: string }).message : String(error),
      };

      return errorMetrics;
    }
  }
}
