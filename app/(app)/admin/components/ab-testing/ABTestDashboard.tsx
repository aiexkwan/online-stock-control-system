/**
 * A/B Testing Dashboard
 * A/B 測試管理和監控界面
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  BeakerIcon, 
  ChartBarIcon, 
  PlayIcon, 
  PauseIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { abTestManager } from '@/lib/ab-testing/ABTestManager';

interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  variants: Array<{
    id: string;
    name: string;
    weight: number;
    config: Record<string, any>;
  }>;
  traffic: number;
  startDate: Date;
  endDate?: Date;
  enabled: boolean;
}

export const ABTestDashboard: React.FC = () => {
  const [tests, setTests] = useState<ABTestConfig[]>([]);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);

  // 初始化預設的 Widget → Card 遷移測試
  useEffect(() => {
    initializeWidgetMigrationTests();
    refreshStats();
  }, []);

  const initializeWidgetMigrationTests = () => {
    const migrationTests = [
      {
        id: 'widget-migration-table',
        name: 'TableWidget → TableCard Migration',
        description: 'A/B test for migrating table widgets to unified card architecture',
        variants: [
          {
            id: 'widget',
            name: 'Original Widget',
            weight: 50,
            config: { useCard: false }
          },
          {
            id: 'card',
            name: 'New Card',
            weight: 50,
            config: { useCard: true }
          }
        ],
        traffic: 20, // 只對 20% 用戶進行測試
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天
        enabled: true
      },
      {
        id: 'widget-migration-form',
        name: 'FormWidget → FormCard Migration',
        description: 'A/B test for migrating form widgets to unified card architecture',
        variants: [
          {
            id: 'widget',
            name: 'Original Widget',
            weight: 70,
            config: { useCard: false }
          },
          {
            id: 'card',
            name: 'New Card',
            weight: 30,
            config: { useCard: true }
          }
        ],
        traffic: 10, // 保守的 10% 測試
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14天
        enabled: false // 暫時關閉
      }
    ];

    // 註冊測試到管理器
    migrationTests.forEach(test => {
      try {
        abTestManager.registerTest(test);
      } catch (error) {
        console.warn(`Failed to register test ${test.id}:`, error);
      }
    });

    setTests(migrationTests);
  };

  const refreshStats = () => {
    const newStats: Record<string, any> = {};
    tests.forEach(test => {
      newStats[test.id] = abTestManager.getTestStats(test.id);
    });
    setStats(newStats);
  };

  const toggleTest = (testId: string) => {
    setTests(prev => prev.map(test => 
      test.id === testId 
        ? { ...test, enabled: !test.enabled }
        : test
    ));
    // 這裡應該調用 API 更新測試狀態
  };

  const getStatusColor = (test: ABTestConfig) => {
    if (!test.enabled) return 'bg-gray-500';
    
    const now = new Date();
    if (now < test.startDate) return 'bg-blue-500';
    if (test.endDate && now > test.endDate) return 'bg-red-500';
    return 'bg-green-500';
  };

  const getStatusText = (test: ABTestConfig) => {
    if (!test.enabled) return 'Paused';
    
    const now = new Date();
    if (now < test.startDate) return 'Scheduled';
    if (test.endDate && now > test.endDate) return 'Ended';
    return 'Running';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <BeakerIcon className="mr-3 h-8 w-8 text-blue-500" />
          A/B Testing Dashboard
        </h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Test
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center">
            <BeakerIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Tests</p>
              <p className="text-2xl font-bold text-gray-900">
                {tests.filter(t => t.enabled).length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Participants</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(stats).reduce((sum: number, stat: any) => sum + (stat?.totalUsers || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center">
            <EyeIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Migration Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {tests.filter(t => t.id.includes('migration') && t.enabled).length}/
                {tests.filter(t => t.id.includes('migration')).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tests List */}
      <div className="rounded-lg bg-white shadow-md">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Test Configuration</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {tests.map(test => (
            <div key={test.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`h-3 w-3 rounded-full ${getStatusColor(test)}`}></div>
                    <h4 className="text-lg font-medium text-gray-900">{test.name}</h4>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      {getStatusText(test)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{test.description}</p>
                  
                  {/* Test Configuration */}
                  <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div>
                      <span className="text-xs text-gray-500">Traffic</span>
                      <p className="font-medium">{test.traffic}%</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Variants</span>
                      <p className="font-medium">{test.variants.length}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Participants</span>
                      <p className="font-medium">{stats[test.id]?.totalUsers || 0}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Duration</span>
                      <p className="font-medium">
                        {test.endDate 
                          ? Math.ceil((test.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) + 'd'
                          : 'Ongoing'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Variants Stats */}
                  {stats[test.id] && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Variant Performance</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {test.variants.map(variant => {
                          const variantStats = stats[test.id]?.variantStats?.[variant.id];
                          return (
                            <div key={variant.id} className="rounded border p-2">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">{variant.name}</span>
                                <span className="text-xs text-gray-500">{variant.weight}%</span>
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                Users: {variantStats?.users || 0} | 
                                Events: {Object.values(variantStats?.events || {}).reduce((a: number, b: unknown) => a + (typeof b === 'number' ? b : 0), 0)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => refreshStats()}
                    className="rounded-md p-2 text-gray-400 hover:text-gray-600"
                    title="Refresh Stats"
                  >
                    <ChartBarIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => toggleTest(test.id)}
                    className={`rounded-md p-2 ${
                      test.enabled 
                        ? 'text-red-600 hover:text-red-800' 
                        : 'text-green-600 hover:text-green-800'
                    }`}
                    title={test.enabled ? 'Pause Test' : 'Resume Test'}
                  >
                    {test.enabled ? (
                      <PauseIcon className="h-5 w-5" />
                    ) : (
                      <PlayIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Example */}
      <div className="rounded-lg bg-blue-50 p-6">
        <h3 className="mb-2 text-lg font-semibold text-blue-900">Usage Example</h3>
        <div className="text-blue-800">
          <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`// 在組件中使用 Widget → Card A/B 測試
import { useWidgetMigration } from '@/lib/ab-testing/useABTest';

function MyComponent({ userId }: { userId: string }) {
  const { useCard, recordInteraction } = useWidgetMigration({
    widgetId: 'table',
    userId,
  });

  const handleClick = () => {
    recordInteraction('click', { button: 'export' });
  };

  return useCard ? (
    <TableCard onClick={handleClick} />
  ) : (
    <TableWidget onClick={handleClick} />
  );
}`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ABTestDashboard;