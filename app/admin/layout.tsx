/**
 * Admin Layout
 * 為 Admin 頁面提供 Dialog Context 和 Upload Refresh Context
 */

'use client';

import { DialogProvider } from '@/app/contexts/DialogContext';
import { UploadRefreshProvider } from './contexts/UploadRefreshContext';
import './styles/page-flip-animation.css';

export default function AdminLayout({ children }: { children?: React.ReactNode }) {
  // Next.js 15 兼容性修復
  const safeChildren = children || (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Admin Loading</h1>
        <p className="text-slate-400">Please wait...</p>
      </div>
    </div>
  );

  return (
    <DialogProvider>
      <UploadRefreshProvider>{safeChildren}</UploadRefreshProvider>
    </DialogProvider>
  );
}
