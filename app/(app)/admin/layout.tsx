/**
 * Admin Layout
 * 為 Admin 頁面提供 Dialog Context、Upload Refresh Context 和 QueryClient
 * Updated: 添加統一背景系統確保視覺一致性
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DialogProvider } from '@/app/contexts/DialogContext';
import { UploadRefreshProvider } from './contexts/UploadRefreshContext';
import { DynamicApolloProvider } from '@/lib/graphql/apollo-provider-dynamic';
import { UnifiedBackground } from '@/app/components/visual-system/core/UnifiedBackground';
import './styles/page-flip-animation.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
      retry: 3,
      retryDelay: 1000,
    },
  },
});

export default function AdminLayout({ children }: { children?: React.ReactNode }) {
  // Next.js 15 兼容性修復
  const safeChildren = children || (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='text-center'>
        <h1 className='mb-4 text-2xl font-bold'>Admin Loading</h1>
        <p className='text-slate-400'>Please wait...</p>
      </div>
    </div>
  );

  return (
    <>
      {/* 🎯 統一背景系統 - 確保Admin區域視覺一致性 */}
      <UnifiedBackground />

      {/* Admin Provider 結構 */}
      <div className='relative z-10 min-h-screen'>
        <DynamicApolloProvider>
          <QueryClientProvider client={queryClient}>
            <DialogProvider>
              <UploadRefreshProvider>{safeChildren}</UploadRefreshProvider>
            </DialogProvider>
          </QueryClientProvider>
        </DynamicApolloProvider>
      </div>
    </>
  );
}
