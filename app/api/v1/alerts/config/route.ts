/**
 * 告警配置端點 - 系統警報規則和通知管理
 * v1.8 系統優化 - 企業級告警管理解決方案
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';

// 告警配置介面
interface AlertRule {
  id: string;
  name: string;
  description: string;
  type: 'threshold' | 'pattern' | 'anomaly' | 'status';
  category: 'system' | 'business' | 'database' | 'security';
  enabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'ne' | 'contains' | 'not_contains';
    value: number | string;
    duration?: number; // 持續時間 (秒)
  };
  actions: Array<{
    type: 'email' | 'sms' | 'webhook' | 'log' | 'slack';
    target: string;
    template?: string;
  }>;
  cooldown: number; // 冷卻時間 (秒)
  createdAt: string;
  updatedAt: string;
}

interface AlertConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  thresholds: {
    system: {
      cpu: { warning: number; critical: number };
      memory: { warning: number; critical: number };
      disk: { warning: number; critical: number };
      responseTime: { warning: number; critical: number };
    };
    business: {
      errorRate: { warning: number; critical: number };
      qcLabelErrors: { warning: number; critical: number };
      pendingTransfers: { warning: number; critical: number };
      orderBacklog: { warning: number; critical: number };
    };
    database: {
      connectionPool: { warning: number; critical: number };
      queryTime: { warning: number; critical: number };
      rpcFailureRate: { warning: number; critical: number };
      replicationLag: { warning: number; critical: number };
    };
  };
  notifications: {
    email: {
      enabled: boolean;
      recipients: string[];
      template: string;
    };
    sms: {
      enabled: boolean;
      recipients: string[];
      template: string;
    };
    webhook: {
      enabled: boolean;
      url: string;
      headers: Record<string, string>;
      template: string;
    };
    slack: {
      enabled: boolean;
      webhook: string;
      channel: string;
      template: string;
    };
  };
  escalation: {
    enabled: boolean;
    rules: Array<{
      level: number;
      delay: number; // 分鐘
      actions: string[];
    }>;
  };
  maintenance: {
    enabled: boolean;
    schedule: Array<{
      start: string;
      end: string;
      days: string[];
      description: string;
    }>;
  };
}

interface AlertConfigResponse {
  status: 'success' | 'error';
  timestamp: string;
  version: string;
  environment: string;
  config: AlertConfig;
  rules: AlertRule[];
  stats: {
    totalRules: number;
    activeRules: number;
    recentAlerts: number;
    acknowledgedAlerts: number;
  };
}

/**
 * 預設告警配置
 */
const defaultAlertConfig: AlertConfig = {
  id: 'default-config',
  name: 'NewPennine WMS 告警配置',
  description: '倉庫管理系統企業級告警配置',
  enabled: true,
  thresholds: {
    system: {
      cpu: { warning: 70, critical: 85 },
      memory: { warning: 75, critical: 90 },
      disk: { warning: 80, critical: 95 },
      responseTime: { warning: 500, critical: 1000 }
    },
    business: {
      errorRate: { warning: 5, critical: 10 },
      qcLabelErrors: { warning: 3, critical: 5 },
      pendingTransfers: { warning: 50, critical: 100 },
      orderBacklog: { warning: 20, critical: 50 }
    },
    database: {
      connectionPool: { warning: 80, critical: 95 },
      queryTime: { warning: 1000, critical: 5000 },
      rpcFailureRate: { warning: 5, critical: 10 },
      replicationLag: { warning: 5000, critical: 10000 }
    }
  },
  notifications: {
    email: {
      enabled: true,
      recipients: ['admin@newpennine.com', 'ops@newpennine.com'],
      template: 'default-email-template'
    },
    sms: {
      enabled: false,
      recipients: ['+85212345678'],
      template: 'default-sms-template'
    },
    webhook: {
      enabled: false,
      url: 'https://hooks.slack.com/services/...',
      headers: { 'Content-Type': 'application/json' },
      template: 'default-webhook-template'
    },
    slack: {
      enabled: true,
      webhook: 'https://hooks.slack.com/services/...',
      channel: '#alerts',
      template: 'default-slack-template'
    }
  },
  escalation: {
    enabled: true,
    rules: [
      {
        level: 1,
        delay: 5,
        actions: ['email']
      },
      {
        level: 2,
        delay: 15,
        actions: ['email', 'sms']
      },
      {
        level: 3,
        delay: 30,
        actions: ['email', 'sms', 'webhook']
      }
    ]
  },
  maintenance: {
    enabled: true,
    schedule: [
      {
        start: '02:00',
        end: '04:00',
        days: ['Sunday'],
        description: '每週系統維護窗口'
      }
    ]
  }
};

