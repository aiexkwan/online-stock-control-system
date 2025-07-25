/**
 * Alert Monitoring Service
 * 告警監控服務 - 持續監控系統指標、觸發告警、處理告警升級
 */

import { Redis } from 'ioredis';
import { DatabaseRecord } from '@/types/database/tables';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AlertRuleEngine } from '../core/AlertRuleEngine';
import { AlertStateManager } from '../core/AlertStateManager';
import { NotificationService } from '../notifications/NotificationService';
import { AlertCondition, isValidAlertCondition } from '../types/alert-types';
import {
  AlertRule,
  Alert,
  AlertState,
  AlertLevel,
  AlertEscalation,
  AlertEngineStatus,
  AlertEngineEvent,
  AlertEngineEventData,
  AlertResponse,
  NotificationConfig,
  AlertDatabaseRecord,
} from '../types';

export class AlertMonitoringService {
  private redis: Redis;
  private supabase: SupabaseClient;
  private ruleEngine: AlertRuleEngine;
  private stateManager: AlertStateManager;
  private notificationService: NotificationService;

  private isRunning: boolean = false;
  private startTime: Date;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();

  // 配置
  private config = {
    monitoringInterval: 30000, // 30 秒
    escalationCheckInterval: 60000, // 1 分鐘
    maxConcurrentAlerts: 100,
    suppressionEnabled: true,
    rateLimitEnabled: true,
  };

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.ruleEngine = new AlertRuleEngine();
    this.stateManager = new AlertStateManager();
    this.notificationService = new NotificationService();

