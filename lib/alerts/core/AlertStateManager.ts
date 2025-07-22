/**
 * Alert State Manager
 * 告警狀態管理 - 負責告警狀態轉換、生命週期管理、狀態持久化
 */

import { Redis } from 'ioredis';
import { DatabaseRecord } from '@/types/database/tables';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Alert,
  AlertState,
  AlertLevel,
  AlertStats,
  AlertQuery,
  AlertResponse,
  AlertSuppression,
  BatchOperationResult,
  SerializedAlert,
  AlertDatabaseRecord,
} from '../types';

export class AlertStateManager {
  private redis: Redis;
  private supabase: SupabaseClient;
  private stateTransitions: Map<string, (alert: Alert) => Promise<void>> = new Map();
  private stateChangeListeners: ((alert: Alert, oldState: AlertState) => void)[] = [];

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.initializeStateTransitions();
  }

  /**
   * 初始化狀態轉換
   */
  private initializeStateTransitions(): void {
    this.stateTransitions.set(AlertState.ACTIVE, this.handleActiveState.bind(this));
    this.stateTransitions.set(AlertState.RESOLVED, this.handleResolvedState.bind(this));
    this.stateTransitions.set(AlertState.ACKNOWLEDGED, this.handleAcknowledgedState.bind(this));
    this.stateTransitions.set(AlertState.SILENCED, this.handleSilencedState.bind(this));
  }

  /**
   * 處理活躍狀態
   */
  private async handleActiveState(alert: Alert): Promise<void> {
    try {
      // 更新 Redis 緩存
      await this.redis.setex(`alert:active:${alert.id}`, 3600, JSON.stringify(alert));

      // 添加到活躍告警列表
      await this.redis.sadd('alerts:active', alert.id);

      // 移除已解決告警列表
      await this.redis.srem('alerts:resolved', alert.id);

      // 更新統計
      await this.updateStats('active', 1);

      console.log(`Alert ${alert.id} set to ACTIVE state`);
    } catch (error) {
      console.error(`Failed to handle active state for alert ${alert.id}:`, error);
      throw error;
    }
  }

  /**
   * 處理已解決狀態
   */
  private async handleResolvedState(alert: Alert): Promise<void> {
    try {
      // 設置解決時間
      alert.resolvedAt = new Date();

      // 更新 Redis 緩存
      await this.redis.setex(
        `alert:resolved:${alert.id}`,
        86400, // 24 小時
        JSON.stringify(alert)
      );

      // 移除活躍告警列表
      await this.redis.srem('alerts:active', alert.id);

      // 添加到已解決告警列表
      await this.redis.sadd('alerts:resolved', alert.id);

      // 更新統計
      await this.updateStats('resolved', 1);
      await this.updateStats('active', -1);

      // 計算解決時間
      if (alert.triggeredAt) {
        const resolutionTime = alert.resolvedAt.getTime() - alert.triggeredAt.getTime();
        await this.updateResolutionTime(resolutionTime);
      }

      console.log(`Alert ${alert.id} set to RESOLVED state`);
    } catch (error) {
      console.error(`Failed to handle resolved state for alert ${alert.id}:`, error);
      throw error;
    }
  }

  /**
   * 處理已確認狀態
   */
  private async handleAcknowledgedState(alert: Alert): Promise<void> {
    try {
      // 設置確認時間
      alert.acknowledgedAt = new Date();

      // 更新 Redis 緩存
      await this.redis.setex(`alert:acknowledged:${alert.id}`, 3600, JSON.stringify(alert));

      // 添加到已確認告警列表
      await this.redis.sadd('alerts:acknowledged', alert.id);

      // 更新統計
      await this.updateStats('acknowledged', 1);

      console.log(`Alert ${alert.id} set to ACKNOWLEDGED state`);
    } catch (error) {
      console.error(`Failed to handle acknowledged state for alert ${alert.id}:`, error);
      throw error;
    }
  }

  /**
   * 處理靜默狀態
   */
  private async handleSilencedState(alert: Alert): Promise<void> {
    try {
      // 更新 Redis 緩存
      await this.redis.setex(`alert:silenced:${alert.id}`, 3600, JSON.stringify(alert));

      // 添加到靜默告警列表
      await this.redis.sadd('alerts:silenced', alert.id);

      // 更新統計
      await this.updateStats('silenced', 1);

      console.log(`Alert ${alert.id} set to SILENCED state`);
    } catch (error) {
      console.error(`Failed to handle silenced state for alert ${alert.id}:`, error);
      throw error;
    }
  }

  /**
   * 更新告警狀態
   */
  public async updateAlertState(
    alertId: string,
    newState: AlertState,
    userId?: string
  ): Promise<AlertResponse> {
    try {
      // 獲取當前告警
      const alert = await this.getAlert(alertId);
      if (!alert) {
        return {
          success: false,
          message: 'Alert not found',
          errors: ['Alert not found'],
        };
      }

      const oldState = alert.state;

      // 驗證狀態轉換
      if (!this.isValidStateTransition(oldState, newState)) {
        return {
          success: false,
          message: `Invalid state transition from ${oldState} to ${newState}`,
          errors: [`Invalid state transition from ${oldState} to ${newState}`],
        };
      }

      // 更新狀態
      alert.state = newState;

      // 處理特定狀態
      if (newState === AlertState.ACKNOWLEDGED && userId) {
        alert.acknowledgedBy = userId;
      }

      // 執行狀態轉換處理
      const stateHandler = this.stateTransitions.get(newState);
      if (stateHandler) {
        await stateHandler(alert);
      }

      // 保存到數據庫
      await this.saveAlert(alert);

      // 觸發狀態變更事件
      this.emitStateChange(alert, oldState);

      return {
        success: true,
        message: `Alert state updated to ${newState}`,
        data: { alert },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update alert state',
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * 檢查狀態轉換是否有效
   */
  private isValidStateTransition(from: AlertState, to: AlertState): boolean {
    const validTransitions: Record<AlertState, AlertState[]> = {
      [AlertState.ACTIVE]: [AlertState.RESOLVED, AlertState.ACKNOWLEDGED, AlertState.SILENCED],
      [AlertState.RESOLVED]: [AlertState.ACTIVE],
      [AlertState.ACKNOWLEDGED]: [AlertState.RESOLVED, AlertState.SILENCED],
      [AlertState.SILENCED]: [AlertState.ACTIVE, AlertState.RESOLVED],
    };

    return validTransitions[from]?.includes(to) || false;
  }

  /**
   * 獲取告警
   */
  public async getAlert(alertId: string): Promise<Alert | null> {
    try {
      // 先從 Redis 獲取
      const cached = await this.redis.get(`alert:${alertId}`);
      if (cached) {
        return JSON.parse(cached);
      }

      // 從數據庫獲取
      const { data, error } = await this.supabase
        .from('alerts')
        .select('*')
        .eq('id', alertId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      const alert = this.deserializeAlert(data);

      // 緩存到 Redis
      await this.redis.setex(`alert:${alertId}`, 3600, JSON.stringify(alert));

      return alert;
    } catch (error) {
      console.error(`Failed to get alert ${alertId}:`, error);
      return null;
    }
  }

  /**
   * 查詢告警
   */
  public async queryAlerts(query: AlertQuery): Promise<Alert[]> {
    try {
      let queryBuilder = this.supabase.from('alerts').select('*');

      // 應用過濾條件
      if (query.ruleIds && query.ruleIds.length > 0) {
        queryBuilder = queryBuilder.in('rule_id', query.ruleIds);
      }

      if (query.levels && query.levels.length > 0) {
        queryBuilder = queryBuilder.in('level', query.levels);
      }

      if (query.states && query.states.length > 0) {
        queryBuilder = queryBuilder.in('state', query.states);
      }

      if (query.startTime) {
        queryBuilder = queryBuilder.gte('triggered_at', query.startTime.toISOString());
      }

      if (query.endTime) {
        queryBuilder = queryBuilder.lte('triggered_at', query.endTime.toISOString());
      }

      // 排序
      const sortBy = query.sortBy || 'triggered_at';
      const sortOrder = query.sortOrder || 'desc';
      queryBuilder = queryBuilder.order(sortBy, { ascending: sortOrder === 'asc' });

      // 分頁
      if (query.limit) {
        queryBuilder = queryBuilder.limit(query.limit);
      }

      if (query.offset) {
        queryBuilder = queryBuilder.range(query.offset, query.offset + (query.limit || 100) - 1);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      return data?.map((item: AlertDatabaseRecord) => this.deserializeAlert(item)) || [];
    } catch (error) {
      console.error('Failed to query alerts:', error);
      return [];
    }
  }

  /**
   * 獲取告警統計
   */
  public async getAlertStats(): Promise<AlertStats> {
    try {
      // 從 Redis 獲取統計
      const stats = await this.redis.hmget(
        'alert:stats',
        'total',
        'active',
        'resolved',
        'acknowledged',
        'silenced',
        'avg_resolution_time'
      );

      return {
        total: parseInt(stats[0] || '0'),
        byLevel: {
          [AlertLevel.INFO]: 0,
          [AlertLevel.WARNING]: 0,
          [AlertLevel.ERROR]: 0,
          [AlertLevel.CRITICAL]: 0,
        },
        byState: {
          [AlertState.ACTIVE]: parseInt(stats[1] || '0'),
          [AlertState.RESOLVED]: parseInt(stats[2] || '0'),
          [AlertState.ACKNOWLEDGED]: parseInt(stats[3] || '0'),
          [AlertState.SILENCED]: parseInt(stats[4] || '0'),
        },
        activeCount: parseInt(stats[1] || '0'),
        resolvedCount: parseInt(stats[2] || '0'),
        avgResolutionTime: parseFloat(stats[5] || '0'),
      };
    } catch (error) {
      console.error('Failed to get alert stats:', error);
      return {
        total: 0,
        byLevel: {
          [AlertLevel.INFO]: 0,
          [AlertLevel.WARNING]: 0,
          [AlertLevel.ERROR]: 0,
          [AlertLevel.CRITICAL]: 0,
        },
        byState: {
          [AlertState.ACTIVE]: 0,
          [AlertState.RESOLVED]: 0,
          [AlertState.ACKNOWLEDGED]: 0,
          [AlertState.SILENCED]: 0,
        },
        activeCount: 0,
        resolvedCount: 0,
        avgResolutionTime: 0,
      };
    }
  }

  /**
   * 批量更新告警狀態
   */
  public async batchUpdateAlertState(
    alertIds: string[],
    newState: AlertState,
    userId?: string
  ): Promise<BatchOperationResult> {
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const alertId of alertIds) {
      try {
        const result = await this.updateAlertState(alertId, newState, userId);
        if (result.success) {
          processed++;
        } else {
          failed++;
          errors.push(`${alertId}: ${result.message}`);
        }
      } catch (error) {
        failed++;
        errors.push(`${alertId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      success: failed === 0,
      processed,
      failed,
      errors,
    };
  }

  /**
   * 創建告警抑制
   */
  public async createSuppression(
    ruleId: string,
    reason: string,
    userId: string,
    expiresAt?: Date
  ): Promise<AlertResponse> {
    try {
      const suppression: AlertSuppression = {
        id: this.generateId(),
        ruleId,
        reason,
        suppressedBy: userId,
        suppressedAt: new Date(),
        expiresAt,
        active: true,
      };

      // 保存抑制配置
      const { error } = await this.supabase.from('alert_suppressions').insert(suppression);

      if (error) throw error;

      // 緩存抑制配置
      await this.redis.setex(
        `suppression:${ruleId}`,
        expiresAt ? Math.floor((expiresAt.getTime() - Date.now()) / 1000) : 86400,
        JSON.stringify(suppression)
      );

      return {
        success: true,
        message: 'Alert suppression created',
        data: { suppression },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create suppression',
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * 檢查告警是否被抑制
   */
  public async isAlertSuppressed(ruleId: string): Promise<boolean> {
    try {
      // 先檢查 Redis 緩存
      const cached = await this.redis.get(`suppression:${ruleId}`);
      if (cached) {
        const suppression: AlertSuppression = JSON.parse(cached);
        return suppression.active && (!suppression.expiresAt || suppression.expiresAt > new Date());
      }

      // 檢查數據庫
      const { data, error } = await this.supabase
        .from('alert_suppressions')
        .select('*')
        .eq('rule_id', ruleId)
        .eq('active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .limit(1);

      if (error) throw error;

      return data && data.length > 0;
    } catch (error) {
      console.error(`Failed to check suppression for rule ${ruleId}:`, error);
      return false;
    }
  }

  /**
   * 清理過期告警
   */
  public async cleanupExpiredAlerts(): Promise<BatchOperationResult> {
    try {
      const retentionDays = 30; // 保留 30 天
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      // 先查詢要刪除的告警數量
      const { data: toDeleteData, error: countError } = await this.supabase
        .from('alerts')
        .select('id')
        .lt('triggered_at', cutoffDate.toISOString());

      if (countError) throw countError;
      const deletedCount = toDeleteData?.length || 0;

      // 刪除過期告警
      const { error: deleteError } = await this.supabase
        .from('alerts')
        .delete()
        .lt('triggered_at', cutoffDate.toISOString());

      if (deleteError) throw deleteError;

      // 清理 Redis 緩存
      const keys = await this.redis.keys('alert:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      return {
        success: true,
        processed: deletedCount,
        failed: 0,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        processed: 0,
        failed: 1,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * 更新統計
   */
  private async updateStats(key: string, value: number): Promise<void> {
    try {
      await this.redis.hincrby('alert:stats', key, value);
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }

  /**
   * 更新解決時間
   */
  private async updateResolutionTime(resolutionTime: number): Promise<void> {
    try {
      // 獲取當前平均解決時間
      const currentAvg = await this.redis.hget('alert:stats', 'avg_resolution_time');
      const currentCount = await this.redis.hget('alert:stats', 'resolved');

      const avg = parseFloat(currentAvg || '0');
      const count = parseInt(currentCount || '0');

      // 計算新的平均值
      const newAvg = (avg * (count - 1) + resolutionTime) / count;

      await this.redis.hset('alert:stats', 'avg_resolution_time', newAvg.toString());
    } catch (error) {
      console.error('Failed to update resolution time:', error);
    }
  }

  /**
   * 保存告警
   */
  private async saveAlert(alert: Alert): Promise<void> {
    try {
      const { error } = await this.supabase.from('alerts').upsert(this.serializeAlert(alert));

      if (error) throw error;

      // 更新 Redis 緩存
      await this.redis.setex(`alert:${alert.id}`, 3600, JSON.stringify(alert));
    } catch (error) {
      console.error('Failed to save alert:', error);
      throw error;
    }
  }

  /**
   * 序列化告警
   */
  private serializeAlert(alert: Alert): SerializedAlert {
    return {
      id: alert.id,
      rule_id: alert.ruleId,
      rule_name: alert.ruleName,
      level: alert.level,
      state: alert.state,
      message: alert.message as string,
      value: alert.value,
      threshold: alert.threshold,
      triggered_at: alert.triggeredAt.toISOString(),
      resolved_at: alert.resolvedAt?.toISOString(),
      acknowledged_at: alert.acknowledgedAt?.toISOString(),
      acknowledged_by: alert.acknowledgedBy,
      notifications: JSON.stringify(alert.notifications),
      labels: JSON.stringify(alert.labels || ({} as any)),
      annotations: JSON.stringify(alert.annotations || ({} as any)),
    };
  }

  /**
   * 反序列化告警
   */
  private deserializeAlert(data: AlertDatabaseRecord): Alert {
    return {
      id: data.id,
      ruleId: data.rule_id as string,
      ruleName: data.rule_name as string,
      level: data.level as AlertLevel,
      state: data.state as AlertState,
      message: data.message as string,
      value: data.value as number | string,
      threshold: data.threshold as number | string,
      triggeredAt: new Date(data.triggered_at as string),
      resolvedAt: data.resolved_at ? new Date(data.resolved_at as string) : undefined,
      acknowledgedAt: data.acknowledged_at ? new Date(data.acknowledged_at as string) : undefined,
      acknowledgedBy: data.acknowledged_by as string | undefined,
      notifications: JSON.parse((data.notifications as string) || '[]'),
      labels: JSON.parse((data.labels as string) || '{}'),
      annotations: JSON.parse((data.annotations as string) || '{}'),
    };
  }

  /**
   * 觸發狀態變更事件
   */
  private emitStateChange(alert: Alert, oldState: AlertState): void {
    this.stateChangeListeners.forEach(listener => {
      try {
        listener(alert, oldState);
      } catch (error) {
        console.error('State change listener error:', error);
      }
    });
  }

  /**
   * 生成 ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 添加狀態變更監聽器
   */
  public addStateChangeListener(listener: (alert: Alert, oldState: AlertState) => void): void {
    this.stateChangeListeners.push(listener);
  }

  /**
   * 移除狀態變更監聽器
   */
  public removeStateChangeListener(listener: (alert: Alert, oldState: AlertState) => void): void {
    const index = this.stateChangeListeners.indexOf(listener);
    if (index > -1) {
      this.stateChangeListeners.splice(index, 1);
    }
  }
}
