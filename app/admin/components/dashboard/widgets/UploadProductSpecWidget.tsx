/**
 * Upload Product Spec Widget - 產品規格文件上傳功能
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { toast } from 'sonner';
import { Folder3D } from './Folder3D';
import { GoogleDriveUploadToast } from './GoogleDriveUploadToast';

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

export const UploadProductSpecWidget = React.memo(function UploadProductSpecWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
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
        console.error('[UploadProductSpecWidget] Error getting user:', error);
      }
    };
    
    getCurrentUser();
  }, []);

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
  const uploadFile = async (uploadingFile: UploadingFile) => {
    try {
      // 更新進度
      const updateProgress = (progress: number) => {
        setUploadingFiles(prev => 
          prev.map(f => f.id === uploadingFile.id ? { ...f, progress } : f)
        );
      };

      updateProgress(20);

      const formData = new FormData();
      formData.append('file', uploadingFile.file);
      formData.append('folder', 'productSpec');
      formData.append('fileName', uploadingFile.file.name);
      formData.append('uploadBy', currentUserId?.toString() || '');

      const response = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData,
      });

      updateProgress(60);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      updateProgress(80);

      // 記錄到 doc_upload 表
      if (currentUserId && result.url) {
        const supabase = createClient();
        await supabase.from('doc_upload').insert({
          doc_name: uploadingFile.file.name,
          upload_by: currentUserId,
          doc_type: 'spec',
          doc_url: result.url,
          file_size: uploadingFile.file.size,
          folder: 'productSpec'
        });
      }

      updateProgress(100);

      // 標記為完成
      setUploadingFiles(prev => 
        prev.map(f => f.id === uploadingFile.id ? { ...f, status: 'completed', progress: 100 } : f)
      );

      toast.success(`${uploadingFile.file.name} uploaded successfully`);

    } catch (error) {
      console.error('[UploadProductSpecWidget] Upload error:', error);
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
        file: file
      };
      
      newFiles.push(uploadingFile);
    }

    if (newFiles.length > 0) {
      setUploadingFiles(prev => [...prev, ...newFiles]);
      
      // 開始上傳
      newFiles.forEach(file => {
        uploadFile(file);
      });
    }
  }, [isEditMode, uploadFile]);

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
          color="#8b5cf6"
          size={1.2}
          icon={<DocumentTextIcon />}
          onClick={handleClick}
          label="Upload Product Spec"
          description="PDF, DOC, DOCX"
        />
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={fileValidation.join(',')}
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
    </>
  );
});