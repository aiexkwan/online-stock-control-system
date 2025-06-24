/**
 * Upload Orders Widget - 訂單 PDF 上傳功能
 * 包含 OpenAI 分析功能
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DocumentArrowUpIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { toast } from 'sonner';
import { Folder3D } from './Folder3D';
import { GoogleDriveUploadToast } from './GoogleDriveUploadToast';
import { OrderAnalysisResultDialog } from './OrderAnalysisResultDialog';
import { FileExistsDialog } from './FileExistsDialog';

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
  const [showFileExistsDialog, setShowFileExistsDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<UploadingFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const size = widget.config.size || WidgetSize.MEDIUM;

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

  // 檢查文件是否存在
  const checkFileExists = async (fileName: string): Promise<{ exists: boolean; publicUrl?: string }> => {
    try {
      const response = await fetch('/api/check-file-exists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, folder: 'orderpdf' })
      });
      
      if (!response.ok) {
        console.error('[UploadOrdersWidget] Failed to check file existence');
        return { exists: false };
      }
      
      return await response.json();
    } catch (error) {
      console.error('[UploadOrdersWidget] Error checking file:', error);
      return { exists: false };
    }
  };

  // 上傳並分析訂單
  const uploadAndAnalyzeOrder = useCallback(async (uploadingFile: UploadingFile, skipUpload = false, existingUrl?: string) => {
    try {
      // 更新進度
      const updateProgress = (progress: number) => {
        setUploadingFiles(prev => 
          prev.map(f => f.id === uploadingFile.id ? { ...f, progress } : f)
        );
      };

      updateProgress(10);
      
      let publicUrl = existingUrl;

      // 如果不跳過上傳，則上傳文件
      if (!skipUpload) {
        const formData = new FormData();
        formData.append('file', uploadingFile.file);
        formData.append('folder', 'orderpdf');
        formData.append('fileName', uploadingFile.file.name);
        formData.append('uploadBy', currentUserId?.toString() || '');

        const uploadResponse = await fetch('/api/upload-file', {
          method: 'POST',
          body: formData,
        });

        updateProgress(30);

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error || 'Upload failed');
        }
        
        const uploadResult = await uploadResponse.json();
        publicUrl = uploadResult.data?.publicUrl || uploadResult.publicUrl;
        updateProgress(50);
      } else {
        // 如果跳過上傳，直接更新進度
        updateProgress(50);
      }

      // doc_upload 記錄已在 upload-file API 中創建
      // json 欄位將在 analyze-order-pdf API 中更新

      updateProgress(60);

      // 開始 AI 分析
      setIsAnalyzing(true);
      console.log('[UploadOrdersWidget] Starting analysis with userId:', currentUserId);
      console.log('[UploadOrdersWidget] Using PDF URL:', publicUrl);
      
      if (!publicUrl) {
        throw new Error('No PDF URL available for analysis');
      }
      
      const analyzeResponse = await fetch('/api/analyze-order-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfUrl: publicUrl,
          fileName: uploadingFile.file.name,
          uploadedBy: currentUserId?.toString() || ''
        })
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
      console.log('[UploadOrdersWidget] Analysis result:', analysisResult);
      console.log('[UploadOrdersWidget] extractedData:', analysisResult.extractedData);
      console.log('[UploadOrdersWidget] recordCount:', analysisResult.recordCount);
      
      // 🔥 Debug: 檢查第一筆訂單數據
      if (analysisResult.extractedData && analysisResult.extractedData.length > 0) {
        console.log('[UploadOrdersWidget] First order data:', analysisResult.extractedData[0]);
        console.log('[UploadOrdersWidget] delivery_add:', analysisResult.extractedData[0].delivery_add);
        console.log('[UploadOrdersWidget] account_num:', analysisResult.extractedData[0].account_num);
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
      } else if (analysisResult.success && analysisResult.recordCount === 0) {
        toast.warning('PDF processed but no orders found');
      } else {
        toast.error('Analysis completed but no data extracted');
        console.warn('[UploadOrdersWidget] No extracted data in result:', analysisResult);
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
  }, [currentUserId]);

  // 處理文件選擇
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
    
    // 檢查文件是否已存在
    const { exists, publicUrl } = await checkFileExists(file.name);
    
    const uploadingFile: UploadingFile = {
      id: `${Date.now()}`,
      name: file.name,
      progress: 0,
      status: 'uploading',
      file: file,
      orderNumber: extractOrderNumber(file.name)
    };
    
    if (exists && publicUrl) {
      // 文件已存在，顯示確認對話框
      setPendingFile(uploadingFile);
      setShowFileExistsDialog(true);
    } else {
      // 文件不存在，直接上傳
      setUploadingFiles(prev => [...prev, uploadingFile]);
      uploadAndAnalyzeOrder(uploadingFile);
    }
  }, [isEditMode, uploadAndAnalyzeOrder, currentUserId]);

  // 處理確認重新上傳
  const handleConfirmReupload = useCallback(async () => {
    if (pendingFile) {
      setUploadingFiles(prev => [...prev, pendingFile]);
      // 跳過上傳步驟，直接分析
      try {
        const { publicUrl } = await checkFileExists(pendingFile.name);
        console.log('[UploadOrdersWidget] Reupload - File exists check result:', { publicUrl });
        if (publicUrl) {
          uploadAndAnalyzeOrder(pendingFile, true, publicUrl);
        } else {
          console.error('[UploadOrdersWidget] No public URL found for existing file');
          // 如果沒有找到 URL，嘗試重新上傳
          uploadAndAnalyzeOrder(pendingFile, false);
        }
      } catch (error) {
        console.error('[UploadOrdersWidget] Error checking file exists:', error);
        // 發生錯誤時，嘗試正常上傳
        uploadAndAnalyzeOrder(pendingFile, false);
      }
      setShowFileExistsDialog(false);
      setPendingFile(null);
    }
  }, [pendingFile, uploadAndAnalyzeOrder]);

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
          size={1.2}
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
      
      {/* File Exists Confirmation Dialog */}
      {showFileExistsDialog && pendingFile && (
        <FileExistsDialog
          isOpen={showFileExistsDialog}
          onClose={() => {
            setShowFileExistsDialog(false);
            setPendingFile(null);
          }}
          onConfirm={handleConfirmReupload}
          fileName={pendingFile.name}
        />
      )}
    </>
  );
});