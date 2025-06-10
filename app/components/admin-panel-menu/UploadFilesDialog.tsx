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
  ExclamationTriangleIcon,
  FolderOpenIcon,
  DocumentPlusIcon,
  SparklesIcon,
      EyeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { createClient } from '@/app/utils/supabase/client';

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

interface OrderPDFUploadState {
  selectedFile: File | null;
  orderNumber: string;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  isAnalyzing: boolean;
  analysisProgress: number;
  extractedData: any[] | null;
  showPreview: boolean;
}

const fileValidation = {
  stockPic: ['.png', '.jpeg', '.jpg'],
  productSpec: ['.pdf', '.doc', '.docx']
};

const maxFileSize = 10 * 1024 * 1024; // 10MB

type TabType = 'files' | 'orderPdf';

export const UploadFilesDialog: React.FC<UploadFilesDialogProps> = ({
  isOpen,
  onOpenChange
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('files');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  
  const [uploadState, setUploadState] = useState<UploadState>({
    selectedFile: null,
    selectedFolder: '',
    fileName: '',
    isUploading: false,
    uploadProgress: 0,
    error: null
  });

  const [orderPDFState, setOrderPDFState] = useState<OrderPDFUploadState>({
    selectedFile: null,
    orderNumber: '',
    isUploading: false,
    uploadProgress: 0,
    error: null,
    isAnalyzing: false,
    analysisProgress: 0,
    extractedData: null,
    showPreview: false
  });

  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const orderPDFInputRef = useRef<HTMLInputElement>(null);

  // 獲取當前用戶 ID
  React.useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('[UploadFilesDialog] Auth error:', authError);
          return;
        }
        
        if (user) {
          console.log('[UploadFilesDialog] Current user:', user.email, 'UUID:', user.id);
          
          // 直接使用 supabase client 查詢 data_id 表（通過 RLS）
          try {
            // 直接使用 email 查詢，因為 UUID 查詢可能受到 RLS 限制
            const { data: userDataByEmail, error: emailError } = await supabase
              .from('data_id')
              .select('id')
              .eq('email', user.email)
              .single();
            
            if (emailError) {
              console.error('[UploadFilesDialog] Error fetching user data by email:', emailError);
              setOrderPDFState(prev => ({
                ...prev,
                error: 'Unable to identify user in system. Please contact administrator.'
              }));
              return;
            }
            
            if (userDataByEmail) {
              console.log('[UploadFilesDialog] User ID found by email:', userDataByEmail.id);
              setCurrentUserId(userDataByEmail.id);
            } else {
              console.warn('[UploadFilesDialog] No user data found by email');
              setOrderPDFState(prev => ({
                ...prev,
                error: 'User not found in system. Please contact administrator.'
              }));
            }
          } catch (queryError) {
            console.error('[UploadFilesDialog] Query error:', queryError);
            setOrderPDFState(prev => ({
              ...prev,
              error: 'Database query failed. Please try again later.'
            }));
          }
        } else {
          console.warn('[UploadFilesDialog] No authenticated user');
        }
      } catch (error) {
        console.error('[UploadFilesDialog] Unexpected error:', error);
        setOrderPDFState(prev => ({
          ...prev,
          error: 'Authentication error. Please try logging in again.'
        }));
      }
    };
    
    if (isOpen) {
      getCurrentUser();
    }
  }, [isOpen]);

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
          setOrderPDFState({
        selectedFile: null,
        orderNumber: '',
        isUploading: false,
        uploadProgress: 0,
        error: null,
        isAnalyzing: false,
        analysisProgress: 0,
        extractedData: null,
        showPreview: false
      });
    setIsDragOver(false);
    setActiveTab('files');
  }, []);

  // 關閉對話框
  const handleClose = useCallback(() => {
    if (!uploadState.isUploading && !orderPDFState.isUploading && !orderPDFState.isAnalyzing) {
      resetState();
      onOpenChange(false);
    }
  }, [uploadState.isUploading, orderPDFState.isUploading, orderPDFState.isAnalyzing, resetState, onOpenChange]);

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

  // 驗證 PDF 文件（用於 Order PDF）
  const validatePDFFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // 檢查文件大小
    if (file.size > maxFileSize) {
      return { isValid: false, error: 'File size must be less than 10MB' };
    }

    // 檢查是否為 PDF
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== '.pdf') {
      return { 
        isValid: false, 
        error: 'Only PDF files are allowed for order uploads' 
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

  // 處理文件選擇（普通上傳）
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

  // 處理 Order PDF 文件選擇
  const handleOrderPDFSelect = useCallback((file: File) => {
    const validation = validatePDFFile(file);
    
    if (!validation.isValid) {
      setOrderPDFState(prev => ({
        ...prev,
        error: validation.error || 'Invalid file'
      }));
      return;
    }

    setOrderPDFState(prev => ({
      ...prev,
      selectedFile: file,
      error: null,
      extractedData: null,
      showPreview: false
    }));
  }, [validatePDFFile]);

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
      if (activeTab === 'files') {
        handleFileSelect(files[0]);
      } else {
        handleOrderPDFSelect(files[0]);
      }
    }
  }, [handleFileSelect, handleOrderPDFSelect, activeTab]);

  // 點擊選擇文件
  const handleFileInputClick = useCallback(() => {
    if (activeTab === 'files') {
      fileInputRef.current?.click();
    } else {
      orderPDFInputRef.current?.click();
    }
  }, [activeTab]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleOrderPDFInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleOrderPDFSelect(files[0]);
    }
  }, [handleOrderPDFSelect]);

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

  // Order Number 修改
  const handleOrderNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const orderNumber = e.target.value;
    setOrderPDFState(prev => ({
      ...prev,
      orderNumber: orderNumber,
      error: null
    }));
  }, []);

  // 上傳文件（普通上傳）
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



  // 分析 Order PDF
  const handleAnalyzeOrderPDF = useCallback(async () => {
    if (!orderPDFState.selectedFile) {
      setOrderPDFState(prev => ({
        ...prev,
        error: 'Please select a PDF file first'
      }));
      return;
    }
    
    if (!currentUserId) {
      setOrderPDFState(prev => ({
        ...prev,
        error: 'User authentication required. Please refresh the page and try again.'
      }));
      return;
    }

    console.log('[UploadFilesDialog] Starting PDF analysis with user ID:', currentUserId);

      setOrderPDFState(prev => ({ 
    ...prev, 
    isAnalyzing: true, 
    analysisProgress: 0,
    error: null
  }));

    try {
      // 創建 FormData
      const formData = new FormData();
      formData.append('file', orderPDFState.selectedFile);
      formData.append('uploadedBy', currentUserId.toString());
      formData.append('saveToStorage', 'true'); // 保存 PDF 到 orderpdf bucket

      // 模擬分析進度
      const progressInterval = setInterval(() => {
        setOrderPDFState(prev => ({
          ...prev,
          analysisProgress: Math.min(prev.analysisProgress + 5, 90)
        }));
      }, 300);

      console.log('[Order PDF Analysis] 開始分析 PDF...');

      // 發送到 analyze-order-pdf API
      const response = await fetch('/api/analyze-order-pdf', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Server error: ${response.status}`);
      }

          // 完成分析
    setOrderPDFState(prev => ({ 
      ...prev, 
      analysisProgress: 100,
      extractedData: result.extractedData || result.insertedRecords || [],
      showPreview: true
    }));
      
      // 短暫延遲顯示完成狀態
      await new Promise(resolve => setTimeout(resolve, 500));

          console.log('[Order PDF Analysis] 分析完成:', result);
    
    toast.success(`PDF Analysis Complete! Extracted ${result.recordCount} records`);
    
    // 重置分析狀態但保留數據預覽
    setOrderPDFState(prev => ({ 
      ...prev, 
      isAnalyzing: false,
      analysisProgress: 0
    }));
      
    } catch (error) {
      console.error('[Order PDF Analysis] 分析錯誤:', error);
      setOrderPDFState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Analysis failed. Please try again.',
        isAnalyzing: false,
        analysisProgress: 0
      }));
    }
  }, [orderPDFState.selectedFile, currentUserId]);

  // 上傳 Order PDF（舊版本，保留作為備用）
  const handleOrderPDFUpload = useCallback(async () => {
    if (!orderPDFState.selectedFile || !orderPDFState.orderNumber.trim()) {
      setOrderPDFState(prev => ({
        ...prev,
        error: 'Please select a PDF file and enter an order number'
      }));
      return;
    }

    setOrderPDFState(prev => ({ ...prev, isUploading: true, uploadProgress: 0 }));

    try {
      // 創建 FormData
      const formData = new FormData();
      formData.append('file', orderPDFState.selectedFile);
      formData.append('fileName', `${orderPDFState.orderNumber}.pdf`);
      formData.append('storagePath', 'orderpdf');

      // 模擬上傳進度
      const progressInterval = setInterval(() => {
        setOrderPDFState(prev => ({
          ...prev,
          uploadProgress: Math.min(prev.uploadProgress + 10, 90)
        }));
      }, 200);

      // 上傳文件到 upload-pdf API
      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // 完成上傳
      setOrderPDFState(prev => ({ ...prev, uploadProgress: 100 }));
      
      // 短暫延遲顯示完成狀態
      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success(`Order PDF uploaded successfully! Order: ${orderPDFState.orderNumber}`);
      console.log('Order PDF upload result:', result);
      
      handleClose();
    } catch (error) {
      console.error('Order PDF upload error:', error);
      setOrderPDFState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Upload failed. Please try again.',
        isUploading: false,
        uploadProgress: 0
      }));
    }
  }, [orderPDFState.selectedFile, orderPDFState.orderNumber, handleClose]);

  const availableFolders = uploadState.selectedFile ? getAvailableFolders(uploadState.selectedFile) : [];



  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800/90 backdrop-blur-xl border border-slate-600/50 text-white max-w-4xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="relative">
          {/* 對話框內部光效 */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5 rounded-2xl"></div>
          
          <div className="relative z-10">
            <DialogHeader className="pb-6">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent flex items-center">
                <CloudArrowUpIcon className="h-6 w-6 text-purple-400 mr-3" />
                Upload Documents
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-lg">
                Upload documents and images to database
              </DialogDescription>
            </DialogHeader>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-slate-700/30 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('files')}
                className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === 'files'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                }`}
              >
                <FolderOpenIcon className="h-4 w-4 mr-2" />
                Upload Files
              </button>
              <button
                onClick={() => setActiveTab('orderPdf')}
                className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === 'orderPdf'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                }`}
              >
                <SparklesIcon className="h-4 w-4 mr-2" />
                Upload Order PDF
              </button>
            </div>

            <div className="space-y-6 py-6">
              {activeTab === 'files' ? (
                // 原有的文件上傳內容
                <>
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
                </>
              ) : (
                                  // AI Order Analysis 內容
                  <>
                    {/* Order PDF 拖拽區域 */}
                  <div
                    className={`
                      relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
                      ${isDragOver 
                        ? 'border-blue-400 bg-blue-500/10' 
                        : orderPDFState.selectedFile
                        ? 'border-green-400 bg-green-500/10'
                        : 'border-slate-600 hover:border-blue-500 hover:bg-blue-500/5'
                      }
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleFileInputClick}
                  >
                    <input
                      ref={orderPDFInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={handleOrderPDFInputChange}
                    />

                    <div className="space-y-4">
                      {orderPDFState.selectedFile ? (
                        <>
                          <div className="flex items-center justify-center">
                            <DocumentIcon className="h-16 w-16 text-green-400" />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-green-400">PDF Selected</p>
                            <p className="text-slate-300">{orderPDFState.selectedFile.name}</p>
                            <p className="text-sm text-slate-400">
                              {(orderPDFState.selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="h-16 w-16 text-slate-400 mx-auto" />
                          <div>
                            <p className="text-lg font-semibold text-slate-300">
                              Drag and drop Order PDF here, or click to select
                            </p>
                            <p className="text-sm text-slate-400 mt-2">
                              Order PDF will be analyze and extract order data automatically (Max 10MB)
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Order PDF 錯誤消息 */}
                  {orderPDFState.error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                    >
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                      <p className="text-red-300 text-sm">{orderPDFState.error}</p>
                    </motion.div>
                  )}

                  {/* AI 分析進度 */}
                  {orderPDFState.isAnalyzing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300 flex items-center">
                          <SparklesIcon className="h-4 w-4 mr-2 text-blue-400" />
                          Analyzing PDF content...
                        </span>
                        <span className="text-blue-400">{orderPDFState.analysisProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${orderPDFState.analysisProgress}%` }}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* 導入資料及結果卡片 */}
                  {orderPDFState.extractedData && orderPDFState.showPreview && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {/* 導入資料卡片 */}
                      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-blue-400 flex items-center">
                            <DocumentIcon className="h-5 w-5 mr-2" />
                            Data Import Summary
                          </h3>
                          <div className="text-sm text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full">
                            {orderPDFState.extractedData.length} rows of data extracted
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="bg-slate-700/30 rounded-lg p-3">
                            <div className="text-slate-400 mb-1">File Name</div>
                            <div className="text-white font-medium truncate">
                              {orderPDFState.selectedFile?.name || 'Unknown'}
                            </div>
                          </div>
                          <div className="bg-slate-700/30 rounded-lg p-3">
                            <div className="text-slate-400 mb-1">File Size</div>
                            <div className="text-white font-medium">
                              {orderPDFState.selectedFile ? 
                                `${(orderPDFState.selectedFile.size / 1024).toFixed(1)} KB` : 
                                'Unknown'
                              }
                            </div>
                          </div>
                          <div className="bg-slate-700/30 rounded-lg p-3">
                            <div className="text-slate-400 mb-1">Processing Time</div>
                            <div className="text-white font-medium">
                              {new Date().toLocaleTimeString('en-US')}
                            </div>
                          </div>
                          <div className="bg-slate-700/30 rounded-lg p-3">
                            <div className="text-slate-400 mb-1">Status</div>
                            <div className="text-green-400 font-medium flex items-center">
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Completed
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 提取數據預覽 */}
                      <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-green-400 flex items-center">
                            <CheckCircleIcon className="h-5 w-5 mr-2" />
                            Extracted Order Data
                          </h3>
                          <button
                            onClick={() => setOrderPDFState(prev => ({ ...prev, showPreview: !prev.showPreview }))}
                            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                        </div>
                        
                        <div className="bg-slate-700/30 rounded-xl p-4 max-h-80 overflow-y-auto">
                          <div className="space-y-3">
                            {orderPDFState.extractedData.map((order, index) => (
                              <div key={index} className="bg-slate-600/40 rounded-lg p-4 border border-slate-500/30">
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  <div className="space-y-2">
                                    <div>
                                      <span className="text-slate-400">Order Number:</span>
                                      <span className="text-white font-medium ml-2">{order.order_ref}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400">Product Code:</span>
                                      <span className="text-cyan-300 font-mono ml-2">{order.product_code}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div>
                                      <span className="text-slate-400">Quantity:</span>
                                      <span className="text-yellow-300 font-medium ml-2">{order.product_qty}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="md:col-span-2">
                                    <div>
                                      <span className="text-slate-400">Product Description:</span>
                                      <span className="text-white ml-2">{order.product_desc}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* 成功狀態卡片 */}
                      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-xl p-6">
                        <div className="flex items-center justify-center">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <CheckCircleIcon className="h-8 w-8 text-green-400" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-green-300">
                                Data Import Success!
                              </h4>
                              <p className="text-green-200 text-sm">
                                Successfully extracted and saved {orderPDFState.extractedData.length} order records to the database
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>

            <DialogFooter className="flex gap-4 pt-6">
              <button
                onClick={handleClose}
                disabled={uploadState.isUploading || orderPDFState.isUploading || orderPDFState.isAnalyzing}
                className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 hover:border-slate-500/70 rounded-xl text-slate-300 hover:text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {orderPDFState.extractedData ? 'Close' : 'Cancel'}
              </button>
              
              {activeTab === 'files' ? (
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
              ) : (
                <button
                  onClick={handleAnalyzeOrderPDF}
                  disabled={
                    !orderPDFState.selectedFile || 
                    orderPDFState.isAnalyzing ||
                    orderPDFState.extractedData !== null
                  }
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                  {orderPDFState.isAnalyzing ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Analyzing PDF ...
                    </div>
                  ) : orderPDFState.extractedData ? (
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="h-5 w-5" />
                      Analysis Complete
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <SparklesIcon className="h-5 w-5" />
                      Start Upload
                    </div>
                  )}
                </button>
              )}
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadFilesDialog; 