    this.startTime = new Date();
    this.setupEventListeners();
  }

  /**
   * 啟動監控服務
   */
  public async start(): Promise<AlertResponse> {
    try {
      if (this.isRunning) {
        return {
          success: false,
          message: 'Monitoring service is already running',
        };
      }

      this.isRunning = true;
      this.startTime = new Date();

      // 啟動主監控循環
      this.startMonitoringLoop();

      // 啟動告警升級檢查
      this.startEscalationCheck();

      // 啟動清理任務
      this.startCleanupTasks();

      console.log('Alert Monitoring Service started successfully');

      return {
        success: true,
        message: 'Alert monitoring service started successfully',
      };
    } catch (error) {
      this.isRunning = false;
      return {
        success: false,
        message: 'Failed to start monitoring service',
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * 停止監控服務
   */
  public async stop(): Promise<AlertResponse> {
    try {
      this.isRunning = false;

      // 停止監控循環
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = null;
      }

      // 清除所有升級計時器
      this.escalationTimers.forEach(timer => clearTimeout(timer));
      this.escalationTimers.clear();

      // 停止告警引擎
      await this.ruleEngine.stop();

      console.log('Alert Monitoring Service stopped');

      return {
        success: true,
        message: 'Alert monitoring service stopped successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to stop monitoring service',
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * 獲取服務狀態
   */
  public async getStatus(): Promise<AlertEngineStatus> {
    try {
      const uptime = this.isRunning ? Date.now() - this.startTime.getTime() : 0;
      const activeAlerts = await this.getActiveAlertsCount();
      const rulesCount = await this.getRulesCount();
      const lastEvaluation = await this.getLastEvaluationTime();

      return {
        running: this.isRunning,
        uptime,
        rulesCount,
        activeAlertsCount: activeAlerts,
        lastEvaluation,
      };
    } catch (error) {
      console.error('Failed to get service status:', error);
      return {
        running: false,
        uptime: 0,
        rulesCount: 0,
        activeAlertsCount: 0,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * 啟動監控循環
   */
  private startMonitoringLoop(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performMonitoringCycle();
      } catch (error) {
        console.error('Monitoring cycle failed:', error);
      }
    }, this.config.monitoringInterval);
  }

  /**
   * 執行監控循環
   */
  private async performMonitoringCycle(): Promise<void> {
    try {
      // 檢查系統健康狀態
      await this.performHealthCheck();

      // 檢查告警抑制
      await this.checkAlertSuppression();

      // 檢查告警依賴關係
      await this.checkAlertDependencies();

      // 更新監控統計
      await this.updateMonitoringStats();

      // 記錄最後評估時間
      await this.redis.set('alert:last_evaluation', new Date().toISOString());
    } catch (error) {
      console.error('Monitoring cycle error:', error);
    }
  }

  /**
   * 執行健康檢查
   */
  private async performHealthCheck(): Promise<void> {
    try {
      // 檢查 Redis 連接
      await this.redis.ping();

      // 檢查數據庫連接
      await this.supabase.from('alert_rules').select('count').limit(1);

      // 檢查告警引擎狀態
      // 這裡可以添加更多健康檢查邏輯
    } catch (error) {
      console.error('Health check failed:', error);
      // 可以觸發系統告警
    }
  }

  /**
   * 檢查告警抑制
   */
  private async checkAlertSuppression(): Promise<void> {
    try {
      // 獲取已抑制的告警
      const suppressedAlerts = await this.redis.keys('suppression:*');

      for (const key of suppressedAlerts) {
        const suppression = await this.redis.get(key);
        if (suppression) {
          const suppressionData = JSON.parse(suppression);

          // 檢查抑制是否過期
          if (suppressionData.expiresAt && new Date(suppressionData.expiresAt) < new Date()) {
            await this.redis.del(key);
            console.log(`Suppression expired for rule: ${suppressionData.ruleId}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to check alert suppression:', error);
    }
  }

  /**
   * 檢查告警依賴關係
   */
  private async checkAlertDependencies(): Promise<void> {
    try {
      // 獲取所有活躍告警
      const activeAlerts = await this.stateManager.queryAlerts({
        states: [AlertState.ACTIVE],
        limit: 1000,
      });

      // 檢查每個告警的依賴關係
      for (const alert of activeAlerts) {
        const rule = await this.getRuleById(alert.ruleId);
        if (rule && rule.dependencies && rule.dependencies.length > 0) {
          const dependenciesMet = await this.checkDependencies(rule.dependencies);

          if (!dependenciesMet) {
            // 如果依賴關係不再滿足，自動解決告警
            await this.stateManager.updateAlertState(alert.id, AlertState.RESOLVED);
            console.log(`Alert ${alert.id} auto-resolved due to dependency changes`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to check alert dependencies:', error);
    }
  }

  /**
   * 檢查依賴關係
   */
  private async checkDependencies(dependencies: string[]): Promise<boolean> {
    try {
      const dependencyAlerts = await Promise.all(
        dependencies.map((dep: string) =>
          this.stateManager.queryAlerts({
            ruleIds: [dep],
            states: [AlertState.ACTIVE],
            limit: 1,
          })
        )
      );

      return dependencyAlerts.some(alerts => alerts.length > 0);
    } catch (error) {
      console.error('Failed to check dependencies:', error);
      return false;
    }
  }

  /**
   * 啟動告警升級檢查
   */
  private startEscalationCheck(): void {
    setInterval(async () => {
      try {
        await this.checkAlertEscalation();
      } catch (error) {
        console.error('Escalation check failed:', error);
      }
    }, this.config.escalationCheckInterval);
  }

  /**
   * 檢查告警升級
   */
  private async checkAlertEscalation(): Promise<void> {
    try {
      const activeAlerts = await this.stateManager.queryAlerts({
        states: [AlertState.ACTIVE],
        limit: 100,
      });

      for (const alert of activeAlerts) {
        await this.processAlertEscalation(alert);
      }
    } catch (error) {
      console.error('Failed to check alert escalation:', error);
    }
  }

  /**
   * 處理告警升級
   */
  private async processAlertEscalation(alert: Alert): Promise<void> {
    try {
      // 獲取升級配置
      const escalation = await this.getEscalationConfig(alert.ruleId);
      if (!escalation || !escalation.enabled) {
        return;
      }

      const now = new Date();
      const alertAge = now.getTime() - alert.triggeredAt.getTime();

      // 檢查每個升級級別
      for (const level of escalation.levels) {
        const escalationKey = `escalation:${alert.id}:${level.level}`;
        const escalationProcessed = await this.redis.get(escalationKey);

        if (!escalationProcessed && alertAge >= level.delay * 1000) {
          // 觸發升級
          await this.triggerEscalation(alert, level);
          await this.redis.setex(escalationKey, 86400, 'processed');
        }
      }
    } catch (error) {
      console.error(`Failed to process escalation for alert ${alert.id}:`, error);
    }
  }

  /**
   * 觸發告警升級
   */
  private async triggerEscalation(
    alert: Alert,
    escalationLevel: {
      level: AlertLevel;
      delay: number;
      notifications: NotificationConfig[];
    }
  ): Promise<void> {
    try {
      // 更新告警級別
      const escalatedAlert = {
        ...alert,
        level: escalationLevel.level,
        message: `[ESCALATED] ${alert.message as string}`,
        annotations: {
          ...alert.annotations,
          escalated: 'true',
          escalationLevel: escalationLevel.level.toString(),
          escalationTime: new Date().toISOString(),
        },
      };

      // 發送升級通知
      for (const notification of escalationLevel.notifications) {
        await this.notificationService.sendNotifications(escalatedAlert, {
          notifications: [notification],
        } as AlertRule);
      }

      console.log(`Alert ${alert.id} escalated to level ${escalationLevel.level}`);
    } catch (error) {
      console.error(`Failed to trigger escalation for alert ${alert.id}:`, error);
    }
  }

  /**
   * 啟動清理任務
   */
  private startCleanupTasks(): void {
    // 每小時執行一次清理
    setInterval(async () => {
      try {
        await this.performCleanup();
      } catch (error) {
        console.error('Cleanup task failed:', error);
      }
    }, 3600000); // 1 小時
  }

  /**
   * 執行清理任務
   */
  private async performCleanup(): Promise<void> {
    try {
      // 清理過期告警
      await this.stateManager.cleanupExpiredAlerts();

      // 清理過期緩存
      await this.cleanupExpiredCache();

      // 清理升級計時器
      await this.cleanupEscalationTimers();

      console.log('Cleanup tasks completed');
    } catch (error) {
      console.error('Cleanup tasks failed:', error);
    }
  }

  /**
   * 清理過期緩存
   */
  private async cleanupExpiredCache(): Promise<void> {
    try {
      const keys = await this.redis.keys('alert:*');
      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) {
          // 沒有設置過期時間的 key，設置默認過期時間
          await this.redis.expire(key, 86400); // 24 小時
        }
      }
    } catch (error) {
      console.error('Failed to cleanup expired cache:', error);
    }
  }

  /**
   * 清理升級計時器
   */
  private async cleanupEscalationTimers(): Promise<void> {
    try {
      const expiredTimers: string[] = [];

      this.escalationTimers.forEach((timer, alertId) => {
        // 檢查告警是否仍然活躍
        this.stateManager.getAlert(alertId).then(alert => {
          if (!alert || alert.state !== AlertState.ACTIVE) {
            clearTimeout(timer);
            expiredTimers.push(alertId);
          }
        });
      });

      // 移除過期的計時器
      expiredTimers.forEach(alertId => {
        this.escalationTimers.delete(alertId);
      });
    } catch (error) {
      console.error('Failed to cleanup escalation timers:', error);
    }
  }

  /**
   * 設置事件監聽器
   */
  private setupEventListeners(): void {
    // 監聽告警引擎事件
    this.ruleEngine.addEventListener((event: AlertEngineEvent) => {
      this.handleAlertEngineEvent(event);
    });

    // 監聽狀態變更事件
    this.stateManager.addStateChangeListener((alert, oldState) => {
      this.handleAlertStateChange(alert, oldState);
    });
  }

  /**
   * 處理告警引擎事件
   */
  private handleAlertEngineEvent(event: AlertEngineEvent): void {
    switch (event.type) {
      case 'alert_triggered':
        this.handleAlertTriggered(event.data);
        break;
      case 'alert_resolved':
        this.handleAlertResolved(event.data);
        break;
      case 'notification_sent':
        this.handleNotificationSent(event.data);
        break;
      default:
        console.log('Unknown alert engine event:', event.type);
    }
  }

  /**
   * 處理告警觸發
   */
  private handleAlertTriggered(data: AlertEngineEventData): void {
    // 設置升級計時器
    if (data.alert && data.rule) {
      this.setupEscalationTimer(data.alert, data.rule);
    }
  }

  /**
   * 處理告警解決
   */
  private handleAlertResolved(data: AlertEngineEventData): void {
    // 清除升級計時器
    if (data.alert) {
      const timers = Array.from(this.escalationTimers.keys()).filter(key =>
        key.startsWith(`escalation:${data.alert!.id}:`)
      );

      timers.forEach(key => {
        const timer = this.escalationTimers.get(key);
        if (timer) {
          clearTimeout(timer);
          this.escalationTimers.delete(key);
        }
      });
    }
  }

  /**
   * 處理通知發送
   */
  private handleNotificationSent(data: AlertEngineEventData): void {
    // 記錄通知統計
    if (data.channel) {
      this.redis.hincrby('notification:stats', data.channel, 1);
    }
  }

  /**
   * 處理告警狀態變更
   */
  private handleAlertStateChange(alert: Alert, oldState: AlertState): void {
    console.log(`Alert ${alert.id} state changed from ${oldState} to ${alert.state}`);

    // 更新統計
    this.redis.hincrby('alert:state:stats', alert.state, 1);
    this.redis.hincrby('alert:state:stats', oldState, -1);
  }

  /**
   * 設置升級計時器
   */
  private setupEscalationTimer(alert: Alert, rule: AlertRule): void {
    // 這裡可以根據規則設置升級計時器
    // 實際實現會更複雜
  }

  /**
   * 更新監控統計
   */
  private async updateMonitoringStats(): Promise<void> {
    try {
      const stats = await this.stateManager.getAlertStats();
      await this.redis.hmset('monitoring:stats', {
        active_alerts: stats.activeCount,
        total_alerts: stats.total,
        avg_resolution_time: stats.avgResolutionTime,
        last_update: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to update monitoring stats:', error);
    }
  }

  /**
   * 輔助方法 - 獲取活躍告警數量
   */
  private async getActiveAlertsCount(): Promise<number> {
    try {
      const { count } = await this.supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('state', AlertState.ACTIVE);

      return count || 0;
    } catch (error) {
      console.error('Failed to get active alerts count:', error);
      return 0;
    }
  }

  /**
   * 輔助方法 - 獲取規則數量
   */
  private async getRulesCount(): Promise<number> {
    try {
      const { count } = await this.supabase
        .from('alert_rules')
        .select('*', { count: 'exact', head: true })
        .eq('enabled', true);

      return count || 0;
    } catch (error) {
      console.error('Failed to get rules count:', error);
      return 0;
    }
  }

  /**
   * 輔助方法 - 獲取最後評估時間
   */
  private async getLastEvaluationTime(): Promise<Date | undefined> {
    try {
      const timestamp = await this.redis.get('alert:last_evaluation');
      return timestamp ? new Date(timestamp) : undefined;
    } catch (error) {
      console.error('Failed to get last evaluation time:', error);
      return undefined;
    }
  }

  /**
   * 輔助方法 - 根據 ID 獲取規則
   */
  private async getRuleById(ruleId: string): Promise<AlertRule | null> {
    try {
      const { data, error } = await this.supabase
        .from('alert_rules')
        .select('*')
        .eq('id', ruleId)
        .single();

      if (error) return null;

      return this.deserializeRule(data);
    } catch (error) {
      console.error(`Failed to get rule ${ruleId}:`, error);
      return null;
    }
  }

  /**
   * 輔助方法 - 獲取升級配置
   */
  private async getEscalationConfig(ruleId: string): Promise<AlertEscalation | null> {
    try {
      const { data, error } = await this.supabase
        .from('alert_escalations')
        .select('*')
        .eq('rule_id', ruleId)
        .single();

      if (error) return null;

      return data;
    } catch (error) {
      console.error(`Failed to get escalation config for rule ${ruleId}:`, error);
      return null;
    }
  }

  /**
   * 輔助方法 - 反序列化規則
   */
  private deserializeRule(data: AlertDatabaseRecord): AlertRule {
    return {
      id: data.id,
      name: data.name as string,
      description: data.description as string,
      enabled: data.enabled as boolean,
      level: data.level as AlertLevel,
      metric: data.metric as string,
      condition: (isValidAlertCondition(data.condition)
        ? data.condition
        : 'gt') as any as AlertCondition,
      threshold: data.threshold as number | string,
      timeWindow: data.time_window as number,
      evaluationInterval: data.evaluation_interval as number,
      dependencies: JSON.parse((data.dependencies as string) || '[]'),
      silenceTime: data.silence_time as number | undefined,
      notifications: JSON.parse((data.notifications as string) || '[]'),
      tags: JSON.parse((data.tags as string) || '{}'),
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
      createdBy: data.created_by as string,
    };
  }
}
