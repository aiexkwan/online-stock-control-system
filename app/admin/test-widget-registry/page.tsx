/**
 * Widget Registry Test Page
 * 用於測試第一階段實施的頁面
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useWidgetRegistry,
  useWidgetPerformance,
  widgetRegistry,
  layoutCompatibilityManager,
  dualLoadingAdapter,
  getDualLoadingConfig,
  useDualLoadingPerformance
} from '@/lib/widgets';
import { adminDashboardLayouts } from '@/app/admin/components/dashboard/adminDashboardLayouts';
import { captureThemeLayout } from '@/lib/widgets/layout-snapshot';

export default function TestWidgetRegistryPage() {
  const { isReady, error } = useWidgetRegistry();
  const performanceStats = useWidgetPerformance();
  const dualLoadingStats = useDualLoadingPerformance();
  const [selectedTheme, setSelectedTheme] = useState('overview');
  const [layoutValidation, setLayoutValidation] = useState<any>(null);
  const [layoutBaseline, setLayoutBaseline] = useState<any>(null);

  // 加載布局基準
  useEffect(() => {
    fetch('/widget-registry/layout-baseline.json')
      .then(res => res.json())
      .then(data => setLayoutBaseline(data))
      .catch(err => console.error('Failed to load layout baseline:', err));
  }, []);

  // 測試布局兼容性
  const testLayoutCompatibility = () => {
    if (!layoutBaseline) {
      console.error('Layout baseline not loaded');
      return;
    }

    const originalLayout = adminDashboardLayouts[selectedTheme];
    const capturedLayout = captureThemeLayout(selectedTheme, originalLayout);
    const baselineLayout = layoutBaseline.snapshots[selectedTheme];
    
    // 與基準比較
    const isValid = layoutCompatibilityManager.validateLayoutIntegrity(
      baselineLayout || [],
      capturedLayout
    );
    
    setLayoutValidation({
      theme: selectedTheme,
      originalCount: originalLayout.widgets.length,
      capturedCount: capturedLayout.length,
      baselineCount: baselineLayout?.length || 0,
      isValid,
      timestamp: new Date().toISOString()
    });
  };

  // 獲取所有註冊的 widgets
  const getAllWidgets = () => {
    const definitions = widgetRegistry.getAllDefinitions();
    return Array.from(definitions.entries()).map(([_, def]) => ({
      ...def
    }));
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="bg-red-950 border-red-800">
          <CardHeader>
            <CardTitle className="text-red-400">Initialization Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-red-300">{error.message}</pre>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span>Initializing Widget Registry...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const config = getDualLoadingConfig();
  const widgets = getAllWidgets();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Widget Registry Test Dashboard</h1>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Registry Version</p>
              <p className="text-2xl font-bold">2.0</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Widgets</p>
              <p className="text-2xl font-bold">{widgets.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">V2 Enabled</p>
              <Badge variant="secondary">
                {config.enableV2 ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">GraphQL Enabled</p>
              <Badge variant="secondary">
                {config.enableGraphQL ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="widgets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="widgets">Registered Widgets</TabsTrigger>
          <TabsTrigger value="layout">Layout Compatibility</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        {/* Registered Widgets Tab */}
        <TabsContent value="widgets">
          <Card>
            <CardHeader>
              <CardTitle>All Registered Widgets ({widgets.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {widgets.map(widget => (
                  <div key={widget.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{widget.name}</p>
                      <p className="text-sm text-muted-foreground">{widget.id}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge>{widget.category}</Badge>
                      {widget.lazyLoad && <Badge variant="secondary">Lazy</Badge>}
                      {widget.graphqlVersion && <Badge variant="outline">GraphQL</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout Compatibility Tab */}
        <TabsContent value="layout">
          <Card>
            <CardHeader>
              <CardTitle>Layout Compatibility Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <select
                  value={selectedTheme}
                  onChange={(e) => setSelectedTheme(e.target.value)}
                  className="px-3 py-2 border rounded bg-background"
                >
                  {Object.keys(adminDashboardLayouts).map(theme => (
                    <option key={theme} value={theme}>{theme}</option>
                  ))}
                </select>
                <Button onClick={testLayoutCompatibility}>
                  Test Layout Compatibility
                </Button>
              </div>

              {layoutValidation && (
                <div className="p-4 border rounded space-y-2">
                  <p><strong>Theme:</strong> {layoutValidation.theme}</p>
                  <p><strong>Original Widgets:</strong> {layoutValidation.originalCount}</p>
                  <p><strong>Captured Widgets:</strong> {layoutValidation.capturedCount}</p>
                  <p><strong>Baseline Widgets:</strong> {layoutValidation.baselineCount}</p>
                  <div>
                    <strong>Validation:</strong>{' '}
                    <Badge variant={layoutValidation.isValid ? "secondary" : "destructive"}>
                      {layoutValidation.isValid ? 'PASSED' : 'FAILED'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tested at: {new Date(layoutValidation.timestamp).toLocaleString()}
                  </p>
                  {!layoutValidation.isValid && (
                    <p className="text-sm text-yellow-500">
                      Note: Check console for detailed layout differences
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {performanceStats && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Widgets</p>
                    <p className="text-2xl font-bold">{performanceStats.totalWidgets}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Loaded Widgets</p>
                    <p className="text-2xl font-bold">{performanceStats.loadedWidgets}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Load Time</p>
                    <p className="text-2xl font-bold">{performanceStats.avgLoadTime.toFixed(2)}ms</p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Dual Loading Stats</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">V2 Loaded</p>
                    <p className="text-xl font-bold">{dualLoadingStats.v2Loaded}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Legacy Loaded</p>
                    <p className="text-xl font-bold">{dualLoadingStats.legacyLoaded}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cache Hits</p>
                    <p className="text-xl font-bold">{dualLoadingStats.cacheHits}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Requests</p>
                    <p className="text-xl font-bold">{dualLoadingStats.totalRequests}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Current Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-muted rounded overflow-x-auto">
                {JSON.stringify(config, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}