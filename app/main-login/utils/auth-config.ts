// 認證配置選擇器
export const AUTH_CONFIG = {
  // 安全模式設定
  SECURITY_MODE: process.env.NEXT_PUBLIC_SECURITY_MODE || 'balanced', // 'strict' | 'balanced' | 'simple'

  // Session 過期時間（毫秒）
  SESSION_TIMEOUT: {
    strict: 30 * 60 * 1000, // 30分鐘
    balanced: 2 * 60 * 60 * 1000, // 2小時
    simple: 8 * 60 * 60 * 1000, // 8小時
  },

  // 是否使用 localStorage
  USE_LOCAL_STORAGE: {
    strict: false, // 完全不使用
    balanced: true, // 使用但有限制
    simple: true, // 正常使用
  },

  // 自動刷新 token
  AUTO_REFRESH_TOKEN: {
    strict: false,
    balanced: true,
    simple: true,
  },

  // 額外安全檢查
  EXTRA_SECURITY_CHECKS: {
    strict: true, // 域名、IP、時間等全面檢查
    balanced: true, // 域名和時間檢查
    simple: false, // 僅基本檢查
  },
} as const;

// 獲取當前安全模式的配置
export function getCurrentSecurityConfig() {
  const mode = AUTH_CONFIG.SECURITY_MODE as keyof typeof AUTH_CONFIG.SESSION_TIMEOUT;

  return {
    sessionTimeout: AUTH_CONFIG.SESSION_TIMEOUT[mode],
    useLocalStorage: AUTH_CONFIG.USE_LOCAL_STORAGE[mode],
    autoRefreshToken: AUTH_CONFIG.AUTO_REFRESH_TOKEN[mode],
    extraSecurityChecks: AUTH_CONFIG.EXTRA_SECURITY_CHECKS[mode],
    mode,
  };
}

// 安全建議
export const SECURITY_RECOMMENDATIONS = {
  strict: {
    description: '最高安全性 - 適用於高敏感環境',
    features: [
      '不使用 localStorage',
      '30分鐘 session 超時',
      '不自動刷新 token',
      '全面的安全檢查',
      '每次操作都需要重新驗證',
    ],
    risks: ['用戶體驗較差', '需要頻繁重新登入'],
  },

  balanced: {
    description: '平衡安全性與用戶體驗 - 推薦設定',
    features: [
      '使用加密的 localStorage',
      '2小時 session 超時',
      '自動刷新 token',
      '域名和時間檢查',
      '定期清理過期數據',
    ],
    risks: ['中等 XSS 風險', '共享電腦風險'],
  },

  simple: {
    description: '標準安全性 - 適用於內部網絡',
    features: ['標準 localStorage 使用', '8小時 session 超時', '自動刷新 token', '基本安全檢查'],
    risks: ['較高 XSS 風險', '較高共享電腦風險'],
  },
};
