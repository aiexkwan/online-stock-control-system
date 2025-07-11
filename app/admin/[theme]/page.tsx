/**
 * Admin Dashboard Theme Pages - SSR Enhanced
 * 動態路由處理所有 admin 子頁面
 * Week 2 Day 2: 添加 Critical Widgets SSR 支持
 */

import { AdminRefreshProvider } from '../contexts/AdminRefreshContext';
import { AdminErrorBoundary } from '../components/AdminErrorBoundary';
import { NewAdminDashboard } from '../components/NewAdminDashboard';
import { prefetchCriticalWidgetsData } from '../hooks/server/prefetch.server';

interface AdminThemePageProps {
  params: {
    theme: string;
  };
}

export default async function AdminThemePage({ params }: AdminThemePageProps) {
  const { theme } = params;
  
  // Server-side data prefetching for Critical Path Widgets
  // 服務器端預取 Critical Path Widgets 數據
  let prefetchedData = null;
  let ssrMode = false;

  try {
    // 只為包含 Critical Widgets 的主題預取數據
    const criticalThemes = ['injection', 'pipeline', 'warehouse'];
    
    if (criticalThemes.includes(theme)) {
      console.log(`[SSR] Prefetching critical widgets data for theme: ${theme}`);
      
      prefetchedData = await prefetchCriticalWidgetsData({
        dateRange: {
          startDate: null, // 使用默認日期範圍
          endDate: null,
        },
        criticalOnly: true,
      });
      
      ssrMode = true;
      
      console.log(`[SSR] Successfully prefetched ${Object.keys(prefetchedData).length} critical widgets`);
    }
  } catch (error) {
    console.error('[SSR] Critical widgets prefetch failed, falling back to CSR:', error);
    // Graceful degradation - 如果 SSR 失敗，回退到 CSR
    prefetchedData = null;
    ssrMode = false;
  }

  return (
    <AdminErrorBoundary>
      <AdminRefreshProvider>
        <NewAdminDashboard 
          prefetchedData={prefetchedData}
          ssrMode={ssrMode}
        />
      </AdminRefreshProvider>
    </AdminErrorBoundary>
  );
}

// 生成靜態路徑
export async function generateStaticParams() {
  return [
    { theme: 'injection' },
    { theme: 'pipeline' },
    { theme: 'warehouse' },
    { theme: 'upload' },
    { theme: 'update' },
    { theme: 'stock-management' },
    { theme: 'system' },
    { theme: 'analysis' },
  ];
}
