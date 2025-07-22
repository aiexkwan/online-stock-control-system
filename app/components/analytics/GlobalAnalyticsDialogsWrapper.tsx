/**
 * GlobalAnalyticsDialogs Wrapper
 * Ensures analytics dialogs are only loaded on client side
 */

'use client';

import dynamic from 'next/dynamic';

// Dynamically import to ensure client-only loading
const GlobalAnalyticsDialogs = dynamic(
  () => import('./GlobalAnalyticsDialogs').then(mod => mod.GlobalAnalyticsDialogs),
  { 
    ssr: false,
    loading: () => null
  }
);

export function GlobalAnalyticsDialogsWrapper() {
  return <GlobalAnalyticsDialogs />;
}