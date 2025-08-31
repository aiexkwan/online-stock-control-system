/**
 * 環境變數驗證系統
 * 使用 Zod 確保環境變數的類型安全和有效性
 *
 * 特性：
 * - 運行時環境變數驗證
 * - 類型安全的環境變數訪問
 * - 預設值支持
 * - 敏感資訊過濾
 * - 開發/生產環境分離
 */

import { z } from 'zod';

// ===== 基礎驗證規則 =====

const requiredString = z.string().min(1);
const optionalString = z.string().optional();
const booleanString = z.enum(['true', 'false']).transform(val => val === 'true');
const numberString = z.string().regex(/^\d+$/).transform(Number);
const urlString = z.string().url();

// ===== 環境變數 Schema 定義 =====

export const envSchema = z.object({
  // Node.js 環境
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Next.js 配置
  NEXT_PUBLIC_APP_URL: urlString.default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Pennine WMS'),
  NEXT_PUBLIC_APP_VERSION: z.string().default('1.0.0'),

  // Supabase 配置
  NEXT_PUBLIC_SUPABASE_URL: urlString,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredString,
  SUPABASE_SERVICE_ROLE_KEY: requiredString,
  SUPABASE_JWT_SECRET: requiredString,

  // 資料庫配置
  DATABASE_URL: urlString.optional(),
  DIRECT_URL: urlString.optional(),

  // OpenAI 配置
  OPENAI_API_KEY: requiredString,
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  OPENAI_MAX_TOKENS: numberString.default('2000'),

  // Anthropic 配置
  ANTHROPIC_API_KEY: optionalString,
  ANTHROPIC_MODEL: z.string().default('claude-3-sonnet-20240229'),

  // 郵件服務配置
  RESEND_API_KEY: optionalString,
  SMTP_HOST: optionalString,
  SMTP_PORT: numberString.optional(),
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,

  // 安全配置
  NEXTAUTH_SECRET: optionalString,
  NEXTAUTH_URL: urlString.optional(),
  JWT_SECRET: requiredString,
  ENCRYPTION_KEY: requiredString,

  // PDF 處理配置
  PDF_STORAGE_BUCKET: z.string().default('pdf-documents'),
  PDF_MAX_SIZE_MB: numberString.default('10'),

  // 快取配置
  REDIS_URL: urlString.optional(),
  CACHE_TTL_SECONDS: numberString.default('3600'),

  // 日誌配置
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE_PATH: optionalString,

  // 功能標誌
  ENABLE_DEBUG_LOGGING: booleanString.default('false'),
  ENABLE_METRICS_COLLECTION: booleanString.default('true'),
  ENABLE_AI_FEATURES: booleanString.default('true'),
  ENABLE_EXPERIMENTAL_FEATURES: booleanString.default('false'),

  // 開發環境特定
  ENABLE_DEV_TOOLS: booleanString.default('false'),
  MOCK_API_RESPONSES: booleanString.default('false'),

  // 生產環境特定
  VERCEL_URL: optionalString,
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),

  // 監控和分析
  ANALYTICS_ID: optionalString,
  SENTRY_DSN: optionalString,

  // 第三方服務
  WEBHOOK_SECRET: optionalString,
  API_RATE_LIMIT: numberString.default('100'),

  // 檔案上傳
  MAX_FILE_SIZE_MB: numberString.default('50'),
  ALLOWED_FILE_TYPES: z.string().default('pdf,xlsx,csv,jpg,png'),
});

// ===== 環境驗證和類型推斷 =====

export type EnvConfig = z.infer<typeof envSchema>;

let cachedEnv: EnvConfig | null = null;

/**
 * 驗證並獲取環境變數配置
 */
export function getValidatedEnv(): EnvConfig {
  if (cachedEnv) {
    return cachedEnv;
  }

  try {
    cachedEnv = envSchema.parse(process.env);
    return cachedEnv;
  } catch (error) {
    console.error('環境變數驗證失敗:');

    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`- ${err.path.join('.')}: ${err.message}`);
      });
    }

    throw new Error('環境變數配置無效，請檢查 .env 文件');
  }
}

/**
 * 安全地獲取環境變數（過濾敏感資訊）
 */
export function getSafeEnv(): Partial<EnvConfig> {
  const env = getValidatedEnv();

  // 移除敏感資訊
  const sensitiveKeys = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_JWT_SECRET',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'RESEND_API_KEY',
    'SMTP_PASS',
    'NEXTAUTH_SECRET',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'WEBHOOK_SECRET',
  ] as const;

  const safeEnv = { ...env };

  sensitiveKeys.forEach(key => {
    if (key in safeEnv) {
      delete safeEnv[key];
    }
  });

  return safeEnv;
}

/**
 * 檢查是否為開發環境
 */
export function isDevelopment(): boolean {
  return getValidatedEnv().NODE_ENV === 'development';
}

/**
 * 檢查是否為生產環境
 */
export function isProduction(): boolean {
  return getValidatedEnv().NODE_ENV === 'production';
}

/**
 * 檢查是否為測試環境
 */
export function isTest(): boolean {
  return getValidatedEnv().NODE_ENV === 'test';
}

/**
 * 獲取功能標誌狀態
 */
