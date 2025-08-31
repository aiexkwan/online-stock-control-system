/**
 * Secure Credentials Manager
 * Provides secure access to sensitive credentials with validation and monitoring
 */

import { createHash } from 'crypto';

/**
 * Configuration for a credential entry
 */
interface CredentialConfig {
  /** The credential name used internally */
  name: string;
  /** The environment variable name */
  envVar: string;
  /** Whether this credential is required for the application to function */
  required: boolean;
  /** Whether this credential contains sensitive data */
  sensitive: boolean;
  /** Optional validator function to check credential format */
  validator?: (value: string) => boolean;
}

/**
 * Validation result interface
 */
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Credential status interface
 */
interface CredentialStatus {
  exists: boolean;
  valid: boolean;
  sensitive: boolean;
}

/**
 * Audit log type
 */
type AuditLog = Record<string, Date[]>;

/**
 * Status report type
 */
type StatusReport = Record<string, CredentialStatus>;

class CredentialsManager {
  private credentials: Map<string, string> = new Map();
  private accessLog: Map<string, Date[]> = new Map();
  private readonly configs: readonly CredentialConfig[] = [
    // Supabase Credentials
    {
      name: 'SUPABASE_URL',
      envVar: 'SUPABASE_URL',
      required: true,
      sensitive: false,
      validator: (value: string): boolean => value.startsWith('https://') && value.includes('.supabase.co')
    },
    {
      name: 'SUPABASE_ANON_KEY',
      envVar: 'SUPABASE_ANON_KEY',
      required: true,
      sensitive: true,
      validator: (value: string): boolean => value.startsWith('eyJ') && value.length > 100
    },
    {
      name: 'SUPABASE_SERVICE_KEY',
      envVar: 'SUPABASE_SERVICE_ROLE_KEY',
      required: false,
      sensitive: true,
      validator: (value: string): boolean => value.startsWith('eyJ') && value.length > 100
    },
    // Test Credentials
    {
      name: 'TEST_LOGIN_EMAIL',
      envVar: 'TEST_LOGIN_EMAIL',
      required: false,
      sensitive: false,
      validator: (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    },
    {
      name: 'TEST_LOGIN_PASSWORD',
      envVar: 'TEST_LOGIN_PASSWORD',
      required: false,
      sensitive: true,
      validator: (value: string): boolean => value.length >= 6
    },
    // API Keys
    {
      name: 'OPENAI_API_KEY',
      envVar: 'OPENAI_API_KEY',
      required: false,
      sensitive: true,
      validator: (value: string): boolean => value.startsWith('sk-') && value.length > 40
    },
    {
      name: 'RESEND_API_KEY',
      envVar: 'RESEND_API_KEY',
      required: false,
      sensitive: true,
      validator: (value: string): boolean => value.startsWith('re_') && value.length > 20
    }
  ];

  constructor() {
    this.loadCredentials();
  }

  private loadCredentials(): void {
    const missingRequired: string[] = [];
    const invalidCredentials: string[] = [];

    for (const config of this.configs) {
      const value = process.env[config.envVar];

      if (!value && config.required) {
        missingRequired.push(config.name);
        continue;
      }

      if (value) {
        if (config.validator && !config.validator(value)) {
          invalidCredentials.push(`${config.name} (invalid format)`);
          continue;
        }
        this.credentials.set(config.name, value);
      }
    }

    if (missingRequired.length > 0) {
      console.error('❌ Missing required credentials:', missingRequired.join(', '));
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Missing required credentials: ${missingRequired.join(', ')}`);
      }
    }

    if (invalidCredentials.length > 0) {
      console.warn('⚠️  Invalid credentials format:', invalidCredentials.join(', '));
    }
  }

  /**
   * Get a credential value with access logging
   */
  public get(name: string): string | undefined {
    // Log access for sensitive credentials
    const config = this.configs.find(c => c.name === name);
    if (config?.sensitive) {
      this.logAccess(name);
    }

    return this.credentials.get(name);
  }

  /**
   * Get a credential or throw if not found
   */
  public getRequired(name: string): string {
    const value = this.get(name);
    if (!value) {
      throw new Error(`Required credential '${name}' not found`);
    }
    return value;
  }

  /**
   * Check if a credential exists
   */
  public has(name: string): boolean {
    return this.credentials.has(name);
  }

  /**
   * Get masked version of a credential for logging
   */
  public getMasked(name: string): string {
    const value = this.get(name);
    if (!value) return 'NOT_SET';

    const config = this.configs.find(c => c.name === name);
    if (!config?.sensitive) return value;

    // Show first 4 and last 4 characters only
    if (value.length <= 12) {
      return '*'.repeat(value.length);
    }
    return `${value.slice(0, 4)}...${value.slice(-4)}`;
  }

  /**
   * Log access to sensitive credentials
   */
  private logAccess(name: string): void {
    if (!this.accessLog.has(name)) {
      this.accessLog.set(name, []);
    }
    const accessDates = this.accessLog.get(name);
    if (accessDates) {
      accessDates.push(new Date());
    }

    // In development, log access to console
    if (process.env.NODE_ENV === 'development') {
      console.debug(`🔑 Credential accessed: ${name} at ${new Date().toISOString()}`);
    }
  }

  /**
   * Get access audit log
   */
  public getAuditLog(): AuditLog {
    const log: AuditLog = {};
    this.accessLog.forEach((dates, name) => {
      log[name] = [...dates]; // Create a copy to prevent external mutation
    });
    return log;
  }

  /**
   * Validate all configured credentials
   */
  public validate(): ValidationResult {
    const errors: string[] = [];

    for (const config of this.configs) {
      const value = this.credentials.get(config.name);

      if (config.required && !value) {
        errors.push(`${config.name}: Missing required credential`);
      }

      if (value && config.validator && !config.validator(value)) {
        errors.push(`${config.name}: Invalid format`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get credential status for monitoring
   */
  public getStatus(): StatusReport {
    const status: StatusReport = {};

    for (const config of this.configs) {
      const value = this.credentials.get(config.name);
      status[config.name] = {
        exists: Boolean(value),
        valid: !value || !config.validator || config.validator(value),
        sensitive: config.sensitive
      };
    }

    return status;
  }

  /**
   * Hash a credential for comparison without exposing the value
   */
  public hash(name: string): string | undefined {
    const value = this.get(name);
    if (!value) {
      return undefined;
    }

    try {
      return createHash('sha256').update(value).digest('hex');
    } catch (error) {
      console.error(`Failed to hash credential '${name}':`, error);
      return undefined;
    }
  }

  /**
   * Get all configured credential names
   */
  public getConfiguredNames(): readonly string[] {
    return this.configs.map(config => config.name);
  }

  /**
   * Check if a credential is configured (regardless of whether it has a value)
   */
  public isConfigured(name: string): boolean {
    return this.configs.some(config => config.name === name);
  }

  /**
   * Get credential configuration
   */
  public getConfig(name: string): Readonly<CredentialConfig> | undefined {
    const config = this.configs.find(config => config.name === name);
    return config ? { ...config } : undefined;
  }
}

// Export singleton instance
export const credentialsManager = new CredentialsManager();

// Export types
export type { CredentialConfig, ValidationResult, CredentialStatus, AuditLog, StatusReport };
