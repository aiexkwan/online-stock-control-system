'use client';

import React, { useEffect, useState } from 'react';
import Navigation from './Navigation';

function SafeHydration({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? <>{children}</> : null;
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SafeHydration>
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        {children}
      </div>
    </SafeHydration>
  );
} 