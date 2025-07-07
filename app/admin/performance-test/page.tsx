'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { performanceBenchmark } from '../utils/performanceBenchmark';
import { AdminDashboardContent } from '../components/dashboard/AdminDashboardContent';
import { ArrowPathIcon, ChartBarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function PerformanceTestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<{
    summary: string;
    details: any;
    recommendations: string[];
  } | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    // 開始監測
    performanceBenchmark.startMonitoring();
    
    return () => {
      performanceBenchmark.cleanup();
    };
  }, []);

  const runBenchmark = async () => {
    setIsRunning(true);
    setReport(null);
    setShowDashboard(true);
    
    // 等待 Dashboard 加載
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 測量 bundle size
    await performanceBenchmark.measureBundleSize();
    
    // 等待所有 widgets 渲染
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 獲取報告
    const benchmarkReport = performanceBenchmark.getReport();
    setReport(benchmarkReport);
    setIsRunning(false);
  };

  const exportReport = () => {
    if (!report) return;
    
    const reportText = `
Admin Dashboard Performance Report
Generated: ${new Date().toISOString()}

${report.summary}

Recommendations:
${report.recommendations.map(r => `- ${r}`).join('\n')}

Detailed Metrics:
${JSON.stringify(report.details, null, 2)}
    `.trim();
    
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard 性能測試</h1>
          <p className="text-gray-400">測試 Widget 虛擬化和代碼分割優化效果</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5" />
                測試控制
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={runBenchmark}
                disabled={isRunning}
                className="w-full mb-4"
              >
                {isRunning ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                    測試進行中...
                  </>
                ) : (
                  '開始性能測試'
                )}
              </Button>
              
              <div className="text-sm text-gray-400">
                <p className="mb-2">測試項目：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Bundle Size 測量</li>
                  <li>初始加載時間</li>
                  <li>Widget 渲染時間</li>
                  <li>重渲染次數統計</li>
                  <li>內存使用情況</li>
                  <li>網絡請求分析</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {report && (
            <>
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">測試結果</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                    {report.summary}
                  </pre>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">優化建議</CardTitle>
                </CardHeader>
                <CardContent>
                  {report.recommendations.length > 0 ? (
                    <ul className="space-y-2">
                      {report.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-yellow-400 flex items-start">
                          <span className="mr-2">⚠️</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-green-400 text-sm">✅ 所有性能指標符合預期！</p>
                  )}
                  
                  <Button
                    onClick={exportReport}
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                  >
                    <DocumentTextIcon className="w-4 h-4 mr-2" />
                    導出報告
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Dashboard 測試區域 */}
        {showDashboard && (
          <div className="border-2 border-dashed border-slate-700 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-white mb-4">Dashboard 測試區域</h2>
            <div className="bg-slate-900 rounded-lg overflow-hidden">
              <AdminDashboardContent 
                selectedTheme="injection"
                timeFrame={{
                  value: 'today',
                  start: new Date(new Date().setHours(0, 0, 0, 0)),
                  end: new Date()
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}