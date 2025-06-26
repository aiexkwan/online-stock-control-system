/**
 * Upload Orders Widget - 訂單 PDF 上傳功能
 * 包含 OpenAI 分析功能
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DocumentArrowUpIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { toast } from 'sonner';
import { Folder3D } from './Folder3D';
import { GoogleDriveUploadToast } from './GoogleDriveUploadToast';
import { OrderAnalysisResultDialog } from './OrderAnalysisResultDialog';
import { useUploadRefresh } from '@/app/admin/contexts/UploadRefreshContext';

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  file: File;
  orderNumber?: string;
}

const maxFileSize = 10 * 1024 * 1024; // 10MB

export const UploadOrdersWidget = React.memo(function UploadOrdersWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { triggerOrderHistoryRefresh } = useUploadRefresh();
  

  // 獲取當前用戶 ID
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) return;
        
        const { data: userDataByEmail } = await supabase
          .from('data_id')
          .select('id')
          .eq('email', user.email)
          .single();
        
        if (userDataByEmail) {
          setCurrentUserId(userDataByEmail.id);
        }
      } catch (error) {
        console.error('[UploadOrdersWidget] Error getting user:', error);
      }
    };
    
    getCurrentUser();
  }, []);

  // 驗證文件
  const validateFile = (file: File): string | null => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension !== '.pdf') {
      return 'Only PDF files are allowed';
    }
    
    if (file.size > maxFileSize) {
      return 'File size must be less than 10MB';
    }
    
    return null;
  };

  // 從文件名提取訂單號
  const extractOrderNumber = (fileName: string): string => {
    const match = fileName.match(/(\d+)\.pdf$/i);
    return match ? match[1] : fileName.replace('.pdf', '').replace('.PDF', '');
  };


  // 🚀 新流程：直接上傳並分析訂單（性能優化）
  const uploadAndAnalyzeOrder = useCallback(async (uploadingFile: UploadingFile, skipUpload = false, existingUrl?: string) => {
    try {
      // 更新進度
      const updateProgress = (progress: number) => {
        setUploadingFiles(prev => 
          prev.map(f => f.id === uploadingFile.id ? { ...f, progress } : f)
        );
      };

      updateProgress(10);
      
      // 🚀 直接發送 FormData 到 analyze-order-pdf-assistant（使用 Assistants API）
      setIsAnalyzing(true);
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[UploadOrdersWidget] Starting direct analysis with userId:', currentUserId);
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[UploadOrdersWidget] File size:', uploadingFile.file.size, 'bytes');
      
      updateProgress(30);
      
      // 準備 FormData
      const formData = new FormData();
      formData.append('file', uploadingFile.file);
      formData.append('fileName', uploadingFile.file.name);
      formData.append('uploadedBy', currentUserId?.toString() || '');
      formData.append('saveToStorage', 'true'); // 可選背景存儲
      
      updateProgress(50);
      
      // 🚀 直接發送到新的 API（一步完成分析）
      const analyzeResponse = await fetch('/api/analyze-order-pdf-assistant', {
        method: 'POST',
        body: formData // 直接發送文件，無需 JSON
      });

      updateProgress(80);

      // 🔎 改進錯誤處理
      let analysisResult;
      try {
        if (!analyzeResponse.ok) {
          // 先嘗試解析為 JSON
          let errorData;
          try {
            errorData = await analyzeResponse.json();
            console.error('[UploadOrdersWidget] ❌ Analysis failed (JSON):', errorData);
          } catch (jsonError) {
            // 如果不是 JSON，讀取為文本
            const errorText = await analyzeResponse.text();
            console.error('[UploadOrdersWidget] ❌ Analysis failed (Text):', errorText);
            console.error('[UploadOrdersWidget] Response status:', analyzeResponse.status);
            throw new Error(`Server error: ${analyzeResponse.status} - Check console for details`);
          }
          
          // 如果是 PDF 格式不支持的錯誤，提供明確訊息
          if (errorData?.error?.includes('PDF format not supported')) {
            throw new Error('PDF analysis failed. Please check the PDF format.');
          }
          
          throw new Error(errorData?.error || errorData?.details || 'Analysis failed');
        }
        
        analysisResult = await analyzeResponse.json();
      } catch (parseError: any) {
        console.error('[UploadOrdersWidget] ❌ Failed to parse response:', parseError);
        throw new Error(parseError.message || 'Failed to parse server response');
      }
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[UploadOrdersWidget] Analysis result:', analysisResult);
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[UploadOrdersWidget] extractedData:', analysisResult.extractedData);
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[UploadOrdersWidget] recordCount:', analysisResult.recordCount);
      
      // 🔥 Debug: 檢查第一筆訂單數據
      if (analysisResult.extractedData && analysisResult.extractedData.length > 0) {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[UploadOrdersWidget] First order data:', analysisResult.extractedData[0]);
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[UploadOrdersWidget] delivery_add:', analysisResult.extractedData[0].delivery_add);
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[UploadOrdersWidget] account_num:', analysisResult.extractedData[0].account_num);
      }
      
      updateProgress(90);

      // json 欄位更新已在 analyze-order-pdf API 中處理

      updateProgress(100);
      setIsAnalyzing(false);

      // 標記為完成
      setUploadingFiles(prev => 
        prev.map(f => f.id === uploadingFile.id ? { ...f, status: 'completed', progress: 100 } : f)
      );

      // 顯示分析結果
      if (analysisResult.extractedData && analysisResult.extractedData.length > 0) {
        toast.success(`Successfully analyzed ${analysisResult.extractedData.length} orders`);
        setAnalysisResult(analysisResult);
        setShowAnalysisDialog(true);
        
        // 觸發訂單歷史記錄更新
        triggerOrderHistoryRefresh();
      } else if (analysisResult.success && analysisResult.recordCount === 0) {
        toast.warning('PDF processed but no orders found');
      } else {
        toast.error('Analysis completed but no data extracted');
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn('[UploadOrdersWidget] No extracted data in result:', analysisResult);
      }

    } catch (error) {
      console.error('[UploadOrdersWidget] Upload/analyze error:', error);
      setIsAnalyzing(false);
      setUploadingFiles(prev => 
        prev.map(f => f.id === uploadingFile.id ? { 
          ...f, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed' 
        } : f)
      );
    }
  }, [currentUserId, triggerOrderHistoryRefresh]);

  // 🚀 處理文件選擇（簡化版 - 直接處理）
  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || isEditMode) return;
    
    if (!currentUserId) {
      toast.error('User not authenticated. Please refresh and try again.');
      return;
    }

    // 只處理第一個文件（不支持批量上傳）
    const file = files[0];
    const error = validateFile(file);
    
    if (error) {
      toast.error(`${file.name}: ${error}`);
      return;
    }
    
    // 🚀 直接處理文件，無需檢查 Storage 存在性
    const uploadingFile: UploadingFile = {
      id: `${Date.now()}`,
      name: file.name,
      progress: 0,
      status: 'uploading',
      file: file,
      orderNumber: extractOrderNumber(file.name)
    };
    
    // 直接開始分析
    setUploadingFiles(prev => [...prev, uploadingFile]);
    uploadAndAnalyzeOrder(uploadingFile);
  }, [isEditMode, uploadAndAnalyzeOrder, currentUserId]);

  // 🚀 移除舊的重新上傳邏輯，因為不再需要 Storage 檢查

  // 拖放處理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  // 點擊上傳
  const handleClick = () => {
    if (!isEditMode) {
      fileInputRef.current?.click();
    }
  };

  // 移除已完成的文件
  const handleRemoveFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id));
  };

  // 關閉上傳提示
  const handleCloseToast = () => {
    setUploadingFiles(prev => prev.filter(f => f.status === 'uploading'));
  };

  return (
    <>
      <div
        className="h-full flex flex-col items-center justify-center"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Folder3D
          color="#3b82f6"

          icon={<DocumentArrowUpIcon />}
          onClick={handleClick}
          label="Upload Orders"
          description="Order PDF"
        />
        {isAnalyzing && (
          <div className="flex items-center gap-1 mt-2">
            <SparklesIcon className="w-3 h-3 text-yellow-500 animate-pulse" />
            <span className="text-xs text-yellow-500">Analyzing...</span>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Upload Toast */}
      {uploadingFiles.length > 0 && (
        <GoogleDriveUploadToast
          files={uploadingFiles}
          onClose={handleCloseToast}
          onRemoveFile={handleRemoveFile}
        />
      )}
      
      {/* Analysis Result Dialog */}
      {showAnalysisDialog && analysisResult && (
        <OrderAnalysisResultDialog
          isOpen={showAnalysisDialog}
          onClose={() => setShowAnalysisDialog(false)}
          data={analysisResult}
        />
      )}
      
    </>
  );
});