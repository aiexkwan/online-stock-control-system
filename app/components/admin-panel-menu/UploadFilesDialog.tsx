'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  CloudArrowUpIcon, 
  DocumentIcon, 
  PhotoIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface UploadFilesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UploadState {
  selectedFile: File | null;
  selectedFolder: 'stockPic' | 'productSpec' | '';
  fileName: string;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
}

const fileValidation = {
  stockPic: ['.png', '.jpeg', '.jpg'],
  productSpec: ['.pdf', '.doc', '.docx']
};

const maxFileSize = 10 * 1024 * 1024; // 10MB

export const UploadFilesDialog: React.FC<UploadFilesDialogProps> = ({
  isOpen,
  onOpenChange
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    selectedFile: null,
    selectedFolder: '',
    fileName: '',
    isUploading: false,
    uploadProgress: 0,
    error: null
  });

  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 重置狀態
  const resetState = useCallback(() => {
    setUploadState({
      selectedFile: null,
      selectedFolder: '',
      fileName: '',
      isUploading: false,
      uploadProgress: 0,
      error: null
    });
    setIsDragOver(false);
  }, []);

  // 關閉對話框
  const handleClose = useCallback(() => {
    if (!uploadState.isUploading) {
      resetState();
      onOpenChange(false);
    }
  }, [uploadState.isUploading, resetState, onOpenChange]);

  // 驗證文件
  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // 檢查文件大小
    if (file.size > maxFileSize) {
      return { isValid: false, error: 'File size must be less than 10MB' };
    }

    // 檢查文件格式
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const allAllowedExtensions = [...fileValidation.stockPic, ...fileValidation.productSpec];
    
    if (!allAllowedExtensions.includes(fileExtension)) {
      return { 
        isValid: false, 
        error: `Unsupported file format. Allowed: ${allAllowedExtensions.join(', ')}` 
      };
    }

    return { isValid: true };
  }, []);

  // 獲取可用的文件夾
  const getAvailableFolders = useCallback((file: File) => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const folders = [];

    if (fileValidation.stockPic.includes(fileExtension)) {
      folders.push('stockPic');
    }
    if (fileValidation.productSpec.includes(fileExtension)) {
      folders.push('productSpec');
    }

    return folders;
  }, []);

  // 處理文件選擇
  const handleFileSelect = useCallback((file: File) => {
    const validation = validateFile(file);
    
    if (!validation.isValid) {
      setUploadState(prev => ({
        ...prev,
        error: validation.error || 'Invalid file'
      }));
      return;
    }

    const availableFolders = getAvailableFolders(file);
    const defaultFolder = availableFolders.length === 1 ? availableFolders[0] as 'stockPic' | 'productSpec' : '';

    setUploadState(prev => ({
      ...prev,
      selectedFile: file,
      fileName: file.name,
      selectedFolder: defaultFolder,
      error: null
    }));
  }, [validateFile, getAvailableFolders]);

  // 拖拽事件處理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // 點擊選擇文件
  const handleFileInputClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // 文件夾選擇
  const handleFolderChange = useCallback((folder: 'stockPic' | 'productSpec') => {
    setUploadState(prev => ({
      ...prev,
      selectedFolder: folder,
      error: null
    }));
  }, []);

  // 文件名修改
  const handleFileNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setUploadState(prev => ({
      ...prev,
      fileName: newName,
      error: null
    }));
  }, []);

  // 上傳文件
  const handleUpload = useCallback(async () => {
    if (!uploadState.selectedFile || !uploadState.selectedFolder || !uploadState.fileName.trim()) {
      setUploadState(prev => ({
        ...prev,
        error: 'Please select a file, folder, and enter a file name'
      }));
      return;
    }

    setUploadState(prev => ({ ...prev, isUploading: true, uploadProgress: 0 }));

    try {
      // 創建 FormData
      const formData = new FormData();
      formData.append('file', uploadState.selectedFile);
      formData.append('folder', uploadState.selectedFolder);
      formData.append('fileName', uploadState.fileName);

      // 模擬上傳進度
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          uploadProgress: Math.min(prev.uploadProgress + 10, 90)
        }));
      }, 200);

      // 上傳文件
      const response = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // 完成上傳
      setUploadState(prev => ({ ...prev, uploadProgress: 100 }));
      
      // 短暫延遲顯示完成狀態
      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success(`File uploaded successfully to ${uploadState.selectedFolder}!`);
      console.log('Upload result:', result.data);
      
      handleClose();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Upload failed. Please try again.',
        isUploading: false,
        uploadProgress: 0
      }));
    }
  }, [uploadState.selectedFile, uploadState.selectedFolder, uploadState.fileName, handleClose]);

  const availableFolders = uploadState.selectedFile ? getAvailableFolders(uploadState.selectedFile) : [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800/90 backdrop-blur-xl border border-slate-600/50 text-white max-w-2xl rounded-2xl shadow-2xl">
        <div className="relative">
          {/* 對話框內部光效 */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5 rounded-2xl"></div>
          
          <div className="relative z-10">
            <DialogHeader className="pb-6">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent flex items-center">
                <CloudArrowUpIcon className="h-6 w-6 text-purple-400 mr-3" />
                Upload Files
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-lg">
                Upload documents and images to database
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-6">
              {/* 文件拖拽區域 */}
              <div
                className={`
                  relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
                  ${isDragOver 
                    ? 'border-purple-400 bg-purple-500/10' 
                    : uploadState.selectedFile
                    ? 'border-green-400 bg-green-500/10'
                    : 'border-slate-600 hover:border-purple-500 hover:bg-purple-500/5'
                  }
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleFileInputClick}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.png,.jpeg,.jpg"
                  onChange={handleFileInputChange}
                />

                <div className="space-y-4">
                  {uploadState.selectedFile ? (
                    <>
                      <div className="flex items-center justify-center">
                        {uploadState.selectedFile.type.startsWith('image/') ? (
                          <PhotoIcon className="h-16 w-16 text-green-400" />
                        ) : (
                          <DocumentIcon className="h-16 w-16 text-green-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-green-400">File Selected</p>
                        <p className="text-slate-300">{uploadState.selectedFile.name}</p>
                        <p className="text-sm text-slate-400">
                          {(uploadState.selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="h-16 w-16 text-slate-400 mx-auto" />
                      <div>
                        <p className="text-lg font-semibold text-slate-300">
                          Drag and drop files here, or click to select
                        </p>
                        <p className="text-sm text-slate-400 mt-2">
                          Supported formats: PDF, DOC, PNG, JPEG (Max 10MB)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 錯誤消息 */}
              {uploadState.error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                >
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-300 text-sm">{uploadState.error}</p>
                </motion.div>
              )}

              {/* 文件夾選擇和文件名輸入 */}
              <AnimatePresence>
                {uploadState.selectedFile && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    {/* 文件夾選擇 */}
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-3">
                        Select Folder
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {availableFolders.map((folder) => (
                          <button
                            key={folder}
                            onClick={() => handleFolderChange(folder as 'stockPic' | 'productSpec')}
                            className={`
                              p-4 rounded-xl border transition-all duration-300 text-left
                              ${uploadState.selectedFolder === folder
                                ? 'border-purple-400 bg-purple-500/20 text-purple-300'
                                : 'border-slate-600 hover:border-purple-500 hover:bg-purple-500/10 text-slate-300'
                              }
                            `}
                          >
                            <div className="font-medium">
                              {folder === 'stockPic' ? 'Stock Pictures' : 'Product Specifications'}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              {folder === 'stockPic' ? 'PNG, JPEG images' : 'PDF, DOC documents'}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 文件名輸入 */}
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-3">
                        File Name
                      </label>
                      <input
                        type="text"
                        value={uploadState.fileName}
                        onChange={handleFileNameChange}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/70 focus:bg-slate-700/70 hover:border-purple-500/50 transition-all duration-300"
                        placeholder="Enter file name"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 上傳進度 */}
              {uploadState.isUploading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Uploading...</span>
                    <span className="text-purple-400">{uploadState.uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadState.uploadProgress}%` }}
                    />
                  </div>
                </motion.div>
              )}
            </div>

            <DialogFooter className="flex gap-4 pt-6">
              <button
                onClick={handleClose}
                disabled={uploadState.isUploading}
                className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 hover:border-slate-500/70 rounded-xl text-slate-300 hover:text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={
                  !uploadState.selectedFile || 
                  !uploadState.selectedFolder || 
                  !uploadState.fileName.trim() || 
                  uploadState.isUploading
                }
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/25 hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {uploadState.isUploading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </div>
                ) : (
                  'Confirm Upload'
                )}
              </button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadFilesDialog; 