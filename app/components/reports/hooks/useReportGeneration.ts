/**
 * 報表生成 Hook
 * 提供統一的報表生成介面
 */

import { useState, useCallback } from 'react';
import { ReportEngine } from '../core/ReportEngine';
import { ReportRegistry } from '../core/ReportRegistry';
import { ReportFormat, FilterValues } from '../core/ReportConfig';

interface UseReportGenerationOptions {
  onSuccess?: (blob: Blob, filename: string) => void;
  onError?: (error: Error) => void;
  autoDownload?: boolean;
}

export function useReportGeneration(reportId: string, options: UseReportGenerationOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const { onSuccess, onError, autoDownload = true } = options;

  const generateReport = useCallback(
    async (format: ReportFormat, filters: FilterValues) => {
      setIsGenerating(true);
      setError(null);
      setProgress(0);

      try {
        // 獲取報表配置
        const registeredReport = ReportRegistry.getReport(reportId);
        if (!registeredReport) {
          throw new Error(`Report "${reportId}" not found in registry`);
        }

        // 創建報表引擎
        const engine = new ReportEngine(
          registeredReport.config,
          registeredReport.dataSources,
          registeredReport.generators
        );

        // 生成報表
        setProgress(20);
        const blob = await engine.generateReport(format, filters);
        setProgress(80);

        // 生成檔案名
        const now = new Date();
        const timestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const filename = `${reportId}_${timestamp}.${format === 'excel' ? 'xlsx' : format}`;

        // 自動下載
        if (autoDownload) {
          downloadBlob(blob, filename);
        }

        setProgress(100);

        // 回調
        if (onSuccess) {
          onSuccess(blob, filename);
        }

        return { blob, filename };
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);

        if (onError) {
          onError(error);
        }

        throw error;
      } finally {
        setIsGenerating(false);
        // 延遲重置進度
        setTimeout(() => setProgress(0), 500);
      }
    },
    [reportId, onSuccess, onError, autoDownload]
  );

  return {
    generateReport,
    isGenerating,
    progress,
    error,
  };
}

/**
 * 下載 Blob 檔案
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
