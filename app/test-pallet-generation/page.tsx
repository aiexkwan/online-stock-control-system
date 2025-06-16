'use client';

import React, { useState } from 'react';
import { useDatabaseOperations } from '@/app/components/qc-label-form/hooks/modules/useDatabaseOperations';
import { useDatabaseOperationsV2 } from '@/app/components/qc-label-form/hooks/modules/useDatabaseOperationsV2';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface TestResult {
  method: 'v1' | 'v2';
  count: number;
  success: boolean;
  time: number;
  error?: string;
  palletNumbers?: string[];
}

export default function TestPalletGenerationPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  
  const v1Operations = useDatabaseOperations();
  const v2Operations = useDatabaseOperationsV2();

  const runTest = async (method: 'v1' | 'v2', count: number) => {
    const startTime = Date.now();
    const operations = method === 'v1' ? v1Operations : v2Operations;
    
    try {
      const result = await operations.generatePalletNumbers(count);
      const endTime = Date.now();
      
      const testResult: TestResult = {
        method,
        count,
        success: !!result.palletNumbers?.length,
        time: endTime - startTime,
        error: result.error,
        palletNumbers: result.palletNumbers
      };
      
      setResults(prev => [...prev, testResult]);
      
      if (testResult.success) {
        toast.success(`${method} generated ${count} numbers in ${testResult.time}ms`);
      } else {
        toast.error(`${method} failed: ${testResult.error}`);
      }
      
    } catch (error: any) {
      const endTime = Date.now();
      const testResult: TestResult = {
        method,
        count,
        success: false,
        time: endTime - startTime,
        error: error.message
      };
      setResults(prev => [...prev, testResult]);
      toast.error(`${method} error: ${error.message}`);
    }
  };

  const runComparisonTest = async (count: number) => {
    setTesting(true);
    
    // 測試 V1
    await runTest('v1', count);
    
    // 等待一下避免並發
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 測試 V2
    await runTest('v2', count);
    
    setTesting(false);
  };

  const runStressTest = async () => {
    setTesting(true);
    
    // 並發測試
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(runTest('v2', 5));
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    await Promise.all(promises);
    setTesting(false);
  };

  const clearResults = () => setResults([]);

  // 計算統計
  const statistics = React.useMemo(() => {
    const v1Results = results.filter(r => r.method === 'v1');
    const v2Results = results.filter(r => r.method === 'v2');
    
    const calculateStats = (results: TestResult[]) => {
      if (results.length === 0) return { avgTime: 0, successRate: 0, total: 0 };
      
      const successful = results.filter(r => r.success);
      const avgTime = successful.length > 0
        ? successful.reduce((sum, r) => sum + r.time, 0) / successful.length
        : 0;
      
      return {
        avgTime: Math.round(avgTime),
        successRate: (successful.length / results.length) * 100,
        total: results.length
      };
    };
    
    return {
      v1: calculateStats(v1Results),
      v2: calculateStats(v2Results)
    };
  }, [results]);

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Pallet Generation Test Suite</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* V1 統計 */}
        <Card>
          <CardHeader>
            <CardTitle>V1 (Original) Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Total Tests: {statistics.v1.total}</p>
              <p>Average Time: {statistics.v1.avgTime}ms</p>
              <p>Success Rate: {statistics.v1.successRate.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
        
        {/* V2 統計 */}
        <Card>
          <CardHeader>
            <CardTitle>V2 (Optimized) Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Total Tests: {statistics.v2.total}</p>
              <p>Average Time: {statistics.v2.avgTime}ms</p>
              <p>Success Rate: {statistics.v2.successRate.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 測試按鈕 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={() => runComparisonTest(1)}
              disabled={testing}
            >
              Compare 1 Number
            </Button>
            <Button 
              onClick={() => runComparisonTest(5)}
              disabled={testing}
            >
              Compare 5 Numbers
            </Button>
            <Button 
              onClick={() => runComparisonTest(10)}
              disabled={testing}
            >
              Compare 10 Numbers
            </Button>
            <Button 
              onClick={runStressTest}
              disabled={testing}
              variant="destructive"
            >
              Stress Test (5x5)
            </Button>
            <Button 
              onClick={clearResults}
              variant="outline"
            >
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 測試結果 */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-gray-500">No test results yet</p>
            ) : (
              <div className="space-y-2">
                {results.map((result, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded border ${
                      result.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold">{result.method}</span>
                        <span className="ml-2">({result.count} numbers)</span>
                        <span className="ml-2 text-sm text-gray-600">
                          {result.time}ms
                        </span>
                      </div>
                      <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                        {result.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                    {result.error && (
                      <p className="text-sm text-red-600 mt-1">{result.error}</p>
                    )}
                    {result.palletNumbers && result.palletNumbers.length <= 5 && (
                      <p className="text-xs text-gray-600 mt-1 font-mono">
                        {result.palletNumbers.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}