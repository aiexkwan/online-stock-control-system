'use client';

import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <ErrorBoundary>
      <Navigation />
      <main className="pt-16"> {/* 為導航欄保留空間 */}
        {children}
      </main>
    </ErrorBoundary>
  );
} 