/**
 * 認證相關類型定義
 */

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isLoading: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  permissions: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
  department?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface TokenPayload {
  sub: string; // user id
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface SessionInfo {
  id: string;
  userId: string;
  deviceInfo: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActivity: string;
  isActive: boolean;
}
