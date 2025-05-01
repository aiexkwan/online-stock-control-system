'use client';

import React from 'react';
import Navigation from './Navigation';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* 側邊選單 2/10 */}
      <aside className="w-1/5 min-w-[180px] max-w-xs bg-gray-200 border-r border-gray-300">
        <Navigation />
      </aside>
      {/* 主內容 8/10 */}
      <main className="flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
} 