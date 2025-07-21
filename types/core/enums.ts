/**
 * 核心枚舉類型定義
 * 統一管理整個應用的枚舉類型，避免循環依賴
 */

// ===== Alert 相關枚舉 =====
export enum AlertType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success'
}

export enum AlertPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

// ===== Widget 相關枚舉 =====
// WidgetType 已移至 types/components/dashboard.ts 以避免重複定義
// 請從該文件導入 WidgetType

export enum LayoutType {
  GRID = 'grid',
  LIST = 'list',
  DASHBOARD = 'dashboard',
  ANALYSIS = 'analysis'
}

export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  AREA = 'area',
  SCATTER = 'scatter',
  DONUT = 'donut',
  RADAR = 'radar',
  HEATMAP = 'heatmap'
}

// ===== Dashboard 相關枚舉 =====
export enum DashboardTheme {
  DEFAULT = 'default',
  ANALYSIS = 'analysis',
  STOCK = 'stock'
}

// ===== User 相關枚舉 =====
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  OPERATOR = 'operator',
  VIEWER = 'viewer'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

// ===== Stock 相關枚舉 =====
export enum StockStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  IN_TRANSIT = 'in_transit',
  DAMAGED = 'damaged',
  EXPIRED = 'expired',
  VOID = 'void'
}

export enum TransactionType {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
  TRANSFER = 'transfer',
  ADJUSTMENT = 'adjustment',
  RETURN = 'return'
}

// ===== Order 相關枚舉 =====
export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PICKED = 'picked',
  PACKED = 'packed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export enum OrderPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// ===== Quality Control 相關枚舉 =====
export enum QCStatus {
  PENDING = 'pending',
  PASSED = 'passed',
  FAILED = 'failed',
  PARTIAL = 'partial',
  RETESTING = 'retesting'
}

export enum QCType {
  INCOMING = 'incoming',
  IN_PROCESS = 'in_process',
  FINAL = 'final',
  RANDOM = 'random'
}

// ===== Report 相關枚舉 =====
export enum ReportType {
  ACO_ORDER = 'aco_order',
  GRN = 'grn',
  STOCK_TAKE = 'stock_take',
  TRANSACTION = 'transaction',
  ORDER_LOADING = 'order_loading',
  VOID_PALLET = 'void_pallet'
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json'
}

// ===== API 相關枚舉 =====
export enum ApiStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  PENDING = 'pending',
  TIMEOUT = 'timeout'
}

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

// ===== 系統相關枚舉 =====
export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test'
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

// ===== TODO 標記相關枚舉 =====
export enum TodoPhase {
  PHASE1 = 'phase1',
  PHASE2 = 'phase2',
  PHASE3 = 'phase3',
  PHASE4 = 'phase4'
}

export enum TodoPriority {
  P0 = 'P0', // Critical - 必須立即處理
  P1 = 'P1', // High - 本期必須完成
  P2 = 'P2', // Medium - 下期考慮
  P3 = 'P3'  // Low - 長期優化
}