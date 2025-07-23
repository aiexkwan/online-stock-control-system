/**
 * AnalysisCard Test Page
 * 測試 GraphQL 整合的 AnalysisCard 組件，包含 AI 分析功能
 */

'use client';

import React, { useState } from 'react';
import { AnalysisCard } from '@/app/(app)/admin/components/dashboard/cards/AnalysisCard';
import { 
  AnalysisType,
  AnalysisUrgency,
  AiInsight,
  AnalysisFilters,
} from '@/types/generated/graphql';
import { toast } from 'sonner';

export default function TestAnalysisCardPage() {
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<AnalysisType>(AnalysisType.InventoryOrderMatching);
  const [selectedUrgency, setSelectedUrgency] = useState<AnalysisUrgency>(AnalysisUrgency.Normal);
  const [generatedAnalyses, setGeneratedAnalyses] = useState<string[]>([]);
  const [clickedInsights, setClickedInsights] = useState<AiInsight[]>([]);
  const [filters, setFilters] = useState<AnalysisFilters>({});

  // 分析類型配置
  const analysisTypes = [
    {
      id: AnalysisType.InventoryOrderMatching,
      name: 'Inventory-Order Matching',
      description: 'Analyze inventory levels against order demand patterns',
      icon: '📦',
      color: 'blue',
    },
    {
      id: AnalysisType.OperationalDashboard,
      name: 'Operational Dashboard',
      description: 'Comprehensive operational efficiency metrics and insights',
      icon: '⚙️',
      color: 'green',
    },
    {
      id: AnalysisType.PerformanceAnalysis,
      name: 'Performance Analysis',
      description: 'KPI analysis and performance trend evaluation',
      icon: '📊',
      color: 'purple',
    },
    {
      id: AnalysisType.TrendForecasting,
      name: 'Trend Forecasting',
      description: 'AI-powered predictive analysis and trend forecasting',
      icon: '📈',
      color: 'indigo',
    },
    {
      id: AnalysisType.AnomalyDetection,
      name: 'Anomaly Detection',
      description: 'Identify unusual patterns and potential operational issues',
      icon: '🚨',
      color: 'red',
    },
  ];

  // AI 緊急程度配置
  const urgencyLevels = [
    {
      id: AnalysisUrgency.Fast,
      name: 'Fast Analysis',
      description: '5-second quick insights using GPT-4o mini',
      time: '~5s',
      color: 'green',
    },
    {
      id: AnalysisUrgency.Normal,
      name: 'Normal Analysis',
      description: '15-second balanced analysis using GPT-4o',
      time: '~15s',
      color: 'blue',
    },
    {
      id: AnalysisUrgency.Thorough,
      name: 'Thorough Analysis',
      description: '60-second comprehensive deep analysis',
      time: '~60s',
      color: 'purple',
    },
  ];

  // 處理分析生成完成
  const handleAnalysisGenerated = (analysisId: string) => {
    console.log('Analysis generated:', analysisId);
    setGeneratedAnalyses(prev => [...prev, analysisId]);
    toast.success(`Analysis generated: ${analysisId.slice(-8)}`);
  };

  // 處理洞察點擊
  const handleInsightClick = (insight: AiInsight) => {
    console.log('Insight clicked:', insight);
    setClickedInsights(prev => [...prev, insight]);
    toast.info(`AI Insight: ${insight.title}`, {
      description: `Confidence: ${(insight.confidence * 100).toFixed(0)}% • ${insight.type.replace('_', ' ')}`,
    });
  };

  // 處理視覺化導出
  const handleVisualizationExport = (vizId: string) => {
    console.log('Visualization exported:', vizId);
    toast.success(`Visualization exported: ${vizId}`);
  };

  // 清空結果
  const clearResults = () => {
    setGeneratedAnalyses([]);
    setClickedInsights([]);
  };

  // 更新篩選器
  const updateFilters = (newFilters: Partial<AnalysisFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">AnalysisCard AI Test Page</h1>
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          Clear Results
        </button>
      </div>

      {/* 分析類型選擇 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-4">Select Analysis Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analysisTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedAnalysisType(type.id)}
              className={`p-4 rounded-lg border text-left transition-all ${
                selectedAnalysisType === type.id
                  ? `border-${type.color}-500 bg-${type.color}-100 text-${type.color}-900`
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="text-3xl mb-2">{type.icon}</div>
              <div className="font-medium text-sm">{type.name}</div>
              <div className="text-xs text-gray-600 mt-1">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* AI 緊急程度選擇 */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="font-semibold text-purple-900 mb-4">AI Analysis Speed</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {urgencyLevels.map((urgency) => (
            <button
              key={urgency.id}
              onClick={() => setSelectedUrgency(urgency.id)}
              className={`p-4 rounded-lg border text-left transition-all ${
                selectedUrgency === urgency.id
                  ? `border-${urgency.color}-500 bg-${urgency.color}-100 text-${urgency.color}-900`
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium text-sm">{urgency.name}</div>
              <div className="text-xs text-gray-600 mt-1">{urgency.description}</div>
              <div className="text-xs font-semibold mt-2">{urgency.time}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 篩選器配置 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="font-semibold text-green-900 mb-4">Analysis Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warehouse
            </label>
            <select
              value={filters.warehouse || ''}
              onChange={(e) => updateFilters({ warehouse: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Warehouses</option>
              <option value="main">Main Warehouse</option>
              <option value="north">North Warehouse</option>
              <option value="south">South Warehouse</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Categories
            </label>
            <select
              onChange={(e) => {
                const categories = e.target.value ? [e.target.value] : [];
                updateFilters({ productCategories: categories });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="books">Books</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Filters
            </label>
            <select
              onChange={(e) => {
                const statuses = e.target.value ? [e.target.value] : [];
                updateFilters({ statusFilters: statuses });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* 當前配置信息 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">Current Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Analysis Type:</span>
            <span className="ml-2">{selectedAnalysisType.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="font-medium">AI Speed:</span>
            <span className="ml-2">{selectedUrgency}</span>
          </div>
          <div>
            <span className="font-medium">Generated Analyses:</span>
            <span className="ml-2">{generatedAnalyses.length}</span>
          </div>
          <div>
            <span className="font-medium">Clicked Insights:</span>
            <span className="ml-2">{clickedInsights.length}</span>
          </div>
        </div>
        {Object.keys(filters).length > 0 && (
          <div className="mt-2 text-sm">
            <span className="font-medium">Active Filters:</span>
            <span className="ml-2">{JSON.stringify(filters)}</span>
          </div>
        )}
      </div>

      {/* 標準分析卡片 */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Standard AnalysisCard</h2>
        <AnalysisCard
          analysisType={selectedAnalysisType}
          showSummary={true}
          showDetails={true}
          showAIInsights={true}
          showVisualizations={true}
          filters={filters}
          height={800}
          aiUrgency={selectedUrgency}
          onAnalysisGenerated={handleAnalysisGenerated}
          onInsightClick={handleInsightClick}
          onVisualizationExport={handleVisualizationExport}
        />
      </section>

      {/* 緊湊模式分析卡片 */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Compact Analysis Cards</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnalysisCard
            analysisType={AnalysisType.PerformanceAnalysis}
            showSummary={true}
            showDetails={false}
            showAIInsights={true}
            showVisualizations={false}
            height={400}
            aiUrgency={AnalysisUrgency.Fast}
            onAnalysisGenerated={handleAnalysisGenerated}
            onInsightClick={handleInsightClick}
            className="bg-gray-50"
          />
          <AnalysisCard
            analysisType={AnalysisType.AnomalyDetection}
            showSummary={false}
            showDetails={true}
            showAIInsights={true}
            showVisualizations={false}
            height={400}
            aiUrgency={AnalysisUrgency.Thorough}
            onAnalysisGenerated={handleAnalysisGenerated}
            onInsightClick={handleInsightClick}
            className="bg-blue-50"
          />
        </div>
      </section>

      {/* 編輯模式測試 */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Edit Mode (Disabled AI)</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 text-sm">
            <strong>Edit Mode:</strong> This card is in edit mode and AI analysis is disabled.
            The configuration is still loaded but AI interactions are blocked.
          </p>
        </div>
        <AnalysisCard
          analysisType={selectedAnalysisType}
          showSummary={true}
          showDetails={true}
          showAIInsights={true}
          showVisualizations={true}
          height={500}
          isEditMode={true}
        />
      </section>

      {/* 生成結果顯示 */}
      {generatedAnalyses.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">Generated Analyses</h2>
          <div className="bg-white rounded-lg border p-4">
            <div className="space-y-3">
              {generatedAnalyses.slice(-5).map((analysisId, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border bg-green-50 border-green-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-green-800">
                        ✅ Analysis Generated
                      </span>
                      <div className="text-sm text-gray-600 mt-1">
                        ID: {analysisId} | Type: {selectedAnalysisType} | 
                        Speed: {selectedUrgency}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AI 洞察結果顯示 */}
      {clickedInsights.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">Clicked AI Insights</h2>
          <div className="bg-white rounded-lg border p-4">
            <div className="space-y-3">
              {clickedInsights.slice(-5).map((insight, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border bg-purple-50 border-purple-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-purple-800">
                        🧠 {insight.title}
                      </span>
                      <div className="text-sm text-gray-600 mt-1">
                        Type: {insight.type.replace('_', ' ')} | 
                        Confidence: {(insight.confidence * 100).toFixed(0)}% |
                        Severity: {insight.severity}
                      </div>
                      <div className="text-sm text-gray-700 mt-2">
                        {insight.content}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(insight.generatedAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 功能測試指南 */}
      <section className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Testing Guide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Analysis Types</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>📦 <strong>Inventory-Order:</strong> Match inventory to demand patterns</li>
              <li>⚙️ <strong>Operational:</strong> Efficiency metrics and insights</li>
              <li>📊 <strong>Performance:</strong> KPI analysis and trends</li>
              <li>📈 <strong>Forecasting:</strong> AI-powered predictive analysis</li>
              <li>🚨 <strong>Anomaly:</strong> Detect unusual patterns</li>
            </ul>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">AI Features to Test</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ AI insight generation with confidence scores</li>
              <li>✅ Multiple urgency levels (Fast/Normal/Thorough)</li>
              <li>✅ Real-time analysis progress tracking</li>
              <li>✅ Interactive insight clicking and feedback</li>
              <li>✅ Severity-based insight categorization</li>
              <li>✅ AI model fallback and error handling</li>
              <li>✅ Data sanitization for privacy protection</li>
            </ul>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Test Instructions</h3>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. Select different analysis types above</li>
              <li>2. Choose AI urgency level (Fast/Normal/Thorough)</li>
              <li>3. Configure filters for targeted analysis</li>
              <li>4. Generate analysis and watch AI insights</li>
              <li>5. Click on AI insights to test interactivity</li>
              <li>6. Test different urgency levels for speed</li>
              <li>7. Verify fallback handling in edit mode</li>
              <li>8. Check performance with multiple cards</li>
            </ol>
          </div>
        </div>
      </section>

      {/* 開發信息 */}
      <section className="bg-gray-900 text-white rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Development Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2">Component Architecture</h3>
            <ul className="space-y-1 text-gray-300">
              <li>• Unified AnalysisCard component with AI integration</li>
              <li>• GraphQL-powered analysis operations</li>
              <li>• OpenAI GPT-4o/4o-mini for intelligent insights</li>
              <li>• Dynamic analysis type switching</li>
              <li>• Real-time AI insight generation</li>
              <li>• Privacy-protected data sanitization</li>
              <li>• Comprehensive error handling and fallbacks</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Replaced Widgets</h3>
            <ul className="space-y-1 text-gray-300">
              <li>• AnalysisExpandableCards (expandable analysis views)</li>
              <li>• InventoryOrderedAnalysisWidget (inventory-order matching)</li>
              <li>• Plus AI-enhanced analysis capabilities</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gray-800 rounded">
          <p className="text-green-400 font-semibold">
            🎯 AnalysisCard successfully consolidates analysis widgets with advanced AI integration
          </p>
          <p className="text-gray-300 mt-1">
            Achieving significant functionality enhancement while maintaining unified GraphQL architecture
          </p>
        </div>
      </section>
    </div>
  );
}