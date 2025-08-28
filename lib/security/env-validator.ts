/**
 * 環境變數驗證器
 * 確保所有必需的環境變數都已正確設置
 */

interface RequiredEnvVars {
  [key: string]: {
    required: boolean;
    sensitive: boolean;
    validator?: (value: string) => boolean;
    mask?: boolean;
  };
}

const ENV_CONFIG: RequiredEnvVars = {
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: {
    required: true,
    sensitive: false,
    validator: value => value.startsWith('https://') && value.includes('.supabase.co'),
  },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {
    required: true,
    sensitive: true,
    mask: true,
    validator: value => value.startsWith('eyJ'),
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    required: true,
    sensitive: true,
    mask: true,
    validator: value => value.startsWith('eyJ'),
  },
  SUPABASE_ACCESS_TOKEN: {
    required: false,
    sensitive: true,
    mask: true,
    validator: value => value.startsWith('sbp_'),
  },
  // OpenAI Configuration
  OPENAI_API_KEY: {
    required: false,
    sensitive: true,
    mask: true,
    validator: value => value.startsWith('sk-'),
  },
  // Email Service
  RESEND_API_KEY: {
    required: false,
    sensitive: true,
    mask: true,
    validator: value => value.startsWith('re_'),
  },
  // Authentication
  NEXTAUTH_SECRET: {
    required: true,
    sensitive: true,
    mask: true,
    validator: value => value.length >= 32,
  },
};

export class EnvValidator {
  private static errors: string[] = [];
  private static warnings: string[] = [];

  /**
   * 驗證所有環境變數
   */
  static validate(): { valid: boolean; errors: string[]; warnings: string[] } {
    this.errors = [];
    this.warnings = [];

    for (const [key, config] of Object.entries(ENV_CONFIG)) {
      const value = process.env[key];

      if (config.required && !value) {
        this.errors.push(`Missing required environment variable: ${key}`);
        continue;
      }

      if (value && config.validator && !config.validator(value)) {
        this.errors.push(`Invalid format for environment variable: ${key}`);
      }

      // 檢查敏感變數是否包含預設或示例值
      if (value && config.sensitive) {
        if (value.includes('xxxxx') || value.includes('example') || value.includes('test-')) {
          this.warnings.push(`Environment variable ${key} appears to contain a placeholder value`);
        }
      }
    }

    // 檢查生產環境特定規則
    if (process.env.NODE_ENV === 'production') {
      this.validateProductionRules();
    }

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  /**
   * 生產環境特定驗證規則
   */
  private static validateProductionRules(): void {
    // 確保 NEXTAUTH_SECRET 不是預設值
    if (process.env.NEXTAUTH_SECRET === 'your-secret-key-here') {
      this.errors.push('NEXTAUTH_SECRET must be changed from default value in production');
    }

    // 確保不使用 localhost URLs
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost')) {
      this.errors.push('NEXT_PUBLIC_SUPABASE_URL cannot use localhost in production');
    }

    // 警告使用 SYS_LOGIN 和 SYS_PASSWORD（應該遷移到更安全的認證方式）
    if (process.env.SYS_LOGIN || process.env.SYS_PASSWORD) {
      this.warnings.push(
        'SYS_LOGIN and SYS_PASSWORD are deprecated. Consider migrating to OAuth or JWT-based authentication'
      );
    }
  }

  /**
   * 獲取環境變數的安全值（用於日誌記錄）
   */
  static getSafeValue(key: string): string {
    const config = ENV_CONFIG[key];
    const value = process.env[key];

    if (!value) return '<not set>';
    if (!config?.mask) return value;

    // 對敏感值進行遮罩處理
    if (value.length <= 8) {
      return '***';
    }
    return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
  }

  /**
   * 生成環境配置報告
   */
  static generateReport(): string {
    const report: string[] = [
      '=== Environment Configuration Report ===',
      `Environment: ${process.env.NODE_ENV || 'development'}`,
      '',
      '--- Required Variables ---',
    ];

    for (const [key, config] of Object.entries(ENV_CONFIG)) {
      if (config.required) {
        const value = this.getSafeValue(key);
        const status = process.env[key] ? '✅' : '❌';
        report.push(`${status} ${key}: ${value}`);
      }
    }

    report.push('', '--- Optional Variables ---');
    for (const [key, config] of Object.entries(ENV_CONFIG)) {
      if (!config.required) {
        const value = this.getSafeValue(key);
        const status = process.env[key] ? '✅' : '⚪';
        report.push(`${status} ${key}: ${value}`);
      }
    }

    const validation = this.validate();
    if (validation.errors.length > 0) {
      report.push('', '--- Errors ---');
      validation.errors.forEach(error => report.push(`❌ ${error}`));
    }

    if (validation.warnings.length > 0) {
      report.push('', '--- Warnings ---');
      validation.warnings.forEach(warning => report.push(`⚠️ ${warning}`));
    }

    return report.join('\n');
  }
}

// 在應用啟動時自動驗證
if (typeof window === 'undefined') {
  const validation = EnvValidator.validate();
  if (!validation.valid && process.env.NODE_ENV === 'production') {
    console.error('Environment validation failed:', validation.errors);
    // 在生產環境中，環境變數驗證失敗應該阻止應用啟動
    if (process.env.FAIL_ON_ENV_ERROR === 'true') {
      process.exit(1);
    }
  }
}
