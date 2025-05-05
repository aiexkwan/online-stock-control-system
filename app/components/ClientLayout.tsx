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
    <div className="min-h-screen grid grid-cols-[minmax(180px,240px)_1fr] bg-[#181c2f]">
      {/* Sidebar */}
      <aside className="bg-[#23263a] shadow-lg flex flex-col">
        <Navigation />
      </aside>

      {/* Main Content */}
      <main className="w-full px-6 py-10 overflow-y-auto">
        {/* ✅ 子元素確保唔再有 margin auto 或 max-w */}
        <div className="w-full space-y-10">
          {children}
        </div>
      </main>
    </div>
  );
} 
