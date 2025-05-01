'use client';

import React, { useState, useEffect } from 'react';

export default function TestPage() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // 收集調試信息
    const debugInfo = [
      `頁面載入時間: ${new Date().toLocaleString()}`,
      `用戶資訊存在: ${Boolean(localStorage.getItem('user'))}`,
      `首次登入標記: ${localStorage.getItem('firstLogin') || '不存在'}`,
      `儀表板已載入標記: ${sessionStorage.getItem('dashboardLoaded') || '不存在'}`,
      `新密碼頁面已載入標記: ${sessionStorage.getItem('newPasswordLoaded') || '不存在'}`
    ];
    
    setLogs(debugInfo);
    
    // 添加一條記錄，表示測試頁面已經成功加載
    console.log('測試頁面：頁面已成功加載');
  }, []);

  // 測試跳轉到其他頁面的函數
  const navigateTo = (path: string) => {
    console.log(`測試頁面：正在跳轉到 ${path}`);
    window.open(path, '_self');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
        <h1 className="text-2xl font-bold mb-4 text-blue-600">頁面導航測試</h1>
        
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-2">調試信息:</h2>
          <ul className="space-y-1 text-sm font-mono">
            {logs.map((log, index) => (
              <li key={index} className="text-gray-700">{log}</li>
            ))}
          </ul>
        </div>
        
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">測試導航按鈕:</h2>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => navigateTo('/login')} 
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            >
              登入頁面
            </button>
            <button 
              onClick={() => navigateTo('/dashboard')} 
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
            >
              儀表板
            </button>
            <button 
              onClick={() => navigateTo('/new-password')} 
              className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded"
            >
              新密碼頁面
            </button>
            <button 
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                navigateTo('/login');
              }} 
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
            >
              清除存儲並登出
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 