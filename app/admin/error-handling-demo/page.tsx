/**
 * Error Handling Demo Page
 * 錯誤處理演示頁面路由
 */

import { Metadata } from 'next';
import ErrorHandlingDemo from '../examples/error-handling-demo';
import { UniversalProvider } from '@/components/layout/universal';

export const metadata: Metadata = {
  title: 'Error Handling Demo - NewPennine WMS',
  description: 'Demonstration of unified error handling system',
};

export default function ErrorHandlingDemoPage() {
  return (
    <UniversalProvider
      enableErrorHandling={true}
      enableLoadingManagement={true}
      debugMode={true}
    >
      <ErrorHandlingDemo />
    </UniversalProvider>
  );
}