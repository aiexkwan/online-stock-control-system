/**
 * Upload Files Widget - 文件上傳功能
 * 支援拖放和多文件上傳
 * 使用 Server Actions 優化
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudArrowUpIcon, DocumentIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase';
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
  folder: 'stockPic' | 'productSpec';
}

const fileValidation = {
  stockPic: ['.png', '.jpeg', '.jpg'],
  productSpec: ['.pdf', '.doc', '.docx'],
};

const maxFileSize = 10 * 1024 * 1024; // 10MB

export const UploadFilesWidget = React.memo(function UploadFilesWidget({
  widget,
  isEditMode,
}: WidgetComponentProps) {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<'stockPic' | 'productSpec'>('stockPic');
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { triggerOtherFilesRefresh } = useUploadRefresh();

  // 獲取當前用戶 ID
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

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
        console.error('[UploadFilesWidget] Error getting user:', error);
      }
    };

    getCurrentUser();
  }, []);

  // 驗證文件
  const validateFile = useCallback(
    (file: File): string | null => {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

      // 檢查文件格式
      if (!fileValidation[selectedFolder].includes(fileExtension)) {
        return `Invalid file format. Allowed: ${fileValidation[selectedFolder].join(', ')}`;
      }

      // 檢查文件大小
      if (file.size > maxFileSize) {
        return 'File size must be less than 10MB';
      }

      return null;
    },
    [selectedFolder]
  );

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
        formData.append('folder', uploadingFile.folder);
        formData.append('fileName', uploadingFile.file.name);
        formData.append('uploadBy', currentUserId?.toString() || '1');

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

        // 顯示成功提示
        toast.success(`Successfully uploaded ${uploadingFile.file.name}`);

        // 觸發歷史記錄更新
        triggerOtherFilesRefresh();
      } catch (error) {
        console.error('[UploadFilesWidget] Upload error:', error);
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
    [currentUserId, triggerOtherFilesRefresh]
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
          folder: selectedFolder,
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
    [selectedFolder, isEditMode, uploadFileAction, validateFile]
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
          <CloudArrowUpIcon
            className='mx-auto mb-4 h-20 w-20 transition-colors'
            style={{ color: selectedFolder === 'stockPic' ? '#10b981' : '#8b5cf6' }}
          />
          <p className='text-center text-gray-400'>Upload Files</p>
        </div>
        <div className='mt-2 flex gap-2'>
          <button
            onClick={e => {
              e.stopPropagation();
              setSelectedFolder('stockPic');
            }}
            disabled={isEditMode}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
              selectedFolder === 'stockPic'
                ? 'bg-green-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Pictures
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              setSelectedFolder('productSpec');
            }}
            disabled={isEditMode}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
              selectedFolder === 'productSpec'
                ? 'bg-purple-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Specs
          </button>
        </div>
        <p className='mt-2 text-xs text-slate-500'>
          {selectedFolder === 'stockPic' ? 'PNG, JPEG, JPG' : 'PDF, DOC, DOCX'}
        </p>

        <input
          ref={fileInputRef}
          type='file'
          multiple
          accept={fileValidation[selectedFolder].join(',')}
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

export default UploadFilesWidget;
