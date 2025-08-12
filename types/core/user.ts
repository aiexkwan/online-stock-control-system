/**
 * 用戶相關類型定義
 */

import { UserRole } from '../database/tables';

// @types-migration:todo(phase1) [P0] UserRole 已遷移到 enums.ts - Completed: 2025-07

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: UserRole;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  resource: string;
  actions: PermissionAction[];
}

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  PRINT = 'print',
}

export interface UserProfile {
  id: string;
  userId: string;
  displayName?: string;
  department?: string;
  position?: string;
  phone?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'zh-TW' | 'zh-CN';
  timezone: string;
  dashboardLayout?: string;
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sound: boolean;
  types: NotificationType[];
}

export enum NotificationType {
  ORDER_COMPLETED = 'order_completed',
  STOCK_ALERT = 'stock_alert',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  ERROR_ALERT = 'error_alert',
}
