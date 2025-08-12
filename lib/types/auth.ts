/**
 * 認證 Hook 類型定義
 */

import type { User } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  userRole: UserRole | null;
}

export interface UserRole {
  type: 'admin' | 'user';
  department: string;
  position: string;
  allowedPaths: string[];
  defaultPath: string;
  navigationRestricted: boolean;
}