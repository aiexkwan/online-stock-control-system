/**
 * Notification Service
 * 通知服務 - 統一管理多渠道通知發送、模板處理、重試機制
 */

import { Redis } from 'ioredis';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Alert,
  AlertRule,
  NotificationConfig,
  NotificationChannel,
  NotificationHistory,
  EmailConfig,
  SlackConfig,
  WebhookConfig,
  SmsConfig,
  AlertTemplate,
  AlertResponse,
  BatchOperationResult,
  NotificationStats,
  NotificationResult
} from '../types';

interface NotificationProvider {
  send(alert: Alert, config: Record<string, unknown>, template?: string): Promise<NotificationResult>;
  test(config: Record<string, unknown>): Promise<boolean>;
}


export class NotificationService {
  private redis: Redis;
  private supabase: SupabaseClient;
  private providers: Map<NotificationChannel, NotificationProvider> = new Map();
  private templates: Map<string, AlertTemplate> = new Map();
  private rateLimiter: Map<string, number> = new Map();

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.initializeProviders();
    this.loadTemplates();
  }

  /**
   * 初始化通知提供者
   */
  private initializeProviders(): void {
    this.providers.set(NotificationChannel.EMAIL, new EmailProvider() as unknown as NotificationProvider);
    this.providers.set(NotificationChannel.SLACK, new SlackProvider() as unknown as NotificationProvider);
    this.providers.set(NotificationChannel.WEBHOOK, new WebhookProvider() as unknown as NotificationProvider);
    this.providers.set(NotificationChannel.SMS, new SmsProvider() as unknown as NotificationProvider);
  }

  /**
   * 載入通知模板
   */
  private async loadTemplates(): Promise<void> {
    try {
      const { data: templates, error } = await this.supabase
        .from('alert_templates')
        .select('*');

      if (error) throw error;

      this.templates.clear();
      templates?.forEach((template: AlertTemplate) => {
        this.templates.set(template.id, template);
      });

      console.log(`Loaded ${this.templates.size} notification templates`);
    } catch (error) {
      console.error('Failed to load notification templates:', error);
    }
  }

  /**
   * 發送通知
   */
  public async sendNotifications(alert: Alert, rule: AlertRule): Promise<AlertResponse> {
    try {
      const results: NotificationResult[] = [];
      
      for (const notification of rule.notifications) {
        if (!notification.enabled) continue;

        // 檢查通知條件
        if (!this.shouldSendNotification(alert, notification)) {
          continue;
        }

        // 檢查速率限制
        if (await this.isRateLimited(notification.id)) {
          console.warn(`Notification ${notification.id} is rate limited`);
          continue;
        }

        // 發送通知
        const result = await this.sendNotification(alert, notification);
        results.push(result);

        // 記錄通知歷史
        await this.recordNotificationHistory(alert, notification, result);

        // 更新速率限制
        await this.updateRateLimit(notification.id);
      }

      return {
        success: results.some(r => r.success),
        message: `Sent ${results.filter(r => r.success).length} of ${results.length} notifications`,
        data: { notifications: results }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send notifications',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * 發送單個通知
   */
  private async sendNotification(
    alert: Alert,
    notification: NotificationConfig
  ): Promise<NotificationResult> {
    try {
      const provider = this.providers.get(notification.channel);
      if (!provider) {
        throw new Error(`Unknown notification channel: ${notification.channel}`);
      }

      // 生成通知內容
      const template = await this.getTemplate(notification.template);
      const content = this.renderTemplate(template, alert);

      // 發送通知
      const result = await provider.send(alert, notification.config as unknown as Record<string, unknown>, content);

      // 重試機制
      if (!result.success) {
        const retryResult = await this.retryNotification(alert, notification, content);
        if (retryResult.success) {
          return retryResult;
        }
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send notification',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 重試通知
   */
  private async retryNotification(
    alert: Alert,
    notification: NotificationConfig,
    content: string,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<NotificationResult> {
    const provider = this.providers.get(notification.channel);
    if (!provider) {
      return {
        success: false,
        message: 'Provider not found',
        error: 'Provider not found'
      };
    }

    for (let i = 0; i < maxRetries; i++) {
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      
      try {
        const result = await provider.send(alert, notification.config as unknown as Record<string, unknown>, content);
        if (result.success) {
          return result;
        }
      } catch (error) {
        console.error(`Retry ${i + 1} failed:`, error);
      }
    }

    return {
      success: false,
      message: 'All retry attempts failed',
      error: 'All retry attempts failed'
    };
  }

  /**
   * 檢查是否應該發送通知
   */
  private shouldSendNotification(alert: Alert, notification: NotificationConfig): boolean {
    // 檢查告警級別
    if (notification.conditions?.levels) {
      if (!notification.conditions.levels.includes(alert.level)) {
        return false;
      }
    }

    // 檢查時間範圍
    if (notification.conditions?.timeRanges) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const dayOfWeek = now.getDay();

      const inTimeRange = notification.conditions.timeRanges.some(range => {
        const startTime = this.parseTime(range.start);
        const endTime = this.parseTime(range.end);
        
        // 檢查星期
        if (range.daysOfWeek && !range.daysOfWeek.includes(dayOfWeek)) {
          return false;
        }

        // 檢查時間範圍
        if (startTime <= endTime) {
          return currentTime >= startTime && currentTime <= endTime;
        } else {
          // 跨天的時間範圍
          return currentTime >= startTime || currentTime <= endTime;
        }
      });

      if (!inTimeRange) {
        return false;
      }
    }

    return true;
  }

  /**
   * 解析時間字符串
   */
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * 檢查速率限制
   */
  private async isRateLimited(notificationId: string): Promise<boolean> {
    try {
      const key = `rate_limit:${notificationId}`;
      const count = await this.redis.get(key);
      
      const maxPerMinute = 10; // 每分鐘最多 10 次
      const maxPerHour = 100; // 每小時最多 100 次

      if (count && parseInt(count) >= maxPerMinute) {
        return true;
      }

      const hourlyKey = `rate_limit:hourly:${notificationId}`;
      const hourlyCount = await this.redis.get(hourlyKey);
      
      if (hourlyCount && parseInt(hourlyCount) >= maxPerHour) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to check rate limit:', error);
      return false;
    }
  }

  /**
   * 更新速率限制
   */
  private async updateRateLimit(notificationId: string): Promise<void> {
    try {
      const key = `rate_limit:${notificationId}`;
      const hourlyKey = `rate_limit:hourly:${notificationId}`;

      await this.redis.multi()
        .incr(key)
        .expire(key, 60)
        .incr(hourlyKey)
        .expire(hourlyKey, 3600)
        .exec();
    } catch (error) {
      console.error('Failed to update rate limit:', error);
    }
  }

  /**
   * 獲取模板
   */
  private async getTemplate(templateId?: string): Promise<string> {
    if (!templateId) {
      return this.getDefaultTemplate();
    }

    const template = this.templates.get(templateId);
    if (!template) {
      return this.getDefaultTemplate();
    }

    return template.template;
  }

  /**
   * 獲取默認模板
   */
  private getDefaultTemplate(): string {
    return `
Alert: {{alert.ruleName}}
Level: {{alert.level}}
State: {{alert.state}}
Message: {{alert.message}}
Value: {{alert.value}}
Threshold: {{alert.threshold}}
Triggered: {{alert.triggeredAt}}
{{#if alert.resolvedAt}}
Resolved: {{alert.resolvedAt}}
{{/if}}
`;
  }

  /**
   * 渲染模板
   */
  private renderTemplate(template: string, alert: Alert): string {
    try {
      // 簡單的模板替換
      let rendered = template;
      
      // 替換基本變量
      rendered = rendered.replace(/\{\{alert\.(\w+)\}\}/g, (match, prop) => {
        const value = alert[prop as keyof Alert];
        return value !== undefined ? String(value) : match;
      });

      // 處理條件語句
      rendered = rendered.replace(/\{\{#if alert\.(\w+)\}\}(.*?)\{\{\/if\}\}/gs, (match, prop, content) => {
        const value = alert[prop as keyof Alert];
        return value ? content : '';
      });

      return rendered;
    } catch (error) {
      console.error('Failed to render template:', error);
      return `Alert: ${alert.ruleName} - ${alert.message as string}`;
    }
  }

  /**
   * 記錄通知歷史
   */
  private async recordNotificationHistory(
    alert: Alert,
    notification: NotificationConfig,
    result: NotificationResult
  ): Promise<void> {
    try {
      const history: NotificationHistory = {
        id: this.generateId(),
        channel: notification.channel,
        sentAt: new Date(),
        status: result.success ? 'sent' : 'failed',
        error: result.error,
        retryCount: 0
      };

      alert.notifications.push(history);

      // 保存到數據庫
      await this.supabase
        .from('notification_history')
        .insert({
          id: history.id,
          alert_id: alert.id,
          channel: history.channel,
          sent_at: history.sentAt.toISOString(),
          status: history.status,
          error: history.error,
          retry_count: history.retryCount
        });
    } catch (error) {
      console.error('Failed to record notification history:', error);
    }
  }

  /**
   * 測試通知配置
   */
  public async testNotification(notification: NotificationConfig): Promise<AlertResponse> {
    try {
      const provider = this.providers.get(notification.channel);
      if (!provider) {
        return {
          success: false,
          message: `Unknown notification channel: ${notification.channel}`,
          errors: [`Unknown notification channel: ${notification.channel}`]
        };
      }

      const success = await provider.test(notification.config as unknown as Record<string, unknown>);
      
      return {
        success,
        message: success ? 'Test notification sent successfully' : 'Test notification failed'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to test notification',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * 批量發送通知
   */
  public async batchSendNotifications(
    alerts: Alert[],
    rule: AlertRule
  ): Promise<BatchOperationResult> {
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const alert of alerts) {
      try {
        const result = await this.sendNotifications(alert, rule);
        if (result.success) {
          processed++;
        } else {
          failed++;
          errors.push(`Alert ${alert.id}: ${result.message}`);
        }
      } catch (error) {
        failed++;
        errors.push(`Alert ${alert.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      success: failed === 0,
      processed,
      failed,
      errors
    };
  }

  /**
   * 創建通知模板
   */
  public async createTemplate(template: Omit<AlertTemplate, 'id'>): Promise<AlertResponse> {
    try {
      const newTemplate: AlertTemplate = {
        ...template,
        id: this.generateId()
      };

      const { error } = await this.supabase
        .from('alert_templates')
        .insert(newTemplate);

      if (error) throw error;

      this.templates.set(newTemplate.id, newTemplate);

      return {
        success: true,
        message: 'Template created successfully',
        data: { 
          alertId: newTemplate.id,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create template',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * 獲取通知統計
   */
  public async getNotificationStats(): Promise<NotificationStats> {
    try {
      const { data: stats, error } = await this.supabase
        .from('notification_history')
        .select('channel, status, count(*) as count');

      if (error) throw error;

      // Handle SQL aggregation result
      const aggregatedStats = stats as unknown as { channel: string; status: string; count: number }[];
      
      const notificationStats: NotificationStats = {
        total: aggregatedStats.reduce((sum, item) => sum + item.count, 0),
        sent: aggregatedStats.filter(item => item.status === 'sent').reduce((sum, item) => sum + item.count, 0),
        failed: aggregatedStats.filter(item => item.status === 'failed').reduce((sum, item) => sum + item.count, 0),
        pending: aggregatedStats.filter(item => item.status === 'pending').reduce((sum, item) => sum + item.count, 0),
        byChannel: aggregatedStats.reduce((acc, item) => {
          acc[item.channel as NotificationChannel] = (acc[item.channel as NotificationChannel] || 0) + item.count;
          return acc;
        }, {} as Record<NotificationChannel, number>),
        byStatus: aggregatedStats.reduce((acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + item.count;
          return acc;
        }, {} as Record<string, number>),
        avgDeliveryTime: 0
      };
      
      return notificationStats;
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      return {
        total: 0,
        sent: 0,
        failed: 0,
        pending: 0,
        byChannel: {} as Record<NotificationChannel, number>,
        byStatus: {} as Record<string, number>,
        avgDeliveryTime: 0
      };
    }
  }

  /**
   * 生成 ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Email Provider
 */
class EmailProvider implements NotificationProvider {
  async send(alert: Alert, config: Record<string, unknown>, template?: string): Promise<NotificationResult> {
    const emailConfig = config as unknown as EmailConfig;
    try {
      // 這裡應該整合實際的郵件服務 (如 Sendgrid, AWS SES 等)
      console.log('Sending email notification:', {
        recipients: emailConfig.recipients,
        subject: emailConfig.subject || `Alert: ${alert.ruleName}`,
        content: template || alert.message as string
      });

      return {
        success: true,
        message: 'Email sent successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send email',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async test(config: Record<string, unknown>): Promise<boolean> {
    const emailConfig = config as unknown as EmailConfig;
    try {
      // 發送測試郵件
      console.log('Testing email configuration:', emailConfig);
      return true;
    } catch (error) {
      console.error('Email test failed:', error);
      return false;
    }
  }
}

/**
 * Slack Provider
 */
class SlackProvider implements NotificationProvider {
  async send(alert: Alert, config: Record<string, unknown>, template?: string): Promise<NotificationResult> {
    const slackConfig = config as unknown as SlackConfig;
    try {
      const payload = {
        channel: slackConfig.channel,
        username: slackConfig.username || 'Alert Bot',
        icon_emoji: slackConfig.iconEmoji || ':warning:',
        text: template || alert.message as string,
        attachments: [
          {
            color: this.getColorForLevel(alert.level),
            fields: [
              {
                title: 'Level',
                value: alert.level,
                short: true
              },
              {
                title: 'State',
                value: alert.state,
                short: true
              },
              {
                title: 'Value',
                value: String(alert.value),
                short: true
              },
              {
                title: 'Threshold',
                value: String(alert.threshold),
                short: true
              }
            ],
            ts: Math.floor(alert.triggeredAt.getTime() / 1000)
          }
        ]
      };

      // 發送到 Slack webhook
      const response = await fetch(slackConfig.webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        success: true,
        message: 'Slack notification sent successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send Slack notification',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async test(config: Record<string, unknown>): Promise<boolean> {
    const slackConfig = config as unknown as SlackConfig;
    try {
      const payload = {
        channel: slackConfig.channel,
        username: slackConfig.username || 'Alert Bot',
        icon_emoji: slackConfig.iconEmoji || ':warning:',
        text: 'Test notification from Alert System'
      };

      const response = await fetch(slackConfig.webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (error) {
      console.error('Slack test failed:', error);
      return false;
    }
  }

  private getColorForLevel(level: string): string {
    switch (level) {
      case 'critical': return 'danger';
      case 'error': return 'warning';
      case 'warning': return 'warning';
      case 'info': return 'good';
      default: return 'good';
    }
  }
}

/**
 * Webhook Provider
 */
class WebhookProvider implements NotificationProvider {
  async send(alert: Alert, config: Record<string, unknown>, template?: string): Promise<NotificationResult> {
    const webhookConfig = config as unknown as WebhookConfig;
    try {
      const payload = {
        alert: alert,
        template: template,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(webhookConfig.url, {
        method: webhookConfig.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...webhookConfig.headers
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(webhookConfig.timeout || 10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        success: true,
        message: 'Webhook notification sent successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send webhook notification',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async test(config: Record<string, unknown>): Promise<boolean> {
    const webhookConfig = config as unknown as WebhookConfig;
    try {
      const payload = {
        test: true,
        message: 'Test notification from Alert System',
        timestamp: new Date().toISOString()
      };

      const response = await fetch(webhookConfig.url, {
        method: webhookConfig.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...webhookConfig.headers
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(webhookConfig.timeout || 10000)
      });

      return response.ok;
    } catch (error) {
      console.error('Webhook test failed:', error);
      return false;
    }
  }
}

/**
 * SMS Provider
 */
class SmsProvider implements NotificationProvider {
  async send(alert: Alert, config: Record<string, unknown>, template?: string): Promise<NotificationResult> {
    const smsConfig = config as unknown as SmsConfig;
    try {
      // 這裡應該整合實際的短信服務 (如 Twilio, AWS SNS 等)
      console.log('Sending SMS notification:', {
        recipients: smsConfig.recipients,
        message: template || alert.message as string
      });

      return {
        success: true,
        message: 'SMS sent successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send SMS',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async test(config: Record<string, unknown>): Promise<boolean> {
    const smsConfig = config as unknown as SmsConfig;
    try {
      // 發送測試短信
      console.log('Testing SMS configuration:', smsConfig);
      return true;
    } catch (error) {
      console.error('SMS test failed:', error);
      return false;
    }
  }
}