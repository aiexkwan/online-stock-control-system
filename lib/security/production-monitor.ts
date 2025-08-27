/**
 * Production Security Monitor
 * Real-time security monitoring and threat detection system
 */

import { EventEmitter } from 'events';
// Use Web Crypto API for Edge Runtime compatibility

// Security event types
export enum SecurityEventType {
  // Authentication events
  LOGIN_ATTEMPT = 'LOGIN_ATTEMPT',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',

  // Authorization events
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',

  // Data access events
  SENSITIVE_DATA_ACCESS = 'SENSITIVE_DATA_ACCESS',
  BULK_DATA_EXPORT = 'BULK_DATA_EXPORT',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  DATA_DELETION = 'DATA_DELETION',

  // Security threats
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  CSRF_ATTEMPT = 'CSRF_ATTEMPT',
  PATH_TRAVERSAL_ATTEMPT = 'PATH_TRAVERSAL_ATTEMPT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  BRUTE_FORCE_DETECTED = 'BRUTE_FORCE_DETECTED',

  // System events
  CONFIGURATION_CHANGE = 'CONFIGURATION_CHANGE',
  SERVICE_STARTED = 'SERVICE_STARTED',
  SERVICE_STOPPED = 'SERVICE_STOPPED',
  ERROR_SPIKE = 'ERROR_SPIKE',
  PERFORMANCE_DEGRADATION = 'PERFORMANCE_DEGRADATION',

  // File system events
  FILE_UPLOAD = 'FILE_UPLOAD',
  MALICIOUS_FILE_DETECTED = 'MALICIOUS_FILE_DETECTED',
  FILE_INTEGRITY_VIOLATION = 'FILE_INTEGRITY_VIOLATION',
}

// Security event severity levels
export enum SecuritySeverity {
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Security event interface
export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  payload?: any;
  metadata?: Record<string, any>;
  stackTrace?: string;
}

// Alert configuration
export interface AlertConfig {
  enabled: boolean;
  channels: AlertChannel[];
  thresholds: AlertThresholds;
  recipients: string[];
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: Record<string, any>;
}

export interface AlertThresholds {
  criticalEventsPerMinute: number;
  highEventsPerMinute: number;
  failedLoginsPerUser: number;
  rateLimitViolations: number;
  errorRate: number;
}

