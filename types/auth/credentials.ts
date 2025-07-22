/**
 * 認證相關類型定義
 * 統一管理認證、登錄、註冊相關類型
 */

import { UserRole } from '@/types/core/enums';

// @types-migration:todo(phase1) [P0] UserRole 已遷移到 core/enums.ts - Completed: 2025-07

// 基本認證類型
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  role?: UserRole;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}


export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  role: UserRole;
  department?: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  language: 'en' | 'zh-HK' | 'zh-CN';
  theme: 'light' | 'dark' | 'auto';
  timezone: string;
  notifications: NotificationSettings;
  dashboard?: DashboardSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  alerts: {
    lowStock: boolean;
    orders: boolean;
    system: boolean;
  };
}

export interface DashboardSettings {
  layout: string;
  widgets: string[];
  refreshInterval: number;
  autoRefresh: boolean;
}

// 認證響應類型
export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  expiresAt?: string;
  message?: string;
  error?: string;
}

export interface TokenPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  iat: number; // issued at
  exp: number; // expires at
  aud?: string; // audience
  iss?: string; // issuer
}

// 會話管理
export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken?: string;
  issuedAt: string;
  expiresAt: string;
  lastActivity: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
}

export interface SessionInfo {
  current: Session;
  all: Session[];
}

// 安全相關
export interface SecuritySettings {
  passwordMinLength: number;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  sessionTimeout: number; // minutes
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  requireEmailVerification: boolean;
  enable2FA: boolean;
}

export interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  timestamp: string;
  failureReason?: string;
}

export interface AccountLockout {
  userId: string;
  email: string;
  lockedAt: string;
  unlockAt: string;
  attempts: number;
  isLocked: boolean;
}

// 兩步驗證
export interface TwoFactorAuth {
  enabled: boolean;
  secret?: string;
  backupCodes: string[];
  lastUsed?: string;
}

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  token: string;
  code: string;
}

// 密碼重置
export interface PasswordResetToken {
  token: string;
  userId: string;
  email: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

// 電子郵件驗證
export interface EmailVerificationToken {
  token: string;
  userId: string;
  email: string;
  expiresAt: string;
  verified: boolean;
  createdAt: string;
}

// API 錯誤類型
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface ValidationError extends ApiError {
  code: 'VALIDATION_ERROR';
  details: {
    fields: {
      field: string;
      messages: string[];
    }[];
  };
}

export interface AuthError extends ApiError {
  code: 'AUTH_ERROR' | 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED' | 'TOKEN_EXPIRED' | 'UNAUTHORIZED';
}

// 權限管理
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

// OAuth 整合
export interface OAuthProvider {
  name: string;
  enabled: boolean;
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

export interface OAuthConfig {
  google?: OAuthProvider;
  microsoft?: OAuthProvider;
  facebook?: OAuthProvider;
}

// 審計日誌
export interface AuthAuditLog {
  id: string;
  userId?: string;
  email?: string;
  action: string;
  resource?: string;
  result: 'success' | 'failure';
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  details?: Record<string, unknown>;
}
