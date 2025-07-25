'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// 動態載入不同的 Provider 組件
const MinimalProviders = dynamic(
  () => import('./providers/MinimalProviders').then(mod => ({ default: mod.MinimalProviders })),
  {
    ssr: true,
    loading: () => <div className='relative z-10 min-h-screen' />,
  }
);

const FullProviders = dynamic(
  () => import('./providers/FullProviders').then(mod => ({ default: mod.FullProviders })),
  {
    ssr: false,
    loading: () => <div className='relative z-10 min-h-screen' />,
  }
);

// 定義輕量級頁面（不需要完整功能）
const LIGHTWEIGHT_ROUTES = [
  '/main-login',
  '/main-login/register',
  '/main-login/reset',
  '/main-login/simple',
  '/main-login/change',
];

interface ConditionalProvidersProps {
  children: React.ReactNode;
}

export function ConditionalProviders({ children }: ConditionalProvidersProps) {
  const pathname = usePathname();

  // 檢查是否為輕量級頁面
  const isLightweightPage = pathname
    ? LIGHTWEIGHT_ROUTES.some(route => pathname.startsWith(route))
    : false;

  // 根據頁面類型返回不同的 Provider
  return (
    <Suspense fallback={<div className='relative z-10 min-h-screen'>{children}</div>}>
      {isLightweightPage ? (
        <MinimalProviders>{children}</MinimalProviders>
      ) : (
        <FullProviders>{children}</FullProviders>
      )}
    </Suspense>
  );
}
