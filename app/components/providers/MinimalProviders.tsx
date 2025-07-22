'use client';

import React from 'react';
import { UnifiedBackground } from '@/app/components/visual-system/core/UnifiedBackground';
import { VisualSystemProvider } from '@/app/components/visual-system/core/VisualSystemProvider';

// 登入頁面的最小化 Provider - 只包含星空背景
export function MinimalProviders({ children }: { children: React.ReactNode }) {
  return (
    <VisualSystemProvider>
      <UnifiedBackground />
      <div className="min-h-screen relative z-10">
        {children}
      </div>
    </VisualSystemProvider>
  );
}