/**
 * Admin Dashboard Theme Pages - SSR Enhanced
 * 動態路由處理所有 admin 子頁面
 * v2.0.2: 實施主題簡化，11個主題合併為3個
 */

import { redirect } from 'next/navigation';
import { AdminRefreshProvider } from '../contexts/AdminRefreshContext';
import { AdminErrorBoundary } from '../components/AdminErrorBoundary';
import { NewAdminDashboard } from '../components/NewAdminDashboard';
import { prefetchCriticalWidgetsData } from '../hooks/server/prefetch.server';
import { getMappedTheme, isActiveTheme } from '../config/theme-mapping';

interface AdminThemePageProps {
  params: Promise<{
    theme: string;
  }>;
}

export default async function AdminThemePage({ params }: AdminThemePageProps) {
  const { theme } = await params;
  
  // v2.0.2: 檢查是否需要重定向到新主題
  if (!isActiveTheme(theme)) {
    const mappedTheme = getMappedTheme(theme);
    redirect(`/admin/${mappedTheme}`);
  }
  
  // Server-side data prefetching for Critical Path Widgets
  // 服務器端預取 Critical Path Widgets 數據
  let prefetchedData = null;
  let ssrMode = false;

  try {
    // 只為包含 Critical Widgets 的主題預取數據
    // v2.0.2: 更新為使用新主題名
    const criticalThemes = ['operations-monitoring'];
    
    if (criticalThemes.includes(theme)) {
      console.log(`[SSR as string] Prefetching critical widgets data for theme: ${theme}`);
      
      prefetchedData = await prefetchCriticalWidgetsData({
        dateRange: {
          startDate: null, // 使用默認日期範圍
          endDate: null,
        },
        criticalOnly: true,
      });
      
      ssrMode = true;
      
      console.log(`[SSR as string] Successfully prefetched ${Object.keys(prefetchedData).length} critical widgets`);
    }
  } catch (error) {
    console.error('[SSR as string] Critical widgets prefetch failed, falling back to CSR:', error);
    // Graceful degradation - 如果 SSR 失敗，回退到 CSR
    prefetchedData = undefined;
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

// 生成靜態路徑 - v2.0.2: 只生成3個活躍主題
export async function generateStaticParams() {
  return [
    { theme: 'operations-monitoring' },
    { theme: 'data-management' },
    { theme: 'analytics' },
  ];
}
