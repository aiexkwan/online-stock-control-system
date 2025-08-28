/**
 * 安全監控類型定義
 * Security & Monitoring Type Definitions
 *
 * 提供安全和監控相關的所有類型定義，包括日誌、監控、資源追蹤和安全中間件
 * Provides all security and monitoring-related type definitions including logging, monitoring, resource tracking and security middleware
 */

import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// 日誌系統類型 / Logging System Types
// =============================================================================

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface LogContext {
  env: string;
  app: string;
  hostname: string;
  module: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  traceId?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  time: string;
  msg: string;
  context: LogContext;
  error?: LogError;
  performance?: PerformanceLogData;
  security?: SecurityLogData;
}

export interface LogError {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

export interface PerformanceLogData {
  duration: number;
  memoryUsage?: number;
  cpuUsage?: number;
  queryCount?: number;
  cacheHits?: number;
}

export interface SecurityLogData {
  eventType: 'authentication' | 'authorization' | 'data_access' | 'security_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userAgent?: string;
  ipAddress?: string;
  suspicious?: boolean;
}

// =============================================================================
// 日誌消毒器類型 / Log Sanitizer Types
// =============================================================================

export interface SanitizationRule {
  field: string | RegExp;
  replacement: string;
  exact?: boolean;
  caseSensitive?: boolean;
}

export interface SanitizationConfig {
  sensitiveFields: string[];
  customRules: SanitizationRule[];
  redactionText: string;
  enableDeepScan: boolean;
  maxDepth: number;
}

export interface SanitizedLogEntry {
  original: Record<string, unknown>;
  sanitized: Record<string, unknown>;
  redactedFields: string[];
  processingTime: number;
}

export type LogSanitizer = (
  data: Record<string, unknown>,
  config?: Partial<SanitizationConfig>
) => SanitizedLogEntry;

// =============================================================================
// 生產環境監控類型 / Production Monitoring Types
// =============================================================================

export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    available: number;
    percentage: number;
  };
  disk: {
    used: number;
    available: number;
    percentage: number;
  };
  network?: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
}

export interface ApplicationMetrics {
  timestamp: Date;
  activeUsers: number;
  totalRequests: number;
  errorRate: number;
  avgResponseTime: number;
  databaseConnections: number;
  cacheHitRate: number;
  backgroundJobs: {
    pending: number;
    processing: number;
    failed: number;
  };
}

export interface HealthCheckStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  responseTime?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface MonitoringAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  source: string;
  metrics?: Record<string, number>;
  resolved?: boolean;
  resolvedAt?: Date;
}

// =============================================================================
// 資源洩漏偵測類型 / Resource Leak Detection Types
// =============================================================================

export interface ResourceUsage {
  type: 'memory' | 'file_descriptor' | 'database_connection' | 'timer' | 'event_listener';
  identifier: string;
  createdAt: Date;
  size?: number;
  metadata?: Record<string, unknown>;
}

export interface ResourceLeakAlert {
  resourceType: string;
  currentCount: number;
  threshold: number;
  growth: {
    rate: number;
    period: string;
  };
  suspects: ResourceUsage[];
  timestamp: Date;
}

export interface ResourceMonitoringConfig {
  thresholds: {
    memory: number;
    fileDescriptors: number;
    databaseConnections: number;
    timers: number;
  };
  checkInterval: number;
  enableAutoCleanup: boolean;
  alertOnThreshold: boolean;
}

export type ResourceLeakDetector = {
  track(resource: ResourceUsage): void;
  untrack(identifier: string): void;
  getUsage(type?: ResourceUsage['type']): ResourceUsage[];
  checkLeaks(): ResourceLeakAlert[];
  cleanup(): void;
};

// =============================================================================
// 安全中間件類型 / Security Middleware Types
// =============================================================================

export interface SecurityContext {
  requestId: string;
  ipAddress: string;
  userAgent: string;
  authUser?: {
    id: string;
    role: string;
    permissions: string[];
  };
  rateLimit?: {
    remaining: number;
    resetTime: Date;
  };
}

export interface SecurityViolation {
  type:
    | 'rate_limit'
    | 'authentication'
    | 'authorization'
    | 'suspicious_activity'
    | 'malformed_request';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, unknown>;
  timestamp: Date;
  blocked: boolean;
}

export interface SecurityConfig {
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessful?: boolean;
  };
  authentication: {
    required: boolean;
    skipPaths?: string[];
  };
  cors: {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowCredentials: boolean;
  };
  headers: {
    hsts?: boolean;
    contentSecurityPolicy?: string;
    xFrameOptions?: string;
  };
}

export type SecurityMiddleware = (
  request: NextRequest,
  context: SecurityContext
) => Promise<{
  allowed: boolean;
  violation?: SecurityViolation;
  response?: NextResponse;
}>;

// =============================================================================
// 監控事件類型 / Monitoring Event Types
// =============================================================================

export type MonitoringEventType =
  | 'performance_degradation'
  | 'error_spike'
  | 'resource_exhaustion'
  | 'security_incident'
  | 'health_check_failed'
  | 'service_recovery';

export interface MonitoringEvent {
  id: string;
  type: MonitoringEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  source: string;
  data: Record<string, unknown>;
  resolved: boolean;
}

export type MonitoringEventHandler = (event: MonitoringEvent) => void | Promise<void>;

// =============================================================================
// 監控配置類型 / Monitoring Configuration Types
// =============================================================================

export interface MonitoringConfig {
  logging: {
    level: LogLevel;
    enableConsole: boolean;
    enableFile: boolean;
    enableRemote: boolean;
    sanitization: SanitizationConfig;
  };
  performance: {
    enableMetrics: boolean;
    metricsInterval: number;
    slowRequestThreshold: number;
    errorRateThreshold: number;
  };
  security: SecurityConfig;
  resources: ResourceMonitoringConfig;
  alerting: {
    enabled: boolean;
    channels: ('email' | 'slack' | 'webhook')[];
    thresholds: Record<string, number>;
  };
}

// =============================================================================
// 監控服務介面 / Monitoring Service Interface
// =============================================================================

export interface MonitoringServiceOperations {
  // 日誌操作
  log(entry: Partial<LogEntry>): void;
  sanitizeLog(data: Record<string, unknown>): SanitizedLogEntry;

  // 監控操作
  recordMetrics(system: SystemMetrics, application: ApplicationMetrics): void;
  checkHealth(services?: string[]): Promise<HealthCheckStatus[]>;
  createAlert(alert: Omit<MonitoringAlert, 'id' | 'timestamp'>): MonitoringAlert;

  // 資源監控
  trackResource(resource: ResourceUsage): void;
  checkResourceLeaks(): ResourceLeakAlert[];
  cleanup(): void;

  // 事件處理
  onEvent(type: MonitoringEventType, handler: MonitoringEventHandler): void;
  emit(event: Omit<MonitoringEvent, 'id' | 'timestamp'>): void;

  // 配置管理
  updateConfig(config: Partial<MonitoringConfig>): void;
  getConfig(): MonitoringConfig;
}

// =============================================================================
// 匯出便利類型 / Export Convenience Types
// =============================================================================

export type AnyLogData = Record<string, unknown> | string | number | boolean;
export type AnySecurityContext = Record<string, unknown>;
export type AnyMonitoringMetrics = SystemMetrics | ApplicationMetrics;