/**
 * 預設告警規則
 */
const defaultAlertRules: AlertRule[] = [
  {
    id: 'system-cpu-high',
    name: '系統 CPU 使用率過高',
    description: '當系統 CPU 使用率超過閾值時觸發',
    type: 'threshold',
    category: 'system',
    enabled: true,
    priority: 'high',
    condition: {
      metric: 'system.cpu',
      operator: 'gt',
      value: 85,
      duration: 300
    },
    actions: [
      {
        type: 'email',
        target: 'admin@newpennine.com',
        template: 'cpu-alert-template'
      },
      {
        type: 'slack',
        target: '#alerts',
        template: 'cpu-slack-template'
      }
    ],
    cooldown: 1800,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'database-slow-query',
    name: '資料庫慢查詢告警',
    description: '當查詢執行時間超過閾值時觸發',
    type: 'threshold',
    category: 'database',
    enabled: true,
    priority: 'medium',
    condition: {
      metric: 'database.queryTime',
      operator: 'gt',
      value: 5000,
      duration: 60
    },
    actions: [
      {
        type: 'email',
        target: 'dba@newpennine.com',
        template: 'slow-query-template'
      }
    ],
    cooldown: 3600,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'business-error-rate',
    name: '業務錯誤率告警',
    description: '當系統錯誤率超過閾值時觸發',
    type: 'threshold',
    category: 'business',
    enabled: true,
    priority: 'high',
    condition: {
      metric: 'business.errorRate',
      operator: 'gt',
      value: 10,
      duration: 300
    },
    actions: [
      {
        type: 'email',
        target: 'ops@newpennine.com',
        template: 'error-rate-template'
      },
      {
        type: 'webhook',
        target: 'https://monitoring.newpennine.com/webhook',
        template: 'webhook-template'
      }
    ],
    cooldown: 900,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'qc-label-failures',
    name: 'QC 標籤列印失敗告警',
    description: '當 QC 標籤列印失敗率過高時觸發',
    type: 'threshold',
    category: 'business',
    enabled: true,
    priority: 'critical',
    condition: {
      metric: 'business.qcLabelErrors',
      operator: 'gt',
      value: 5,
      duration: 600
    },
    actions: [
      {
        type: 'email',
        target: 'production@newpennine.com',
        template: 'qc-label-template'
      },
      {
        type: 'sms',
        target: '+85212345678',
        template: 'qc-label-sms-template'
      }
    ],
    cooldown: 1800,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'redis-connection-loss',
    name: 'Redis 連接丟失告警',
    description: '當 Redis 連接狀態異常時觸發',
    type: 'status',
    category: 'system',
    enabled: true,
    priority: 'critical',
    condition: {
      metric: 'system.redis.status',
      operator: 'eq',
      value: 'unhealthy'
    },
    actions: [
      {
        type: 'email',
        target: 'admin@newpennine.com',
        template: 'redis-connection-template'
      },
      {
        type: 'webhook',
        target: 'https://monitoring.newpennine.com/critical',
        template: 'critical-webhook-template'
      }
    ],
    cooldown: 300,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

/**
 * 獲取告警統計
 */
async function getAlertStats() {
  // 模擬告警統計數據
  return {
    totalRules: defaultAlertRules.length,
    activeRules: defaultAlertRules.filter(rule => rule.enabled).length,
    recentAlerts: Math.floor(Math.random() * 50), // 最近 24 小時的告警數
    acknowledgedAlerts: Math.floor(Math.random() * 20) // 已確認的告警數
  };
}

/**
 * 驗證告警配置
 */
function validateAlertConfig(config: Partial<AlertConfig>): string[] {
  const errors: string[] = [];

  // 驗證閾值
  if (config.thresholds) {
    if (config.thresholds.system) {
      const { cpu, memory, disk, responseTime } = config.thresholds.system;
      if (cpu && cpu.warning >= cpu.critical) {
        errors.push('CPU warning threshold must be less than critical threshold');
      }
      if (memory && memory.warning >= memory.critical) {
        errors.push('Memory warning threshold must be less than critical threshold');
      }
      if (disk && disk.warning >= disk.critical) {
        errors.push('Disk warning threshold must be less than critical threshold');
      }
      if (responseTime && responseTime.warning >= responseTime.critical) {
        errors.push('Response time warning threshold must be less than critical threshold');
      }
    }
  }

  // 驗證通知配置
  if (config.notifications) {
    if (config.notifications.email && config.notifications.email.enabled) {
      if (!config.notifications.email.recipients || config.notifications.email.recipients.length === 0) {
        errors.push('Email recipients must be specified when email notifications are enabled');
      }
    }
    
    if (config.notifications.webhook && config.notifications.webhook.enabled) {
      if (!config.notifications.webhook.url) {
        errors.push('Webhook URL must be specified when webhook notifications are enabled');
      }
    }
  }

  return errors;
}

/**
 * 獲取告警配置 (GET)
 */
export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    const stats = await getAlertStats();

    const response: AlertConfigResponse = {
      status: 'success',
      timestamp,
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      config: defaultAlertConfig,
      rules: defaultAlertRules,
      stats
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'API-Version': 'v1',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Alert config GET failed:', error);

    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to retrieve alert configuration'
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache',
        'API-Version': 'v1'
      }
    });
  }
}

