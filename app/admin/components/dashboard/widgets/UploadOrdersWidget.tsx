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

  // 上傳並分析訂單
  const uploadAndAnalyzeOrder = async (uploadingFile: UploadingFile) => {
    try {
      // 更新進度
      const updateProgress = (progress: number) => {
        setUploadingFiles(prev => 
          prev.map(f => f.id === uploadingFile.id ? { ...f, progress } : f)
        );
      };

      updateProgress(10);

      // 上傳文件
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
      updateProgress(50);

      // 記錄到 doc_upload 表（先不包含 metadata）
      let docUploadId: string | null = null;
      if (currentUserId && uploadResult.url) {
        const supabase = createClient();
        const { data: insertedDoc, error: insertError } = await supabase
          .from('doc_upload')
          .insert({
            doc_name: uploadingFile.file.name,
            upload_by: currentUserId,
            doc_type: 'order',
            doc_url: uploadResult.url,
            file_size: uploadingFile.file.size,
            folder: 'orderpdf'
          })
          .select('uuid')
          .single();

        if (insertedDoc) {
          docUploadId = insertedDoc.uuid;
        }
      }

      updateProgress(60);

      // 開始 AI 分析
      setIsAnalyzing(true);
      const analyzeFormData = new FormData();
      analyzeFormData.append('file', uploadingFile.file);
      analyzeFormData.append('orderNumber', uploadingFile.orderNumber || '');
      analyzeFormData.append('uploadedBy', currentUserId?.toString() || '');

      const analyzeResponse = await fetch('/api/analyze-order-pdf', {
        method: 'POST',
        body: analyzeFormData,
      });

      updateProgress(80);

      if (!analyzeResponse.ok) {
        const error = await analyzeResponse.json();
        throw new Error(error.error || 'Analysis failed');
      }

      const analysisResult = await analyzeResponse.json();
      updateProgress(90);

      // 更新 doc_upload 表的 json 欄位 - 儲存發送給 OpenAI 的原始文本
      if (docUploadId && analysisResult.extractedText) {
        const supabase = createClient();
        const { error: updateError } = await supabase
          .from('doc_upload')
          .update({
            json: analysisResult.extractedText
          })
          .eq('uuid', docUploadId);
          
        if (updateError) {
          console.error('[UploadOrdersWidget] Failed to update json field:', updateError);
        } else {
          console.log('[UploadOrdersWidget] Successfully updated json field with extracted text');
        }
      }

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
  };

  // 處理文件選擇
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0 || isEditMode) return;

    const newFiles: UploadingFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = validateFile(file);
      
      if (error) {
        toast.error(`${file.name}: ${error}`);
        continue;
      }
      
      const uploadingFile: UploadingFile = {
        id: `${Date.now()}-${i}`,
        name: file.name,
        progress: 0,
        status: 'uploading',
        file: file,
        orderNumber: extractOrderNumber(file.name)
      };
      
      newFiles.push(uploadingFile);
    }

    if (newFiles.length > 0) {
      setUploadingFiles(prev => [...prev, ...newFiles]);
      
      // 開始上傳和分析
      newFiles.forEach(file => {
        uploadAndAnalyzeOrder(file);
      });
    }
  }, [isEditMode, uploadAndAnalyzeOrder]);

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
          multiple
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