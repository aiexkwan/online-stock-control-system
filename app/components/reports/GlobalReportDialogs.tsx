/**
 * Global Report Dialogs
 * 管理所有報表對話框的全局組件
 */

'use client';

import React, { useState, useEffect } from 'react';
import { UnifiedVoidReportDialog } from '@/app/void-pallet/components/UnifiedVoidReportDialog';
import { UnifiedLoadingReportDialog } from '@/app/order-loading/components/UnifiedLoadingReportDialog';
// ACO Report now integrated directly into system page widget
// GRN Report now integrated directly into system page widget
// Transaction Report now integrated directly into system page widget
import { UnifiedExportAllDataDialog } from '@/app/components/reports/UnifiedExportAllDataDialog';

interface ReportDialogState {
  voidPalletReport: boolean;
  orderLoadingReport: boolean;
  stockTakeReport: boolean;
  // acoOrderReport: boolean; // Now integrated into system page
  // transactionReport: boolean; // Now integrated into system page
  // grnReport: boolean; // Now integrated into system page
  exportAllData: boolean;
}

export function GlobalReportDialogs() {
  const [dialogStates, setDialogStates] = useState<ReportDialogState>({
    voidPalletReport: false,
    orderLoadingReport: false,
    stockTakeReport: false,
    // acoOrderReport: false, // Now integrated into system page
    // transactionReport: false, // Now integrated into system page
    // grnReport: false, // Now integrated into system page
    exportAllData: false,
  });

  useEffect(() => {
    // 監聽開啟報表的自定義事件
    const handleOpenVoidPalletReport = () => {
      setDialogStates(prev => ({ ...prev, voidPalletReport: true }));
    };

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
    window.addEventListener('openVoidPalletReport', handleOpenVoidPalletReport);
    window.addEventListener('openOrderLoadingReport', handleOpenOrderLoadingReport);
    window.addEventListener('openStockTakeReport', handleOpenStockTakeReport);
    // window.addEventListener('openAcoOrderReport', handleOpenAcoOrderReport);
    // window.addEventListener('openTransactionReport', handleOpenTransactionReport);
    // window.addEventListener('openGrnReport', handleOpenGrnReport);
    window.addEventListener('openExportAllData', handleOpenExportAllData);

    // 清理函數
    return () => {
      window.removeEventListener('openVoidPalletReport', handleOpenVoidPalletReport);
      window.removeEventListener('openOrderLoadingReport', handleOpenOrderLoadingReport);
      window.removeEventListener('openStockTakeReport', handleOpenStockTakeReport);
      // window.removeEventListener('openAcoOrderReport', handleOpenAcoOrderReport);
      // window.removeEventListener('openTransactionReport', handleOpenTransactionReport);
      // window.removeEventListener('openGrnReport', handleOpenGrnReport);
      window.removeEventListener('openExportAllData', handleOpenExportAllData);
    };
  }, []);

  const closeDialog = (reportKey: keyof ReportDialogState) => {
    setDialogStates(prev => ({ ...prev, [reportKey]: false }));
  };

  return (
    <>
      <UnifiedVoidReportDialog
        isOpen={dialogStates.voidPalletReport}
        onClose={() => closeDialog('voidPalletReport')}
      />
      
      <UnifiedLoadingReportDialog
        isOpen={dialogStates.orderLoadingReport}
        onClose={() => closeDialog('orderLoadingReport')}
      />
      
      {/* ACO Order Report now integrated directly into system page widget */}
      
      {/* Transaction Report now integrated directly into system page widget */}
      {/* GRN Report now integrated directly into system page widget */}
      
      <UnifiedExportAllDataDialog
        isOpen={dialogStates.exportAllData}
        onClose={() => closeDialog('exportAllData')}
      />
    </>
  );
}