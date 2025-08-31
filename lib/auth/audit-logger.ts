/**
 * Security Audit Logger
 * Tracks all authentication and authorization events
 */

import { createClient } from '../../app/utils/supabase/server';
import type { Database } from '../database.types';

export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',

  // Authorization events
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',

  // Security events
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  CSRF_ATTACK_BLOCKED = 'CSRF_ATTACK_BLOCKED',
  SESSION_HIJACK_ATTEMPT = 'SESSION_HIJACK_ATTEMPT',

  // Account events
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
}

export interface AuditLogEntry {
  id?: string;
  event_type: AuditEventType;
  user_id?: string;
  email?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: Date;
  success: boolean;
  metadata?: Record<string, unknown>;
  risk_score?: number;
}

// Database representation of audit log
export interface AuditLogRecord {
  id?: string;
  event_type: string;
  user_id?: string | null;
  email?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  success: boolean;
  metadata?: Record<string, unknown> | null;
  risk_score?: number | null;
}

// Query filters interface
export interface AuditQueryFilters {
  user_id?: string;
  event_type?: AuditEventType;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
}

/**
 * Audit Logger Class
 */
export class AuditLogger {
  private static instance: AuditLogger;
  private buffer: AuditLogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Start flush interval (batch write to database)
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 5000); // Flush every 5 seconds
  }

  static getInstance(): AuditLogger {
    if (!this.instance) {
      this.instance = new AuditLogger();
    }
    return this.instance;
  }

  /**
   * Log an audit event
   */
  async log(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    const logEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date(),
      risk_score: this.calculateRiskScore(entry),
    };

    // Add to buffer for batch processing
    this.buffer.push(logEntry);

    // Immediate flush for high-risk events
    if (logEntry.risk_score && logEntry.risk_score >= 80) {
      await this.flush();
    }

    // Alert on critical security events
    if (this.isCriticalEvent(entry.event_type)) {
      await this.alertSecurityTeam(logEntry);
    }
  }

  /**
   * Calculate risk score for event
   */
  private calculateRiskScore(entry: Omit<AuditLogEntry, 'timestamp' | 'risk_score'>): number {
    let score = 0;

    // Failed authentication attempts
    if (entry.event_type === AuditEventType.LOGIN_FAILURE) {
      score += 20;
    }

    // Rate limiting
    if (entry.event_type === AuditEventType.RATE_LIMIT_EXCEEDED) {
      score += 40;
    }

    // Attack attempts
    const attackEventTypes = [
      AuditEventType.CSRF_ATTACK_BLOCKED,
      AuditEventType.SESSION_HIJACK_ATTEMPT,
      AuditEventType.SUSPICIOUS_ACTIVITY,
    ] as const;

    if (attackEventTypes.includes(entry.event_type as any)) {
      score += 80;
    }

    // Unknown IP (would need IP reputation service)
    if (entry.ip_address && this.isUnknownIP(entry.ip_address)) {
      score += 10;
    }

    // Unusual time (e.g., 2-5 AM)
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 5) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Check if IP is unknown/suspicious
   */
  private isUnknownIP(ip: string): boolean {
    // Implement IP reputation checking
    // For now, just check if it's not a private IP
    const privateIPs = ['127.0.0.1', '::1', '192.168.', '10.', '172.'];
    return !privateIPs.some(prefix => ip.startsWith(prefix));
  }

  /**
   * Check if event is critical
   */
  private isCriticalEvent(eventType: AuditEventType): boolean {
    return [
      AuditEventType.CSRF_ATTACK_BLOCKED,
      AuditEventType.SESSION_HIJACK_ATTEMPT,
      AuditEventType.SUSPICIOUS_ACTIVITY,
      AuditEventType.ACCOUNT_LOCKED,
    ].includes(eventType);
  }

  /**
   * Alert security team
   */
  private async alertSecurityTeam(entry: AuditLogEntry): Promise<void> {
    // In production, send email/SMS/Slack alert
    console.error('[SECURITY ALERT]', {
      event: entry.event_type,
      user: entry.email || entry.user_id,
      ip: entry.ip_address,
      risk: entry.risk_score,
      timestamp: entry.timestamp,
    });

    // Could integrate with incident response system
  }

  /**
   * Flush buffer to database
   */
  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      // Write to Supabase audit_logs table
      // You'll need to create this table in your database
      const supabase = await createClient();

      const auditRecords: Partial<AuditLogRecord>[] = entries.map(entry => ({
        event_type: entry.event_type,
        user_id: entry.user_id || null,
        email: entry.email || null,
        ip_address: entry.ip_address || null,
        user_agent: entry.user_agent || null,
        success: entry.success,
        metadata: entry.metadata || null,
        risk_score: entry.risk_score || null,
        created_at: entry.timestamp.toISOString(),
      }));

      // Use generic table insert since audit_logs might not be defined in types
      const { error } = await (supabase as any).from('audit_logs').insert(auditRecords);

      if (error) {
        console.error('Failed to write audit logs:', error);
        // Re-add to buffer for retry
        this.buffer.unshift(...entries);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Audit log flush error:', errorMessage);
      // Re-add to buffer for retry
      this.buffer.unshift(...entries);
    }
  }

  /**
   * Query audit logs
   */
  async query(filters: AuditQueryFilters = {}): Promise<AuditLogEntry[]> {
    try {
      const supabase = await createClient();

      // Use generic query since audit_logs might not be defined in types
      let query = (supabase as any).from('audit_logs').select('*');

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.event_type) {
        query = query.eq('event_type', filters.event_type);
      }

      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date.toISOString());
      }

      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date.toISOString());
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Transform database records to AuditLogEntry format
      const entries: AuditLogEntry[] = (data || []).map((record: AuditLogRecord) => ({
        id: record.id,
        event_type: record.event_type as AuditEventType,
        user_id: record.user_id || undefined,
        email: record.email || undefined,
        ip_address: record.ip_address || undefined,
        user_agent: record.user_agent || undefined,
        timestamp: new Date(record.created_at),
        success: record.success,
        metadata: record.metadata || undefined,
        risk_score: record.risk_score || undefined,
      }));

      return entries;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Audit log query error:', errorMessage);
      return [];
    }
  }

  /**
   * Get suspicious activity for user
   */
  async getSuspiciousActivity(userId: string): Promise<AuditLogEntry[]> {
    const logs = await this.query({
      user_id: userId,
      limit: 50,
    });

    return logs.filter(log => (log.risk_score ?? 0) >= 60);
  }

  /**
   * Cleanup old logs (GDPR compliance)
   */
  async cleanup(daysToKeep: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const supabase = await createClient();

      // Use generic delete since audit_logs might not be defined in types
      const { error } = await (supabase as any)
        .from('audit_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Audit log cleanup error:', errorMessage);
    }
  }

  /**
   * Destroy instance (cleanup)
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    // Final flush without awaiting to avoid blocking
    void this.flush();
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();
