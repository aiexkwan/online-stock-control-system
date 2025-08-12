/**
 * Core type definitions for NewPennine WMS
 * This file provides type safety replacements for common `any` type usage
 */

// Re-export all inventory analysis types
export * from './inventory-analysis.types';

// Common Database Types
export interface BaseRecord {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
}

export interface ApiResponse<T = unknown> {
  data: T;
  error?: DatabaseError;
  success: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Product Types
export interface Product {
  product_code: string;
  product_description: string;
  product_type: string | null;
  product_colour: string | null;
  status: 'active' | 'inactive' | 'discontinued';
  created_at: string;
  updated_at: string;
}

export interface ProductWithStock extends Product {
  current_stock: number;
  available_stock: number;
  reserved_stock: number;
  location_count: number;
}

// Pallet Types
export interface Pallet {
  pallet_code: string;
  product_code: string;
  quantity: number;
  location: string;
  status: 'active' | 'void' | 'transferred' | 'consumed';
  created_at: string;
  updated_at: string;
}

export interface PalletInfo extends Pallet {
  product_description?: string;
  product_type?: string;
  product_colour?: string;
}

// Location Types
export interface Location {
  location_code: string;
  location_name: string;
  location_type: 'warehouse' | 'staging' | 'shipping' | 'receiving';
  capacity: number;
  current_utilization: number;
  status: 'active' | 'inactive' | 'maintenance';
}

// Transaction Types
export interface Transaction {
  transaction_id: string;
  transaction_type: 'receive' | 'ship' | 'transfer' | 'adjust' | 'void';
  pallet_code: string;
  product_code: string;
  quantity: number;
  from_location?: string;
  to_location?: string;
  reference_number?: string;
  created_by: string;
  created_at: string;
}

// Order Types
export interface Order {
  order_id: string;
  order_number: string;
  order_type: 'aco' | 'grn' | 'internal';
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  supplier_code?: string;
  supplier_name?: string;
  total_items: number;
  total_quantity: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  order_id: string;
  product_code: string;
  product_description: string;
  quantity_ordered: number;
  quantity_received: number;
  quantity_remaining: number;
  unit_price?: number;
  total_price?: number;
  status: 'pending' | 'partial' | 'completed' | 'cancelled';
}

// User Types
export interface User {
  user_id: string;
  username: string;
  full_name: string;
  email: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  department: string;
  status: 'active' | 'inactive' | 'suspended';
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  user_id: string;
  session_id: string;
  ip_address: string;
  user_agent: string;
  expires_at: string;
  created_at: string;
}

// Card Types
export interface WidgetConfig {
  widget_id: string;
  widget_type: string;
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  configuration: Record<string, unknown>;
  is_visible: boolean;
  refresh_interval: number;
}

export interface WidgetData<T = unknown> {
  widget_id: string;
  data: T;
  last_updated: string;
  cache_expires_at: string;
  loading: boolean;
  error?: DatabaseError;
}

// Chart Types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, unknown>;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  title: string;
  xAxis: {
    label: string;
    dataKey: string;
  };
  yAxis: {
    label: string;
    dataKey: string;
  };
  colors: string[];
  showLegend: boolean;
  showGrid: boolean;
}

// Report Types
export interface ReportConfig {
  report_id: string;
  report_name: string;
  report_type: 'inventory' | 'transaction' | 'order' | 'user' | 'custom';
  parameters: Record<string, unknown>;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    recipients: string[];
  };
}

export interface ReportExecution {
  execution_id: string;
  report_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  file_path?: string;
  file_size?: number;
  error_message?: string;
  executed_by: string;
}

// Form Types
export interface FormField {
  name: string;
  type: 'text' | 'number' | 'email' | 'password' | 'select' | 'checkbox' | 'radio' | 'textarea';
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  options?: Array<{
    value: string;
    label: string;
  }>;
}

export interface FormData {
  [key: string]: string | number | boolean | string[] | null;
}

export interface FormValidationError {
  field: string;
  message: string;
}

// Search Types
export interface SearchFilters {
  [key: string]: string | number | boolean | string[] | null;
}

export interface SearchResult<T = unknown> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  filters: SearchFilters;
  sort: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

// Audit Types
export interface AuditLog {
  log_id: string;
  table_name: string;
  record_id: string;
  action: 'insert' | 'update' | 'delete';
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  changed_by: string;
  changed_at: string;
  ip_address: string;
  user_agent: string;
}

// Notification Types
export interface Notification {
  notification_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  recipient_id: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
  read_at?: string;
}

// System Types
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Array<{
    name: string;
    status: 'pass' | 'fail';
    message?: string;
    duration_ms: number;
  }>;
  timestamp: string;
}

export interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  active_connections: number;
  response_time_ms: number;
  error_rate: number;
  timestamp: string;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Event Types
export interface SystemEvent {
  event_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  source: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Cache Types
export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  expires_at: string;
  created_at: string;
  access_count: number;
  last_accessed: string;
}

// Error Types
export interface ApplicationError {
  error_id: string;
  error_code: string;
  error_message: string;
  error_stack?: string;
  context: Record<string, unknown>;
  user_id?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Permission Types
export interface Permission {
  permission_id: string;
  permission_name: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute';
  description: string;
}

export interface RolePermission {
  role: string;
  permissions: Permission[];
}

// Type guards
export function isApiResponse<T>(obj: unknown): obj is ApiResponse<T> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'data' in obj &&
    'success' in obj &&
    'timestamp' in obj
  );
}

export function isPaginatedResponse<T>(obj: unknown): obj is PaginatedResponse<T> {
  return (
    isApiResponse(obj) &&
    'pagination' in obj &&
    typeof (obj as Record<string, unknown>).pagination === 'object'
  );
}

export function isDatabaseError(obj: unknown): obj is DatabaseError {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'message' in obj &&
    typeof (obj as Record<string, unknown>).message === 'string'
  );
}

// Constants
export const COMMON_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 1000,
  CACHE_DURATION: 300000, // 5 minutes
  SESSION_TIMEOUT: 3600000, // 1 hour
  MAX_SEARCH_RESULTS: 10000,
  AUDIT_RETENTION_DAYS: 90,
} as const;
