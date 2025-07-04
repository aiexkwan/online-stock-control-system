'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { widgetRegistry } from '@/lib/widgets/enhanced-registry';
import { migrationTracker } from '@/lib/widgets/migration-adapter';
import { HistoryTree } from '../components/dashboard/widgets/HistoryTree';
import { AwaitLocationQtyWidget } from '../components/dashboard/widgets/AwaitLocationQtyWidget';
import { YesterdayTransferCountWidget } from '../components/dashboard/widgets/YesterdayTransferCountWidget';
import { ProductMixChartWidget } from '../components/dashboard/widgets/ProductMixChartWidget';
import { StockDistributionChart } from '../components/dashboard/widgets/StockDistributionChart';
import { StockLevelHistoryChart } from '../components/dashboard/widgets/StockLevelHistoryChart';
import { OrdersListWidget } from '../components/dashboard/widgets/OrdersListWidget';
import { WidgetType } from '@/app/types/dashboard';

export default function TestWidgetMigrationPage() {
  const [migrationStatus, setMigrationStatus] = useState<Record<string, string>>({});
  const [performanceData, setPerformanceData] = useState<Record<string, any>>({});
  const [showOld, setShowOld] = useState(true);
  const [showNew, setShowNew] = useState(true);
  const [activeWidget, setActiveWidget] = useState('HistoryTree');
  
  // Initialize registry
  useEffect(() => {
    const initRegistry = async () => {
      try {
        await widgetRegistry.autoRegisterWidgets();
        console.log('Widget registry initialized');
      } catch (error) {
        console.error('Failed to initialize widget registry:', error);
      }
    };
    initRegistry();
  }, []);
  
  // Get the new components from registry
  const NewHistoryTree = widgetRegistry.getComponent('HistoryTree');
  const NewAwaitLocationQtyWidget = widgetRegistry.getComponent('AwaitLocationQtyWidget');
  const NewYesterdayTransferCountWidget = widgetRegistry.getComponent('YesterdayTransferCountWidget');
  const NewProductMixChartWidget = widgetRegistry.getComponent('ProductMixChartWidget');
  const NewStockDistributionChart = widgetRegistry.getComponent('StockDistributionChart');
  const NewStockLevelHistoryChart = widgetRegistry.getComponent('StockLevelHistoryChart');
  const NewOrdersListWidget = widgetRegistry.getComponent('OrdersListWidget');
  
  const testMigration = async (widgetId: string) => {
    setMigrationStatus(prev => ({ ...prev, [widgetId]: 'testing' }));
    
    // Start migration tracking
    migrationTracker.startMigration(widgetId);
    
    try {
      // Test loading performance
      const startTime = performance.now();
      
      // Preload the widget
      await widgetRegistry.preloadWidgets([widgetId]);
      
      const loadTime = performance.now() - startTime;
      
      // Get performance stats
      const stats = widgetRegistry.getLoadStatistics();
      const widgetStats = stats.get(widgetId);
      
      setPerformanceData(prev => ({
        ...prev,
        [widgetId]: {
          loadTime: loadTime.toFixed(2),
          stats: widgetStats
        }
      }));
      
      // Mark migration as complete
      migrationTracker.completeMigration(widgetId, true);
      setMigrationStatus(prev => ({ ...prev, [widgetId]: 'completed' }));
      
    } catch (error) {
      console.error(`Migration test failed for ${widgetId}:`, error);
      migrationTracker.failMigration(widgetId, error as Error);
      setMigrationStatus(prev => ({ ...prev, [widgetId]: 'failed' }));
    }
  };
  
  const generateReport = () => {
    const report = migrationTracker.generateReport();
    console.log(report);
    alert('Migration report generated - check console');
  };
  
  // Mock widget props
  const mockWidgetProps = {
    widget: {
      id: 'history-tree-test',
      type: WidgetType.CUSTOM,
      title: 'History Tree',
      config: {
        dataSource: 'record_history'
      }
    },
    isEditMode: false
  };
  
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Widget Migration Test - Phase 2</h1>
      
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Migration Control Panel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={() => testMigration(activeWidget)} disabled={migrationStatus[activeWidget] === 'testing'}>
              {migrationStatus[activeWidget] === 'testing' ? 'Testing...' : `Test ${activeWidget}`}
            </Button>
            <Button onClick={generateReport} variant="outline">
              Generate Report
            </Button>
          </div>
          
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOld}
                onChange={(e) => setShowOld(e.target.checked)}
              />
              Show Old Version
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showNew}
                onChange={(e) => setShowNew(e.target.checked)}
              />
              Show New Version
            </label>
          </div>
          
          <div className="text-sm">
            <p>Active Widget: <span className="font-bold">{activeWidget}</span></p>
            <p>Migration Status: <span className={`font-bold ${
              migrationStatus[activeWidget] === 'completed' ? 'text-green-500' : 
              migrationStatus[activeWidget] === 'failed' ? 'text-red-500' : 
              migrationStatus[activeWidget] === 'testing' ? 'text-yellow-500' : 
              'text-gray-500'
            }`}>{(migrationStatus[activeWidget] || 'pending').toUpperCase()}</span></p>
            
            {performanceData[activeWidget] && (
              <div className="mt-2 space-y-1">
                <p>Load Time: {performanceData[activeWidget].loadTime}ms</p>
                <p>Registry Status: {performanceData[activeWidget].stats?.loadStatus || 'N/A'}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Widget Selection Tabs */}
      <Tabs value={activeWidget} onValueChange={setActiveWidget}>
        <TabsList>
          <TabsTrigger value="HistoryTree">HistoryTree</TabsTrigger>
          <TabsTrigger value="AwaitLocationQtyWidget">Await Location Qty</TabsTrigger>
          <TabsTrigger value="YesterdayTransferCountWidget">Yesterday Transfer Count</TabsTrigger>
          <TabsTrigger value="ProductMixChartWidget">Product Mix Chart</TabsTrigger>
          <TabsTrigger value="StockDistributionChart">Stock Distribution</TabsTrigger>
          <TabsTrigger value="StockLevelHistoryChart">Stock Level History</TabsTrigger>
          <TabsTrigger value="OrdersListWidget">Orders List</TabsTrigger>
        </TabsList>
        
        {/* Widget Comparison */}
        <TabsContent value="HistoryTree" className="grid grid-cols-2 gap-6">
          {/* Old Version */}
          {showOld && (
            <Card>
              <CardHeader>
                <CardTitle>Old Version (Direct Import)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] overflow-hidden">
                  <HistoryTree {...mockWidgetProps} />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* New Version */}
          {showNew && (
            <Card>
              <CardHeader>
                <CardTitle>New Version (Registry)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] overflow-hidden">
                  {NewHistoryTree ? (
                    <NewHistoryTree {...mockWidgetProps} />
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      Registry not initialized
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="AwaitLocationQtyWidget" className="grid grid-cols-2 gap-6">
          {/* Old Version */}
          {showOld && (
            <Card>
              <CardHeader>
                <CardTitle>Old Version (Direct Import)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] overflow-hidden">
                  <AwaitLocationQtyWidget {...mockWidgetProps} />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* New Version */}
          {showNew && (
            <Card>
              <CardHeader>
                <CardTitle>New Version (Registry)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] overflow-hidden">
                  {NewAwaitLocationQtyWidget ? (
                    <NewAwaitLocationQtyWidget {...mockWidgetProps} />
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      Registry not initialized
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="YesterdayTransferCountWidget" className="grid grid-cols-2 gap-6">
          {/* Old Version */}
          {showOld && (
            <Card>
              <CardHeader>
                <CardTitle>Old Version (Direct Import)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] overflow-hidden">
                  <YesterdayTransferCountWidget {...mockWidgetProps} />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* New Version */}
          {showNew && (
            <Card>
              <CardHeader>
                <CardTitle>New Version (Registry)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] overflow-hidden">
                  {NewYesterdayTransferCountWidget ? (
                    <NewYesterdayTransferCountWidget {...mockWidgetProps} />
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      Registry not initialized
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Chart Widgets */}
        <TabsContent value="ProductMixChartWidget" className="grid grid-cols-2 gap-6">
          {/* Old Version */}
          {showOld && (
            <Card>
              <CardHeader>
                <CardTitle>Old Version (Direct Import)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] overflow-hidden">
                  <ProductMixChartWidget {...mockWidgetProps} />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* New Version */}
          {showNew && (
            <Card>
              <CardHeader>
                <CardTitle>New Version (Registry)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] overflow-hidden">
                  {NewProductMixChartWidget ? (
                    <NewProductMixChartWidget {...mockWidgetProps} />
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      Registry not initialized
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="StockDistributionChart" className="grid grid-cols-2 gap-6">
          {/* Old Version */}
          {showOld && (
            <Card>
              <CardHeader>
                <CardTitle>Old Version (Direct Import)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] overflow-hidden">
                  <StockDistributionChart {...mockWidgetProps} />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* New Version */}
          {showNew && (
            <Card>
              <CardHeader>
                <CardTitle>New Version (Registry)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] overflow-hidden">
                  {NewStockDistributionChart ? (
                    <NewStockDistributionChart {...mockWidgetProps} />
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      Registry not initialized
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="StockLevelHistoryChart" className="grid grid-cols-2 gap-6">
          {/* Old Version */}
          {showOld && (
            <Card>
              <CardHeader>
                <CardTitle>Old Version (Direct Import)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] overflow-hidden">
                  <StockLevelHistoryChart {...mockWidgetProps} />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* New Version */}
          {showNew && (
            <Card>
              <CardHeader>
                <CardTitle>New Version (Registry)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] overflow-hidden">
                  {NewStockLevelHistoryChart ? (
                    <NewStockLevelHistoryChart {...mockWidgetProps} />
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      Registry not initialized
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* List Widget */}
        <TabsContent value="OrdersListWidget" className="grid grid-cols-2 gap-6">
          {/* Old Version */}
          {showOld && (
            <Card>
              <CardHeader>
                <CardTitle>Old Version (Direct Import)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] overflow-hidden">
                  <OrdersListWidget {...mockWidgetProps} />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* New Version */}
          {showNew && (
            <Card>
              <CardHeader>
                <CardTitle>New Version (Registry)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] overflow-hidden">
                  {NewOrdersListWidget ? (
                    <NewOrdersListWidget {...mockWidgetProps} />
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      Registry not initialized
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>Old System: Direct import, bundled with main chunk</p>
            <p>New System: Dynamic import, loaded on demand</p>
            {performanceData && (
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <pre>{JSON.stringify(performanceData, null, 2)}</pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}