// Security patterns for detection
const SECURITY_PATTERNS = {
  SQL_INJECTION: [
    // More specific SQL injection patterns that avoid false positives
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION)\b.*\b(FROM|WHERE|TABLE)\b)/gi,
    /(\b(OR|AND)\b\s*\d+\s*=\s*\d+)/gi,
    /(\'\s*(OR|AND)\s*\')/gi,
    /(\-\-|\#|\/\*.*\*\/)/g,
    // Allow legitimate use of FROM in URL parameters like ?from=/admin
    /(\bunion\b.*\bselect\b)/gi,
  ],
  XSS: [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /document\.(cookie|write|location)/gi,
    /window\.(location|open)/gi,
  ],
  PATH_TRAVERSAL: [/\.\.(\/|\\)/g, /%2e%2e(\/|\\)/gi, /\.\.(\/|\\)+(etc|var|usr|home|root)/gi],
  COMMAND_INJECTION: [
    /;|\||&&|>|<|`|\$\(/g,
    /\b(cat|ls|rm|mv|cp|chmod|chown|wget|curl|nc|bash|sh)\b/gi,
  ],
};

// Security Monitor Class
export class ProductionSecurityMonitor extends EventEmitter {
  private static instance: ProductionSecurityMonitor;
  private events: SecurityEvent[] = [];
  private alertConfig: AlertConfig;
  private rateLimitMap: Map<string, number[]> = new Map();
  private anomalyBaseline: Map<string, any> = new Map();
  private isMonitoring: boolean = false;

  private constructor() {
    super();

    this.alertConfig = {
      enabled: true,
      channels: [],
      thresholds: {
        criticalEventsPerMinute: 5,
        highEventsPerMinute: 20,
        failedLoginsPerUser: 5,
        rateLimitViolations: 10,
        errorRate: 0.05,
      },
      recipients: [],
    };

    this.setupEventHandlers();
    this.startMonitoring();
  }

  public static getInstance(): ProductionSecurityMonitor {
    if (!ProductionSecurityMonitor.instance) {
      ProductionSecurityMonitor.instance = new ProductionSecurityMonitor();
    }
    return ProductionSecurityMonitor.instance;
  }

  /**
   * Log a security event
   */
  public logEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
    };

    this.events.push(fullEvent);
    this.emit('security-event', fullEvent);

    // Check for alert conditions
    this.checkAlertConditions(fullEvent);

    // Perform threat analysis
    this.analyzeThreat(fullEvent);

    // Update anomaly detection baseline
    this.updateAnomalyBaseline(fullEvent);

    // Cleanup old events (keep last 24 hours)
    this.cleanupOldEvents();
  }

  /**
   * Detect security threats in request
   */
  public detectThreats(request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
    query?: any;
  }): SecurityEventType[] {
    const threats: SecurityEventType[] = [];

    // Combine all input for analysis
    const input = JSON.stringify({
      url: request.url,
      body: request.body,
      query: request.query,
      headers: request.headers,
    });

    // Check for SQL injection
    if (this.detectPattern(input, SECURITY_PATTERNS.SQL_INJECTION)) {
      threats.push(SecurityEventType.SQL_INJECTION_ATTEMPT);
    }

    // Check for XSS
    if (this.detectPattern(input, SECURITY_PATTERNS.XSS)) {
      threats.push(SecurityEventType.XSS_ATTEMPT);
    }

    // Check for path traversal
    if (this.detectPattern(input, SECURITY_PATTERNS.PATH_TRAVERSAL)) {
      threats.push(SecurityEventType.PATH_TRAVERSAL_ATTEMPT);
    }

    // Check for command injection
    if (this.detectPattern(input, SECURITY_PATTERNS.COMMAND_INJECTION)) {
      threats.push(SecurityEventType.SQL_INJECTION_ATTEMPT); // Log as SQL injection for now
    }

    return threats;
  }

  /**
   * Check rate limiting
   */
  public checkRateLimit(identifier: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = this.rateLimitMap.get(identifier) || [];

    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter(t => now - t < windowMs);

    if (validTimestamps.length >= limit) {
      this.logEvent({
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        severity: SecuritySeverity.MEDIUM,
        metadata: { identifier, limit, window: windowMs },
      });
      return false;
    }

    validTimestamps.push(now);
    this.rateLimitMap.set(identifier, validTimestamps);

    return true;
  }

  /**
   * Detect anomalous behavior
   */
  public detectAnomaly(metric: string, value: number): boolean {
    const baseline = this.anomalyBaseline.get(metric);

    if (!baseline) {
      this.anomalyBaseline.set(metric, {
        values: [value],
        mean: value,
        stdDev: 0,
      });
      return false;
    }

    // Calculate z-score
    const zScore = Math.abs((value - baseline.mean) / (baseline.stdDev || 1));

    // Anomaly if z-score > 3 (99.7% confidence)
    const isAnomaly = zScore > 3;

    // Update baseline with exponential moving average
    baseline.values.push(value);
    if (baseline.values.length > 100) {
      baseline.values.shift();
    }

    baseline.mean =
      baseline.values.reduce((a: number, b: number) => a + b, 0) / baseline.values.length;
    baseline.stdDev = Math.sqrt(
      baseline.values.reduce((sum: number, v: number) => sum + Math.pow(v - baseline.mean, 2), 0) /
        baseline.values.length
    );

    return isAnomaly;
  }

  /**
   * Get security metrics
   */
  public getMetrics(): {
    totalEvents: number;
    eventsBySeverity: Record<SecuritySeverity, number>;
    eventsByType: Record<SecurityEventType, number>;
    recentCriticalEvents: SecurityEvent[];
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);

    const recentEvents = this.events.filter(e => e.timestamp > oneHourAgo);

    const eventsBySeverity = recentEvents.reduce(
      (acc, event) => {
        acc[event.severity] = (acc[event.severity] || 0) + 1;
        return acc;
      },
      {} as Record<SecuritySeverity, number>
    );

    const eventsByType = recentEvents.reduce(
      (acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      },
      {} as Record<SecurityEventType, number>
    );

    const recentCriticalEvents = recentEvents
      .filter(e => e.severity === SecuritySeverity.CRITICAL)
      .slice(-10);

    // Calculate threat level
    const criticalCount = eventsBySeverity[SecuritySeverity.CRITICAL] || 0;
    const highCount = eventsBySeverity[SecuritySeverity.HIGH] || 0;

    let threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (criticalCount > 5) {
      threatLevel = 'CRITICAL';
    } else if (criticalCount > 0 || highCount > 10) {
      threatLevel = 'HIGH';
    } else if (highCount > 5) {
      threatLevel = 'MEDIUM';
    } else {
      threatLevel = 'LOW';
    }

    return {
      totalEvents: recentEvents.length,
      eventsBySeverity,
      eventsByType,
      recentCriticalEvents,
      threatLevel,
    };
  }

  /**
   * Export security report
   */
  public exportReport(
    startDate: Date,
    endDate: Date
  ): {
    period: { start: Date; end: Date };
    summary: any;
    events: SecurityEvent[];
    recommendations: string[];
  } {
    const periodEvents = this.events.filter(
      e => e.timestamp >= startDate && e.timestamp <= endDate
    );

    const summary = {
      totalEvents: periodEvents.length,
      uniqueUsers: new Set(periodEvents.map(e => e.userId).filter(Boolean)).size,
      uniqueIPs: new Set(periodEvents.map(e => e.ipAddress).filter(Boolean)).size,
      topThreats: this.getTopThreats(periodEvents),
      peakHours: this.getPeakHours(periodEvents),
    };

    const recommendations = this.generateRecommendations(periodEvents);

    return {
      period: { start: startDate, end: endDate },
      summary,
      events: periodEvents,
      recommendations,
    };
  }

  // Private methods

  private setupEventHandlers(): void {
    this.on('security-event', (event: SecurityEvent) => {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Security]', event);
      }

      // Send to external logging service
      this.sendToLoggingService(event);
    });
  }

  private startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Periodic health check
    setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Every minute

    // Periodic anomaly detection
    setInterval(() => {
      this.performAnomalyDetection();
    }, 300000); // Every 5 minutes
  }

  private generateEventId(): string {
    // Use Web Crypto API for Edge Runtime compatibility
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Fallback for environments without Web Crypto API
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }

  private detectPattern(input: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(input));
  }

  private checkAlertConditions(event: SecurityEvent): void {
    if (!this.alertConfig.enabled) return;

    // Check critical events threshold
    const recentCritical = this.events.filter(
      e => e.severity === SecuritySeverity.CRITICAL && e.timestamp > new Date(Date.now() - 60000)
    );

    if (recentCritical.length >= this.alertConfig.thresholds.criticalEventsPerMinute) {
      this.sendAlert({
        title: 'Critical Security Events Threshold Exceeded',
        message: `${recentCritical.length} critical events in the last minute`,
        severity: SecuritySeverity.CRITICAL,
        events: recentCritical,
      });
    }

    // Check failed login attempts
    if (event.type === SecurityEventType.LOGIN_FAILURE && event.userId) {
      const failedLogins = this.events.filter(
        e =>
          e.type === SecurityEventType.LOGIN_FAILURE &&
          e.userId === event.userId &&
          e.timestamp > new Date(Date.now() - 300000) // Last 5 minutes
      );

      if (failedLogins.length >= this.alertConfig.thresholds.failedLoginsPerUser) {
        this.sendAlert({
          title: 'Multiple Failed Login Attempts',
          message: `User ${event.userId} has ${failedLogins.length} failed login attempts`,
          severity: SecuritySeverity.HIGH,
          events: failedLogins,
        });
      }
    }
  }

  private analyzeThreat(event: SecurityEvent): void {
    // Implement threat correlation and analysis
    // This would typically integrate with threat intelligence feeds
  }

  private updateAnomalyBaseline(event: SecurityEvent): void {
    // Update baseline metrics for anomaly detection
  }

  private cleanupOldEvents(): void {
    const cutoffTime = new Date(Date.now() - 86400000); // 24 hours ago
    this.events = this.events.filter(e => e.timestamp > cutoffTime);
  }

  private sendAlert(alert: any): void {
    // Send alerts through configured channels
    this.alertConfig.channels.forEach(channel => {
      this.sendToChannel(channel, alert);
    });
  }

  private sendToChannel(channel: AlertChannel, alert: any): void {
    // Implementation would send to actual channels
    console.log(`[Alert - ${channel.type}]`, alert);
  }

  private sendToLoggingService(event: SecurityEvent): void {
    // Send to external logging service (e.g., Datadog, Splunk, ELK)
    if (process.env.LOGGING_SERVICE_ENDPOINT) {
      // Implementation would send to actual service
    }
  }

  private performHealthCheck(): void {
    // Perform system health check
    const metrics = this.getMetrics();

    if (metrics.threatLevel === 'CRITICAL') {
      this.sendAlert({
        title: 'Critical Threat Level Detected',
        message: 'System is under active attack or experiencing critical security issues',
        severity: SecuritySeverity.CRITICAL,
        metrics,
      });
    }
  }

  private performAnomalyDetection(): void {
    // Perform anomaly detection on various metrics
  }

  private getTopThreats(
    events: SecurityEvent[]
  ): Array<{ type: SecurityEventType; count: number }> {
    const threatCounts = events.reduce(
      (acc, event) => {
        if (
          event.severity === SecuritySeverity.HIGH ||
          event.severity === SecuritySeverity.CRITICAL
        ) {
          acc[event.type] = (acc[event.type] || 0) + 1;
        }
        return acc;
      },
      {} as Record<SecurityEventType, number>
    );

    return Object.entries(threatCounts)
      .map(([type, count]) => ({ type: type as SecurityEventType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private getPeakHours(events: SecurityEvent[]): number[] {
    const hourCounts = new Array(24).fill(0);

    events.forEach(event => {
      const hour = event.timestamp.getHours();
      hourCounts[hour]++;
    });

    return hourCounts;
  }

  private generateRecommendations(events: SecurityEvent[]): string[] {
    const recommendations: string[] = [];

    const threatTypes = new Set(events.map(e => e.type));

    if (threatTypes.has(SecurityEventType.SQL_INJECTION_ATTEMPT)) {
      recommendations.push('Review and strengthen input validation for SQL queries');
      recommendations.push('Implement parameterized queries across all database operations');
    }

    if (threatTypes.has(SecurityEventType.BRUTE_FORCE_DETECTED)) {
      recommendations.push('Implement account lockout policies');
      recommendations.push('Consider implementing CAPTCHA for login forms');
    }

    if (threatTypes.has(SecurityEventType.XSS_ATTEMPT)) {
      recommendations.push('Review and enhance output encoding practices');
      recommendations.push('Implement Content Security Policy (CSP) headers');
    }

    return recommendations;
  }
}

// Export singleton instance
export const securityMonitor = ProductionSecurityMonitor.getInstance();
