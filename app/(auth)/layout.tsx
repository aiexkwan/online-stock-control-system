import React from 'react';
import { UniversalBackground } from '@/app/components/UniversalBackground';

// Auth Layout - 使用統一星空背景系統，確保視覺一致性
export default function AuthLayout({ children }: { children?: React.ReactNode }) {
  const safeChildren = children || null;

  return <UniversalBackground>{safeChildren}</UniversalBackground>;
}
