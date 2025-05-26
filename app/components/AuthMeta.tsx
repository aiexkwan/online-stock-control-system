'use client';

import { useEffect } from 'react';
import Head from 'next/head';
import { getCookie } from 'cookies-next';

/**
 * AuthMeta 組件 - 將身份驗證 ID 添加為頁面元數據
 * 這使得客戶端 JavaScript 可以訪問通過中間件設置的頭信息
 */
export default function AuthMeta() {
  useEffect(() => {
    // 檢查是否為公開路徑，如果是則跳過認證邏輯 - 應與 ClientLayout 保持一致
    const publicPaths = [
      '/login',
      '/new-password',
      '/change-password',
      '/dashboard/access',
      '/print-label',
      '/print-grnlabel',
      '/stock-transfer'  // 添加 stock-transfer 作為公開路由
    ];
    const currentPath = window.location.pathname;
    if (publicPaths.some(path => currentPath.startsWith(path))) {
      console.log(`[AuthMeta] Public path detected (${currentPath}), skipping auth checks.`);
      return; // 跳過下面的認證邏輯
    }
    
    // 從 cookie 中獲取用戶 ID
    const userId = getCookie('loggedInUserClockNumber');
    
    // 如果找到 ID，創建一個 meta 標記或更新現有的標記
    if (userId) {
      // 檢查是否已存在該 meta 標記
      let metaTag = document.querySelector('meta[name="x-auth-user-id"]');
      
      if (!metaTag) {
        // 如果不存在，創建一個新的 meta 標記
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', 'x-auth-user-id');
        document.head.appendChild(metaTag);
      }
      
      // 設置或更新 meta 標記的內容
      metaTag.setAttribute('content', userId.toString());
      console.log(`[AuthMeta] Set user ID meta tag: ${userId}`);
    }
  }, []);

  // 無 UI 輸出
  return null;
} 