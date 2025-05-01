'use client';

import React from 'react';

export default function DirectDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
        <h1 className="text-2xl font-bold mb-4 text-blue-600">直接儀表板頁面</h1>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">無需身份驗證的頁面</h2>
          <p className="text-gray-700">
            此頁面不檢查用戶登入狀態，所以能夠直接訪問。可用於測試路由問題。
          </p>
        </div>
        
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">如何使用</h2>
          <p className="text-gray-700 mb-2">
            請點擊下方按鈕來手動保存用戶資訊，這將允許您訪問其他頁面。
          </p>
          <button 
            onClick={() => {
              const adminData = {
                id: 'admin',
                name: 'Administrator',
                department: 'IT',
                permissions: {
                  qc: true,
                  receive: true,
                  void: true,
                  view: true,
                  resume: true,
                  report: true
                }
              };
              
              // 同時在所有可能的存儲位置保存資訊
              localStorage.setItem('user', JSON.stringify(adminData));
              sessionStorage.setItem('user', JSON.stringify(adminData));
              document.cookie = `user=${JSON.stringify(adminData)}; path=/; max-age=86400`;
              
              alert('用戶資訊已保存！現在您可以訪問其他頁面。');
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            保存管理員資訊
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <a href="/dashboard" className="px-4 py-2 bg-blue-500 text-white rounded text-center hover:bg-blue-600">
            訪問儀表板
          </a>
          <a href="/dashboard.tsx" className="px-4 py-2 bg-blue-500 text-white rounded text-center hover:bg-blue-600">
            訪問替代儀表板
          </a>
          <a href="/new-password" className="px-4 py-2 bg-purple-500 text-white rounded text-center hover:bg-purple-600">
            訪問密碼頁面
          </a>
          <a href="/pass-change" className="px-4 py-2 bg-purple-500 text-white rounded text-center hover:bg-purple-600">
            訪問替代密碼頁面
          </a>
          <a href="/login" className="px-4 py-2 bg-gray-500 text-white rounded text-center hover:bg-gray-600">
            回到登入頁面
          </a>
          <a href="/test-page" className="px-4 py-2 bg-yellow-500 text-white rounded text-center hover:bg-yellow-600">
            測試頁面
          </a>
        </div>
      </div>
    </div>
  );
} 