/**
 * 更新告警配置 (PUT)
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const timestamp = new Date().toISOString();

    // 驗證配置
    const validationErrors = validateAlertConfig(body);
    if (validationErrors.length > 0) {
      return NextResponse.json({
        status: 'error',
        timestamp,
        error: 'Validation failed',
        details: validationErrors
      }, {
        status: 400,
        headers: {
          'API-Version': 'v1'
        }
      });
    }

    // 在實際實現中，這裡應該將配置保存到資料庫
    // 目前返回更新成功的回應
    const updatedConfig = {
      ...defaultAlertConfig,
      ...body,
      updatedAt: timestamp
    };

    return NextResponse.json({
      status: 'success',
      timestamp,
      message: 'Alert configuration updated successfully',
      config: updatedConfig
    }, {
      headers: {
        'API-Version': 'v1'
      }
    });

  } catch (error) {
    console.error('Alert config PUT failed:', error);

    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to update alert configuration'
    }, {
      status: 500,
      headers: {
        'API-Version': 'v1'
      }
    });
  }
}

/**
 * 創建新告警規則 (POST)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const timestamp = new Date().toISOString();

    // 驗證必要欄位
    const requiredFields = ['name', 'type', 'category', 'condition', 'actions'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        status: 'error',
        timestamp,
        error: 'Missing required fields',
        details: missingFields
      }, {
        status: 400,
        headers: {
          'API-Version': 'v1'
        }
      });
    }

    // 創建新規則
    const newRule: AlertRule = {
      id: `rule-${Date.now()}`,
      name: body.name,
      description: body.description || '',
      type: body.type,
      category: body.category,
      enabled: body.enabled !== false,
      priority: body.priority || 'medium',
      condition: body.condition,
      actions: body.actions,
      cooldown: body.cooldown || 3600,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    // 在實際實現中，這裡應該將規則保存到資料庫
    return NextResponse.json({
      status: 'success',
      timestamp,
      message: 'Alert rule created successfully',
      rule: newRule
    }, {
      status: 201,
      headers: {
        'API-Version': 'v1'
      }
    });

  } catch (error) {
    console.error('Alert rule POST failed:', error);

    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create alert rule'
    }, {
      status: 500,
      headers: {
        'API-Version': 'v1'
      }
    });
  }
}

/**
 * 刪除告警規則 (DELETE)
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('id');
    const timestamp = new Date().toISOString();

    if (!ruleId) {
      return NextResponse.json({
        status: 'error',
        timestamp,
        error: 'Rule ID is required'
      }, {
        status: 400,
        headers: {
          'API-Version': 'v1'
        }
      });
    }

    // 在實際實現中，這裡應該從資料庫刪除規則
    return NextResponse.json({
      status: 'success',
      timestamp,
      message: `Alert rule ${ruleId} deleted successfully`
    }, {
      headers: {
        'API-Version': 'v1'
      }
    });

  } catch (error) {
    console.error('Alert rule DELETE failed:', error);

    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to delete alert rule'
    }, {
      status: 500,
      headers: {
        'API-Version': 'v1'
      }
    });
  }
}

/**
 * 支援 HEAD 請求用於快速檢查
 */
export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'API-Version': 'v1',
      'X-API-Version': 'v1',
      'Cache-Control': 'no-cache'
    }
  });
}