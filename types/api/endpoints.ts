/**
 * API 端點類型定義
 */

export interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  requestType?: string;
  responseType?: string;
}

export const API_ENDPOINTS = {
  // 認證相關
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    REGISTER: '/api/auth/register',
    RESET_PASSWORD: '/api/auth/reset-password',
    CHANGE_PASSWORD: '/api/auth/change-password',
  },

  // 用戶管理
  USERS: {
    LIST: '/api/users',
    CREATE: '/api/users',
    GET: '/api/users/:id',
    UPDATE: '/api/users/:id',
    DELETE: '/api/users/:id',
    PROFILE: '/api/users/profile',
  },

  // 產品管理
  PRODUCTS: {
    LIST: '/api/products',
    CREATE: '/api/products',
    GET: '/api/products/:code',
    UPDATE: '/api/products/:code',
    DELETE: '/api/products/:code',
    SEARCH: '/api/products/search',
  },

  // 訂單管理
  ORDERS: {
    LIST: '/api/orders',
    CREATE: '/api/orders',
    GET: '/api/orders/:id',
    UPDATE: '/api/orders/:id',
    DELETE: '/api/orders/:id',
    ACO: '/api/orders/aco',
    GRN: '/api/orders/grn',
  },

  // 庫存管理
  STOCK: {
    LIST: '/api/stock',
    UPDATE: '/api/stock',
    TRANSFER: '/api/stock/transfer',
    COUNT: '/api/stock/count',
    LEVELS: '/api/inventory/stock-levels',
  },

  // 報表生成
  REPORTS: {
    GENERATE: '/api/reports/generate',
    LIST: '/api/reports',
    DOWNLOAD: '/api/reports/:id/download',
    ACO_ORDER: '/api/reports/aco-order',
    GRN: '/api/reports/grn',
    TRANSACTION: '/api/reports/transaction',
    EXPORT_ALL: '/api/reports/export-all',
  },

  // 標籤列印
  PRINT: {
    LABEL: '/api/print/label',
    BARCODE: '/api/print/barcode',
    HISTORY: '/api/print/history',
    STATUS: '/api/print/status/:jobId',
  },

  // 系統監控
  MONITORING: {
    HEALTH: '/api/health',
    DEEP_HEALTH: '/api/v1/health/deep',
    METRICS: '/api/v1/metrics',
    ALERTS: '/api/v1/alerts',
  },

  // 文件上傳
  FILES: {
    UPLOAD: '/api/upload-file',
    UPLOAD_PDF: '/api/upload-pdf',
    CHECK_EXISTS: '/api/check-file-exists',
  },

  // 管理後台
  ADMIN: {
    DASHBOARD: '/api/admin/dashboard',
    STATS: '/api/admin/dashboard/combined-stats',
    MONITORING: '/api/admin/monitoring',
  },
} as const;

export type ApiEndpointKey = keyof typeof API_ENDPOINTS;
export type ApiEndpointPath =
  (typeof API_ENDPOINTS)[ApiEndpointKey][keyof (typeof API_ENDPOINTS)[ApiEndpointKey]];
