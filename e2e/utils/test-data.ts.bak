/**
 * E2E 測試數據生成工具
 */

export const generateTestData = {
  /**
   * 生成測試用托盤號
   */
  palletNumber: () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
    const seq = Math.floor(Math.random() * 999) + 1;
    return `${dateStr}/${seq}`;
  },

  /**
   * 生成測試用產品代碼
   */
  productCode: () => {
    const prefix = ['TEST', 'DEMO', 'SAMPLE'][Math.floor(Math.random() * 3)];
    const number = Math.floor(Math.random() * 9999) + 1;
    return `${prefix}${number.toString().padStart(4, '0')}`;
  },

  /**
   * 生成測試用系列號
   */
  series: () => {
    const prefix = ['PM', 'QC', 'TEST'][Math.floor(Math.random() * 3)];
    const date = new Date();
    const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
    return `${prefix}-${dateStr}`;
  },

  /**
   * 生成測試用戶
   */
  user: () => {
    const id = Math.floor(Math.random() * 99999);
    return {
      email: `test${id}@pennineindustries.com`,
      password: `Test@${id}`,
      name: `Test User ${id}`,
    };
  },

  /**
   * 生成批量測試數據
   */
  batch: (count: number, generator: () => any) => {
    return Array.from({ length: count }, generator);
  },
};

/**
 * 統一憑證獲取函數
 */
export function getUnifiedCredentials() {
  return {
    email:
      process.env.UNIFIED_TEST_EMAIL ||
      process.env.SYS_LOGIN ||
      process.env.E2E_USER_EMAIL ||
      process.env.PUPPETEER_LOGIN ||
      'test@pennineindustries.com',
    password:
      process.env.UNIFIED_TEST_PASSWORD ||
      process.env.SYS_PASSWORD ||
      process.env.E2E_USER_PASSWORD ||
      process.env.PUPPETEER_PASSWORD ||
      'testpassword',
  };
}

/**
 * 檢查是否有可用的測試憑證
 */
export function hasValidCredentials(): boolean {
  const creds = getUnifiedCredentials();
  return !!(creds.email && creds.password && creds.email.includes('@'));
}

/**
 * 測試環境配置
 */
export const testConfig = {
  // 超時設定
  timeouts: {
    short: 5000,
    medium: 10000,
    long: 30000,
  },

  // 統一測試用戶憑證
  credentials: {
    get admin() {
      return getUnifiedCredentials();
    },
    get user() {
      return getUnifiedCredentials();
    },
  },

  // API 端點
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
  },
};

// 添加測試用戶常量供其他測試使用
export const TEST_USER = {
  email: 'akwan@pennineindustries.com',
  password: 'X315Y316',
};

/**
 * 等待條件輔助函數
 */
export const waitFor = {
  /**
   * 等待網絡空閒
   */
  networkIdle: async (page: any, timeout = 5000) => {
    await page.waitForLoadState('networkidle', { timeout });
  },

  /**
   * 等待所有圖片加載
   */
  imagesLoaded: async (page: any) => {
    await page.waitForFunction(() => {
      const images = Array.from(document.images);
      return images.every(img => img.complete);
    });
  },

  /**
   * 等待動畫完成
   */
  animationComplete: async (page: any, selector: string) => {
    await page.waitForFunction((sel: string) => {
      const element = document.querySelector(sel);
      if (!element) return false;
      const animations = element.getAnimations();
      return animations.length === 0 || animations.every(a => a.playState === 'finished');
    }, selector);
  },
};
