import React from 'react';
import { StarfieldBackground } from '@/app/components/StarfieldBackground';

// Auth Layout - 使用統一星空背景系統，確保視覺一致性
export default function AuthLayout({ children }: { children?: React.ReactNode }) {
  const safeChildren = children || null;

  return <StarfieldBackground>{safeChildren}</StarfieldBackground>;
}
