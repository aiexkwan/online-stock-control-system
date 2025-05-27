'use client';

import React, { useState, useEffect } from 'react';
import { unifiedAuth } from '../utils/unified-auth';

interface SecurityMonitorProps {
  onSessionExpiring?: () => void;
  onSessionExpired?: () => void;
}

export default function SecurityMonitor({ onSessionExpiring, onSessionExpired }: SecurityMonitorProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const securityInfo = unifiedAuth.getSecurityInfo();

  useEffect(() => {
    // 只在使用 localStorage 的模式下監控 session
    if (!securityInfo.useLocalStorage) {
      return;
    }

    const checkSession = () => {
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
          const remaining = Math.max(0, sessionTimeout - (sessionTimeout * 0.8));
          const minutes = Math.floor(remaining / (60 * 1000));
          setTimeRemaining(`${minutes} minutes`);
        }
      } catch (error) {
        console.error('Session check failed:', error);
        onSessionExpired?.();
      }
    };

    // 每分鐘檢查一次
    const interval = setInterval(checkSession, 60 * 1000);
    
    // 立即檢查一次
    checkSession();

    return () => clearInterval(interval);
  }, [securityInfo, showWarning, onSessionExpiring, onSessionExpired]);

  if (!showWarning || !securityInfo.useLocalStorage) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-yellow-500 text-black p-4 rounded-lg shadow-lg border border-yellow-600">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-800 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">Session Expiring Soon</h4>
            <p className="text-xs mt-1">
              Your session will expire in approximately {timeRemaining}. 
              Please save your work and refresh the page to extend your session.
            </p>
            <button
              onClick={() => setShowWarning(false)}
              className="mt-2 text-xs underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 