export function getFeatureFlags(): {
  debugLogging: boolean;
  metricsCollection: boolean;
  aiFeatures: boolean;
  experimentalFeatures: boolean;
  devTools: boolean;
  mockApiResponses: boolean;
} {
  const env = getValidatedEnv();

  return {
    debugLogging: env.ENABLE_DEBUG_LOGGING,
    metricsCollection: env.ENABLE_METRICS_COLLECTION,
    aiFeatures: env.ENABLE_AI_FEATURES,
    experimentalFeatures: env.ENABLE_EXPERIMENTAL_FEATURES,
    devTools: env.ENABLE_DEV_TOOLS && isDevelopment(),
    mockApiResponses: env.MOCK_API_RESPONSES && isDevelopment(),
  };
}

/**
 * 獲取 AI 服務配置
 */
export function getAiConfig(): {
  openai: {
    apiKey: string;
    model: string;
    maxTokens: number;
  };
  anthropic?: {
    apiKey: string;
    model: string;
  };
} {
  const env = getValidatedEnv();

  const config: {
    openai: {
      apiKey: string;
      model: string;
      maxTokens: number;
    };
    anthropic?: {
      apiKey: string;
      model: string;
    };
  } = {
    openai: {
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
      maxTokens: env.OPENAI_MAX_TOKENS,
    },
  };

  if (env.ANTHROPIC_API_KEY) {
    config.anthropic = {
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.ANTHROPIC_MODEL,
    };
  }

  return config;
}

/**
 * 獲取資料庫配置
 */
export function getDatabaseConfig(): {
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
    jwtSecret: string;
  };
  postgres?: {
    url: string;
    directUrl?: string;
  };
} {
  const env = getValidatedEnv();

  const config: {
    supabase: {
      url: string;
      anonKey: string;
      serviceRoleKey: string;
      jwtSecret: string;
    };
    postgres?: {
      url: string;
      directUrl?: string;
    };
  } = {
    supabase: {
      url: env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
      jwtSecret: env.SUPABASE_JWT_SECRET,
    },
  };

  if (env.DATABASE_URL) {
    config.postgres = {
      url: env.DATABASE_URL,
      directUrl: env.DIRECT_URL,
    };
  }

  return config;
}

/**
 * 獲取郵件服務配置
 */
export function getEmailConfig(): {
  resend?: {
    apiKey: string;
  };
  smtp?: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
} {
  const env = getValidatedEnv();
  const config: {
    resend?: {
      apiKey: string;
    };
    smtp?: {
      host: string;
      port: number;
      user: string;
      pass: string;
    };
  } = {};

  if (env.RESEND_API_KEY) {
    config.resend = {
      apiKey: env.RESEND_API_KEY,
    };
  }

  if (env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS) {
    config.smtp = {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    };
  }

  return config;
}

/**
 * 驗證必需的環境變數是否存在
 */
export function validateRequiredEnv(): {
  isValid: boolean;
  missingVars: string[];
  errors: string[];
} {
  const requiredForProduction = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
  ];

  const missingVars: string[] = [];
  const errors: string[] = [];

  try {
    const env = envSchema.parse(process.env);

    // 檢查生產環境必需變數
    if (isProduction()) {
      requiredForProduction.forEach(varName => {
        if (!process.env[varName]) {
          missingVars.push(varName);
        }
      });
    }

    // 檢查 URL 格式
    try {
      new URL(env.NEXT_PUBLIC_SUPABASE_URL);
    } catch {
      errors.push('NEXT_PUBLIC_SUPABASE_URL 格式無效');
    }

    // 檢查 API 金鑰長度
    if (env.OPENAI_API_KEY.length < 20) {
      errors.push('OPENAI_API_KEY 長度不足');
    }

    if (env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET 長度至少需要 32 個字符');
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        errors.push(`${err.path.join('.')}: ${err.message}`);
      });
    }
  }

  return {
    isValid: missingVars.length === 0 && errors.length === 0,
    missingVars,
    errors,
  };
}

/**
 * 在應用啟動時驗證環境變數
 */
export function initializeEnv(): void {
  const validation = validateRequiredEnv();

  if (!validation.isValid) {
    console.error('環境變數驗證失敗:');

    if (validation.missingVars.length > 0) {
      console.error('缺少必需的環境變數:');
      validation.missingVars.forEach(varName => {
        console.error(`- ${varName}`);
      });
    }

    if (validation.errors.length > 0) {
      console.error('環境變數錯誤:');
      validation.errors.forEach(error => {
        console.error(`- ${error}`);
      });
    }

    if (isProduction()) {
      throw new Error('生產環境下環境變數配置無效');
    } else {
      console.warn('開發環境下繼續運行，但某些功能可能不可用');
    }
  } else {
    console.info('環境變數驗證通過');
  }
}

// 單個環境變數安全訪問器
export function getValidatedEnvVar(key: keyof EnvConfig): string | undefined {
  const validated = getValidatedEnv();
  return validated?.[key] as string | undefined;
}

// 必需環境變數訪問器（如果不存在會拋出錯誤）
export function getRequiredEnvVar(key: keyof EnvConfig): string {
  const value = getValidatedEnvVar(key);
  if (!value) {
    throw new Error(`Required environment variable ${String(key)} is not set`);
  }
  return value;
}

// 導出常用的環境變數訪問器
export const env = {
  get: getValidatedEnv,
  getSafe: getSafeEnv,
  getVar: getValidatedEnvVar,
  requireVar: getRequiredEnvVar,
  isDev: isDevelopment,
  isProd: isProduction,
  isTest: isTest,
  features: getFeatureFlags,
  ai: getAiConfig,
  database: getDatabaseConfig,
  email: getEmailConfig,
};
