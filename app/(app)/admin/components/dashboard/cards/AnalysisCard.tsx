/**
 * AnalysisCard Component
 * 統一的分析卡片組件，取代原有的分析相關widgets
 * 整合 AnalysisExpandableCards + InventoryOrderedAnalysisWidget 功能
 * 使用 GraphQL + AI 提供智能分析和洞察
 */

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Settings,
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
  Play,
  Pause,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AnalysisType,
  AnalysisUrgency,
  AnalysisCardInput,
  AnalysisCardData,
  AnalysisGenerationInput,
  AiInsight,
  InsightSeverity,
  AnalysisFilters,
} from '@/types/generated/graphql';

// GraphQL 查詢
const ANALYSIS_CARD_QUERY = gql`
  query AnalysisCardQuery($input: AnalysisCardInput!) {
    analysisCardData(input: $input) {
      analysisType
      summary {
        title
        description
        keyMetrics {
          name
          value
          change
          changeDirection
          unit
          trend {
            timestamp
            value
            label
          }
        }
        overallScore
        status
        alertLevel
      }
      detailData {
        sections {
          id
          title
          content
          data
          visualizationType
          importance
        }
        dataPoints {
          id
          label
          value
          timestamp
          category
          metadata
        }
        comparisons {
          id
          title
          baseline
          current
          change
          changePercent
          timeframe
        }
        correlations {
          id
          variables
          coefficient
          strength
          significance
          interpretation
        }
      }
      aiInsights {
        id
        type
        confidence
        title
        content
        recommendations
        severity
        relatedData
        generatedAt
        modelUsed
        processingTime
      }
      visualizations {
        id
        type
        title
        data
        config
        interactive
        exportable
      }
      metadata {
        analysisId
        userId
        generatedAt
        dataSource
        dataPeriod
        recordsAnalyzed
        aiModelVersion
        processingSteps {
          step
          duration
          status
          details
        }
      }
      executionTime
      cached
      lastUpdated
      refreshInterval
    }
  }
`;

// GraphQL 突變
const GENERATE_ANALYSIS_MUTATION = gql`
  mutation GenerateAnalysis($input: AnalysisGenerationInput!) {
    generateAnalysis(input: $input) {
      id
      analysisId
      success
      message
      estimatedCompletionTime
      progress
    }
  }
`;

export interface AnalysisCardProps {
  // 分析類型配置
  analysisType?: AnalysisType;

  // 顯示選項
  showSummary?: boolean;
  showDetails?: boolean;
  showAIInsights?: boolean;
  showVisualizations?: boolean;

  // 時間範圍
  dateRange?: {
    start: Date;
    end: Date;
  };

  // 篩選條件
  filters?: AnalysisFilters;

  // 樣式
  className?: string;
  height?: number | string;

  // AI 配置
  aiUrgency?: AnalysisUrgency;

  // 編輯模式
  isEditMode?: boolean;

