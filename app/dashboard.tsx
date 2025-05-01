'use client';

import React, { useEffect, useState } from 'react';

export default function AlternateDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    console.log('替代儀表板頁面：頁面已加載');
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        const userData = JSON.parse(userString);
        setUser(userData);
        console.log('替代儀表板：已載入用戶數據', userData);
      } else {
        console.log('替代儀表板：未找到用戶數據');
      }
    } catch (e) {
      console.error('替代儀表板：解析用戶數據錯誤', e);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">正在載入頁面...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
        <h1 className="text-2xl font-bold mb-4 text-blue-600">替代儀表板頁面</h1>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">用戶信息</h2>
          {user ? (
            <div>
              <p><span className="font-medium">ID:</span> {user.id}</p>
              <p><span className="font-medium">姓名:</span> {user.name || '未設置'}</p>
              <p><span className="font-medium">部門:</span> {user.department || '未設置'}</p>
            </div>
          ) : (
            <p>未找到用戶信息</p>
          )}
        </div>
        
        <div className="space-y-3">
          <p className="text-gray-600">此頁面是一個替代儀表板頁面，用於排查路由問題。</p>
          <div className="flex space-x-2">
            <a href="/login" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              登入頁面
            </a>
            <a href="/test-page" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              測試頁面
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 