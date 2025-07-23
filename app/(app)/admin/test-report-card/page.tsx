/**
 * ReportCard Test Page
 * 測試 GraphQL 整合的 ReportCard 組件
 */

'use client';

import React, { useState } from 'react';
import { ReportCard } from '@/app/(app)/admin/components/dashboard/cards/ReportCard';
import { 
  ReportType,
  ReportFormat,
  GeneratedReport,
  ReportTemplate,
} from '@/types/generated/graphql';
import { toast } from 'sonner';

export default function TestReportCardPage() {
  const [selectedReportType, setSelectedReportType] = useState<ReportType>(ReportType.TransactionReport);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);

  // 報表類型配置
  const reportTypes = [
    {
      id: ReportType.TransactionReport,
      name: 'Transaction Report',
      description: 'Detailed transaction history and analysis',
      icon: '💰',
    },
    {
      id: ReportType.InventoryReport,
      name: 'Inventory Report',
      description: 'Current inventory levels and stock analysis',
      icon: '📦',
    },
    {
      id: ReportType.FinancialReport,
      name: 'Financial Report',
      description: 'Financial performance and cost analysis',
      icon: '📊',
    },
    {
      id: ReportType.OperationalReport,
      name: 'Operational Report',
      description: 'Operational efficiency and performance metrics',
      icon: '⚙️',
    },
    {
      id: ReportType.CustomReport,
      name: 'Custom Report',
      description: 'User-defined custom reports with flexible configuration',
      icon: '🎯',
    },
    {
      id: ReportType.SystemReport,
      name: 'System Report',
      description: 'System performance and usage analytics',
      icon: '🖥️',
    },
  ];

  // 處理報表生成完成
  const handleReportGenerated = (report: GeneratedReport) => {
    console.log('Report generated:', report);
    setGeneratedReports(prev => [...prev, report]);
    toast.success(`Report generated: ${report.title}`);
  };

  // 處理報表刪除
  const handleReportDeleted = (reportId: string) => {
    console.log('Report deleted:', reportId);
    setGeneratedReports(prev => prev.filter(r => r.id !== reportId));
    toast.success('Report deleted successfully');
  };

  // 處理報表下載
  const handleReportDownload = (report: GeneratedReport) => {
    console.log('Report downloaded:', report);
    toast.success(`Report downloaded: ${report.fileName}`);
  };

  // 處理模板選擇
  const handleTemplateSelected = (template: ReportTemplate) => {
    console.log('Template selected:', template);
    setSelectedTemplate(template);
    toast.info(`Template selected: ${template.name}`);
  };

  // 清空結果
  const clearResults = () => {
    setGeneratedReports([]);
    setSelectedTemplate(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">ReportCard GraphQL Test Page</h1>
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          Clear Results
        </button>
      </div>

      {/* 報表類型選擇 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Select Report Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {reportTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedReportType(type.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedReportType === type.id
                  ? 'border-blue-500 bg-blue-100 text-blue-900'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl mb-1">{type.icon}</div>
              <div className="font-medium text-sm">{type.name}</div>
              <div className="text-xs text-gray-600 mt-1">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 當前配置信息 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">Current Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Report Type:</span>
            <span className="ml-2">{selectedReportType}</span>
          </div>
          <div>
            <span className="font-medium">Generated Reports:</span>
            <span className="ml-2">{generatedReports.length}</span>
          </div>
          {selectedTemplate && (
            <div>
              <span className="font-medium">Selected Template:</span>
              <span className="ml-2">{selectedTemplate.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* 標準報表卡片 */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Standard Report Card</h2>
        <ReportCard
          reportType={selectedReportType}
          showRecentReports={true}
          showActiveGenerations={true}
          showTemplates={true}
          showStatistics={true}
          showGenerationForm={true}
          height={600}
          onReportGenerated={handleReportGenerated}
          onReportDeleted={handleReportDeleted}
          onReportDownload={handleReportDownload}
          onTemplateSelected={handleTemplateSelected}
        />
      </section>

      {/* 緊湊模式報表卡片 */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Compact Report Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReportCard
            reportType={selectedReportType}
            showRecentReports={true}
            showActiveGenerations={true}
            showTemplates={false}
            showStatistics={false}
            showGenerationForm={false}
            height={350}
            onReportGenerated={handleReportGenerated}
            onReportDeleted={handleReportDeleted}
            className="bg-gray-50"
          />
          <ReportCard
            reportType={ReportType.InventoryReport}
            showRecentReports={false}
            showActiveGenerations={true}
            showTemplates={false}
            showStatistics={true}
            showGenerationForm={true}
            height={350}
            onReportGenerated={handleReportGenerated}
            className="bg-blue-50"
          />
        </div>
      </section>

      {/* 編輯模式測試 */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Edit Mode (Disabled Generation)</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 text-sm">
            <strong>Edit Mode:</strong> This card is in edit mode and report generation is disabled.
            The configuration is still loaded but interactions are blocked.
          </p>
        </div>
        <ReportCard
          reportType={selectedReportType}
          showRecentReports={true}
          showActiveGenerations={true}
          showTemplates={true}
          showStatistics={true}
          showGenerationForm={true}
          height={400}
          isEditMode={true}
        />
      </section>

      {/* 生成結果顯示 */}
      {generatedReports.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">Generated Reports</h2>
          <div className="bg-white rounded-lg border p-4">
            <div className="space-y-3">
              {generatedReports.slice(-5).map((report, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border bg-green-50 border-green-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-green-800">
                        ✅ {report.title}
                      </span>
                      <div className="text-sm text-gray-600 mt-1">
                        Type: {report.reportType} | Format: {report.format} | 
                        Records: {report.recordCount?.toLocaleString()} |
                        Size: {report.fileSize ? Math.round(report.fileSize / 1024) : 0} KB
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

      {/* 功能測試指南 */}
      <section className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Testing Guide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Report Types</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>💰 <strong>Transaction:</strong> Detailed transaction history and analysis</li>
              <li>📦 <strong>Inventory:</strong> Current inventory levels and stock analysis</li>
              <li>📊 <strong>Financial:</strong> Financial performance and cost analysis</li>
              <li>⚙️ <strong>Operational:</strong> Operational efficiency metrics</li>
              <li>🎯 <strong>Custom:</strong> User-defined custom reports</li>
              <li>🖥️ <strong>System:</strong> System performance analytics</li>
            </ul>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Features to Test</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Report generation with different formats</li>
              <li>✅ Real-time generation progress tracking</li>
              <li>✅ Template selection and usage</li>
              <li>✅ Recent reports display and management</li>
              <li>✅ Report download functionality</li>
              <li>✅ Report deletion and cleanup</li>
              <li>✅ Statistics and metrics display</li>
              <li>✅ Error handling and retry mechanisms</li>
            </ul>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Test Instructions</h3>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. Select different report types above</li>
              <li>2. Fill out the generation form with custom title/description</li>
              <li>3. Try different formats (PDF, Excel, CSV)</li>
              <li>4. Test priority levels and scheduling</li>
              <li>5. Watch real-time progress updates</li>
              <li>6. Download completed reports</li>
              <li>7. Delete reports to test cleanup</li>
              <li>8. Check statistics and metrics</li>
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
              <li>• Unified ReportCard component</li>
              <li>• GraphQL-powered report generation</li>
              <li>• Dynamic configuration by report type</li>
              <li>• Real-time progress tracking</li>
              <li>• Template management system</li>
              <li>• Flexible format support</li>
              <li>• Comprehensive error handling</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Replaced Widgets</h3>
            <ul className="space-y-1 text-gray-300">
              <li>• ReportGeneratorWithDialogWidget (unified report generation)</li>
              <li>• TransactionReportWidget (transaction-specific reports)</li>
              <li>• Plus additional report-related functionality</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gray-800 rounded">
          <p className="text-green-400 font-semibold">
            🎯 ReportCard successfully consolidates report widgets into 1 unified component
          </p>
          <p className="text-gray-300 mt-1">
            Achieving significant code reduction while adding GraphQL integration and enhanced report management
          </p>
        </div>
      </section>
    </div>
  );
}