/**
 * ReprintLabelCard Component
 * 使用 FormCard 統一架構實現的標籤重印功能
 * 
 * 遷移自: ReprintLabelWidget
 * 支援: 托盤號輸入、標籤重印、事務日誌記錄
 */

'use client';

import React, { useCallback } from 'react';
import { FormCard, FormType, FormDataRecord, SubmitSuccessData, FormSubmitError } from './FormCard';
import { useWidgetToast } from '@/app/(app)/admin/hooks/useWidgetToast';
import { fetchPalletForReprint } from '@/app/actions/palletActions';
import {
  TransactionLogService,
  TransactionSource,
  TransactionOperation,
} from '@/app/services/transactionLog.service';
import { ErrorHandler } from '@/app/components/qc-label-form/services/ErrorHandler';

// ReprintLabelCard 專用 Props
export interface ReprintLabelCardProps {
  // 顯示選項
  title?: string;
  showHeader?: boolean;
  showProgress?: boolean;
  
  // 樣式
  className?: string;
  height?: number | string;
  
  // 編輯模式（用於 A/B 測試）
  isEditMode?: boolean;
  
  // 回調
  onSuccess?: (data: SubmitSuccessData) => void;
  onError?: (error: FormSubmitError) => void;
  onCancel?: () => void;
}

export const ReprintLabelCard: React.FC<ReprintLabelCardProps> = ({
  title,
  showHeader = true,
  showProgress = false, // 重印標籤不需要進度指示
  className,
  height = 'auto',
  isEditMode = false,
  onSuccess,
  onError,
  onCancel,
}) => {
  const { showSuccess, showError, showInfo } = useWidgetToast();
  const transactionLog = new TransactionLogService();
  const errorHandler = ErrorHandler.getInstance();

  // 打印 PDF 功能（保持原邏輯）
  const printPDF = useCallback(async (pdfUrl: string, palletNumber: string) => {
    try {
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        // 等待 PDF 加載後觸發打印
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 1000);
        };
      } else {
        // 後備方案：下載 PDF 讓用戶手動打印
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `pallet-label-${palletNumber}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showInfo('PDF downloaded. Please print it manually.');
      }
    } catch (error) {
      errorHandler.handleApiError(error instanceof Error ? error : new Error('Print error'), {
        component: 'ReprintLabelCard',
        action: 'printPDF',
        additionalData: { pdfUrl },
      });
      // 最終後備方案：直接打開 PDF
      window.open(pdfUrl, '_blank');
      showInfo('PDF opened in new tab. Please print it manually.');
    }
  }, [showInfo, errorHandler]);

  // 處理表單提交（保持原邏輯但適配 FormCard）
  const handleFormSubmit = useCallback(async (formData: FormDataRecord): Promise<SubmitSuccessData> => {
    const palletNumber = formData.palletNumber as string;
    
    if (!palletNumber?.trim()) {
      throw new Error('Please enter a pallet number');
    }

    // 開始事務日誌記錄
    const transactionId = transactionLog.generateTransactionId();

    try {
      // 記錄事務開始
      await transactionLog.startTransaction({
        transactionId,
        sourceModule: TransactionSource.REPRINT_LABEL,
        sourcePage: 'AdminDashboard',
        sourceAction: 'ReprintLabel',
        operationType: TransactionOperation.PRINT_LABEL,
        userId: 'system', // 管理儀表板操作使用系統用戶
        metadata: {
          palletNumber: palletNumber.toUpperCase(),
          component: 'ReprintLabelCard',
        },
      });

      // 步驟 1：獲取托盤信息
      await transactionLog.recordStep(transactionId, {
        name: 'fetch_pallet_info',
        sequence: 1,
        data: { palletNumber: palletNumber.toUpperCase() },
      });

      const result = await fetchPalletForReprint(palletNumber);

      if (!result.success) {
        const errorMsg = result.error || `Failed to fetch pallet ${palletNumber}`;
        await transactionLog.recordError(transactionId, new Error(errorMsg), 'FETCH_ERROR');
        throw new Error(errorMsg);
      }

      const palletData = result.data;

      if (!palletData || !palletData.pdf_url) {
        const errorMsg = `No PDF label found for pallet ${palletNumber}`;
        await transactionLog.recordError(transactionId, new Error(errorMsg), 'PDF_NOT_FOUND');
        throw new Error(errorMsg);
      }

      // 步驟 2：執行打印
      await transactionLog.recordStep(transactionId, {
        name: 'execute_print',
        sequence: 2,
        data: {
          pdfUrl: palletData.pdf_url,
          palletInfo: {
            plt_num: palletData.plt_num,
            product_code: palletData.product_code,
            product_description: palletData.product_description,
            quantity: palletData.product_qty,
          },
        },
      });

      await printPDF(typeof palletData.pdf_url === 'string' ? palletData.pdf_url : '', palletNumber);

      // 完成事務
      await transactionLog.completeTransaction(transactionId, {
        printSuccess: true,
        palletPrinted: palletData.plt_num,
      });

      const successMessage = `Label for ${palletData.plt_num} (${palletData.product_description || palletData.product_code}) sent to printer`;
      
      showSuccess(successMessage);

      return {
        id: palletData.plt_num,
        message: successMessage,
        palletData,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      await transactionLog.recordError(transactionId, err, 'REPRINT_FAILED');

      errorHandler.handleApiError(err, {
        component: 'ReprintLabelCard',
        action: 'handleFormSubmit',
        additionalData: {
          palletNumber: palletNumber.toUpperCase(),
        },
      });

      throw err;
    }
  }, [transactionLog, printPDF, showSuccess, errorHandler]);

  // FormCard 提交成功回調
  const handleSubmitSuccess = useCallback((data: SubmitSuccessData) => {
    onSuccess?.(data);
  }, [onSuccess]);

  // FormCard 提交失敗回調
  const handleSubmitError = useCallback((error: FormSubmitError) => {
    // 錯誤已經在 handleFormSubmit 中處理過了
    // 這裡只需要顯示給用戶並回調
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : 'An error occurred during reprint';
    
    showError(errorMessage);
    onError?.(error);
  }, [showError, onError]);

  return (
    <FormCard
      formType={FormType.REPRINT_LABEL}
      showHeader={showHeader}
      showProgress={showProgress}
      className={className}
      height={height}
      isEditMode={isEditMode}
      onSubmitSuccess={handleSubmitSuccess}
      onSubmitError={handleSubmitError}
      onCancel={onCancel}
      // 使用自定義提交邏輯
      customSubmitHandler={handleFormSubmit}
    />
  );
};

export default ReprintLabelCard;