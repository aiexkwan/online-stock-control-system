'use client';

import React, { useState, useEffect } from 'react';

export default function TestPage() {
  const [userInfo, setUserInfo] = useState<any>(null);
  
  useEffect(() => {
    console.log('測試頁面已載入');
    
    // 檢查localStorage中的用戶資訊
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserInfo(user);
      }
    } catch (e) {
      console.error('解析用戶資訊失敗', e);
    }
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50/30">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">測試頁面</h1>
        <p className="mb-4">這是一個測試頁面，用於排查路由問題。</p>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h2 className="font-bold mb-2">用戶資訊</h2>
          {userInfo ? (
            <pre className="text-xs overflow-auto bg-gray-100 p-2 rounded">
              {JSON.stringify(userInfo, null, 2)}
            </pre>
          ) : (
            <p>未找到用戶資訊</p>
          )}
        </div>
        
        <div className="mt-4 flex space-x-2">
          <a href="/login" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            回到登入頁面
          </a>
          <a href="/dashboard" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            前往儀表板
          </a>
        </div>
      </div>
    </div>
  );
} 