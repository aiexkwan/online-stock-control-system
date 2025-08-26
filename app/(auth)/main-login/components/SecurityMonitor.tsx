'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { unifiedAuth } from '../utils/unified-auth';

interface SecurityMonitorProps {
  onSessionExpiring?: () => void;
  onSessionExpired?: () => void;
}

const SecurityMonitor = memo(function SecurityMonitor({
  onSessionExpiring,
  onSessionExpired,
}: SecurityMonitorProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const securityInfo = useMemo(() => unifiedAuth.getSecurityInfo(), []);

  const checkSession = useCallback(() => {
    try {
      const isExpiringSoon = unifiedAuth.isSessionExpiringSoon();

      if (isExpiringSoon && !showWarning) {
        setShowWarning(true);
        onSessionExpiring?.();
      }

      // 計算剩餘時間（如果有的話）
      if (securityInfo.useLocalStorage && 'isSessionExpiringSoon' in unifiedAuth) {
        // 這裡可以添加更精確的時間計算
        const sessionTimeout = securityInfo.sessionTimeout;
        const remaining = Math.max(0, sessionTimeout - sessionTimeout * 0.8);
        const minutes = Math.floor(remaining / (60 * 1000));
        setTimeRemaining(`${minutes} minutes`);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      onSessionExpired?.();
    }
  }, [
    showWarning,
    securityInfo.sessionTimeout,
    securityInfo.useLocalStorage,
    onSessionExpiring,
    onSessionExpired,
  ]);

  useEffect(() => {
    // 只在使用 localStorage 的模式下監控 session
    if (!securityInfo.useLocalStorage) {
      return;
    }

    // 每分鐘檢查一次
    const interval = setInterval(checkSession, 60 * 1000);

    // 立即檢查一次
    checkSession();

    return () => clearInterval(interval);
  }, [securityInfo.useLocalStorage, checkSession]);

  const handleDismiss = useCallback(() => {
    setShowWarning(false);
  }, []);

  if (!showWarning || !securityInfo.useLocalStorage) {
    return null;
  }

  return (
    <div className='fixed right-4 top-4 z-50 max-w-sm'>
      <div className='rounded-lg border border-yellow-600 bg-yellow-500 p-4 text-black shadow-lg'>
        <div className='flex items-start'>
          <svg
            className='mr-2 mt-0.5 h-5 w-5 text-yellow-800'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
            />
          </svg>
          <div className='flex-1'>
            <h4 className='text-sm font-semibold'>Session Expiring Soon</h4>
            <p className='mt-1 text-xs'>
              Your session will expire in approximately {timeRemaining}. Please save your work and
              refresh the page to extend your session.
            </p>
            <button onClick={handleDismiss} className='mt-2 text-xs underline hover:no-underline'>
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SecurityMonitor;
