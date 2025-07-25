/**
 * Performance Monitor Test Page
 * 測試性能監控系統
 */

'use client';

import React, { useEffect } from 'react';
import PerformanceMonitorDashboard from '@/app/(app)/admin/components/monitoring/PerformanceMonitorDashboard';
import { cardPerformanceMonitor } from '@/lib/monitoring/performance-monitor';

export default function TestPerformanceMonitorPage() {
  // 模擬一些性能數據用於測試
  useEffect(() => {
    const simulateCardLoads = () => {
      // 模擬各種 Card 載入時間
      const cardTypes = ['table', 'chart', 'stats', 'analysis', 'other-files'];
      
      cardTypes.forEach((cardType, index) => {
        setTimeout(() => {
          cardPerformanceMonitor.startCardLoad(cardType);
          
          // 模擬不同的載入時間
          const loadTime = Math.random() * 500 + 50; // 50-550ms
          
          setTimeout(() => {
            cardPerformanceMonitor.endCardLoad(cardType, {
              dataSource: `mock_${cardType}`,
              complexity: index % 3 === 0 ? 'high' : 'medium'
            });
          }, loadTime);
        }, index * 100);
      });
    };

    const simulateQueries = () => {
      const queries = [
        'tableCardData',
        'chartData', 
        'statsData',
        'analysisData',
        'otherFiles'
      ];

      queries.forEach((query, index) => {
        setTimeout(() => {
          const queryTime = Math.random() * 200 + 20; // 20-220ms
          const cacheHit = Math.random() > 0.3; // 70% 緩存命中率
          
          cardPerformanceMonitor.recordQueryTime(query, queryTime, cacheHit);
        }, index * 150);
      });
    };

    const simulateBundleSizes = () => {
      const cards = ['table', 'chart', 'stats', 'analysis', 'other-files'];
      
      cards.forEach(card => {
        const size = Math.random() * 50000 + 10000; // 10-60KB
        cardPerformanceMonitor.recordBundleSize(card, size);
      });
    };

    // 初始化模擬數據
    simulateCardLoads();
    simulateQueries();
    simulateBundleSizes();

    // 每 3 秒產生新的模擬數據
    const interval = setInterval(() => {
      simulateCardLoads();
      simulateQueries();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Performance Monitor Test
          </h1>
          <p className="mt-2 text-gray-600">
            測試 Card 系統性能監控功能，包含模擬數據和實時更新
          </p>
        </div>

        {/* 性能監控面板 */}
        <PerformanceMonitorDashboard />

        {/* 測試說明 */}
        <div className="mt-8 rounded-lg bg-blue-50 p-6">
          <h3 className="mb-2 text-lg font-semibold text-blue-900">測試說明</h3>
          <div className="text-blue-800">
            <ul className="list-disc list-inside space-y-1">
              <li>頁面會自動模擬 Card 載入時間 (50-550ms)</li>
              <li>模擬 GraphQL 查詢性能 (20-220ms)</li>
              <li>模擬 70% 緩存命中率</li>
              <li>每 3 秒產生新的模擬數據</li>
              <li>監控面板每 2 秒自動更新</li>
            </ul>
          </div>
        </div>

        {/* 實際使用示例 */}
        <div className="mt-8 rounded-lg bg-green-50 p-6">
          <h3 className="mb-2 text-lg font-semibold text-green-900">實際使用方式</h3>
          <div className="text-green-800">
            <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`// 在 Card 組件中集成性能監控
import { startCardLoad, endCardLoad, recordQueryTime } from '@/lib/monitoring/performance-monitor';

// 開始載入監控
useEffect(() => {
  startCardLoad('my-card');
  
  // 載入完成時
  return () => {
    endCardLoad('my-card', { dataSource: 'my_data' });
  };
}, []);

// GraphQL 查詢監控
const { data, loading } = useQuery(MY_QUERY, {
  onCompleted: (data) => {
    const queryTime = performance.now() - queryStartTime;
    recordQueryTime('MY_QUERY', queryTime, data?._cache);
  }
});`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}