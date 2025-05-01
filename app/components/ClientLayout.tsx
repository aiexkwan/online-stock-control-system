'use client';

import React from 'react';
import Navigation from './Navigation';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />
      {children}
    </div>
  );
} 