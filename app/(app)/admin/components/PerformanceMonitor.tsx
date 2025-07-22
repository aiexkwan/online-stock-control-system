/**
 * Performance Monitor Component
 * 實時顯示動態載入性能指標
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  comparePerformance,
  runPerformanceTest,
  performanceTest,
} from '@/app/(app)/admin/utils/performance-test';
import { CheckCircle2, AlertCircle, TrendingUp, Zap } from 'lucide-react';

// @types-migration:todo(phase2) [P1] 定義正確的 comparison result 類型 - Owner: @frontend-team

export const PerformanceMonitor: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [report, setReport] = useState<string>('');
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (isMonitoring) {
      runPerformanceTest();

      // 監聽路由變化生成報告
      const interval = setInterval(() => {
        const newReport = performanceTest.generateReport();
        if (newReport !== report) {
          setReport(newReport);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isMonitoring, report]);

  // @types-migration:todo(phase2) [P1] 傳入正確的 PerformanceResult[] 參數 - Owner: @frontend-team
  const comparison = comparePerformance([]);

  return (
    <div className='space-y-4'>
      <Card className='border-slate-700 bg-slate-800'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Zap className='h-5 w-5 text-yellow-500' />
            Phase 3.1.2 Performance Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {/* 控制按鈕 */}
            <div className='flex gap-2'>
              <Button
                onClick={() => setIsMonitoring(!isMonitoring)}
                variant={isMonitoring ? 'destructive' : 'default'}
                size='sm'
              >
                {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
              </Button>
              <Button
                onClick={() => setShowComparison(!showComparison)}
                variant='outline'
                size='sm'
              >
                {showComparison ? 'Hide Comparison' : 'Show Comparison'}
              </Button>
            </div>

            {/* 性能比較 */}
            {showComparison && (
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                {/* @types-migration:todo(phase2) [P1] 修復 comparison 不是陣列的問題 - Owner: @frontend-team */}
                {(comparison as any).improved?.map((result: any, index: number) => (
                  <div key={index} className='space-y-2 rounded-lg bg-slate-700/50 p-4'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-slate-400'>{result.metric}</span>
                      <span className='flex items-center gap-1 text-green-500'>
                        <TrendingUp className='h-4 w-4' />
                        {result.improvement}
                      </span>
                    </div>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-red-400'>Before: {result.before}</span>
                      <span className='text-green-400'>After: {result.after}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 實時監控結果 */}
            {isMonitoring && report && (
              <div className='rounded-lg bg-slate-900 p-4'>
                <pre className='whitespace-pre-wrap font-mono text-xs text-slate-300'>{report}</pre>
              </div>
            )}

            {/* 成功指標 */}
            <div className='space-y-2 border-t border-slate-700 pt-4'>
              <h4 className='mb-2 text-sm font-semibold text-slate-300'>Implementation Status</h4>
              <div className='space-y-1'>
                <div className='flex items-center gap-2 text-sm'>
                  <CheckCircle2 className='h-4 w-4 text-green-500' />
                  <span className='text-slate-400'>OptimizedWidgetLoader implemented</span>
                </div>
                <div className='flex items-center gap-2 text-sm'>
                  <CheckCircle2 className='h-4 w-4 text-green-500' />
                  <span className='text-slate-400'>RoutePredictor with history tracking</span>
                </div>
                <div className='flex items-center gap-2 text-sm'>
                  <CheckCircle2 className='h-4 w-4 text-green-500' />
                  <span className='text-slate-400'>SmartPreloader with idle callback</span>
                </div>
                <div className='flex items-center gap-2 text-sm'>
                  <CheckCircle2 className='h-4 w-4 text-green-500' />
                  <span className='text-slate-400'>Webpack chunk optimization configured</span>
                </div>
                <div className='flex items-center gap-2 text-sm'>
                  <CheckCircle2 className='h-4 w-4 text-green-500' />
                  <span className='text-slate-400'>Dynamic imports in AdminDashboardContent</span>
                </div>
              </div>
            </div>

            {/* 使用說明 */}
            {!isMonitoring && (
              <div className='rounded-lg border border-blue-500/20 bg-blue-500/10 p-3'>
                <div className='flex items-start gap-2'>
                  <AlertCircle className='mt-0.5 h-4 w-4 text-blue-400' />
                  <div className='text-xs text-blue-300'>
                    <p className='mb-1 font-semibold'>Testing Instructions:</p>
                    <ol className='list-inside list-decimal space-y-1'>
                      <li>Click &quot;Start Monitoring&quot; to enable performance tracking</li>
                      <li>Navigate between different admin themes (injection, pipeline, etc.)</li>
                      <li>Observe chunk loading and performance metrics</li>
                      <li>
                        Compare with pre-optimization metrics using &quot;Show Comparison&quot;
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
