'use client';

import { type ReactNode } from 'react';
import { AccessibilityProvider } from '@/lib/accessibility';
import { ClientVisualSystemProvider } from '@/app/components/visual-system/core/ClientVisualSystemProvider';
import { ApolloProvider } from '@/lib/graphql/apollo-provider';

/**
 * FullProviders Component
 * 應用頁面的完整 Provider - 包含所有功能（星空背景已在 ClientVisualSystemProvider 中）
 *
 * 整合了以下 Provider：
 * - AccessibilityProvider: WCAG 2.1 AA 合規的無障礙性支援
 * - ApolloProvider: GraphQL 資料管理與快取
 * - ClientVisualSystemProvider: 視覺效果與背景系統
 *
 * @param children - 子組件
 * @returns 包含所有必要 Provider 的組件
 */

interface FullProvidersProps {
  readonly children: ReactNode;
}

export function FullProviders({ children }: FullProvidersProps) {
  return (
    <AccessibilityProvider>
      <ApolloProvider>
        <ClientVisualSystemProvider>
          <div className='relative z-10 min-h-screen'>{children}</div>
        </ClientVisualSystemProvider>
      </ApolloProvider>
    </AccessibilityProvider>
  );
}
