'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, BarChart3, TrendingUp } from 'lucide-react';
import { runPerformanceTest } from '@/app/admin/utils/performanceTestBatchQuery';
import { WidgetSkeleton } from './common/WidgetStates';
import type { WidgetProps } from '@/app/admin/types/widget-types';

interface TestResult {
  comparison: any;
  report: string;
  stats: any;
}

const PerformanceTestWidget: React.FC<WidgetProps> = ({ className }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setIsRunning(true);
    setError(null);
    setProgress(0);
    
    try {
      // 模擬進度更新
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      // 運行性能測試
      const testResult = await runPerformanceTest();
      
      clearInterval(progressInterval);
      setProgress(100);
      setResult(testResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : '性能測試失敗');
    } finally {
      setIsRunning(false);
    }
  };

  const formatPercentage = (value: number) => {
    return value > 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          批量查詢性能測試
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result && !isRunning && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              測試批量查詢系統相比個別查詢嘅性能提升
            </p>
            <Button onClick={runTest} size="lg" className="gap-2">
              <Play className="h-4 w-4" />
              開始測試
            </Button>
          </div>
        )}

        {isRunning && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <WidgetSkeleton type="spinner" className="h-4 w-4" />
              <span className="text-sm">正在運行性能測試...</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {result && !isRunning && (
          <div className="space-y-4">
            {/* 性能改善摘要 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">加載速度提升</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatPercentage(result.comparison.improvement.timeSavedPercentage)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  節省 {result.comparison.improvement.timeSaved.toFixed(0)}ms
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">請求減少</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {formatPercentage(result.comparison.improvement.requestsReducedPercentage)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  減少 {result.comparison.improvement.requestsReduced} 個請求
                </p>
              </div>
            </div>

            {/* 詳細對比 */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm">詳細性能對比</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">批量查詢時間</span>
                  <span className="text-sm font-medium">
                    {result.comparison.batchQuery.duration.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">個別查詢時間</span>
                  <span className="text-sm font-medium">
                    {result.comparison.individualQueries.duration.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">批量查詢請求數</span>
                  <span className="text-sm font-medium">
                    {result.comparison.batchQuery.requestCount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">個別查詢請求數</span>
                  <span className="text-sm font-medium">
                    {result.comparison.individualQueries.requestCount}
                  </span>
                </div>
              </div>
            </div>

            {/* 測試報告 */}
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium hover:text-primary">
                查看完整測試報告
              </summary>
              <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto max-h-96">
                {result.report}
              </pre>
            </details>

            {/* 重新測試按鈕 */}
            <Button 
              onClick={runTest} 
              variant="outline" 
              size="sm" 
              className="w-full"
            >
              重新運行測試
            </Button>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceTestWidget;