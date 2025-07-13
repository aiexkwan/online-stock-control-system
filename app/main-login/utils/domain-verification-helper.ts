/**
 * 域名驗證助手工具
 * 幫助用戶在遇到域名驗證問題時進行恢復
 */

import { createClient } from '@/app/utils/supabase/client';

export class DomainVerificationHelper {
  private static readonly STORAGE_KEY = 'pennine_secure_login_domain_verified';

  /**
   * 檢查域名驗證狀態
   */
  static checkVerificationStatus(): {
    isVerified: boolean;
    storedDomain: string | null;
    currentDomain: string;
    isExpired: boolean;
  } {
    if (typeof window === 'undefined') {
      return {
        isVerified: false,
        storedDomain: null,
        currentDomain: '',
        isExpired: false,
      };
    }

    const currentDomain = window.location.hostname;
    let storedDomain = null;
    let isExpired = false;

    try {
      const item = localStorage.getItem(this.STORAGE_KEY);
      if (item) {
        const parsed = JSON.parse(item);
        storedDomain = parsed.domain;
        isExpired = Date.now() > parsed.expires;
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    }

    return {
      isVerified: !!localStorage.getItem(this.STORAGE_KEY) && !isExpired,
      storedDomain,
      currentDomain,
      isExpired,
    };
  }

  /**
   * 嘗試恢復域名驗證
   */
  static async attemptRecovery(): Promise<{
    success: boolean;
    message: string;
    action?: 'restored' | 'sign_in_required';
  }> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        message: 'Cannot recover verification on server side',
      };
    }

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session && session.user) {
        // 恢復域名驗證標記
        const now = Date.now();
        const maxAge = 2 * 60 * 60 * 1000; // 2小時
        const verificationData = {
          value: 'true',
          expires: now + maxAge,
          domain: window.location.hostname,
          timestamp: now,
        };

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(verificationData));

        return {
          success: true,
          message: 'Domain verification restored successfully',
          action: 'restored',
        };
      } else {
        return {
          success: false,
          message: 'No valid session found. Please sign in again.',
          action: 'sign_in_required',
        };
      }
    } catch (error) {
      console.error('Error attempting recovery:', error);
      return {
        success: false,
        message: `Recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 清除域名驗證數據
   */
  static clearVerification(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * 獲取詳細的診斷信息
   */
  static getDiagnosticInfo(): {
    environment: string;
    currentDomain: string;
    isLocalhost: boolean;
    storageAvailable: boolean;
    verificationStatus: ReturnType<typeof DomainVerificationHelper.checkVerificationStatus>;
  } {
    const isLocalhost = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.startsWith('192.168.')
    );

    return {
      environment: process.env.NODE_ENV || 'unknown',
      currentDomain: typeof window !== 'undefined' ? window.location.hostname : 'server',
      isLocalhost,
      storageAvailable: typeof window !== 'undefined' && typeof localStorage !== 'undefined',
      verificationStatus: this.checkVerificationStatus(),
    };
  }

  /**
   * 生成用戶友好的錯誤消息
   */
  static generateUserFriendlyMessage(diagnostics: ReturnType<typeof DomainVerificationHelper.getDiagnosticInfo>): string {
    const { environment, currentDomain, isLocalhost, verificationStatus } = diagnostics;

    if (verificationStatus.isExpired) {
      return `驗證已過期。請重新登入以恢復訪問權限。`;
    }

    if (verificationStatus.storedDomain && verificationStatus.storedDomain !== currentDomain) {
      if (environment === 'development' && isLocalhost) {
        return `開發環境域名不匹配。正在嘗試自動恢復...`;
      } else {
        return `域名驗證失敗。請在正確的域名 (${verificationStatus.storedDomain}) 上訪問應用程式。`;
      }
    }

    return `域名驗證失敗。請重新登入以恢復訪問權限。`;
  }
}

// 導出便捷函數
export const domainVerificationHelper = {
  check: DomainVerificationHelper.checkVerificationStatus,
  recover: DomainVerificationHelper.attemptRecovery,
  clear: DomainVerificationHelper.clearVerification,
  diagnose: DomainVerificationHelper.getDiagnosticInfo,
  getMessage: DomainVerificationHelper.generateUserFriendlyMessage,
}; 