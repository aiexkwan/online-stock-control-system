'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { VisualSystemProvider, UnifiedBackground } from '@/app/components/visual-system';
import { DynamicActionBar } from '@/components/ui/dynamic-action-bar';
import { VISUAL_CONFIG } from '@/app/components/visual-system/config/visual-config';

export function ClientVisualSystemProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 檢查當前路徑是否應該隱藏導航欄
  const shouldHideNav = VISUAL_CONFIG.bottomNav.visibility.hiddenPaths.some(
    path => pathname?.startsWith(path)
  );
  
  return (
    <VisualSystemProvider>
      <UnifiedBackground />
      {children}
      {/* DynamicActionBar - 在認證頁面隱藏 */}
      {!shouldHideNav && <DynamicActionBar />}
    </VisualSystemProvider>
  );
}