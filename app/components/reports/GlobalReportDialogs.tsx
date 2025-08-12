/**
 * Global Report Dialogs
 * 管理所有報表對話框的全局組件
 */

'use client';

import React, { useState, useEffect } from 'react';
import { UnifiedLoadingReportDialog } from '@/app/(app)/order-loading/components/UnifiedLoadingReportDialog';
// ACO Report now integrated directly into system page card
// GRN Report now integrated directly into system page card
// Transaction Report now integrated directly into system page card
import { UnifiedExportAllDataDialog } from '@/app/components/reports/UnifiedExportAllDataDialog';

interface ReportDialogState {
  orderLoadingReport: boolean;
  stockTakeReport: boolean;
  exportAllData: boolean;
}

export function GlobalReportDialogs() {
  const [dialogStates, setDialogStates] = useState<ReportDialogState>({
    orderLoadingReport: false,
    stockTakeReport: false,
    exportAllData: false,
  });

  useEffect(() => {
    // 監聽開啟報表的自定義事件
    const handleOpenOrderLoadingReport = () => {
      setDialogStates(prev => ({ ...prev, orderLoadingReport: true }));
    };

    const handleOpenStockTakeReport = () => {
      setDialogStates(prev => ({ ...prev, stockTakeReport: true }));
    };

    // ACO Order Report now integrated into system page
    // const handleOpenAcoOrderReport = () => {
    //   setDialogStates(prev => ({ ...prev, acoOrderReport: true }));
    // };

    // Transaction Report now integrated into system page
    // const handleOpenTransactionReport = () => {
    //   setDialogStates(prev => ({ ...prev, transactionReport: true }));
    // };

    // GRN Report now integrated into system page
    // const handleOpenGrnReport = () => {
    //   setDialogStates(prev => ({ ...prev, grnReport: true }));
    // };

    const handleOpenExportAllData = () => {
      setDialogStates(prev => ({ ...prev, exportAllData: true }));
    };

    // 添加事件監聽器
    window.addEventListener('openOrderLoadingReport', handleOpenOrderLoadingReport);
    window.addEventListener('openStockTakeReport', handleOpenStockTakeReport);
    // window.addEventListener('openAcoOrderReport', handleOpenAcoOrderReport);
    // window.addEventListener('openTransactionReport', handleOpenTransactionReport);
    // window.addEventListener('openGrnReport', handleOpenGrnReport);
    window.addEventListener('openExportAllData', handleOpenExportAllData);

    // 清理函數
    return () => {
      window.removeEventListener('openOrderLoadingReport', handleOpenOrderLoadingReport);
      window.removeEventListener('openStockTakeReport', handleOpenStockTakeReport);
      window.removeEventListener('openExportAllData', handleOpenExportAllData);
    };
  }, []);

  const closeDialog = (reportKey: keyof ReportDialogState) => {
    setDialogStates(prev => ({ ...prev, [reportKey]: false }));
  };

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