  // 回調
  onAnalysisGenerated?: (analysisId: string) => void;
  onInsightClick?: (insight: AiInsight) => void;
  onVisualizationExport?: (vizId: string) => void;
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({
  analysisType = AnalysisType.InventoryOrderMatching,
  showSummary = true,
  showDetails = true,
  showAIInsights = true,
  showVisualizations = true,
  dateRange,
  filters,
  className,
  height = 700,
  aiUrgency = AnalysisUrgency.Normal,
  isEditMode = false,
  onAnalysisGenerated,
  onInsightClick,
  onVisualizationExport,
}) => {
  // 狀態管理
  const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'insights' | 'visualizations'>(
    'summary'
  );
  const [aiInsightsExpanded, setAIInsightsExpanded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [localFilters, setLocalFilters] = useState<AnalysisFilters>(filters || {});

  // 準備查詢輸入
  const queryInput: AnalysisCardInput = {
    analysisType,
    timeRange: dateRange
      ? {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        }
      : undefined,
    filters: localFilters,
    includeAIInsights: showAIInsights,
    urgency: aiUrgency,
    userId: 'current_user', // 應該從上下文獲取
  };

  // 執行 GraphQL 查詢
  const { data, loading, error, refetch } = useQuery<{ analysisCardData: AnalysisCardData }>(
    ANALYSIS_CARD_QUERY,
    {
      variables: { input: queryInput },
      fetchPolicy: 'cache-and-network',
      skip: isEditMode,
      pollInterval: autoRefresh ? 30000 : 0, // 30秒自動刷新
    }
  );

  // GraphQL 突變
  const [generateAnalysis] = useMutation(GENERATE_ANALYSIS_MUTATION);

  // 處理分析生成
  const handleGenerateAnalysis = useCallback(async () => {
    if (!data?.analysisCardData) return;

    const input: AnalysisGenerationInput = {
      analysisType,
      title: `${analysisType} Analysis`,
      description: data.analysisCardData.summary.description,
      filters: localFilters,
      urgency: aiUrgency,
      includeAI: showAIInsights,
      userId: 'current_user',
    };

    try {
      const { data: result } = await generateAnalysis({ variables: { input } });

      if (result?.generateAnalysis.success) {
        onAnalysisGenerated?.(result.generateAnalysis.analysisId);
        refetch();
      }
    } catch (error) {
      console.error('Failed to generate analysis:', error);
    }
  }, [
    analysisType,
    localFilters,
    aiUrgency,
    showAIInsights,
    generateAnalysis,
    onAnalysisGenerated,
    refetch,
    data?.analysisCardData,
  ]);

  // 處理刷新
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // AI 洞察分組
  const aiInsightsByType = useMemo(() => {
    if (!data?.analysisCardData.aiInsights) return {};

    return data.analysisCardData.aiInsights.reduce(
      (acc, insight) => {
        acc[insight.type] = acc[insight.type] || [];
        acc[insight.type].push(insight);
        return acc;
      },
      {} as Record<string, AiInsight[]>
    );
  }, [data?.analysisCardData.aiInsights]);

  // 關鍵洞察（高嚴重性）
  const criticalInsights = useMemo(
    () =>
      data?.analysisCardData.aiInsights?.filter(
        insight =>
          insight.severity === InsightSeverity.Critical ||
          insight.severity === InsightSeverity.Warning
      ) || [],
    [data?.analysisCardData.aiInsights]
  );

  // 格式化數值
  const formatValue = useCallback((value: string, unit?: string) => {
    return unit ? `${value} ${unit}` : value;
  }, []);

  // 格式化變化
  const formatChange = useCallback((change?: number, direction?: string) => {
    if (change === undefined) return null;

    const color =
      direction === 'UP'
        ? 'text-green-600'
        : direction === 'DOWN'
          ? 'text-red-600'
          : 'text-gray-600';
    const icon = direction === 'UP' ? '↗' : direction === 'DOWN' ? '↘' : '→';

    return (
      <span className={cn('text-sm font-medium', color)}>
        {icon} {Math.abs(change).toFixed(1)}%
      </span>
    );
  }, []);

  // 渲染分析摘要
  const renderSummary = () => {
    if (!showSummary || !data?.analysisCardData.summary) return null;

    const { summary } = data.analysisCardData;

    return (
      <div className='space-y-6'>
        {/* 概覽分數 */}
        <div className='rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:from-blue-950/20 dark:to-indigo-950/20'>
          <div className='mb-4 flex items-center justify-between'>
            <div>
              <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
                Overall Analysis Score
              </h3>
              <p className='mt-1 text-gray-600 dark:text-gray-400'>{summary.description}</p>
            </div>
            <div className='text-right'>
              <div className='text-3xl font-bold text-blue-600'>
                {summary.overallScore?.toFixed(1) || 'N/A'}
              </div>
              <div
                className={cn(
                  'rounded-full px-2 py-1 text-sm font-medium',
                  summary.status === 'EXCELLENT'
                    ? 'bg-green-100 text-green-800'
                    : summary.status === 'GOOD'
                      ? 'bg-blue-100 text-blue-800'
                      : summary.status === 'ATTENTION_REQUIRED'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                )}
              >
                {summary.status.replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* 警報級別 */}
          {summary.alertLevel && summary.alertLevel !== 'LOW' && (
            <div
              className={cn(
                'flex items-center gap-2 rounded-md p-3',
                summary.alertLevel === 'CRITICAL'
                  ? 'bg-red-100 text-red-800'
                  : summary.alertLevel === 'HIGH'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-yellow-100 text-yellow-800'
              )}
            >
              <AlertTriangle className='h-4 w-4' />
              <span className='text-sm font-medium'>{summary.alertLevel} Priority Alert</span>
            </div>
          )}
        </div>

        {/* 關鍵指標 */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          {summary.keyMetrics.map((metric, index) => (
            <motion.div
              key={metric.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'
            >
              <div className='mb-2 flex items-center justify-between'>
                <h4 className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                  {metric.name}
                </h4>
                {formatChange(metric.change || undefined, metric.changeDirection)}
              </div>
              <div className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                {formatValue(metric.value, metric.unit || undefined)}
              </div>

              {/* 簡化趨勢圖 */}
              {metric.trend && metric.trend.length > 0 && (
                <div className='mt-3 h-12'>
                  <div className='flex items-end space-x-1'>
                    {metric.trend.slice(-10).map((point, i) => (
                      <div
                        key={i}
                        className='rounded-t bg-blue-200 dark:bg-blue-700'
                        style={{
                          height: `${(point.value / Math.max(...(metric.trend || []).map(p => p.value))) * 100}%`,
                          minHeight: '2px',
                          width: '100%',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染詳細數據
  const renderDetails = () => {
    if (!showDetails || !data?.analysisCardData.detailData) return null;

    const { detailData } = data.analysisCardData;

    return (
      <div className='space-y-6'>
        {/* 分析章節 */}
        {detailData.sections.map(section => (
          <div
            key={section.id}
            className='rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'
          >
            <div className='mb-4 flex items-center justify-between'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                {section.title}
              </h3>
              <span
                className={cn(
                  'rounded-full px-2 py-1 text-xs',
                  section.importance === 'HIGH'
                    ? 'bg-red-100 text-red-800'
                    : section.importance === 'MEDIUM'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                )}
              >
                {section.importance}
              </span>
            </div>
            <p className='mb-4 text-gray-600 dark:text-gray-400'>{section.content}</p>

            {/* 視覺化類型指示器 */}
            <div className='flex items-center gap-2 text-sm text-gray-500'>
              {section.visualizationType === 'bar_chart' && <BarChart3 className='h-4 w-4' />}
              {section.visualizationType === 'line_chart' && <LineChart className='h-4 w-4' />}
              {section.visualizationType === 'pie_chart' && <PieChart className='h-4 w-4' />}
              <span>Visualization: {section.visualizationType?.replace('_', ' ')}</span>
            </div>
          </div>
        ))}

        {/* 數據比較 */}
        {detailData.comparisons.length > 0 && (
          <div className='rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
            <h3 className='mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100'>
              Performance Comparisons
            </h3>
            <div className='space-y-4'>
              {detailData.comparisons.map(comparison => (
                <div
                  key={comparison.id}
                  className='flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-700'
                >
                  <div>
                    <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                      {comparison.title}
                    </h4>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      {comparison.timeframe} comparison
                    </p>
                  </div>
                  <div className='text-right'>
                    <div className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                      {comparison.current} vs {comparison.baseline}
                    </div>
                    <div
                      className={cn(
                        'text-sm font-medium',
                        comparison.change > 0 ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {comparison.change > 0 ? '+' : ''}
                      {comparison.changePercent.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 相關性分析 */}
        {detailData.correlations.length > 0 && (
          <div className='rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
            <h3 className='mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100'>
              Data Correlations
            </h3>
            <div className='space-y-4'>
              {detailData.correlations.map(correlation => (
                <div key={correlation.id} className='rounded-lg bg-gray-50 p-4 dark:bg-gray-700'>
                  <div className='mb-2 flex items-center justify-between'>
                    <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                      {correlation.variables.join(' ↔ ')}
                    </h4>
                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-xs',
                        correlation.strength === 'STRONG'
                          ? 'bg-green-100 text-green-800'
                          : correlation.strength === 'MODERATE'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                      )}
                    >
                      {correlation.strength} ({correlation.coefficient.toFixed(2)})
                    </span>
                  </div>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    {correlation.interpretation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 渲染 AI 洞察
  const renderAIInsights = () => {
    if (!showAIInsights || !data?.analysisCardData.aiInsights?.length) return null;

    const { aiInsights } = data.analysisCardData;

    return (
      <div className='space-y-6'>
        {/* AI 洞察總覽 */}
        <div className='rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 p-6 dark:from-purple-950/20 dark:to-pink-950/20'>
          <div className='mb-4 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Brain className='h-6 w-6 text-purple-600' />
              <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
                AI-Powered Insights
              </h3>
            </div>
            <div className='text-sm text-gray-600 dark:text-gray-400'>
              {aiInsights.length} insights • Model: {aiInsights[0]?.modelUsed}
            </div>
          </div>

          {criticalInsights.length > 0 && (
            <div className='mb-4 rounded-lg border border-red-200 bg-red-100 p-4 dark:border-red-800 dark:bg-red-950/20'>
              <div className='flex items-center gap-2 text-red-800 dark:text-red-200'>
                <AlertTriangle className='h-4 w-4' />
                <span className='font-medium'>
                  {criticalInsights.length} Critical Insight{criticalInsights.length > 1 ? 's' : ''}{' '}
                  Detected
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 洞察列表 */}
        <div className='space-y-4'>
          {aiInsights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'cursor-pointer rounded-lg border p-6 transition-all hover:shadow-md',
                insight.severity === InsightSeverity.Critical
                  ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
                  : insight.severity === InsightSeverity.Warning
                    ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20'
                    : insight.severity === InsightSeverity.Optimization
                      ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20'
                      : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
              )}
              onClick={() => onInsightClick?.(insight)}
            >
              <div className='mb-3 flex items-start justify-between'>
                <div className='flex items-center gap-2'>
                  {insight.severity === InsightSeverity.Critical && (
                    <AlertTriangle className='h-5 w-5 text-red-600' />
                  )}
                  {insight.severity === InsightSeverity.Warning && (
                    <AlertTriangle className='h-5 w-5 text-yellow-600' />
                  )}
                  {insight.severity === InsightSeverity.Optimization && (
                    <TrendingUp className='h-5 w-5 text-blue-600' />
                  )}
                  {insight.severity === InsightSeverity.Info && (
                    <Activity className='h-5 w-5 text-gray-600' />
                  )}
                  <h4 className='font-semibold text-gray-900 dark:text-gray-100'>
                    {insight.title}
                  </h4>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-500'>
                  <span>Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
                  <span>•</span>
                  <span>{(insight.processingTime || 0).toFixed(1)}s</span>
                </div>
              </div>

              <p className='mb-4 text-gray-700 dark:text-gray-300'>{insight.content}</p>

              {insight.recommendations.length > 0 && (
                <div className='space-y-2'>
                  <h5 className='font-medium text-gray-900 dark:text-gray-100'>Recommendations:</h5>
                  <ul className='space-y-1'>
                    {insight.recommendations.map((rec, i) => (
                      <li
                        key={i}
                        className='flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400'
                      >
                        <span className='mt-1 text-blue-600'>•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className='mt-4 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700'>
                <span className='text-xs text-gray-500'>
                  {insight.type.replace('_', ' ')} •{' '}
                  {new Date(insight.generatedAt).toLocaleString()}
                </span>
                <div className='ml-4 h-1 w-full rounded-full bg-gray-200 dark:bg-gray-700'>
                  <div
                    className='h-1 rounded-full bg-blue-600'
                    style={{ width: `${insight.confidence * 100}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  // 錯誤狀態
  if (error && !data) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg bg-red-50 p-8 dark:bg-red-950/20',
          className
        )}
      >
        <AlertTriangle className='mr-2 h-6 w-6 text-red-500' />
        <span className='text-red-700 dark:text-red-300'>
          Failed to load analysis: {error.message}
        </span>
      </div>
    );
  }

  // 加載狀態
  if (loading && !data) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className='rounded-lg bg-gray-200 dark:bg-gray-700' style={{ height }} />
      </div>
    );
  }

  return (
    <div
      className={cn('overflow-hidden rounded-lg bg-white shadow-md dark:bg-gray-900', className)}
    >
      {/* 標題欄 */}
      <div className='flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700'>
        <div className='flex items-center space-x-3'>
          <Brain className='h-6 w-6 text-purple-600' />
          <div>
            <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
              {data?.analysisCardData.summary.title || 'Analysis Dashboard'}
            </h2>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              {analysisType.replace('_', ' ')} • Last updated:{' '}
              {data?.analysisCardData.lastUpdated
                ? new Date(data.analysisCardData.lastUpdated).toLocaleTimeString()
                : 'Never'}
            </p>
          </div>
        </div>

        <div className='flex items-center space-x-2'>
          {/* AI 狀態指示器 */}
          {data?.analysisCardData.aiInsights && data.analysisCardData.aiInsights.length > 0 && (
            <div className='flex items-center gap-1 rounded-md bg-purple-50 px-2 py-1 text-sm text-purple-600 dark:bg-purple-950/20'>
              <Sparkles className='h-4 w-4' />
              {data.analysisCardData.aiInsights.length} AI Insights
            </div>
          )}

          {/* 自動刷新控制 */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              'rounded-md p-2 transition-colors',
              autoRefresh ? 'bg-green-100 text-green-600' : 'text-gray-500 hover:bg-gray-100'
            )}
            title={autoRefresh ? 'Disable auto refresh' : 'Enable auto refresh'}
          >
            {autoRefresh ? <Pause className='h-4 w-4' /> : <Play className='h-4 w-4' />}
          </button>

          {/* 篩選器控制 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className='rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          >
            <Filter className='h-4 w-4' />
          </button>

          {/* 刷新按鈕 */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className='rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* 篩選器面板 */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className='border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800'
          >
            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                  Warehouse
                </label>
                <select
                  value={localFilters.warehouse || ''}
                  onChange={e => setLocalFilters(prev => ({ ...prev, warehouse: e.target.value }))}
                  className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm'
                >
                  <option value=''>All Warehouses</option>
                  <option value='main'>Main Warehouse</option>
                  <option value='north'>North Warehouse</option>
                  <option value='south'>South Warehouse</option>
                </select>
              </div>

              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                  AI Urgency
                </label>
                <select
                  value={aiUrgency}
                  onChange={e => {
                    // This would trigger a re-query with new urgency
                    console.log('AI Urgency changed:', e.target.value);
                  }}
                  className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm'
                >
                  <option value={AnalysisUrgency.Fast}>Fast (5s)</option>
                  <option value={AnalysisUrgency.Normal}>Normal (15s)</option>
                  <option value={AnalysisUrgency.Thorough}>Thorough (60s)</option>
                </select>
              </div>

              <div className='flex items-end'>
                <button
                  onClick={handleGenerateAnalysis}
                  disabled={isEditMode || loading}
                  className='rounded-md bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700 disabled:opacity-50'
                >
                  Generate New Analysis
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 內容標籤 */}
      <div className='border-b border-gray-200 dark:border-gray-700'>
        <nav className='flex space-x-8 px-6'>
          <button
            onClick={() => setActiveTab('summary')}
            className={cn(
              'border-b-2 px-1 py-4 text-sm font-medium',
              activeTab === 'summary'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            )}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={cn(
              'border-b-2 px-1 py-4 text-sm font-medium',
              activeTab === 'details'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            )}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={cn(
              'relative border-b-2 px-1 py-4 text-sm font-medium',
              activeTab === 'insights'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            )}
          >
            AI Insights
            {criticalInsights.length > 0 && (
              <span className='absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500' />
            )}
          </button>
          <button
            onClick={() => setActiveTab('visualizations')}
            className={cn(
              'border-b-2 px-1 py-4 text-sm font-medium',
              activeTab === 'visualizations'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            )}
          >
            Visualizations
          </button>
        </nav>
      </div>

      {/* 內容容器 */}
      <div className='p-6' style={{ maxHeight: height, overflowY: 'auto' }}>
        {activeTab === 'summary' && renderSummary()}
        {activeTab === 'details' && renderDetails()}
        {activeTab === 'insights' && renderAIInsights()}
        {activeTab === 'visualizations' && (
          <div className='py-12 text-center'>
            <BarChart3 className='mx-auto mb-4 h-16 w-16 text-gray-300' />
            <h3 className='mb-2 text-lg font-medium text-gray-900 dark:text-gray-100'>
              Visualizations Coming Soon
            </h3>
            <p className='text-gray-600 dark:text-gray-400'>
              Interactive charts and graphs will be available here
            </p>
          </div>
        )}

        {/* 空狀態 */}
        {!data?.analysisCardData && !loading && (
          <div className='py-12 text-center'>
            <Brain className='mx-auto mb-4 h-16 w-16 text-gray-300' />
            <h3 className='mb-2 text-lg font-medium text-gray-900 dark:text-gray-100'>
              No analysis data available
            </h3>
            <p className='mb-4 text-gray-600 dark:text-gray-400'>
              Generate your first analysis to get started
            </p>
            <button
              onClick={handleGenerateAnalysis}
              disabled={isEditMode}
              className='rounded-md bg-purple-600 px-6 py-2 text-white hover:bg-purple-700 disabled:opacity-50'
            >
              Generate Analysis
            </button>
          </div>
        )}
      </div>

      {/* 元數據信息 */}
      {data?.analysisCardData.metadata && (
        <div className='border-t border-gray-200 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-800'>
          <div className='flex items-center justify-between text-xs text-gray-500'>
            <div className='flex items-center gap-4'>
              <span>
                Records: {data.analysisCardData.metadata.recordsAnalyzed.toLocaleString()}
              </span>
              <span>Execution: {data.analysisCardData.executionTime.toFixed(2)}s</span>
              <span>Source: {data.analysisCardData.metadata.dataSource}</span>
            </div>
            <div className='flex items-center gap-2'>
              <span>Analysis ID: {data.analysisCardData.metadata.analysisId.slice(-8)}</span>
              {data.analysisCardData.cached && (
                <span className='rounded bg-green-100 px-2 py-1 text-green-800'>Cached</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 導出類型，方便其他組件使用
export type {
  AnalysisType,
  AnalysisUrgency,
  AnalysisCardInput,
  AnalysisCardData,
  AiInsight,
} from '@/types/generated/graphql';
