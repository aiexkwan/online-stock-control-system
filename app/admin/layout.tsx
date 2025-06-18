/**
 * Admin Layout
 * 為 Admin 頁面提供 Dialog Context
 */

'use client';

import { DialogProvider } from '@/app/contexts/DialogContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DialogProvider>
      {children}
    </DialogProvider>
  );
}