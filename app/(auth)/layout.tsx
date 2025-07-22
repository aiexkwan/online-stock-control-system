import React from 'react';
import { MinimalBackground } from '@/app/components/MinimalBackground';

// 極簡 Auth Layout - 只有背景，無任何其他 Provider
// 修正：不重新定義 html/body，只提供內容包裝
export default function AuthLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  const safeChildren = children || null;
  
  return (
    <>
      <MinimalBackground />
      {safeChildren}
    </>
  );
}