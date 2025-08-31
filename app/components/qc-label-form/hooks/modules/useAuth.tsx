/**
 * useAuth Hook
 * 處理 QC Label 系統的用戶認證和時鐘編號管理
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../../../../utils/supabase/client';

interface UseAuthProps {
  setUserId: (userId: string) => void;
}

interface UseAuthReturn {
  userId?: string;
  isAuthenticated: boolean;
  refreshAuth: () => Promise<void>;
}

/**
 * 從電郵地址提取時鐘編號
 * 支援格式：clocknumber@pennineindustries.com 或 clocknumber@domain.com
 */
function extractClockNumberFromEmail(email: string): string | null {
  if (!email || !email.includes('@')) {
    return null;
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    return null;
  }

  const clockNumber = parts[0];
  // 驗證時鐘編號格式（假設是數字）
  if (!/^\d+$/.test(clockNumber)) {
    return null;
  }

  return clockNumber;
}

/**
 * QC Label 認證 Hook
 * 提供簡化的認證邏輯，避免複雜的依賴
 */
export const useAuth = ({ setUserId }: UseAuthProps): UseAuthReturn => {
  const [userId, setCurrentUserId] = useState<string | undefined>();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // 獲取用戶 ID
  const getUserId = useCallback(async (): Promise<string | null> => {
    try {
      const supabase = createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error('Auth error:', error);
        setIsAuthenticated(false);
        setCurrentUserId(undefined);
        return null;
      }

      if (user?.email) {
        // 從電郵提取時鐘編號
        const clockNumber = extractClockNumberFromEmail(user.email);
        if (clockNumber) {
          setUserId(clockNumber);
          setCurrentUserId(clockNumber);
          setIsAuthenticated(true);
          return clockNumber;
        }
      }

      setIsAuthenticated(false);
      setCurrentUserId(undefined);
      return null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      setIsAuthenticated(false);
      setCurrentUserId(undefined);
      return null;
    }
  }, [setUserId]);

  // 刷新認證狀態
  const refreshAuth = useCallback(async () => {
    await getUserId();
  }, [getUserId]);

  // 初始化認證狀態
  useEffect(() => {
    getUserId();
  }, [getUserId]);

  // 監聽認證狀態變化
  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await getUserId();
      } else if (event === 'SIGNED_OUT') {
        setUserId('');
        setCurrentUserId(undefined);
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [getUserId, setUserId]);

  return {
    userId,
    isAuthenticated,
    refreshAuth,
  };
};
