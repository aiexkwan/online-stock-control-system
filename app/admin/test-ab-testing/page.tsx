'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FlaskConical,
  Users,
  BarChart,
  Settings,
  Play,
  Pause,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

import { abTestManager, ABTestConfig, ABTestContext } from '@/lib/widgets/ab-testing-framework';
import { recordWidgetLoadPerformance, recordWidgetError, recordWidgetInteraction } from '@/lib/widgets/ab-testing-middleware';
import { recordWidgetLoadPerformanceV2, recordWidgetErrorV2, calculateAggregateErrorRate } from '@/lib/widgets/ab-testing-metrics';
import { resetABTest } from '@/lib/widgets/ab-testing-utils';

// Mock session generator
function generateMockSession(): ABTestContext {
  const routes = ['/admin/warehouse', '/admin/injection', '/admin/pipeline', '/admin/stock-management'];
  const userIds = ['user1', 'user2', 'user3', 'user4', 'user5', null];
  
  return {
    sessionId: Math.random().toString(36).substring(2),
    userId: userIds[Math.floor(Math.random() * userIds.length)] || undefined,
    route: routes[Math.floor(Math.random() * routes.length)],
    timestamp: Date.now(),
    features: Math.random() > 0.5 ? ['beta', 'power-user'] : [],
  };
}

