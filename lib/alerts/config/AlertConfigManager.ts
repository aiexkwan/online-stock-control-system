/**
 * Alert Config Manager
 * 告警配置管理器 - 管理預設規則、自定義規則、時間窗口等配置
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AlertRule,
  AlertLevel,
  AlertCondition,
  NotificationChannel,
  AlertConfig,
  AlertTemplate,
  AlertResponse
} from '../types';

export class AlertConfigManager {
  private supabase: SupabaseClient;
  private defaultConfig: AlertConfig;
  private templates: Map<string, AlertTemplate> = new Map();

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.defaultConfig = this.getDefaultConfig();
    this.loadTemplates();
  }

  /**
   * 獲取默認配置
   */
  private getDefaultConfig(): AlertConfig {
    return {
      global: {
        enabled: true,
        evaluationInterval: 30,
        maxAlertsPerRule: 50,
        defaultSilenceTime: 300,
        retentionDays: 30
      },
      notifications: {
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 10000,
        rateLimit: {
          enabled: true,
          maxPerMinute: 10,
          maxPerHour: 100
        }
      },
      storage: {
        redis: {
          keyPrefix: 'alert:',
          ttl: 3600
        },
        supabase: {
          alertsTable: 'alerts',
          rulesTable: 'alert_rules',
          notificationsTable: 'notification_history'
        }
      }
    };
  }

  /**
   * 初始化預設告警規則
   */
  public async initializeDefaultRules(): Promise<AlertResponse> {
    try {
      const defaultRules = this.getDefaultAlertRules();
      
      for (const rule of defaultRules) {
        await this.createRule(rule);
      }

      return {
        success: true,
        message: `Initialized ${defaultRules.length} default alert rules`,
        data: { count: defaultRules.length }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to initialize default rules',
        errors: [error instanceof Error ? (error as { message: string }).message : String(error)]
      };
    }
  }

  /**
   * 獲取預設告警規則
   */
  private getDefaultAlertRules(): Partial<AlertRule>[] {
    return [
      {
        name: 'High API Response Time',
        description: 'Alert when API response time exceeds 2 seconds',
        level: AlertLevel.WARNING,
        metric: 'api_response_time',
        condition: AlertCondition.GREATER_THAN,
        threshold: 2000,
        timeWindow: 300,
        evaluationInterval: 30,
        notifications: [
          {
            id: 'default-email',
            channel: NotificationChannel.EMAIL,
            enabled: true,
            config: {
              recipients: ['admin@example.com'],
              subject: 'API Response Time Alert'
            }
          }
        ],
        tags: { category: 'performance', system: 'api' }
      },
      {
        name: 'Critical API Response Time',
        description: 'Alert when API response time exceeds 5 seconds',
        level: AlertLevel.CRITICAL,
        metric: 'api_response_time',
        condition: AlertCondition.GREATER_THAN,
        threshold: 5000,
        timeWindow: 300,
        evaluationInterval: 30,
        notifications: [
          {
            id: 'critical-email',
            channel: NotificationChannel.EMAIL,
            enabled: true,
            config: {
              recipients: ['admin@example.com', 'devops@example.com'],
              subject: 'CRITICAL: API Response Time Alert',
              priority: 'high'
            }
          }
        ],
        tags: { category: 'performance', system: 'api', priority: 'critical' }
      },
      {
        name: 'High Error Rate',
        description: 'Alert when error rate exceeds 5%',
        level: AlertLevel.ERROR,
        metric: 'error_rate',
        condition: AlertCondition.GREATER_THAN,
        threshold: 5,
        timeWindow: 300,
        evaluationInterval: 60,
        notifications: [
          {
            id: 'error-slack',
            channel: NotificationChannel.SLACK,
            enabled: true,
            config: {
              webhook: process.env.SLACK_WEBHOOK_URL || '',
              channel: '#alerts',
              username: 'Error Bot'
            }
          }
        ],
        tags: { category: 'reliability', system: 'api' }
      },
      {
        name: 'Low Active Users',
        description: 'Alert when active users drop below 5',
        level: AlertLevel.INFO,
        metric: 'active_users',
        condition: AlertCondition.LESS_THAN,
        threshold: 5,
        timeWindow: 600,
        evaluationInterval: 120,
        notifications: [
          {
            id: 'users-webhook',
            channel: NotificationChannel.WEBHOOK,
            enabled: true,
            config: {
              url: process.env.MONITORING_WEBHOOK_URL || '',
              method: 'POST'
            }
          }
        ],
        tags: { category: 'business', system: 'users' }
      },
      {
        name: 'High Database Connections',
        description: 'Alert when database connections exceed 80% of limit',
        level: AlertLevel.WARNING,
        metric: 'database_connections',
        condition: AlertCondition.GREATER_THAN,
        threshold: 80,
        timeWindow: 180,
        evaluationInterval: 30,
        notifications: [
          {
            id: 'db-email',
            channel: NotificationChannel.EMAIL,
            enabled: true,
            config: {
              recipients: ['dba@example.com'],
              subject: 'Database Connection Alert'
            }
          }
        ],
        tags: { category: 'infrastructure', system: 'database' }
      },
      {
        name: 'Critical Memory Usage',
        description: 'Alert when memory usage exceeds 90%',
        level: AlertLevel.CRITICAL,
        metric: 'memory_usage',
        condition: AlertCondition.GREATER_THAN,
        threshold: 90,
        timeWindow: 120,
        evaluationInterval: 30,
        notifications: [
          {
            id: 'memory-critical',
            channel: NotificationChannel.EMAIL,
            enabled: true,
            config: {
              recipients: ['devops@example.com'],
              subject: 'CRITICAL: Memory Usage Alert',
              priority: 'high'
            }
          }
        ],
        tags: { category: 'infrastructure', system: 'server', priority: 'critical' }
      },
      {
        name: 'High Disk Usage',
        description: 'Alert when disk usage exceeds 85%',
        level: AlertLevel.WARNING,
        metric: 'disk_usage',
        condition: AlertCondition.GREATER_THAN,
        threshold: 85,
        timeWindow: 300,
        evaluationInterval: 300,
        notifications: [
          {
            id: 'disk-webhook',
            channel: NotificationChannel.WEBHOOK,
            enabled: true,
            config: {
              url: process.env.MONITORING_WEBHOOK_URL || '',
              method: 'POST'
            }
          }
        ],
        tags: { category: 'infrastructure', system: 'storage' }
      }
    ];
  }

  /**
   * 創建告警規則
   */
  private async createRule(ruleData: Partial<AlertRule>): Promise<void> {
    try {
      // 檢查規則是否已存在
      const { data: existing } = await this.supabase
        .from('alert_rules')
        .select('id')
        .eq('name', ruleData.name)
        .single();

      if (existing) {
        console.log(`Rule "${ruleData.name}" already exists, skipping...`);
        return;
      }

      // 創建新規則
      const rule: AlertRule = {
        id: this.generateId(),
        name: ruleData.name!,
        description: ruleData.description || '',
        enabled: true,
        level: ruleData.level!,
        metric: ruleData.metric!,
        condition: ruleData.condition!,
        threshold: ruleData.threshold!,
        timeWindow: ruleData.timeWindow!,
        evaluationInterval: ruleData.evaluationInterval!,
        dependencies: ruleData.dependencies || [],
        silenceTime: ruleData.silenceTime,
        notifications: ruleData.notifications || [],
        tags: ruleData.tags || {},
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      };

      const { error } = await this.supabase
        .from('alert_rules')
        .insert(this.serializeRule(rule));

      if (error) throw error;

      console.log(`Created default rule: ${rule.name}`);
    } catch (error) {
      console.error(`Failed to create rule "${ruleData.name}":`, error);
      throw error;
    }
  }

  /**
   * 初始化通知模板
   */
  public async initializeDefaultTemplates(): Promise<AlertResponse> {
    try {
      const defaultTemplates = this.getDefaultTemplates();
      
      for (const template of defaultTemplates) {
        await this.createTemplate(template);
      }

      return {
        success: true,
        message: `Initialized ${defaultTemplates.length} default templates`,
        data: { count: defaultTemplates.length }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to initialize default templates',
        errors: [error instanceof Error ? (error as { message: string }).message : String(error)]
      };
    }
  }

  /**
   * 獲取預設模板
   */
  private getDefaultTemplates(): AlertTemplate[] {
    return [
      {
        id: 'email-default',
        name: 'Default Email Template',
        description: 'Standard email notification template',
        channel: NotificationChannel.EMAIL,
        template: `
Subject: {{alert.level}} Alert: {{alert.ruleName}}

Alert Details:
- Rule: {{alert.ruleName}}
- Level: {{alert.level}}
- State: {{alert.state}}
- Message: {{(alert as { message: string }).message}}
- Current Value: {{alert.value}}
- Threshold: {{alert.threshold}}
- Triggered: {{alert.triggeredAt}}

{{#if alert.resolvedAt}}
- Resolved: {{alert.resolvedAt}}
{{/if}}

Please take appropriate action if required.
        `,
        variables: ['alert.ruleName', 'alert.level', 'alert.state', '(alert as { message: string }).message', 'alert.value', 'alert.threshold', 'alert.triggeredAt', 'alert.resolvedAt'],
        defaultValues: {}
      },
      {
        id: 'slack-default',
        name: 'Default Slack Template',
        description: 'Standard Slack notification template',
        channel: NotificationChannel.SLACK,
        template: `
🚨 *{{alert.level}} Alert*: {{alert.ruleName}}

*Current Value:* {{alert.value}}
*Threshold:* {{alert.threshold}}
*Status:* {{alert.state}}

*Message:* {{(alert as { message: string }).message}}

*Time:* {{alert.triggeredAt}}
        `,
        variables: ['alert.ruleName', 'alert.level', 'alert.value', 'alert.threshold', 'alert.state', '(alert as { message: string }).message', 'alert.triggeredAt'],
        defaultValues: {}
      },
      {
        id: 'webhook-default',
        name: 'Default Webhook Template',
        description: 'Standard webhook notification template',
        channel: NotificationChannel.WEBHOOK,
        template: `{
  "alert": {
    "id": "{{alert.id}}",
    "ruleName": "{{alert.ruleName}}",
    "level": "{{alert.level}}",
    "state": "{{alert.state}}",
    "message": "{{(alert as { message: string }).message}}",
    "value": {{alert.value}},
    "threshold": {{alert.threshold}},
    "triggeredAt": "{{alert.triggeredAt}}",
    "resolvedAt": {{#if alert.resolvedAt}}"{{alert.resolvedAt}}"{{else}}null{{/if}}
  },
  "timestamp": "{{now}}",
  "system": "NewPennine Alert System"
}`,
        variables: ['alert.id', 'alert.ruleName', 'alert.level', 'alert.state', '(alert as { message: string }).message', 'alert.value', 'alert.threshold', 'alert.triggeredAt', 'alert.resolvedAt', 'now'],
        defaultValues: {
          now: new Date().toISOString()
        }
      }
    ];
  }

  /**
   * 創建通知模板
   */
  private async createTemplate(template: AlertTemplate): Promise<void> {
    try {
      // 檢查模板是否已存在
      const { data: existing } = await this.supabase
        .from('alert_templates')
        .select('id')
        .eq('id', template.id)
        .single();

      if (existing) {
        console.log(`Template "${template.name}" already exists, skipping...`);
        return;
      }

      const { error } = await this.supabase
        .from('alert_templates')
        .insert(template);

      if (error) throw error;

      this.templates.set(template.id, template);
      console.log(`Created default template: ${template.name}`);
    } catch (error) {
      console.error(`Failed to create template "${template.name}":`, error);
      throw error;
    }
  }

  /**
   * 載入模板
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
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }

  /**
   * 獲取所有模板
   */
  public async getTemplates(): Promise<AlertTemplate[]> {
    try {
      const { data: templates, error } = await this.supabase
        .from('alert_templates')
        .select('*')
        .order('name');

      if (error) throw error;

      return templates || [];
    } catch (error) {
      console.error('Failed to get templates:', error);
      return [];
    }
  }

  /**
   * 獲取模板
   */
  public async getTemplate(id: string): Promise<AlertTemplate | null> {
    try {
      const cached = this.templates.get(id);
      if (cached) return cached;

      const { data: template, error } = await this.supabase
        .from('alert_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      this.templates.set(id, template);
      return template;
    } catch (error) {
      console.error(`Failed to get template ${id}:`, error);
      return null;
    }
  }

  /**
   * 創建數據庫表格
   */
  public async createDatabaseSchema(): Promise<AlertResponse> {
    try {
      const schemas = [
        this.createAlertRulesTable(),
        this.createAlertsTable(),
        this.createNotificationHistoryTable(),
        this.createAlertTemplatesTable(),
        this.createAlertEscalationsTable(),
        this.createAlertSuppressionsTable()
      ];

      for (const schema of schemas) {
        await this.supabase.rpc('execute_sql', { sql: schema });
      }

      return {
        success: true,
        message: 'Database schema created successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create database schema',
        errors: [error instanceof Error ? (error as { message: string }).message : String(error)]
      };
    }
  }

  /**
   * 創建告警規則表
   */
  private createAlertRulesTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS alert_rules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        enabled BOOLEAN DEFAULT true,
        level TEXT NOT NULL,
        metric TEXT NOT NULL,
        condition TEXT NOT NULL,
        threshold TEXT NOT NULL,
        time_window INTEGER NOT NULL,
        evaluation_interval INTEGER NOT NULL,
        dependencies JSONB DEFAULT '[]',
        silence_time INTEGER,
        notifications JSONB DEFAULT '[]',
        tags JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by TEXT NOT NULL,
        
        CONSTRAINT alert_rules_name_unique UNIQUE (name),
        CONSTRAINT alert_rules_level_check CHECK (level IN ('info', 'warning', 'error', 'critical')),
        CONSTRAINT alert_rules_condition_check CHECK (condition IN ('gt', 'lt', 'eq', 'ne', 'contains', 'regex'))
      );
      
      CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON alert_rules(enabled);
      CREATE INDEX IF NOT EXISTS idx_alert_rules_level ON alert_rules(level);
      CREATE INDEX IF NOT EXISTS idx_alert_rules_metric ON alert_rules(metric);
      CREATE INDEX IF NOT EXISTS idx_alert_rules_created_at ON alert_rules(created_at);
    `;
  }

  /**
   * 創建告警表
   */
  private createAlertsTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        rule_id TEXT NOT NULL,
        rule_name TEXT NOT NULL,
        level TEXT NOT NULL,
        state TEXT NOT NULL,
        message TEXT NOT NULL,
        value TEXT NOT NULL,
        threshold TEXT NOT NULL,
        triggered_at TIMESTAMP WITH TIME ZONE NOT NULL,
        resolved_at TIMESTAMP WITH TIME ZONE,
        acknowledged_at TIMESTAMP WITH TIME ZONE,
        acknowledged_by TEXT,
        notifications JSONB DEFAULT '[]',
        labels JSONB DEFAULT '{}',
        annotations JSONB DEFAULT '{}',
        
        CONSTRAINT alerts_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES alert_rules(id) ON DELETE CASCADE,
        CONSTRAINT alerts_level_check CHECK (level IN ('info', 'warning', 'error', 'critical')),
        CONSTRAINT alerts_state_check CHECK (state IN ('active', 'resolved', 'acknowledged', 'silenced'))
      );
      
      CREATE INDEX IF NOT EXISTS idx_alerts_rule_id ON alerts(rule_id);
      CREATE INDEX IF NOT EXISTS idx_alerts_level ON alerts(level);
      CREATE INDEX IF NOT EXISTS idx_alerts_state ON alerts(state);
      CREATE INDEX IF NOT EXISTS idx_alerts_triggered_at ON alerts(triggered_at);
      CREATE INDEX IF NOT EXISTS idx_alerts_resolved_at ON alerts(resolved_at);
    `;
  }

  /**
   * 創建通知歷史表
   */
  private createNotificationHistoryTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS notification_history (
        id TEXT PRIMARY KEY,
        alert_id TEXT NOT NULL,
        channel TEXT NOT NULL,
        sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
        status TEXT NOT NULL,
        error TEXT,
        retry_count INTEGER DEFAULT 0,
        
        CONSTRAINT notification_history_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE,
        CONSTRAINT notification_history_channel_check CHECK (channel IN ('email', 'slack', 'webhook', 'sms')),
        CONSTRAINT notification_history_status_check CHECK (status IN ('pending', 'sent', 'failed', 'retry'))
      );
      
      CREATE INDEX IF NOT EXISTS idx_notification_history_alert_id ON notification_history(alert_id);
      CREATE INDEX IF NOT EXISTS idx_notification_history_channel ON notification_history(channel);
      CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON notification_history(sent_at);
      CREATE INDEX IF NOT EXISTS idx_notification_history_status ON notification_history(status);
    `;
  }

  /**
   * 創建告警模板表
   */
  private createAlertTemplatesTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS alert_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        channel TEXT NOT NULL,
        template TEXT NOT NULL,
        variables JSONB DEFAULT '[]',
        default_values JSONB DEFAULT '{}',
        
        CONSTRAINT alert_templates_name_unique UNIQUE (name),
        CONSTRAINT alert_templates_channel_check CHECK (channel IN ('email', 'slack', 'webhook', 'sms'))
      );
      
      CREATE INDEX IF NOT EXISTS idx_alert_templates_channel ON alert_templates(channel);
    `;
  }

  /**
   * 創建告警升級表
   */
  private createAlertEscalationsTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS alert_escalations (
        id TEXT PRIMARY KEY,
        rule_id TEXT NOT NULL,
        enabled BOOLEAN DEFAULT true,
        levels JSONB NOT NULL,
        
        CONSTRAINT alert_escalations_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES alert_rules(id) ON DELETE CASCADE,
        CONSTRAINT alert_escalations_rule_id_unique UNIQUE (rule_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_alert_escalations_rule_id ON alert_escalations(rule_id);
      CREATE INDEX IF NOT EXISTS idx_alert_escalations_enabled ON alert_escalations(enabled);
    `;
  }

  /**
   * 創建告警抑制表
   */
  private createAlertSuppressionsTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS alert_suppressions (
        id TEXT PRIMARY KEY,
        rule_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        suppressed_by TEXT NOT NULL,
        suppressed_at TIMESTAMP WITH TIME ZONE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE,
        active BOOLEAN DEFAULT true,
        
        CONSTRAINT alert_suppressions_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES alert_rules(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_alert_suppressions_rule_id ON alert_suppressions(rule_id);
      CREATE INDEX IF NOT EXISTS idx_alert_suppressions_active ON alert_suppressions(active);
      CREATE INDEX IF NOT EXISTS idx_alert_suppressions_expires_at ON alert_suppressions(expires_at);
    `;
  }

  /**
   * 序列化規則
   */
  private serializeRule(rule: AlertRule): Record<string, unknown> {
    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      enabled: rule.enabled,
      level: rule.level,
      metric: rule.metric,
      condition: rule.condition,
      threshold: rule.threshold,
      time_window: rule.timeWindow,
      evaluation_interval: rule.evaluationInterval,
      dependencies: JSON.stringify(rule.dependencies || []),
      silence_time: rule.silenceTime,
      notifications: JSON.stringify(rule.notifications),
      tags: JSON.stringify(rule.tags || {}),
      created_at: rule.createdAt.toISOString(),
      updated_at: rule.updatedAt.toISOString(),
      created_by: rule.createdBy
    };
  }

  /**
   * 生成 ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 獲取配置
   */
  public getConfig(): AlertConfig {
    return this.defaultConfig;
  }

  /**
   * 更新配置
   */
  public updateConfig(config: Partial<AlertConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }
}