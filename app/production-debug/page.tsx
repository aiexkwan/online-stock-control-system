'use client';

import { useState } from 'react';

export default function ProductionDebugPage() {
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    setDebugData(null);

    try {
      console.log('[Client] 開始診斷生產環境...');
      
      const response = await fetch('/api/debug-production', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[Client] 診斷結果:', data);
      setDebugData(data);
    } catch (err: any) {
      console.error('[Client] 診斷失敗:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testGrnActions = async () => {
    try {
      console.log('[Client] 測試 GRN Actions...');
      
      // 動態導入 actions
      const { generateGrnPalletNumbersAndSeries } = await import('../actions/grnActions');
      
      const result = await generateGrnPalletNumbersAndSeries(1);
      
      console.log('[Client] GRN Actions 結果:', result);
      
      if (result.error) {
        setError(`GRN Actions 錯誤: ${result.error}`);
      } else {
        setDebugData((prev: any) => ({
          ...prev,
          grnActionsTest: {
            success: true,
            palletNumbers: result.palletNumbers,
            series: result.series
          }
        }));
      }
    } catch (err: any) {
      console.error('[Client] GRN Actions 測試失敗:', err);
      setError(`GRN Actions 失敗: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          🚀 生產環境診斷工具
        </h1>
        
        <div className="space-y-6">
          {/* 控制按鈕 */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {loading ? '診斷中...' : '🔍 運行診斷'}
            </button>
            
            <button
              onClick={testGrnActions}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              🎯 測試 GRN Actions
            </button>
          </div>

          {/* 錯誤顯示 */}
          {error && (
            <div className="bg-red-900 border border-red-700 p-4 rounded-lg">
              <h3 className="font-bold text-red-400 mb-2">❌ 錯誤</h3>
              <pre className="text-red-300 whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          {/* 診斷結果 */}
          {debugData && (
            <div className="space-y-6">
              {/* 環境變數檢查 */}
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4 text-blue-400">
                  🌍 環境變數狀態
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(debugData.environment || {}).map(([key, value]) => (
                    <div key={key} className="bg-gray-700 p-3 rounded">
                      <div className="font-semibold text-yellow-400">{key}</div>
                      <pre className="text-sm text-gray-300 mt-1">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supabase 測試結果 */}
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4 text-green-400">
                  🔌 Supabase 連接測試
                </h3>
                <div className={`p-4 rounded ${debugData.supabaseTest?.success ? 'bg-green-900 border border-green-700' : 'bg-red-900 border border-red-700'}`}>
                  <div className="font-semibold mb-2">
                    {debugData.supabaseTest?.success ? '✅ 連接成功' : '❌ 連接失敗'}
                  </div>
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(debugData.supabaseTest, null, 2)}
                  </pre>
                </div>
              </div>

              {/* 棧板測試結果 */}
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4 text-purple-400">
                  📦 棧板號碼生成測試
                </h3>
                <div className={`p-4 rounded ${debugData.palletTest?.success ? 'bg-green-900 border border-green-700' : 'bg-red-900 border border-red-700'}`}>
                  <div className="font-semibold mb-2">
                    {debugData.palletTest?.success ? '✅ 生成成功' : '❌ 生成失敗'}
                  </div>
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(debugData.palletTest, null, 2)}
                  </pre>
                </div>
              </div>

              {/* GRN Actions 測試結果 */}
              {debugData.grnActionsTest && (
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-4 text-orange-400">
                    🏭 GRN Actions 測試
                  </h3>
                  <div className={`p-4 rounded ${debugData.grnActionsTest?.success ? 'bg-green-900 border border-green-700' : 'bg-red-900 border border-red-700'}`}>
                    <div className="font-semibold mb-2">
                      {debugData.grnActionsTest?.success ? '✅ Actions 成功' : '❌ Actions 失敗'}
                    </div>
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(debugData.grnActionsTest, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* 完整診斷數據 */}
              <details className="bg-gray-800 p-6 rounded-lg">
                <summary className="text-xl font-bold mb-4 text-gray-400 cursor-pointer hover:text-white">
                  📋 完整診斷數據 (點擊展開)
                </summary>
                <pre className="text-xs text-gray-300 whitespace-pre-wrap bg-black p-4 rounded mt-4 overflow-auto max-h-96">
                  {JSON.stringify(debugData, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>

        {/* 說明 */}
        <div className="mt-12 text-center text-gray-400">
          <p>這個工具幫助診斷生產環境中的 API key 和 Supabase 連接問題</p>
          <p className="text-sm mt-2">
            環境: {typeof window !== 'undefined' ? window.location.hostname : 'Unknown'}
          </p>
        </div>
      </div>
    </div>
  );
} 