/**
 * useAuth Hook
 * 處理 QC Label 系統的用戶認證和時鐘編號管理
 */

import { useEffect, useCallback } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { extractClockNumberFromEmail } from '@/app/utils/qcLabelHelpers';
import { CLOCK_NUMBER_EMAIL_INDEX } from '../../constants';

interface UseAuthProps {
  setUserId: (userId: string) => void;
}

interface UseAuthReturn {
  userId?: string;
  isAuthenticated: boolean;
  refreshAuth: () => Promise<void>;
}

export const useAuth = ({ setUserId }: UseAuthProps): UseAuthReturn => {
  // 創建 Supabase 客戶端
  const createClientSupabase = useCallback(() => {
    return createClient();
  }, []);

  // 獲取並設置用戶 ID
  const getUserId = useCallback(async () => {
    try {
      const supabase = createClientSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email) {
        // 從電郵提取時鐘編號 (格式: clocknumber@pennine.com)
        const clockNumber = extractClockNumberFromEmail(user.email);
        if (clockNumber) {
          setUserId(clockNumber);
          return clockNumber;
        }
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
    }
    return null;
  }, [setUserId, createClientSupabase]);

  // 初始化時自動獲取用戶 ID
  useEffect(() => {
    getUserId();
  }, [getUserId]);

  // 檢查用戶是否已認證
  const checkAuthentication = useCallback(async (): Promise<boolean> => {
    try {
      const supabase = createClientSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      return !!user;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }, [createClientSupabase]);

  // 刷新認證狀態
  const refreshAuth = useCallback(async () => {
    await getUserId();
  }, [getUserId]);

  // 監聽認證狀態變化
  useEffect(() => {
    const supabase = createClientSupabase();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await getUserId();
        } else if (event === 'SIGNED_OUT') {
          setUserId('');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [createClientSupabase, getUserId, setUserId]);

  return {
    isAuthenticated: true, // 簡化版本，實際應該基於狀態
    refreshAuth
  };
};