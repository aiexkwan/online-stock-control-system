'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, BarChart3, TrendingUp } from 'lucide-react';
import { runPerformanceTest } from '@/app/(app)/admin/utils/performanceTestBatchQuery';
import { WidgetSkeleton } from './common/WidgetStates';
import type { WidgetProps } from '@/app/(app)/admin/types/dashboard';
import {
  brandColors,
  widgetColors,
  semanticColors,
  getWidgetCategoryColor,
} from '@/lib/design-system/colors';
import { textClasses, getTextClass } from '@/lib/design-system/typography';
import { spacing, widgetSpacing, spacingUtilities } from '@/lib/design-system/spacing';
import { cn } from '@/lib/utils';

// Import types from the performance test module
import type { ComparisonResult } from '@/app/(app)/admin/utils/performanceTestBatchQuery';

interface TestResult {
  comparison: ComparisonResult;
  report: string;
  stats: {
    summary: unknown;
    batchQueryStats: unknown;
    individualQueryStats: unknown;
    recentAlerts: unknown[];
  };
}

// Type guards for performance test results
function isValidComparison(data: unknown): data is ComparisonResult {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.concurrentQuery === 'object' &&
    typeof d.individualQueries === 'object' &&
    typeof d.improvement === 'object'
  );
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
      // Simulate progress without setInterval to avoid loading animations
      setProgress(50); // Set to 50% immediately

      // 運行性能測試
      const testResult = await runPerformanceTest();

      setProgress(100);
      setResult(testResult);
    } catch (err) {
      setError(err instanceof Error ? (err as { message: string }).message : '性能測試失敗');
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
        <CardTitle className={cn('flex items-center gap-2', textClasses['heading-base'])}>
          <BarChart3 className='h-5 w-5' />
          批量查詢性能測試
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {!result && !isRunning && (
          <div className='py-8 text-center'>
            <p className={cn(textClasses['body-small'], 'mb-4 text-muted-foreground')}>
              測試批量查詢系統相比個別查詢嘅性能提升
            </p>
            <Button onClick={runTest} size='lg' className='gap-2'>
              <Play className='h-4 w-4' />
              開始測試
            </Button>
          </div>
        )}

        {isRunning && (
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <WidgetSkeleton type='spinner' className='h-4 w-4' />
              <span className={textClasses['body-small']}>正在運行性能測試...</span>
            </div>
            <Progress value={progress} className='h-2' />
          </div>
        )}

        {result && !isRunning && (
          <div className='space-y-4'>
            {/* 性能改善摘要 */}
            <div className='grid grid-cols-2 gap-4'>
              <div className={cn('rounded-lg p-4', 'bg-success/10 border-success/20 border')}>
                <div className='mb-1 flex items-center gap-2'>
                  <TrendingUp
                    className='h-4 w-4'
                    style={{ color: semanticColors.success.DEFAULT }}
                  />
                  <span className={cn(textClasses['body-small'], 'font-medium')}>加載速度提升</span>
                </div>
                <p
                  className={cn(textClasses['heading-large'], 'font-bold')}
                  style={{ color: semanticColors.success.DEFAULT }}
                >
                  {formatPercentage(result.comparison.improvement?.timeSavedPercentage || 0)}
                </p>
                <p className={cn(textClasses['label-small'], 'mt-1 text-muted-foreground')}>
                  節省 {(result.comparison.improvement?.timeSaved || 0).toFixed(0)}ms
                </p>
              </div>

              <div className={cn('rounded-lg p-4', 'bg-info/10 border-info/20 border')}>
                <div className='mb-1 flex items-center gap-2'>
                  <BarChart3 className='h-4 w-4' style={{ color: semanticColors.info.DEFAULT }} />
                  <span className={cn(textClasses['body-small'], 'font-medium')}>請求減少</span>
                </div>
                <p
                  className={cn(textClasses['heading-large'], 'font-bold')}
                  style={{ color: semanticColors.info.DEFAULT }}
                >
                  {formatPercentage(result.comparison.improvement?.requestsReducedPercentage || 0)}
                </p>
                <p className={cn(textClasses['label-small'], 'mt-1 text-muted-foreground')}>
                  減少 {result.comparison.improvement?.requestsReduced || 0} 個請求
                </p>
              </div>
            </div>

            {/* 詳細對比 */}
            <div className='space-y-3 rounded-lg border p-4'>
              <h4 className={cn(textClasses['body-small'], 'font-medium')}>詳細性能對比</h4>

              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className={cn(textClasses['body-small'], 'text-muted-foreground')}>
                    批量查詢時間
                  </span>
                  <span className={cn(textClasses['body-small'], 'font-medium')}>
                    {(result.comparison.concurrentQuery?.duration || 0).toFixed(0)}ms
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className={cn(textClasses['body-small'], 'text-muted-foreground')}>
                    個別查詢時間
                  </span>
                  <span className={cn(textClasses['body-small'], 'font-medium')}>
                    {(result.comparison.individualQueries?.duration || 0).toFixed(0)}ms
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className={cn(textClasses['body-small'], 'text-muted-foreground')}>
                    批量查詢請求數
                  </span>
                  <span className={cn(textClasses['body-small'], 'font-medium')}>
                    {result.comparison.concurrentQuery?.requestCount || 0}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className={cn(textClasses['body-small'], 'text-muted-foreground')}>
                    個別查詢請求數
                  </span>
                  <span className={cn(textClasses['body-small'], 'font-medium')}>
                    {result.comparison.individualQueries?.requestCount || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* 測試報告 */}
            <details className='group'>
              <summary
                className={cn(
                  'cursor-pointer font-medium hover:text-primary',
                  textClasses['body-small']
                )}
              >
                查看完整測試報告
              </summary>
              <pre
                className={cn(
                  'mt-2 max-h-96 overflow-auto rounded-lg bg-muted p-4',
                  textClasses['label-small']
                )}
              >
                {result.report}
              </pre>
            </details>

            {/* 重新測試按鈕 */}
            <Button onClick={runTest} variant='outline' size='sm' className='w-full'>
              重新運行測試
            </Button>
          </div>
        )}

        {error && (
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceTestWidget;
