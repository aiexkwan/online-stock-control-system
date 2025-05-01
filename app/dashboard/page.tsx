'use client';

import React, { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalItems: 0,
    recentActivities: 0,
    lowStockAlerts: 0,
  });

  useEffect(() => {
    // 嘗試從多個存儲位置獲取用戶信息
    const checkAuth = () => {
      try {
        console.log('儀表板頁面：嘗試獲取用戶信息');
        
        // 首先嘗試從 localStorage 獲取
        let userInfo = null;
        let userString = localStorage.getItem('user');
        
        if (userString) {
          console.log('儀表板：從 localStorage 找到用戶數據');
          userInfo = JSON.parse(userString);
        } else {
          // 如果 localStorage 中沒有，嘗試從 sessionStorage 獲取
          userString = sessionStorage.getItem('user');
          if (userString) {
            console.log('儀表板：從 sessionStorage 找到用戶數據');
            userInfo = JSON.parse(userString);
          } else {
            // 嘗試從 cookie 獲取
            const cookies = document.cookie.split('; ');
            const userCookie = cookies.find(cookie => cookie.startsWith('user='));
            if (userCookie) {
              userString = userCookie.split('=')[1];
              console.log('儀表板：從 cookie 找到用戶數據');
              userInfo = JSON.parse(decodeURIComponent(userString));
            }
          }
        }
        
        if (userInfo) {
          setUser(userInfo);
          setLoading(false);
          console.log('儀表板：成功設置用戶資料', userInfo);
        } else {
          setErrorMessage('找不到用戶數據，請先登入');
          setLoading(false);
          console.log('儀表板：未找到用戶數據');
        }
      } catch (e) {
        console.error('儀表板：解析用戶數據錯誤', e);
        setErrorMessage('解析用戶數據時出錯');
        setLoading(false);
      }
    };

    const getStats = () => {
      // 簡單統計數據，暫時使用假數據
      setStats({
        totalItems: 125,
        recentActivities: 8,
        lowStockAlerts: 3,
      });
    };

    // 立即執行這些函數
    checkAuth();
    getStats();
    
    // 為防止任何問題，設置一個標記表示頁面已加載
    sessionStorage.setItem('dashboardLoaded', 'true');
  }, []);

  // 顯示加載狀態
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">正在載入儀表板...</p>
        </div>
      </div>
    );
  }

  // 顯示錯誤信息
  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="w-16 h-16 bg-red-100 mx-auto rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-bold text-center text-gray-800">無法載入儀表板</h2>
          <p className="mt-2 text-center text-gray-600">{errorMessage}</p>
          
          <div className="mt-6 grid grid-cols-2 gap-3">
            <a 
              href="/login" 
              className="text-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              返回登入頁面
            </a>
            <a 
              href="/direct-dashboard" 
              className="text-center py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded"
            >
              前往直接儀表板
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* 用戶信息顯示 */}
        <div className="mb-6 bg-white shadow rounded-lg p-4">
          <h1 className="text-2xl font-bold text-gray-800">歡迎，{user?.name || user?.id || '用戶'}</h1>
          <p className="text-gray-600">部門: {user?.department || '未知'}</p>
          
          {/* 添加直接連結到測試頁面 */}
          <div className="mt-4 flex space-x-2">
            <a 
              href="/direct-dashboard" 
              className="text-sm text-blue-600 hover:underline"
            >
              前往直接儀表板
            </a>
            <a 
              href="/test-page" 
              className="text-sm text-blue-600 hover:underline"
            >
              前往測試頁面
            </a>
          </div>
        </div>
        
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Stock Overview Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        庫存總數
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stats.totalItems}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        最近活動 (24小時)
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stats.recentActivities}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Low Stock Alert Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        庫存不足警告
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stats.lowStockAlerts}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 