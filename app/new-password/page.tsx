'use client';

import React, { useState, useEffect } from 'react';

export default function NewPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    console.log('NewPasswordPage: page loaded');
    
    // 檢查localStorage中的用戶資訊
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserData(user);
        console.log('NewPasswordPage: user data loaded', user);
        
        // 保存一個標記表示已加載
        sessionStorage.setItem('newPasswordLoaded', 'true');
      } else {
        console.log('NewPasswordPage: user data not found, redirecting to login page');
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
      }
    } catch (e) {
      console.error('NewPasswordPage: failed to parse user info', e);
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    }
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userData || !userData.id) {
      setError('User information not found, please log in again');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('嘗試更新用戶密碼...');
      
      // 更新用戶對象中的密碼
      userData.password = newPassword;
      localStorage.setItem('user', JSON.stringify(userData));
      
      // 清除首次登入標記
      localStorage.removeItem('firstLogin');
      
      // 顯示成功訊息
      setSuccess(true);
      
      // 3秒後跳轉到儀表板
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 3000);
    } catch (error) {
      console.error('Failed to update password:', error);
      setError(error instanceof Error ? error.message : 'Unable to update password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50/30">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-green-600 mb-2">Password updated successfully!</h1>
          <p className="text-gray-600 mb-8">Your password has been successfully updated. Redirecting to dashboard...</p>
          <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
            <div className="bg-green-500 h-1 animate-pulse rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50/30">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Set New Password</h1>
        <p className="mb-6">Please set a new password for your account; password must be at least 6 characters long.</p>
        
        {userData ? (
          <div className="mb-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Updating password for user <span className="font-bold">{userData.name || userData.id}</span>
            </p>
          </div>
        ) : (
          <div className="mb-6 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              User information not found, please return to login page and try again
            </p>
          </div>
        )}
        
        <form onSubmit={handlePasswordChange}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter new password"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter password again"
              required
            />
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <a 
              href="/login"
              className="text-blue-600 hover:underline text-sm"
            >
              返回登入
            </a>
            
            <button
              type="submit"
              disabled={loading || !userData}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md ${loading || !userData ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
            >
              {loading ? 'Processing...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 