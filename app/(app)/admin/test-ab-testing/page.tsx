/**
 * A/B Testing Framework Test Page
 * 測試 A/B 測試框架功能
 */

'use client';

import React, { useState } from 'react';
import ABTestDashboard from '@/app/(app)/admin/components/ab-testing/ABTestDashboard';
import { useWidgetMigration, useABTest, useFeatureFlag } from '@/lib/ab-testing/useABTest';

// 模擬組件展示 A/B 測試
const TestTableComponent: React.FC<{ userId: string }> = ({ userId }) => {
  const { useCard, recordInteraction, isLoading } = useWidgetMigration({
    widgetId: 'table',
    userId,
    onCardRender: () => console.log('Card rendered for user:', userId),
    onWidgetRender: () => console.log('Widget rendered for user:', userId)
  });

  const handleClick = (action: string) => {
    recordInteraction(action, { timestamp: Date.now() });
  };

  if (isLoading) {
    return <div className="p-4 bg-gray-200 rounded animate-pulse">Loading...</div>;
  }

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">
          {useCard ? '🆕 TableCard (New)' : '📊 TableWidget (Original)'}
        </h3>
        <span className={`px-2 py-1 text-xs rounded ${
          useCard ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {useCard ? 'Card Architecture' : 'Widget Architecture'}
        </span>
      </div>
      
      <div className={`p-4 rounded ${
        useCard ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
      }`}>
        <p className="text-sm mb-3">
          {useCard 
            ? '✨ 新的 TableCard 組件 - 統一架構、更好性能、GraphQL 優化'
            : '📋 原始 TableWidget 組件 - 傳統架構、獨立實現'
          }
        </p>
        
        <div className="flex space-x-2">
          <button
            onClick={() => handleClick('export')}
            className={`px-3 py-1 text-sm rounded ${
              useCard 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Export Data
          </button>
          <button
            onClick={() => handleClick('filter')}
            className={`px-3 py-1 text-sm rounded border ${
              useCard 
                ? 'border-green-600 text-green-600 hover:bg-green-50' 
                : 'border-blue-600 text-blue-600 hover:bg-blue-50'
            }`}
          >
            Apply Filter
          </button>
          <button
            onClick={() => handleClick('refresh')}
            className={`px-3 py-1 text-sm rounded border ${
              useCard 
                ? 'border-green-600 text-green-600 hover:bg-green-50' 
                : 'border-blue-600 text-blue-600 hover:bg-blue-50'
            }`}
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

// Feature Flag 測試組件
const FeatureFlagTest: React.FC<{ userId: string }> = ({ userId }) => {
  const { enabled: newFormEnabled } = useFeatureFlag('new-form-ui', userId);
  const { enabled: advancedFilters } = useFeatureFlag('advanced-filters', userId);

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-3">🚩 Feature Flags Test</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span>New Form UI</span>
          <span className={`px-2 py-1 text-xs rounded ${
            newFormEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {newFormEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Advanced Filters</span>
          <span className={`px-2 py-1 text-xs rounded ${
            advancedFilters ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {advancedFilters ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>
    </div>
  );
};

// 自定義 A/B 測試組件
const CustomABTest: React.FC<{ userId: string }> = ({ userId }) => {
  const { variant, recordEvent, isVariant } = useABTest({
    testId: 'button-color-test',
    userId,
    autoTrack: true
  });

  const handleButtonClick = () => {
    recordEvent('button_clicked', { 
      variant,
      timestamp: Date.now()
    });
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-3">🎨 Custom A/B Test - Button Color</h3>
      <div className="mb-3">
        <span className="text-sm text-gray-600">
          Current variant: <strong>{variant || 'Control'}</strong>
        </span>
      </div>
      
      <button
        onClick={handleButtonClick}
        className={`px-4 py-2 rounded font-medium ${
          isVariant('red') 
            ? 'bg-red-500 text-white hover:bg-red-600'
            : isVariant('green')
            ? 'bg-green-500 text-white hover:bg-green-600'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        Test Button
      </button>
    </div>
  );
};

export default function TestABTestingPage() {
  const [currentUserId, setCurrentUserId] = useState('user-001');

  // 模擬不同用戶
  const testUsers = [
    'user-001', 'user-002', 'user-003', 'user-004', 'user-005',
    'admin-001', 'admin-002', 'manager-001', 'manager-002', 'operator-001'
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          A/B Testing Framework Test
        </h1>

        {/* User Selector */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Test User Selection</h2>
          <div className="flex flex-wrap gap-2">
            {testUsers.map(userId => (
              <button
                key={userId}
                onClick={() => setCurrentUserId(userId)}
                className={`px-3 py-2 text-sm rounded border ${
                  currentUserId === userId
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {userId}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Current user: <strong>{currentUserId}</strong>
          </p>
        </div>

        {/* Test Components */}
        <div className="mb-8 space-y-6">
          <TestTableComponent userId={currentUserId} />
          <FeatureFlagTest userId={currentUserId} />
          <CustomABTest userId={currentUserId} />
        </div>

        {/* A/B Testing Dashboard */}
        <ABTestDashboard />

        {/* Usage Instructions */}
        <div className="mt-8 rounded-lg bg-blue-50 p-6">
          <h3 className="mb-2 text-lg font-semibold text-blue-900">測試說明</h3>
          <div className="text-blue-800">
            <ul className="list-disc list-inside space-y-1">
              <li>切換不同用戶查看 A/B 測試分配結果</li>
              <li>點擊組件按鈕記錄用戶互動事件</li>
              <li>查看 Dashboard 中的測試統計數據</li>
              <li>測試 Widget → Card 遷移的平滑切換</li>
              <li>驗證 Feature Flag 功能的開關控制</li>
            </ul>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-8 rounded-lg bg-green-50 p-6">
          <h3 className="mb-2 text-lg font-semibold text-green-900">技術特點</h3>
          <div className="text-green-800">
            <ul className="list-disc list-inside space-y-1">
              <li>✅ 一致性用戶分配 (基於用戶 ID 哈希)</li>
              <li>✅ 流量控制 (可設定參與測試的用戶比例)</li>
              <li>✅ 多變體支援 (支援 A/B/C/D... 測試)</li>
              <li>✅ 事件追蹤 (記錄用戶互動和轉換)</li>
              <li>✅ React Hook 整合 (易於在組件中使用)</li>
              <li>✅ 即時統計 (實時查看測試結果)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}