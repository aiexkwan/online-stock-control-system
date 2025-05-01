'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function NewPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    console.log('新密碼頁面已載入');
    
    // 檢查localStorage中的用戶資訊
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserData(user);
        console.log('已載入用戶數據:', user);
      } else {
        console.log('未找到用戶數據');
      }
    } catch (e) {
      console.error('解析用戶資訊失敗', e);
    }
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userData || !userData.id) {
      setError('找不到用戶資訊，請重新登入');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('密碼長度必須至少為6個字符');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('兩次輸入的密碼不一致');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 更新數據庫中的密碼
      const { error: updateError } = await supabase
        .from('data_id')
        .update({ password: newPassword })
        .eq('id', userData.id);
      
      if (updateError) {
        throw updateError;
      }
      
      // 清除首次登入標記
      localStorage.removeItem('firstLogin');
      
      // 顯示成功訊息
      setSuccess(true);
      
      // 3秒後跳轉到儀表板
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 3000);
    } catch (error) {
      console.error('更新密碼失敗:', error);
      setError(error instanceof Error ? error.message : '無法更新密碼');
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
          <h1 className="text-2xl font-bold text-green-600 mb-2">密碼更新成功！</h1>
          <p className="text-gray-600 mb-8">您的密碼已成功更新，正在跳轉到儀表板...</p>
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
        <h1 className="text-2xl font-bold mb-4">設置新密碼</h1>
        <p className="mb-6">請為您的帳戶設置一個新密碼，密碼長度必須至少為6個字符。</p>
        
        {userData ? (
          <div className="mb-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              為用戶 <span className="font-bold">{userData.name || userData.id}</span> 更新密碼
            </p>
          </div>
        ) : (
          <div className="mb-6 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              未找到用戶資訊，請返回登入頁面重試
            </p>
          </div>
        )}
        
        <form onSubmit={handlePasswordChange}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              新密碼
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="輸入新密碼"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              確認密碼
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="再次輸入新密碼"
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
              {loading ? '處理中...' : '更新密碼'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 