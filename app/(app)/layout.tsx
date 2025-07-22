'use client';

import React from 'react';
import { FullProviders } from '@/app/components/providers/FullProviders';

// 主應用 Layout - 包含所有 Provider 同功能
export default function AppLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  const safeChildren = children || null;
  
  return (
    <FullProviders>
      {safeChildren}
    </FullProviders>
  );
}