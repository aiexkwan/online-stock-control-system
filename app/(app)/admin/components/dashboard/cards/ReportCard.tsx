/**
 * ReportCard Component
 * 統一的報表卡片組件，取代原有的報表相關widgets
 * 整合 ReportGeneratorWithDialogWidget + TransactionReportWidget 功能
 * 使用 GraphQL 提供高性能報表生成和管理
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentTextIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlayIcon,
  StopIcon,
  TrashIcon,
  ShareIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  PlusIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import {
  ReportType,
  ReportFormat,
  ReportStatus,
  ReportPriority,
  ReportCardInput,
  ReportGenerationInput,
  ReportCardData,
  GeneratedReport,
  ReportGenerationProgress,
  ReportTemplate,
  ReportStatistics,
} from '@/types/generated/graphql';

// GraphQL 查詢
const REPORT_CARD_QUERY = gql`
  query ReportCardQuery($input: ReportCardInput!) {
    reportCardData(input: $input) {
      reportType
      config {
        reportType
        title
        description
        formats
        maxFileSize
        retentionDays
        requireAuth
        allowScheduling
        supportsFiltering
        supportsGrouping
        estimatedGenerationTime
      }
      recentReports {
        id
        reportType
        title
        description
        format
        status
        fileName
        fileSize
        downloadUrl
        expiresAt
        generatedAt
        generatedBy
        generationTime
        recordCount
        priority
        downloadCount
        lastDownloaded
        error
      }
      activeGenerations {
        id
        reportType
        title
        status
        progress
        estimatedTimeRemaining
        recordsProcessed
        totalRecords
        error
        startedAt
        userId
      }
      templates {
        id
        name
        reportType
        description
        config
        filters
        grouping
        isPublic
        createdBy
        createdAt
        lastUsed
        usageCount
      }
      statistics {
        totalReports
        todayReports
        pendingReports
        completedReports
        failedReports
        averageGenerationTime
        successRate
        diskUsage
        quotaUsage
      }
      lastUpdated
      refreshInterval
      dataSource
    }
  }
`;

// GraphQL 突變
const GENERATE_REPORT_MUTATION = gql`
  mutation GenerateReport($input: ReportGenerationInput!) {
    generateReport(input: $input) {
      id
      reportId
      success
      message
      estimatedCompletionTime
      progress
    }
  }
`;

const CANCEL_GENERATION_MUTATION = gql`
  mutation CancelReportGeneration($generationId: ID!) {
    cancelReportGeneration(generationId: $generationId)
  }
`;

const DELETE_REPORT_MUTATION = gql`
  mutation DeleteReport($reportId: ID!) {
    deleteReport(reportId: $reportId)
  }
`;

export interface ReportCardProps {
  // 報表類型配置
  reportType?: ReportType;
  
  // 顯示選項
  showRecentReports?: boolean;
  showActiveGenerations?: boolean;
  showTemplates?: boolean;
  showStatistics?: boolean;
  showGenerationForm?: boolean;
  
  // 時間範圍
  dateRange?: {
    start: Date;
    end: Date;
  };
  
  // 樣式
  className?: string;
  height?: number | string;
  
  // 編輯模式
  isEditMode?: boolean;
  
  // 回調
  onReportGenerated?: (report: GeneratedReport) => void;
  onReportDeleted?: (reportId: string) => void;
  onReportDownload?: (report: GeneratedReport) => void;
  onTemplateSelected?: (template: ReportTemplate) => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  reportType = ReportType.TransactionReport,
  showRecentReports = true,
  showActiveGenerations = true,
  showTemplates = true,
  showStatistics = true,
  showGenerationForm = true,
  dateRange,
  className,
  height = 600,
  isEditMode = false,
  onReportGenerated,
  onReportDeleted,
  onReportDownload,
  onTemplateSelected,
}) => {
  // 狀態管理
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>(ReportFormat.Pdf);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [generationPriority, setGenerationPriority] = useState<ReportPriority>(ReportPriority.Normal);

  // 準備查詢輸入
  const queryInput: ReportCardInput = {
    reportType,
    dateRange: dateRange ? {
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
    } : undefined,
    includeStatistics: showStatistics,
    includeRecentReports: showRecentReports,
    includeActiveGenerations: showActiveGenerations,
    includeTemplates: showTemplates,
    userId: 'current_user', // 應該從上下文獲取
  };

  // 執行 GraphQL 查詢
  const { data, loading, error, refetch } = useQuery<{ reportCardData: ReportCardData }>(
    REPORT_CARD_QUERY,
    {
      variables: { input: queryInput },
      fetchPolicy: 'cache-and-network',
      skip: isEditMode,
      pollInterval: 5000, // 5秒輪詢以更新進度
    }
  );

  // GraphQL 突變
  const [generateReport] = useMutation(GENERATE_REPORT_MUTATION);
  const [cancelGeneration] = useMutation(CANCEL_GENERATION_MUTATION);
  const [deleteReport] = useMutation(DELETE_REPORT_MUTATION);

  // 處理報表生成
  const handleGenerateReport = useCallback(async () => {
    if (!data?.reportCardData.config) return;

    const input: ReportGenerationInput = {
      reportType,
      format: selectedFormat,
      title: reportTitle || data.reportCardData.config.title,
      description: reportDescription || data.reportCardData.config.description,
      templateId: selectedTemplate || undefined,
      priority: generationPriority,
      userId: 'current_user',
    };

    try {
      const { data: result } = await generateReport({ variables: { input } });
      
      if (result?.generateReport.success) {
        // 清空表單
        setReportTitle('');
        setReportDescription('');
        setSelectedTemplate('');
        
        // 重新查詢數據以顯示新的生成進度
        refetch();
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  }, [reportType, selectedFormat, reportTitle, reportDescription, selectedTemplate, generationPriority, generateReport, refetch, data?.reportCardData.config]);

  // 處理取消生成
  const handleCancelGeneration = useCallback(async (generationId: string) => {
    try {
      await cancelGeneration({ variables: { generationId } });
      refetch();
    } catch (error) {
      console.error('Failed to cancel generation:', error);
    }
  }, [cancelGeneration, refetch]);

  // 處理刪除報表
  const handleDeleteReport = useCallback(async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await deleteReport({ variables: { reportId } });
      onReportDeleted?.(reportId);
      refetch();
    } catch (error) {
      console.error('Failed to delete report:', error);
    }
  }, [deleteReport, onReportDeleted, refetch]);

  // 處理下載報表
  const handleDownloadReport = useCallback((report: GeneratedReport) => {
    if (report.downloadUrl) {
      window.open(report.downloadUrl, '_blank');
      onReportDownload?.(report);
    }
  }, [onReportDownload]);

  // 格式化文件大小
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // 格式化生成時間
  const formatDuration = useCallback((seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }, []);

  // 渲染報表生成表單
  const renderGenerationForm = () => {
    if (!showGenerationForm || !data?.reportCardData.config) return null;

    return (
      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            Generate New Report
          </h3>
          <PlayIcon className="w-5 h-5 text-blue-600" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Report Title
            </label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder={data.reportCardData.config.title}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Format
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as ReportFormat)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {data.reportCardData.config.formats.map((format) => (
                <option key={format} value={format}>
                  {format}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder={data.reportCardData.config.description}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {showTemplates && data.reportCardData.templates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No Template</option>
                {data.reportCardData.templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <select
              value={generationPriority}
              onChange={(e) => setGenerationPriority(e.target.value as ReportPriority)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={ReportPriority.Low}>Low</option>
              <option value={ReportPriority.Normal}>Normal</option>
              <option value={ReportPriority.High}>High</option>
              <option value={ReportPriority.Urgent}>Urgent</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Estimated generation time: {data.reportCardData.config.estimatedGenerationTime}s
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={isEditMode}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <PlayIcon className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>
    );
  };

  // 渲染活躍生成進度
  const renderActiveGenerations = () => {
    if (!showActiveGenerations || !data?.reportCardData.activeGenerations.length) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Active Generations
        </h3>
        <div className="space-y-3">
          {data.reportCardData.activeGenerations.map((generation) => (
            <motion.div
              key={generation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-900 dark:text-yellow-100">
                    {generation.title}
                  </span>
                </div>
                <button
                  onClick={() => handleCancelGeneration(generation.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <StopIcon className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mb-2">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Progress: {generation.progress.toFixed(1)}%</span>
                  <span>ETA: {generation.estimatedTimeRemaining}s</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${generation.progress}%` }}
                  />
                </div>
              </div>

              {generation.error && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  Error: {generation.error}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染最近報表
  const renderRecentReports = () => {
    if (!showRecentReports || !data?.reportCardData.recentReports.length) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Recent Reports
        </h3>
        <div className="space-y-3">
          {data.reportCardData.recentReports.map((report) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <DocumentTextIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {report.title}
                  </span>
                  {report.status === ReportStatus.Completed && (
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  )}
                  {report.status === ReportStatus.Error && (
                    <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {report.status === ReportStatus.Completed && (
                    <button
                      onClick={() => handleDownloadReport(report)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Download"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <span className="font-medium">Format:</span> {report.format}
                </div>
                <div>
                  <span className="font-medium">Size:</span> {formatFileSize(report.fileSize || 0)}
                </div>
                <div>
                  <span className="font-medium">Records:</span> {report.recordCount?.toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Generated:</span> {formatDuration(report.generationTime || 0)}
                </div>
              </div>

              {report.error && (
                <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                  Error: {report.error}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染統計信息
  const renderStatistics = () => {
    if (!showStatistics || !data?.reportCardData.statistics) return null;

    const stats = data.reportCardData.statistics;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{stats.completedReports}</div>
          <div className="text-sm text-green-800 dark:text-green-200">Completed</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.pendingReports}</div>
          <div className="text-sm text-yellow-800 dark:text-yellow-200">Pending</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{formatDuration(stats.averageGenerationTime)}</div>
          <div className="text-sm text-blue-800 dark:text-blue-200">Avg Time</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">{(stats.successRate * 100).toFixed(1)}%</div>
          <div className="text-sm text-purple-800 dark:text-purple-200">Success Rate</div>
        </div>
      </div>
    );
  };

  // 錯誤狀態
  if (error && !data) {
    return (
      <div
        className={cn(
          'flex items-center justify-center p-8 bg-red-50 dark:bg-red-950/20 rounded-lg',
          className
        )}
      >
        <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mr-2" />
        <span className="text-red-700 dark:text-red-300">
          Failed to load reports: {error.message}
        </span>
      </div>
    );
  }

  // 加載狀態
  if (loading && !data) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg" style={{ height }} />
      </div>
    );
  }

  return (
    <div className={cn('bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden', className)}>
      {/* 標題欄 */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <DocumentTextIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {data?.reportCardData.config.title || 'Report Management'}
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <FunnelIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => refetch()}
            className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* 內容容器 */}
      <div className="p-6" style={{ maxHeight: height, overflowY: 'auto' }}>
        {renderGenerationForm()}
        {renderActiveGenerations()}
        {renderStatistics()}
        {renderRecentReports()}

        {/* 空狀態 */}
        {!data?.reportCardData.recentReports.length && 
         !data?.reportCardData.activeGenerations.length && (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No reports yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Generate your first report to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// 導出類型，方便其他組件使用
export type { 
  ReportType, 
  ReportFormat, 
  ReportStatus,
  ReportCardInput,
  ReportCardData,
  GeneratedReport 
} from '@/types/generated/graphql';