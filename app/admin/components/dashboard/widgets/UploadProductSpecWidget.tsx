/**
 * Upload Product Spec Widget - 產品規格文件上傳功能
 * 使用 Server Actions 優化
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { toast } from 'sonner';
import { GoogleDriveUploadToast } from './GoogleDriveUploadToast';
import { useUploadRefresh } from '@/app/admin/contexts/UploadRefreshContext';
import { uploadFile } from '@/app/actions/fileActions';

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  file: File;
}

const fileValidation = ['.pdf', '.doc', '.docx'];
const maxFileSize = 10 * 1024 * 1024; // 10MB

export const UploadProductSpecWidget = React.memo(function UploadProductSpecWidget({
  widget,
  isEditMode,
}: WidgetComponentProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { triggerOtherFilesRefresh } = useUploadRefresh();


  // 驗證文件
  const validateFile = (file: File): string | null => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!fileValidation.includes(fileExtension)) {
      return `Invalid file format. Allowed: ${fileValidation.join(', ')}`;
    }

    if (file.size > maxFileSize) {
      return 'File size must be less than 10MB';
    }

    return null;
  };

  // 上傳單個文件
  const uploadFileAction = useCallback(
    async (uploadingFile: UploadingFile) => {
      try {
        // 更新進度
        const updateProgress = (progress: number) => {
          setUploadingFiles(prev =>
            prev.map(f => (f.id === uploadingFile.id ? { ...f, progress } : f))
          );
        };

        // Server Actions 不支援實時進度，使用模擬進度
        updateProgress(20);

        const formData = new FormData();
        formData.append('file', uploadingFile.file);
        formData.append('folder', 'productSpec');
        formData.append('fileName', uploadingFile.file.name);

        // 使用 Server Action 上傳
        updateProgress(40);
        const result = await uploadFile(formData);
        updateProgress(80);

        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        updateProgress(100);

        // 標記為完成
        setUploadingFiles(prev =>
          prev.map(f =>
            f.id === uploadingFile.id ? { ...f, status: 'completed', progress: 100 } : f
          )
        );

        toast.success(`${uploadingFile.file.name} uploaded successfully`);

        // 觸發歷史記錄更新
        triggerOtherFilesRefresh();
      } catch (error) {
        console.error('[UploadProductSpecWidget] Upload error:', error);
        setUploadingFiles(prev =>
          prev.map(f =>
            f.id === uploadingFile.id
              ? {
                  ...f,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Upload failed',
                }
              : f
          )
        );
        
        // 顯示錯誤提示
        toast.error(
          error instanceof Error ? error.message : `Failed to upload ${uploadingFile.file.name}`
        );
      }
    },
    [triggerOtherFilesRefresh]
  );

  // 處理文件選擇
  const handleFiles = useCallback(
    (files: FileList | null) => {
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
        };

        newFiles.push(uploadingFile);
      }

      if (newFiles.length > 0) {
        setUploadingFiles(prev => [...prev, ...newFiles]);

        // 開始上傳
        newFiles.forEach(file => {
          uploadFileAction(file);
        });
      }
    },
    [isEditMode, uploadFileAction]
  );

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
        className='flex h-full flex-col items-center justify-center'
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          onClick={handleClick}
          className='cursor-pointer p-8 transition-transform hover:scale-105'
        >
          <DocumentTextIcon className='mx-auto mb-4 h-20 w-20 text-purple-500 transition-colors hover:text-purple-400' />
          <p className='text-center font-medium text-gray-400'>Upload Product Spec</p>
          <p className='mt-1 text-center text-xs text-gray-500'>PDF, DOC, DOCX</p>
        </div>

        <input
          ref={fileInputRef}
          type='file'
          multiple
          accept={fileValidation.join(',')}
          onChange={e => handleFiles(e.target.files)}
          className='hidden'
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
    </>
  );
});

export default UploadProductSpecWidget;
