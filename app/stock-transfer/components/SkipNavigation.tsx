import React from 'react';

/**
 * Skip Navigation 組件
 * 幫助鍵盤用戶快速跳過重複內容
 */
export const SkipNavigation: React.FC = () => {
  return (
    <div className="sr-only focus:not-sr-only">
      <a
        href="#main-content"
        className="absolute top-0 left-0 p-2 m-2 bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <a
        href="#search-section"
        className="absolute top-0 left-32 p-2 m-2 bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Skip to search
      </a>
      <a
        href="#transfer-log"
        className="absolute top-0 left-56 p-2 m-2 bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Skip to transfer log
      </a>
    </div>
  );
};