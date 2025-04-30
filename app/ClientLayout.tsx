'use client';

import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">載入中...</p>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      setMounted(true);
    } catch (error) {
      console.error('ClientLayout mounting error:', error);
    }
  }, []);

  // 如果還沒有掛載完成，顯示加載狀態
  if (!mounted) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-grow pt-16"> {/* 為導航欄保留空間 */}
          {children}
        </main>
      </div>
    </ErrorBoundary>
  );
} 