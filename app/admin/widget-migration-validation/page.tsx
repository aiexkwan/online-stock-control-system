'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { widgetRegistry } from '@/lib/widgets/enhanced-registry';
import { migrationTracker } from '@/lib/widgets/migration-adapter';

interface TestResult {
  widgetId: string;
  status: 'pending' | 'testing' | 'passed' | 'failed';
  loadTime?: number;
  error?: string;
  timestamp?: string;
}

interface CategoryTestResults {
  [category: string]: TestResult[];
}

export default function WidgetMigrationValidationPage() {
  const [testResults, setTestResults] = useState<CategoryTestResults>({});
  const [isRunning, setIsRunning] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string>('');
  const [registryStats, setRegistryStats] = useState<any>(null);

  // Widget categories to test
  const categories = [
    { id: 'stats', name: 'Stats Widgets', count: 5 },
    { id: 'charts', name: 'Charts Widgets', count: 7 },
    { id: 'lists', name: 'Lists Widgets', count: 8 },
    { id: 'reports', name: 'Reports Widgets', count: 8 },
    { id: 'operations', name: 'Operations Widgets', count: 5 },
    { id: 'analysis', name: 'Analysis Widgets', count: 3 },
  ];

  // Initialize registry
  useEffect(() => {
    const initRegistry = async () => {
      try {
        await widgetRegistry.autoRegisterWidgets();
        const stats = widgetRegistry.getLoadStatistics();
        setRegistryStats({
          totalWidgets: stats.size,
          loadedWidgets: Array.from(stats.values()).filter(w => w.loadStatus === 'loaded').length,
        });
      } catch (error) {
        console.error('Failed to initialize registry:', error);
      }
    };
    initRegistry();
  }, []);

  // Test a single widget
  const testWidget = async (widgetId: string, category: string): Promise<TestResult> => {
    const startTime = performance.now();
    
    try {
      // Get widget definition
      const definition = widgetRegistry.getDefinition(widgetId);
      if (!definition) {
        throw new Error('Widget not found in registry');
      }

      // Test component loading
      const component = widgetRegistry.getComponent(widgetId);
      if (!component) {
        throw new Error('Widget component not available');
      }

      // Preload widget
      await widgetRegistry.preloadWidgets([widgetId]);

      const loadTime = performance.now() - startTime;

      return {
        widgetId,
        status: 'passed',
        loadTime: Math.round(loadTime * 100) / 100,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        widgetId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  };

  // Test all widgets in a category
  const testCategory = async (categoryId: string) => {
    setIsRunning(true);
    setCurrentCategory(categoryId);

    const widgets = widgetRegistry.getByCategory(categoryId as any);
    const results: TestResult[] = [];

    // Initialize all widgets as pending
    widgets.forEach(widget => {
      results.push({
        widgetId: widget.id,
        status: 'pending',
      });
    });

    setTestResults(prev => ({
      ...prev,
      [categoryId]: results,
    }));

    // Test each widget
    for (let i = 0; i < widgets.length; i++) {
      const widget = widgets[i];
      
      // Update status to testing
      setTestResults(prev => ({
        ...prev,
        [categoryId]: prev[categoryId].map((r, idx) => 
          idx === i ? { ...r, status: 'testing' } : r
        ),
      }));

      // Run test
      const result = await testWidget(widget.id, categoryId);

      // Update with result
      setTestResults(prev => ({
        ...prev,
        [categoryId]: prev[categoryId].map((r, idx) => 
          idx === i ? result : r
        ),
      }));

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsRunning(false);
    setCurrentCategory('');
  };

  // Test all categories
  const testAll = async () => {
    for (const category of categories) {
      await testCategory(category.id);
    }
  };

  // Generate validation report
  const generateReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      registryStats,
      testResults,
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        avgLoadTime: 0,
      },
    };

    // Calculate summary
    Object.values(testResults).forEach(categoryResults => {
      categoryResults.forEach(result => {
        report.summary.total++;
        if (result.status === 'passed') {
          report.summary.passed++;
          if (result.loadTime) {
            report.summary.avgLoadTime += result.loadTime;
          }
        } else if (result.status === 'failed') {
          report.summary.failed++;
        }
      });
    });

    if (report.summary.passed > 0) {
      report.summary.avgLoadTime /= report.summary.passed;
    }

    console.log('Validation Report:', report);
    
    // Download as JSON
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `widget-validation-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // Get status icon
  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'testing':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  // Get category stats
  const getCategoryStats = (categoryId: string) => {
    const results = testResults[categoryId] || [];
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const avgLoadTime = results
      .filter(r => r.status === 'passed' && r.loadTime)
      .reduce((sum, r) => sum + (r.loadTime || 0), 0) / (passed || 1);

    return { passed, failed, avgLoadTime: avgLoadTime.toFixed(2) };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Widget Migration Validation</h1>
        <div className="flex gap-4">
          <Button 
            onClick={testAll} 
            disabled={isRunning}
            variant="default"
          >
            Test All Widgets
          </Button>
          <Button 
            onClick={generateReport}
            variant="outline"
            disabled={Object.keys(testResults).length === 0}
          >
            Generate Report
          </Button>
        </div>
      </div>

      {/* Registry Status */}
      <Card>
        <CardHeader>
          <CardTitle>Registry Status</CardTitle>
        </CardHeader>
        <CardContent>
          {registryStats ? (
            <div className="flex gap-6">
              <div>
                <p className="text-sm text-gray-500">Total Widgets</p>
                <p className="text-2xl font-bold">{registryStats.totalWidgets}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Loaded</p>
                <p className="text-2xl font-bold text-green-500">{registryStats.loadedWidgets}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Initializing registry...</p>
          )}
        </CardContent>
      </Card>

      {/* Category Tests */}
      <Tabs defaultValue={categories[0].id}>
        <TabsList className="grid grid-cols-6 w-full">
          {categories.map(category => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.name}
              {testResults[category.id] && (
                <Badge variant="secondary" className="ml-2">
                  {getCategoryStats(category.id).passed}/{category.count}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category.id} value={category.id}>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{category.name} Test Results</CardTitle>
                  <Button
                    onClick={() => testCategory(category.id)}
                    disabled={isRunning}
                    size="sm"
                  >
                    {currentCategory === category.id ? 'Testing...' : 'Run Tests'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {testResults[category.id] ? (
                  <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-gray-50 rounded">
                        <p className="text-sm text-gray-500">Passed</p>
                        <p className="text-2xl font-bold text-green-500">
                          {getCategoryStats(category.id).passed}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded">
                        <p className="text-sm text-gray-500">Failed</p>
                        <p className="text-2xl font-bold text-red-500">
                          {getCategoryStats(category.id).failed}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded">
                        <p className="text-sm text-gray-500">Avg Load Time</p>
                        <p className="text-2xl font-bold">
                          {getCategoryStats(category.id).avgLoadTime}ms
                        </p>
                      </div>
                    </div>

                    {/* Test Results */}
                    <div className="space-y-2">
                      {testResults[category.id].map(result => (
                        <div
                          key={result.widgetId}
                          className={`flex items-center justify-between p-3 rounded border ${
                            result.status === 'failed' ? 'border-red-200 bg-red-50' :
                            result.status === 'passed' ? 'border-green-200 bg-green-50' :
                            result.status === 'testing' ? 'border-blue-200 bg-blue-50' :
                            'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {getStatusIcon(result.status)}
                            <span className="font-medium">{result.widgetId}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            {result.loadTime && (
                              <span className="text-sm text-gray-500">
                                {result.loadTime}ms
                              </span>
                            )}
                            {result.error && (
                              <span className="text-sm text-red-500">
                                {result.error}
                              </span>
                            )}
                            {result.timestamp && (
                              <span className="text-xs text-gray-400">
                                {new Date(result.timestamp).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Click &quot;Run Tests&quot; to validate widgets in this category
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}