export default function ABTestingDashboard() {
  const [activeTest, setActiveTest] = useState<ABTestConfig | null>(null);
  const [testReport, setTestReport] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationInterval, setSimulationInterval] = useState<NodeJS.Timeout | null>(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState({
    v2Sessions: 0,
    legacySessions: 0,
    avgLoadTimeV2: 0,
    avgLoadTimeLegacy: 0,
    errorRateV2: 0,
    errorRateLegacy: 0,
  });

  // Load test configuration
  useEffect(() => {
    // Start the test to ensure it's initialized
    try {
      abTestManager.startTest('widget-registry-v2-rollout');
      const report = abTestManager.getTestReport('widget-registry-v2-rollout');
      // Create a mock test config based on the report
      const test: ABTestConfig = {
        testId: 'widget-registry-v2-rollout',
        name: report.name,
        status: report.status as any,
        startDate: report.startDate,
        endDate: report.endDate,
        segmentation: {
          type: 'percentage',
          rules: [
            { type: 'percentage', value: 10, variantId: 'v2-system' },
            { type: 'percentage', value: 90, variantId: 'legacy-system' }
          ]
        },
        variants: [
          {
            id: 'v2-system',
            name: 'New Widget Registry V2',
            weight: 10,
            config: { useNewRegistry: true, enableGraphQL: true }
          },
          {
            id: 'legacy-system', 
            name: 'Legacy System',
            weight: 90,
            config: { useNewRegistry: false, enableGraphQL: false }
          }
        ],
        metrics: [
          { name: 'widget_load_time', type: 'performance', target: 50, unit: 'ms' },
          { name: 'error_rate', type: 'error', target: 0.01, unit: '%' },
          { name: 'user_engagement', type: 'engagement', unit: 'interactions' }
        ],
        rollback: {
          enabled: true,
          threshold: 0.10, // 10% 錯誤率閾值
          window: 5 * 60 * 1000
        }
      };
      setActiveTest(test);
    } catch (e) {
      console.error('Failed to load test configuration:', e);
    }
  }, []);

  // Update report periodically
  useEffect(() => {
    const updateReport = () => {
      if (activeTest) {
        const report = abTestManager.getTestReport(activeTest.testId);
        setTestReport(report);
        
        // Calculate realtime metrics
        const v2Variant = report.variants.find(v => v.variantId === 'v2-system');
        const legacyVariant = report.variants.find(v => v.variantId === 'legacy-system');
        
        // 使用改進的錯誤率計算
        const v2ErrorRate = calculateAggregateErrorRate('v2-system');
        const legacyErrorRate = calculateAggregateErrorRate('legacy-system');
        
        setRealtimeMetrics({
          v2Sessions: v2Variant?.sessions || 0,
          legacySessions: legacyVariant?.sessions || 0,
          avgLoadTimeV2: v2Variant?.metrics.get('widget_load_time')?.mean || 0,
          avgLoadTimeLegacy: legacyVariant?.metrics.get('widget_load_time')?.mean || 0,
          errorRateV2: v2ErrorRate,
          errorRateLegacy: legacyErrorRate,
        });
      }
    };

    updateReport();
    const interval = setInterval(updateReport, 2000);
    return () => clearInterval(interval);
  }, [activeTest]);

  // Start/stop test
  const handleToggleTest = () => {
    if (!activeTest) return;
    
    if (activeTest.status === 'active') {
      abTestManager.pauseTest(activeTest.testId);
      setActiveTest({ ...activeTest, status: 'paused' });
    } else {
      abTestManager.startTest(activeTest.testId);
      setActiveTest({ ...activeTest, status: 'active' });
    }
  };

  // Simulate traffic
  const handleToggleSimulation = () => {
    if (isSimulating && simulationInterval) {
      clearInterval(simulationInterval);
      setSimulationInterval(null);
      setIsSimulating(false);
    } else {
      const interval = setInterval(() => {
        // Generate mock sessions
        for (let i = 0; i < 5; i++) {
          const context = generateMockSession();
          const decision = abTestManager.getDecision(context);
          
          if (decision) {
            // Simulate widget loads
            const widgets = ['HistoryTree', 'StatsCardWidget', 'ProductMixChartWidget'];
            widgets.forEach(widgetId => {
              // Simulate load time (V2 is faster)
              const baseTime = decision.variantId === 'v2-system' ? 10 : 50;
              const loadTime = baseTime + Math.random() * 20;
              
              // Use the new V2 recording functions with session ID
              const sessionId = context.sessionId;
              
              // Simulate occasional errors (much lower rate to avoid triggering rollback)
              const errorRate = decision.variantId === 'v2-system' ? 0.001 : 0.005; // 0.1% vs 0.5%
              if (Math.random() < errorRate) {
                recordWidgetErrorV2(
                  widgetId, 
                  new Error('Simulated error'), 
                  decision.variantId,
                  sessionId
                );
              } else {
                // Record successful load
                recordWidgetLoadPerformanceV2(widgetId, loadTime, decision.variantId, sessionId);
              }
              
              // Simulate interactions
              if (Math.random() > 0.3) {
                recordWidgetInteraction(widgetId, 'click', decision.variantId);
              }
            });
          }
        }
      }, 1000);
      
      setSimulationInterval(interval);
      setIsSimulating(true);
    }
  };

  // Update test configuration
  const updateTestSplit = (v2Percentage: number) => {
    if (!activeTest) return;
    
    const updatedTest = {
      ...activeTest,
      segmentation: {
        ...activeTest.segmentation,
        rules: [
          {
            type: 'percentage' as const,
            value: v2Percentage,
            variantId: 'v2-system'
          },
          {
            type: 'percentage' as const,
            value: 100 - v2Percentage,
            variantId: 'legacy-system'
          }
        ]
      },
      variants: activeTest.variants.map(v => ({
        ...v,
        weight: v.id === 'v2-system' ? v2Percentage : 100 - v2Percentage
      }))
    };
    
    abTestManager.createTest(updatedTest);
    setActiveTest(updatedTest);
  };

  if (!activeTest) {
    return <div>Loading...</div>;
  }

  const v2Percentage = activeTest.variants.find(v => v.id === 'v2-system')?.weight || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <FlaskConical className="h-8 w-8" />
          <h1 className="text-2xl font-bold">A/B Testing Dashboard</h1>
        </div>
        <div className="flex gap-4">
          <Button 
            onClick={() => {
              resetABTest('widget-registry-v2-rollout');
              window.location.reload();
            }}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Test
          </Button>
          <Button 
            onClick={handleToggleSimulation}
            variant={isSimulating ? "destructive" : "outline"}
          >
            {isSimulating ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop Simulation
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Simulation
              </>
            )}
          </Button>
          <Button 
            onClick={handleToggleTest}
            variant={activeTest.status === 'active' ? "default" : "outline"}
          >
            {activeTest.status === 'active' ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause Test
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Test
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Test Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{activeTest.name}</span>
            <Badge variant={activeTest.status === 'active' ? 'default' : 'secondary'}>
              {activeTest.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">{activeTest.description}</p>
          
          {/* Traffic Split Control */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Traffic Split (V2 System)</Label>
              <span className="text-sm font-medium">{v2Percentage}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={v2Percentage}
              onChange={(e) => updateTestSplit(parseInt(e.target.value))}
              className="w-full"
              disabled={activeTest.status === 'active'}
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Legacy System</span>
              <span>New V2 System</span>
            </div>
          </div>
          
          {activeTest.rollback?.enabled && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Automatic rollback enabled: {activeTest.rollback.threshold * 100}% error threshold
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Realtime Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">V2 Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realtimeMetrics.v2Sessions}</div>
            <Progress 
              value={(realtimeMetrics.v2Sessions / (realtimeMetrics.v2Sessions + realtimeMetrics.legacySessions)) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Legacy Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realtimeMetrics.legacySessions}</div>
            <Progress 
              value={(realtimeMetrics.legacySessions / (realtimeMetrics.v2Sessions + realtimeMetrics.legacySessions)) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Load Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between">
              <div>
                <div className="text-sm text-gray-500">V2</div>
                <div className="text-lg font-bold text-green-600">
                  {realtimeMetrics.avgLoadTimeV2.toFixed(1)}ms
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Legacy</div>
                <div className="text-lg font-bold">
                  {realtimeMetrics.avgLoadTimeLegacy.toFixed(1)}ms
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between">
              <div>
                <div className="text-sm text-gray-500">V2</div>
                <div className="text-lg font-bold text-green-600">
                  {(realtimeMetrics.errorRateV2 * 100).toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Legacy</div>
                <div className="text-lg font-bold">
                  {(realtimeMetrics.errorRateLegacy * 100).toFixed(2)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Widget Load Time Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              {testReport?.variants.map((variant: any) => {
                const loadTimeStats = variant.metrics.get('widget_load_time');
                if (!loadTimeStats) return null;
                
                return (
                  <div key={variant.variantId} className="mb-4">
                    <h4 className="font-medium mb-2">{variant.name}</h4>
                    <div className="grid grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Mean:</span>
                        <div className="font-bold">{loadTimeStats.mean.toFixed(2)}ms</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Median:</span>
                        <div className="font-bold">{loadTimeStats.median.toFixed(2)}ms</div>
                      </div>
                      <div>
                        <span className="text-gray-500">P95:</span>
                        <div className="font-bold">{loadTimeStats.p95.toFixed(2)}ms</div>
                      </div>
                      <div>
                        <span className="text-gray-500">P99:</span>
                        <div className="font-bold">{loadTimeStats.p99.toFixed(2)}ms</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Samples:</span>
                        <div className="font-bold">{loadTimeStats.count}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {realtimeMetrics.avgLoadTimeV2 > 0 && realtimeMetrics.avgLoadTimeLegacy > 0 && (
                <Alert className="mt-4">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    V2 System is {((1 - realtimeMetrics.avgLoadTimeV2 / realtimeMetrics.avgLoadTimeLegacy) * 100).toFixed(1)}% faster than Legacy
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Rate Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {testReport?.variants.map((variant: any) => {
                const errorStats = variant.metrics.get('error_rate');
                if (!errorStats) return null;
                
                return (
                  <div key={variant.variantId} className="mb-4">
                    <h4 className="font-medium mb-2">{variant.name}</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Error Rate:</span>
                        <div className="font-bold">{(errorStats.mean * 100).toFixed(3)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Errors:</span>
                        <div className="font-bold">{errorStats.count}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Success Rate:</span>
                        <div className="font-bold text-green-600">
                          {(100 - errorStats.mean * 100).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Engagement Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {testReport?.variants.map((variant: any) => {
                const engagementStats = variant.metrics.get('user_engagement');
                if (!engagementStats) return null;
                
                return (
                  <div key={variant.variantId} className="mb-4">
                    <h4 className="font-medium mb-2">{variant.name}</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Total Interactions:</span>
                        <div className="font-bold">{engagementStats.count}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Avg per Session:</span>
                        <div className="font-bold">
                          {variant.sessions > 0 
                            ? (engagementStats.count / variant.sessions).toFixed(2)
                            : '0'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Sessions:</span>
                        <div className="font-bold">{variant.sessions}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}