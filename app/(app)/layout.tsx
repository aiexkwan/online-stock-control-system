import React from 'react';
import { FullProviders } from '@/app/components/providers/FullProviders';

// 主應用 Layout - 服務端組件，通過 FullProviders 處理客戶端邊界
export default function AppLayout({ children }: { children?: React.ReactNode }) {
  const safeChildren = children || null;

  return <FullProviders>{safeChildren}</FullProviders>;
}
