'use client';

import React, { useEffect, useState } from 'react';
import Navigation from './Navigation';
import { usePathname } from 'next/navigation';

function SafeHydration({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return mounted ? <>{children}</> : null;
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/change-password';

  return (
    <SafeHydration>
      <div className="min-h-screen bg-gray-900">
        {!isAuthPage && <Navigation />}
        <div className={!isAuthPage ? 'ml-64 pt-16' : ''}>
          {children}
        </div>
      </div>
    </SafeHydration>
  );
} 