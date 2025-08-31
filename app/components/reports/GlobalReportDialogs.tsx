/**
 * Global Report Dialogs
 * 管理所有報表對話框的全局組件
 *
 * @description 提供統一的報表對話框管理，處理全域報表開啟事件
 * @version 1.0.0
 * @author PennineWMS Team
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { UnifiedLoadingReportDialog } from '@/app/(app)/order-loading/components/UnifiedLoadingReportDialog';
// ACO Report now integrated directly into system page card
// GRN Report now integrated directly into system page card
// Transaction Report now integrated directly into system page card
import { UnifiedExportAllDataDialog } from '@/app/components/reports/UnifiedExportAllDataDialog';

/**
 * 報表對話框狀態介面
 * @interface ReportDialogState
 */
interface ReportDialogState {
  /** 訂單裝載報表對話框狀態 */
  readonly orderLoadingReport: boolean;
  /** 庫存盤點報表對話框狀態 */
  readonly stockTakeReport: boolean;
  /** 匯出所有數據對話框狀態 */
  readonly exportAllData: boolean;
}

/**
 * 自定義事件類型定義
 */
type ReportEventType = 'openOrderLoadingReport' | 'openStockTakeReport' | 'openExportAllData';

/**
 * 全域 Window 事件擴展
 */
declare global {
  interface WindowEventMap {
    openOrderLoadingReport: CustomEvent;
    openStockTakeReport: CustomEvent;
    openExportAllData: CustomEvent;
  }
}

/**
 * 全域報表對話框管理組件
 * @returns {JSX.Element} 全域報表對話框組件
 */
export function GlobalReportDialogs(): JSX.Element {
  const [dialogStates, setDialogStates] = useState<ReportDialogState>({
    orderLoadingReport: false,
    stockTakeReport: false,
    exportAllData: false,
  });

  /**
   * 關閉指定的報表對話框
   * @param {keyof ReportDialogState} reportKey - 報表對話框的鍵值
   */
  const closeDialog = useCallback((reportKey: keyof ReportDialogState): void => {
    setDialogStates(prev => ({ ...prev, [reportKey]: false }));
  }, []);

  /**
   * 處理開啟訂單裝載報表事件
   */
  const handleOpenOrderLoadingReport = useCallback((): void => {
    setDialogStates(prev => ({ ...prev, orderLoadingReport: true }));
  }, []);

  /**
   * 處理開啟庫存盤點報表事件
   */
  const handleOpenStockTakeReport = useCallback((): void => {
    setDialogStates(prev => ({ ...prev, stockTakeReport: true }));
  }, []);

  /**
   * 處理開啟匯出所有數據事件
   */
  const handleOpenExportAllData = useCallback((): void => {
    setDialogStates(prev => ({ ...prev, exportAllData: true }));
  }, []);

  useEffect(() => {
    try {
      // 添加事件監聽器
      window.addEventListener('openOrderLoadingReport', handleOpenOrderLoadingReport);
      window.addEventListener('openStockTakeReport', handleOpenStockTakeReport);
      window.addEventListener('openExportAllData', handleOpenExportAllData);

      // 清理函數
      return () => {
        window.removeEventListener('openOrderLoadingReport', handleOpenOrderLoadingReport);
        window.removeEventListener('openStockTakeReport', handleOpenStockTakeReport);
        window.removeEventListener('openExportAllData', handleOpenExportAllData);
      };
    } catch (error) {
      console.error('Failed to set up global report dialog event listeners:', error);
    }
  }, [handleOpenOrderLoadingReport, handleOpenStockTakeReport, handleOpenExportAllData]);

  return (
    <>
      <UnifiedLoadingReportDialog
        isOpen={dialogStates.orderLoadingReport}
        onClose={() => closeDialog('orderLoadingReport')}
      />

      {/* ACO Order Report now integrated directly into system page card */}
      {/* Transaction Report now integrated directly into system page card */}
      {/* GRN Report now integrated directly into system page card */}

      <UnifiedExportAllDataDialog
        isOpen={dialogStates.exportAllData}
        onClose={() => closeDialog('exportAllData')}
      />
    </>
  );
}
