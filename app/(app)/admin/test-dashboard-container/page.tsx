/**
 * Dashboard Container 測試頁面
 * 用於驗證新的 Card 載入機制和 Dashboard 容器
 */

'use client';

import React, { useState } from 'react';
import { DashboardContainer } from '@/lib/cards/DashboardContainer';
import { CardLayoutConfig } from '@/lib/cards/types';
import { StatsType } from '@/types/generated/graphql';

export default function TestDashboardContainerPage() {
  // 初始佈局配置
  const [layout, setLayout] = useState<CardLayoutConfig[]>([
    {
      id: 'stats-1',
      type: 'stats',
      gridArea: '1 / 1 / 2 / 4',
      config: {
        statTypes: [
          StatsType.PalletCount,
          StatsType.TransferCount,
          StatsType.InventoryLevel,
        ] as StatsType[],
        columns: 3,
        showTrend: true,
        showComparison: true,
      },
    },
    {
      id: 'chart-1',
      type: 'chart',
      gridArea: '2 / 1 / 3 / 3',
      height: '400px',
      config: {
        chartTypes: ['line', 'bar'],
        dataSource: 'inventory',
        title: 'Inventory Trends',
        showLegend: true,
      },
    },
    {
      id: 'list-1',
      type: 'list',
      gridArea: '2 / 3 / 3 / 4',
      height: '400px',
      config: {
        listType: 'recent-orders',
        pageSize: 10,
        showPagination: true,
      },
    },
    {
      id: 'upload-1',
      type: 'upload',
      gridArea: '3 / 1 / 4 / 2',
      config: {
        uploadType: 'product-images',
        maxFiles: 5,
        acceptedFormats: ['image/*'],
      },
    },
  ]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  // 處理 Card 掛載
  const handleCardMount = (cardId: string, cardType: string) => {
    console.log(`[TestPage] Card mounted: ${cardType} (${cardId})`);
  };

  // 處理 Card 錯誤
  const handleCardError = (cardId: string, error: Error) => {
    console.error(`[TestPage] Card error: ${cardId}`, error);
  };

  // 處理佈局變更
  const handleLayoutChange = (newLayout: CardLayoutConfig[]) => {
    setLayout(newLayout);
    console.log('[TestPage] Layout changed:', newLayout);
  };

  // 添加新 Card
  const handleCardAdd = (type: string) => {
    const newCard: CardLayoutConfig = {
      id: `${type}-${Date.now()}`,
      type,
      config: {},
    };
    setLayout([...layout, newCard]);
  };

  // 移除 Card
  const handleCardRemove = (cardId: string) => {
    setLayout(layout.filter(item => item.id !== cardId));
  };

  // 獲取性能統計
  const fetchPerformanceStats = async () => {
    const { CardLoader } = await import('@/lib/cards/CardLoader');
    const stats = CardLoader.getStats();
    setPerformanceMetrics(stats);
  };

  return (
    <div className="p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Container Test</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing new Card loading mechanism
          </p>
        </div>
        
        {/* 控制按鈕 */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-4 py-2 rounded ${
              isEditMode 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            {isEditMode ? 'Exit Edit Mode' : 'Edit Mode'}
          </button>
          
          <button
            onClick={fetchPerformanceStats}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Show Performance
          </button>
        </div>
      </div>

      {/* 性能指標顯示 */}
      {performanceMetrics && (
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Performance Metrics</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Cached Cards:</span>
              <span className="ml-2 font-mono">{performanceMetrics.cachedCards}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Loading Cards:</span>
              <span className="ml-2 font-mono">{performanceMetrics.loadingCards}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Avg Load Time:</span>
              <span className="ml-2 font-mono">
                {performanceMetrics.averageLoadTime.toFixed(2)}ms
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard 容器 */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <DashboardContainer
          layout={layout}
          route="/admin/test-dashboard-container"
          config={{
            errorBoundary: true,
            performanceTracking: true,
          }}
          isEditMode={isEditMode}
          onCardMount={handleCardMount}
          onCardError={handleCardError}
          onLayoutChange={handleLayoutChange}
          onCardAdd={handleCardAdd}
          onCardRemove={handleCardRemove}
        />
      </div>

      {/* 佈局配置顯示 */}
      <details className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
        <summary className="cursor-pointer font-semibold">
          Current Layout Configuration
        </summary>
        <pre className="mt-2 text-xs overflow-auto">
          {JSON.stringify(layout, null, 2)}
        </pre>
      </details>

      {/* 說明文字 */}
      <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
        <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          Test Instructions
        </h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
          <li>Click "Edit Mode" to enable card management features</li>
          <li>In edit mode, hover over cards to see remove button</li>
          <li>Click the "+" button to add new cards</li>
          <li>Click "Show Performance" to view loading statistics</li>
          <li>Check browser console for detailed logs</li>
        </ul>
      </div>
    </div>
  );
}