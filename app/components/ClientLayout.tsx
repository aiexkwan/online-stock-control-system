'use client';

import React from 'react';
import Navigation from './Navigation';
import { usePathname } from 'next/navigation';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = pathname === '/login' || pathname === '/change-password';

  if (hideSidebar) {
    return (
      <div className="min-h-screen bg-[#181c2f] flex flex-col">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#181c2f]">
      {/* 側邊選單 2/10，深灰底 */}
      <aside className="w-1/5 min-w-[180px] max-w-xs bg-[#23263a] border-r border-[#23263a] shadow-lg flex flex-col">
        <Navigation />
      </aside>
      {/* 主內容 8/10，卡片化分區 */}
      <main className="flex-1 px-8 py-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
} 