'use client';

import React from 'react';
import { AccessibilityProvider } from '@/lib/accessibility';
import { ClientVisualSystemProvider } from '@/app/components/visual-system/core/ClientVisualSystemProvider';
import { ApolloProvider } from '@/lib/graphql/apollo-provider';

// 應用頁面的完整 Provider - 包含所有功能（星空背景已在 ClientVisualSystemProvider 中）
export function FullProviders({ children }: { children: React.ReactNode }) {
  return (
    <AccessibilityProvider>
      <ApolloProvider>
        <ClientVisualSystemProvider>
          <div className="min-h-screen relative z-10">
            {children}
          </div>
        </ClientVisualSystemProvider>
      </ApolloProvider>
    </AccessibilityProvider>
  );
}