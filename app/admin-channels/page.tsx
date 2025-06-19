/**
 * Admin Panel Page - Channel 版本
 * 使用 Channel 訂閱系統的新版 Admin Dashboard
 */

'use client';

import React from 'react';
import { AdminPageClientChannels } from '../admin/components/AdminPageClientChannels';
import { DialogProvider } from '@/app/contexts/DialogContext';

export default function AdminChannelsPage() {
  return (
    <DialogProvider>
      <AdminPageClientChannels />
    </DialogProvider>
  );
}