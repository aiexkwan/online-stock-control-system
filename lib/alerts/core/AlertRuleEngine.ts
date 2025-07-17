/**
 * Alert Rule Engine
 * 告警規則引擎 - 負責規則評估、條件匹配、告警觸發
 */

import { Redis } from 'ioredis';
import { createClient } from '@supabase/supabase-js';
import {
  AlertRule,
  AlertLevel,
  AlertState,
  AlertCondition,
  Alert,
  AlertMetric,
  AlertContext,
  AlertTestResult,
  AlertEngineEvent,
  AlertResponse
} from '../types';

export class AlertRuleEngine {
  private redis: Redis;
  private supabase: any;
  private rules: Map<string, AlertRule> = new Map();
  private evaluationTimers: Map<string, NodeJS.Timeout> = new Map();
  private eventListeners: ((event: AlertEngineEvent) => void)[] = [];

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    this.initializeEngine();
  }

  /**
   * 初始化引擎
   */
  private async initializeEngine(): Promise<void> {
    try {
      await this.loadRules();
      await this.startEvaluationTimers();
      console.log('Alert Rule Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Alert Rule Engine:', error);
      throw error;
    }
  }

  /**
   * 載入所有告警規則
   */
  private async loadRules(): Promise<void> {
    try {
      const { data: rules, error } = await this.supabase
        .from('alert_rules')
        .select('*')
        .eq('enabled', true);

      if (error) throw error;

      this.rules.clear();
      rules?.forEach((rule: any) => {
        this.rules.set(rule.id, this.deserializeRule(rule));
      });

      console.log(`Loaded ${this.rules.size} alert rules`);
    } catch (error) {
      console.error('Failed to load alert rules:', error);
      throw error;
    }
  }

  /**
   * 開始評估計時器
   */
  private async startEvaluationTimers(): Promise<void> {
    this.rules.forEach((rule, ruleId) => {
      this.startRuleEvaluation(ruleId, rule);
    });
  }

  /**
   * 開始單個規則評估
   */
  private startRuleEvaluation(ruleId: string, rule: AlertRule): void {
    // 清除現有計時器
    const existingTimer = this.evaluationTimers.get(ruleId);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    // 創建新計時器
    const timer = setInterval(async () => {
      try {
        await this.evaluateRule(ruleId, rule);
      } catch (error) {
        console.error(`Rule evaluation failed for ${ruleId}:`, error);
        this.emitEvent({
          type: 'alert_triggered',
          timestamp: new Date(),
          data: { ruleId, error: error.message }
        });
      }
    }, rule.evaluationInterval * 1000);

    this.evaluationTimers.set(ruleId, timer);
  }

  /**
   * 評估告警規則
   */
  private async evaluateRule(ruleId: string, rule: AlertRule): Promise<void> {
    try {
      // 獲取指標數據
      const metric = await this.getMetricValue(rule.metric);
      
      // 創建評估上下文
      const context: AlertContext = {
        ruleId,
        metric,
        evaluationTime: new Date(),
        environment: process.env.NODE_ENV || 'development'
      };

      // 評估條件
      const shouldTrigger = await this.evaluateCondition(rule, context);
      
      // 檢查當前告警狀態
      const currentAlert = await this.getCurrentAlert(ruleId);
      
      if (shouldTrigger) {
        if (!currentAlert || currentAlert.state === AlertState.RESOLVED) {
          await this.triggerAlert(rule, context);
        }
      } else {
        if (currentAlert && currentAlert.state === AlertState.ACTIVE) {
          await this.resolveAlert(currentAlert.id);
        }
      }

      // 更新最後評估時間
      await this.updateLastEvaluation(ruleId);
    } catch (error) {
      console.error(`Rule evaluation failed for ${ruleId}:`, error);
      throw error;
    }
  }

  /**
   * 評估告警條件
   */
  private async evaluateCondition(rule: AlertRule, context: AlertContext): Promise<boolean> {
    const { condition, threshold } = rule;
    const value = context.metric.value;

    // 檢查依賴關係
    if (rule.dependencies && rule.dependencies.length > 0) {
      const dependenciesSatisfied = await this.checkDependencies(rule.dependencies);
      if (!dependenciesSatisfied) {
        return false;
      }
    }

    // 評估主要條件
    switch (condition) {
      case AlertCondition.GREATER_THAN:
        return Number(value) > Number(threshold);
      
      case AlertCondition.LESS_THAN:
        return Number(value) < Number(threshold);
      
      case AlertCondition.EQUALS:
        return value === threshold;
      
      case AlertCondition.NOT_EQUALS:
        return value !== threshold;
      
      case AlertCondition.CONTAINS:
        return String(value).includes(String(threshold));
      
      case AlertCondition.REGEX:
        const regex = new RegExp(String(threshold));
        return regex.test(String(value));
      
      default:
        throw new Error(`Unknown condition: ${condition}`);
    }
  }

  /**
   * 檢查依賴關係
   */
  private async checkDependencies(dependencies: string[]): Promise<boolean> {
    try {
      const activeAlerts = await Promise.all(
        dependencies.map(dep => this.getCurrentAlert(dep))
      );

      return activeAlerts.some(alert => 
        alert && alert.state === AlertState.ACTIVE
      );
    } catch (error) {
      console.error('Failed to check dependencies:', error);
      return false;
    }
  }

  /**
   * 觸發告警
   */
  private async triggerAlert(rule: AlertRule, context: AlertContext): Promise<void> {
    try {
      const alert: Alert = {
        id: this.generateAlertId(),
        ruleId: rule.id,
        ruleName: rule.name,
        level: rule.level,
        state: AlertState.ACTIVE,
        message: this.generateAlertMessage(rule, context),
        value: context.metric.value,
        threshold: rule.threshold,
        triggeredAt: new Date(),
        notifications: [],
        labels: context.metric.labels || {},
        annotations: {
          metric: rule.metric,
          condition: rule.condition,
          environment: context.environment
        }
      };

      // 保存告警
      await this.saveAlert(alert);

      // 發送通知
      await this.sendNotifications(alert, rule);

      // 觸發事件
      this.emitEvent({
        type: 'alert_triggered',
        timestamp: new Date(),
        data: { alert, rule }
      });

      console.log(`Alert triggered: ${alert.id} (${rule.name})`);
    } catch (error) {
      console.error('Failed to trigger alert:', error);
      throw error;
    }
  }

  /**
   * 解決告警
   */
  private async resolveAlert(alertId: string): Promise<void> {
    try {
      const alert = await this.getAlert(alertId);
      if (!alert) return;

      alert.state = AlertState.RESOLVED;
      alert.resolvedAt = new Date();

      await this.saveAlert(alert);

      // 發送解決通知
      const rule = this.rules.get(alert.ruleId);
      if (rule) {
        await this.sendNotifications(alert, rule);
      }

      // 觸發事件
      this.emitEvent({
        type: 'alert_resolved',
        timestamp: new Date(),
        data: { alert }
      });

      console.log(`Alert resolved: ${alertId}`);
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      throw error;
    }
  }

  /**
   * 獲取指標值
   */
  private async getMetricValue(metric: string): Promise<AlertMetric> {
    try {
      // 根據指標名稱查詢相應的數據源
      const value = await this.queryMetric(metric);
      
      return {
        name: metric,
        value,
        timestamp: new Date(),
        labels: {}
      };
    } catch (error) {
      console.error(`Failed to get metric ${metric}:`, error);
      throw error;
    }
  }

  /**
   * 查詢指標
   */
  private async queryMetric(metric: string): Promise<number | string> {
    switch (metric) {
      case 'api_response_time':
        return await this.getApiResponseTime();
      
      case 'error_rate':
        return await this.getErrorRate();
      
      case 'active_users':
        return await this.getActiveUsers();
      
      case 'database_connections':
        return await this.getDatabaseConnections();
      
      case 'memory_usage':
        return await this.getMemoryUsage();
      
      case 'disk_usage':
        return await this.getDiskUsage();
      
      default:
        throw new Error(`Unknown metric: ${metric}`);
    }
  }

  /**
   * 獲取 API 響應時間
   */
  private async getApiResponseTime(): Promise<number> {
    const start = Date.now();
    try {
      await this.supabase.from('record_palletinfo').select('id').limit(1);
      return Date.now() - start;
    } catch (error) {
      return 9999; // 錯誤時返回高值
    }
  }

  /**
   * 獲取錯誤率
   */
  private async getErrorRate(): Promise<number> {
    try {
      const { data: errorLogs } = await this.supabase
        .from('error_logs')
        .select('id')
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

      return errorLogs?.length || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 獲取活躍用戶數
   */
  private async getActiveUsers(): Promise<number> {
    try {
      const { data: users } = await this.supabase
        .from('user_sessions')
        .select('user_id')
        .gte('last_activity', new Date(Date.now() - 5 * 60 * 1000).toISOString());

      return new Set(users?.map(u => u.user_id)).size || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 獲取數據庫連接數
   */
  private async getDatabaseConnections(): Promise<number> {
    try {
      const { data } = await this.supabase.rpc('get_database_connections');
      return data || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 獲取記憶體使用率
   */
  private async getMemoryUsage(): Promise<number> {
    const usage = process.memoryUsage();
    return (usage.heapUsed / usage.heapTotal) * 100;
  }

  /**
   * 獲取磁碟使用率
   */
  private async getDiskUsage(): Promise<number> {
    // 簡化實現，實際應該查詢系統磁碟使用情況
    return 50; // 假設 50% 使用率
  }

  /**
   * 生成告警消息
   */
  private generateAlertMessage(rule: AlertRule, context: AlertContext): string {
    return `Alert: ${rule.name} - ${rule.metric} is ${context.metric.value} (threshold: ${rule.threshold})`;
  }

  /**
   * 生成告警 ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 發送通知
   */
  private async sendNotifications(alert: Alert, rule: AlertRule): Promise<void> {
    // 通知邏輯會在 NotificationService 中實現
    console.log(`Sending notifications for alert ${alert.id}`);
  }

  /**
   * 保存告警
   */
  private async saveAlert(alert: Alert): Promise<void> {
    try {
      // 保存到數據庫
      const { error } = await this.supabase
        .from('alerts')
        .upsert(this.serializeAlert(alert));

      if (error) throw error;

      // 保存到 Redis 緩存
      await this.redis.setex(
        `alert:${alert.id}`,
        3600,
        JSON.stringify(alert)
      );
    } catch (error) {
      console.error('Failed to save alert:', error);
      throw error;
    }
  }

  /**
   * 獲取告警
   */
  private async getAlert(alertId: string): Promise<Alert | null> {
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

      if (error) throw error;
      
      return data ? this.deserializeAlert(data) : null;
    } catch (error) {
      console.error(`Failed to get alert ${alertId}:`, error);
      return null;
    }
  }

  /**
   * 獲取當前告警
   */
  private async getCurrentAlert(ruleId: string): Promise<Alert | null> {
    try {
      const { data, error } = await this.supabase
        .from('alerts')
        .select('*')
        .eq('rule_id', ruleId)
        .eq('state', AlertState.ACTIVE)
        .order('triggered_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data ? this.deserializeAlert(data) : null;
    } catch (error) {
      console.error(`Failed to get current alert for rule ${ruleId}:`, error);
      return null;
    }
  }

  /**
   * 更新最後評估時間
   */
  private async updateLastEvaluation(ruleId: string): Promise<void> {
    try {
      await this.redis.setex(
        `rule:${ruleId}:last_evaluation`,
        3600,
        new Date().toISOString()
      );
    } catch (error) {
      console.error(`Failed to update last evaluation for rule ${ruleId}:`, error);
    }
  }

  /**
   * 序列化規則
   */
  private serializeRule(rule: AlertRule): any {
    return {
      ...rule,
      notifications: JSON.stringify(rule.notifications),
      dependencies: JSON.stringify(rule.dependencies || []),
      tags: JSON.stringify(rule.tags || {})
    };
  }

  /**
   * 反序列化規則
   */
  private deserializeRule(data: any): AlertRule {
    return {
      ...data,
      notifications: JSON.parse(data.notifications || '[]'),
      dependencies: JSON.parse(data.dependencies || '[]'),
      tags: JSON.parse(data.tags || '{}'),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  /**
   * 序列化告警
   */
  private serializeAlert(alert: Alert): any {
    return {
      id: alert.id,
      rule_id: alert.ruleId,
      rule_name: alert.ruleName,
      level: alert.level,
      state: alert.state,
      message: alert.message,
      value: alert.value,
      threshold: alert.threshold,
      triggered_at: alert.triggeredAt.toISOString(),
      resolved_at: alert.resolvedAt?.toISOString(),
      acknowledged_at: alert.acknowledgedAt?.toISOString(),
      acknowledged_by: alert.acknowledgedBy,
      notifications: JSON.stringify(alert.notifications),
      labels: JSON.stringify(alert.labels || {}),
      annotations: JSON.stringify(alert.annotations || {})
    };
  }

  /**
   * 反序列化告警
   */
  private deserializeAlert(data: any): Alert {
    return {
      id: data.id,
      ruleId: data.rule_id,
      ruleName: data.rule_name,
      level: data.level,
      state: data.state,
      message: data.message,
      value: data.value,
      threshold: data.threshold,
      triggeredAt: new Date(data.triggered_at),
      resolvedAt: data.resolved_at ? new Date(data.resolved_at) : undefined,
      acknowledgedAt: data.acknowledged_at ? new Date(data.acknowledged_at) : undefined,
      acknowledgedBy: data.acknowledged_by,
      notifications: JSON.parse(data.notifications || '[]'),
      labels: JSON.parse(data.labels || '{}'),
      annotations: JSON.parse(data.annotations || '{}')
    };
  }

  /**
   * 觸發事件
   */
  private emitEvent(event: AlertEngineEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }

  /**
   * 測試告警規則
   */
  public async testRule(ruleId: string): Promise<AlertTestResult> {
    try {
      const rule = this.rules.get(ruleId);
      if (!rule) {
        return {
          success: false,
          message: 'Rule not found',
          wouldTrigger: false,
          errors: ['Rule not found']
        };
      }

      const metric = await this.getMetricValue(rule.metric);
      const context: AlertContext = {
        ruleId,
        metric,
        evaluationTime: new Date(),
        environment: process.env.NODE_ENV || 'development'
      };

      const wouldTrigger = await this.evaluateCondition(rule, context);

      return {
        success: true,
        message: wouldTrigger ? 'Alert would trigger' : 'Alert would not trigger',
        value: metric.value,
        wouldTrigger,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        wouldTrigger: false,
        errors: [error.message]
      };
    }
  }

  /**
   * 添加事件監聽器
   */
  public addEventListener(listener: (event: AlertEngineEvent) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * 移除事件監聽器
   */
  public removeEventListener(listener: (event: AlertEngineEvent) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * 停止引擎
   */
  public async stop(): Promise<void> {
    // 清除所有計時器
    this.evaluationTimers.forEach(timer => clearInterval(timer));
    this.evaluationTimers.clear();

    // 關閉連接
    await this.redis.quit();
    
    console.log('Alert Rule Engine stopped');
  }

  /**
   * 重新載入規則
   */
  public async reloadRules(): Promise<AlertResponse> {
    try {
      await this.loadRules();
      await this.startEvaluationTimers();
      
      return {
        success: true,
        message: 'Rules reloaded successfully',
        data: { rulesCount: this.rules.size }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to reload rules',
        errors: [error.message]
      };
    }
  }
}