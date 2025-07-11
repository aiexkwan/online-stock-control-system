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
      email: `test${id}@example.com`,
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
 * 測試環境配置
 */
export const testConfig = {
  // 超時設定
  timeouts: {
    short: 5000,
    medium: 10000,
    long: 30000,
  },

  // 測試用戶憑證
  credentials: {
    admin: {
      email: process.env.E2E_ADMIN_EMAIL || 'admin@example.com',
      password: process.env.E2E_ADMIN_PASSWORD || 'admin123',
    },
    user: {
      email: process.env.E2E_USER_EMAIL || 'user@example.com',
      password: process.env.E2E_USER_PASSWORD || 'user123',
    },
  },

  // API 端點
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
  },
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
