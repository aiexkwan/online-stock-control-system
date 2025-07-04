'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Play, 
  Pause,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';

import { dualLoadingAdapter, configureDualLoading } from '@/lib/widgets/dual-loading-adapter';
import { useDualRunVerification } from '@/lib/widgets/dual-run-verification';
import { WidgetComponentProps } from '@/lib/widgets/types';
import { migrationTracker } from '@/lib/widgets/migration-adapter';

// Mock widget props for testing
const mockWidgetProps: WidgetComponentProps = {
  widget: {
    id: 'test-widget',
    name: 'Test Widget',
    icon: 'Activity',
    config: {},
    theme: 'default'
  },
  isEditMode: false,
  timeFrame: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date()
  }
};

export default function DualRunVerificationPage() {
  const { report, isVerifying, runVerification, clearResults } = useDualRunVerification();
  const [selectedWidget, setSelectedWidget] = useState<string>('');
  const [autoVerify, setAutoVerify] = useState(false);
  const [verificationConfig, setVerificationConfig] = useState({
    enableVerification: true,
    verificationSampleRate: 0.1,
    compareRenderOutput: true,
    comparePerformance: true,
    failOnDiscrepancy: false
  });
  const [verificationQueue, setVerificationQueue] = useState<string[]>([]);
  const [isRunningBatch, setIsRunningBatch] = useState(false);
  const [migratedWidgets, setMigratedWidgets] = useState<string[]>([]);
  const [isLoadingWidgets, setIsLoadingWidgets] = useState(true);

  // Initialize widget registry and get available widgets
  React.useEffect(() => {
    const initializeWidgets = async () => {
      try {
        // Ensure registry is initialized
        const { widgetRegistry } = await import('@/lib/widgets/enhanced-registry');
        await widgetRegistry.autoRegisterWidgets();
        
        // Get all registered widgets
        const allWidgets = widgetRegistry.getAllDefinitions();
        const widgetIds = Array.from(allWidgets.keys());
        setMigratedWidgets(widgetIds);
        
        console.log(`[DualRunVerification] Found ${widgetIds.length} widgets:`, widgetIds);
      } catch (error) {
        console.error('[DualRunVerification] Failed to initialize widgets:', error);
      } finally {
        setIsLoadingWidgets(false);
      }
    };
    
    initializeWidgets();
  }, []);
  
  // Update configuration
  const updateConfig = useCallback((key: string, value: any) => {
    const newConfig = { ...verificationConfig, [key]: value };
    setVerificationConfig(newConfig);
    
    // Update dual loading adapter config
    configureDualLoading({
      enableVerification: newConfig.enableVerification,
      verificationSampleRate: newConfig.verificationSampleRate
    });
  }, [verificationConfig]);

  // Run single widget verification
  const handleVerifySingle = useCallback(async () => {
    if (!selectedWidget) return;
    
    console.log(`[DualRunVerification] Starting verification for ${selectedWidget}`);
    try {
      await runVerification(selectedWidget, mockWidgetProps);
      console.log(`[DualRunVerification] Verification completed for ${selectedWidget}`);
    } catch (error) {
      console.error(`[DualRunVerification] Verification failed for ${selectedWidget}:`, error);
    }
  }, [selectedWidget, runVerification]);

  // Run batch verification
  const handleVerifyBatch = useCallback(async () => {
    if (verificationQueue.length === 0) return;
    
    setIsRunningBatch(true);
    
    for (const widgetId of verificationQueue) {
      await runVerification(widgetId, mockWidgetProps);
      // Small delay between verifications
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunningBatch(false);
  }, [verificationQueue, runVerification]);

  // Export report
  const handleExportReport = useCallback(() => {
    if (!report) return;
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dual-run-verification-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  }, [report]);

  // Get status icon
  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dual Run Verification</h1>
        <div className="flex gap-4">
          <Button 
            onClick={handleExportReport}
            variant="outline"
            disabled={!report}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button 
            onClick={clearResults}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Results
          </Button>
        </div>
      </div>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Verification Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="enable-verification"
                checked={verificationConfig.enableVerification}
                onCheckedChange={(checked) => updateConfig('enableVerification', checked)}
              />
              <Label htmlFor="enable-verification">Enable Verification</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="compare-render"
                checked={verificationConfig.compareRenderOutput}
                onCheckedChange={(checked) => updateConfig('compareRenderOutput', checked)}
              />
              <Label htmlFor="compare-render">Compare Render Output</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="compare-performance"
                checked={verificationConfig.comparePerformance}
                onCheckedChange={(checked) => updateConfig('comparePerformance', checked)}
              />
              <Label htmlFor="compare-performance">Compare Performance</Label>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Label>Sample Rate:</Label>
            <input
              type="range"
              min="0"
              max="100"
              value={verificationConfig.verificationSampleRate * 100}
              onChange={(e) => updateConfig('verificationSampleRate', parseInt(e.target.value) / 100)}
              className="flex-1"
            />
            <span className="text-sm font-medium">{(verificationConfig.verificationSampleRate * 100).toFixed(0)}%</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single">Single Widget</TabsTrigger>
          <TabsTrigger value="batch">Batch Verification</TabsTrigger>
          <TabsTrigger value="report">Verification Report</TabsTrigger>
        </TabsList>

        {/* Single Widget Verification */}
        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Single Widget Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <select 
                  value={selectedWidget} 
                  onChange={(e) => setSelectedWidget(e.target.value)}
                  className="flex-1 h-10 px-3 py-2 text-sm rounded-md border border-input bg-background"
                  disabled={isLoadingWidgets}
                >
                  <option value="">
                    {isLoadingWidgets ? 'Loading widgets...' : 'Select a widget to verify'}
                  </option>
                  {!isLoadingWidgets && migratedWidgets.map(widgetId => (
                    <option key={widgetId} value={widgetId}>
                      {widgetId}
                    </option>
                  ))}
                </select>
                
                <Button 
                  onClick={handleVerifySingle}
                  disabled={!selectedWidget || isVerifying}
                >
                  {isVerifying ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Verification
                    </>
                  )}
                </Button>
              </div>

              {/* Recent verification results */}
              {report && report.widgetReports.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Recent Results:</h3>
                  {report.widgetReports
                    .filter(w => w.widgetId === selectedWidget)
                    .slice(-5)
                    .map((result, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.successfulRuns > result.failedRuns)}
                          <span className="font-medium">{result.widgetId}</span>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span>Old: {result.averageOldTime.toFixed(2)}ms</span>
                          <span>New: {result.averageNewTime.toFixed(2)}ms</span>
                          <Badge variant={result.successfulRuns > result.failedRuns ? "default" : "destructive"}>
                            {result.successfulRuns}/{result.totalRuns} passed
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batch Verification */}
        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch Widget Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select widgets to verify:</Label>
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto border rounded p-4">
                  {isLoadingWidgets ? (
                    <p className="col-span-3 text-center text-gray-500">Loading widgets...</p>
                  ) : migratedWidgets.length === 0 ? (
                    <p className="col-span-3 text-center text-gray-500">No widgets found</p>
                  ) : (
                    migratedWidgets.map(widgetId => (
                    <label key={widgetId} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={verificationQueue.includes(widgetId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setVerificationQueue([...verificationQueue, widgetId]);
                          } else {
                            setVerificationQueue(verificationQueue.filter(id => id !== widgetId));
                          }
                        }}
                      />
                      <span className="text-sm">{widgetId}</span>
                    </label>
                  )))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {verificationQueue.length} widgets selected
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setVerificationQueue(migratedWidgets)}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setVerificationQueue([])}
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={handleVerifyBatch}
                    disabled={verificationQueue.length === 0 || isRunningBatch}
                  >
                    {isRunningBatch ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Batch
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {isRunningBatch && (
                <Progress value={(report?.totalRuns || 0) / verificationQueue.length * 100} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verification Report */}
        <TabsContent value="report" className="space-y-4">
          {report ? (
            <>
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Verification Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Total Runs</p>
                      <p className="text-2xl font-bold">{report.totalRuns}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Success Rate</p>
                      <p className="text-2xl font-bold text-green-500">
                        {report.totalRuns > 0 
                          ? ((report.successfulRuns / report.totalRuns) * 100).toFixed(1) 
                          : 0}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Avg Old Time</p>
                      <p className="text-2xl font-bold">
                        {report.performanceComparison.averageOldSystemTime.toFixed(2)}ms
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Avg New Time</p>
                      <p className="text-2xl font-bold">
                        {report.performanceComparison.averageNewSystemTime.toFixed(2)}ms
                      </p>
                    </div>
                  </div>
                  
                  {report.performanceComparison.improvement !== 0 && (
                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Performance {report.performanceComparison.improvement > 0 ? 'improved' : 'degraded'} by {' '}
                        <span className={report.performanceComparison.improvement > 0 ? 'text-green-600' : 'text-red-600'}>
                          {Math.abs(report.performanceComparison.improvement).toFixed(1)}%
                        </span>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Detailed Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Widget-by-Widget Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {report.widgetReports.map((widgetReport) => (
                      <div key={widgetReport.widgetId} className="border rounded p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium flex items-center gap-2">
                              {getStatusIcon(widgetReport.successfulRuns > widgetReport.failedRuns)}
                              {widgetReport.widgetId}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {widgetReport.successfulRuns}/{widgetReport.totalRuns} runs successful
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">
                              Old: {widgetReport.averageOldTime.toFixed(2)}ms
                            </p>
                            <p className="text-sm">
                              New: {widgetReport.averageNewTime.toFixed(2)}ms
                            </p>
                          </div>
                        </div>
                        
                        {widgetReport.commonDiscrepancies.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-red-600">Common Issues:</p>
                            <ul className="text-sm text-gray-600 mt-1">
                              {widgetReport.commonDiscrepancies.map((disc, idx) => (
                                <li key={idx}>• {disc.issue} ({disc.count} times)</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No verification results yet. Run some verifications to see the report.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}