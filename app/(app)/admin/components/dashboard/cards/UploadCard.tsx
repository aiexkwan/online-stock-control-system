/**
 * UploadCard Component
 * 統一的上傳卡片組件，取代原有的4個獨立上傳widgets
 * 使用 GraphQL 統一上傳處理，支援動態配置和多種文件類型
 */

'use client';

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  PhotoIcon,
  DocumentTextIcon,
  DocumentArrowUpIcon,
  SparklesIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type {
  UploadType,
  UploadFolder,
  SupportedFileType,
  UploadStatus,
  UploadCardInput,
  SingleFileUploadInput,
  UploadCardData,
  UploadConfig,
  FileInfo,
  UploadProgress,
  SingleUploadResult,
  OrderAnalysisResult,
} from '@/types/generated/graphql';

// GraphQL 查詢
const UPLOAD_CARD_QUERY = gql`
  query UploadCardQuery($input: UploadCardInput!) {
    uploadCardData(input: $input) {
      uploadType
      config {
        uploadType
        allowedTypes
        maxFileSize
        maxFiles
        folder
        requiresAnalysis
        allowMultiple
        supportsDragDrop
        supportsPreview
      }
      recentUploads {
        id
        originalName
        fileName
        size
        extension
        uploadedAt
        url
        thumbnailUrl
      }
      activeUploads {
        id
        fileName
        progress
        status
        error
        bytesUploaded
        totalBytes
      }
      statistics {
        totalUploads
        totalSize
        successRate
        todayUploads
        popularFileTypes {
          type
          count
          totalSize
        }
      }
      lastUpdated
      refreshInterval
      dataSource
    }
  }
`;

// GraphQL 上傳 Mutation
const UPLOAD_SINGLE_FILE_MUTATION = gql`
  mutation UploadSingleFile($input: SingleFileUploadInput!) {
    uploadSingleFile(input: $input) {
      id
      fileName
      success
      fileInfo {
        id
        originalName
        fileName
        size
        extension
        folder
        uploadedAt
        url
        thumbnailUrl
      }
      analysisResult {
        success
        recordCount
        processingTime
        extractedData {
          orderNumber
          customerName
          orderDate
          totalAmount
        }
        confidence
      }
      error
    }
  }
`;

export interface UploadCardProps {
  // 上傳類型配置
  uploadType: UploadType;
  
  // 可選的文件夾覆寫
  folder?: UploadFolder;
  
  // 顯示選項
  showRecentUploads?: boolean;
  showStatistics?: boolean;
  showProgress?: boolean;
  
  // 自定義樣式
  className?: string;
  height?: number | string;
  
  // 編輯模式
  isEditMode?: boolean;
  
  // 回調函數
  onUploadComplete?: (result: SingleUploadResult) => void;
  onUploadError?: (error: string) => void;
  onAnalysisComplete?: (result: OrderAnalysisResult) => void;
  onFileSelect?: (files: File[]) => void;
}

export const UploadCard: React.FC<UploadCardProps> = ({
  uploadType,
  folder: overrideFolder,
  showRecentUploads = true,
  showStatistics = false,
  showProgress = true,
  className,
  height = 400,
  isEditMode = false,
  onUploadComplete,
  onUploadError,
  onAnalysisComplete,
  onFileSelect,
}) => {
  // 狀態管理
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<UploadFolder | undefined>(overrideFolder);
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ id: string; url: string; file: File }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<OrderAnalysisResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 準備查詢輸入
  const queryInput: UploadCardInput = useMemo(
    () => ({
      uploadType,
      folder: selectedFolder,
      includeStatistics: showStatistics,
      includeRecentUploads: showRecentUploads,
      includeActiveUploads: showProgress,
      recentLimit: 10,
    }),
    [uploadType, selectedFolder, showStatistics, showRecentUploads, showProgress]
  );

  // 執行 GraphQL 查詢
  const { data, loading, error, refetch } = useQuery<{ uploadCardData: UploadCardData }>(
    UPLOAD_CARD_QUERY,
    {
      variables: { input: queryInput },
      fetchPolicy: 'cache-and-network',
      skip: isEditMode,
      pollInterval: showProgress ? 2000 : 0, // 如果顯示進度則輪詢
    }
  );

  // 上傳 Mutation
  const [uploadSingleFile] = useMutation<{ uploadSingleFile: SingleUploadResult }>(
    UPLOAD_SINGLE_FILE_MUTATION
  );

  // 設置默認文件夾
  useEffect(() => {
    if (!selectedFolder && data?.uploadCardData.config.folder) {
      setSelectedFolder(data.uploadCardData.config.folder);
    }
  }, [data?.uploadCardData.config.folder, selectedFolder]);

  // 清理預覽 URL
  useEffect(() => {
    return () => {
      previews.forEach(preview => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  // 文件驗證
  const validateFile = useCallback(
    (file: File, config: UploadConfig): string | null => {
      const fileExtension = ('.' + file.name.split('.').pop()?.toLowerCase()) as SupportedFileType;

      // 檢查文件格式
      if (!config.allowedTypes.includes(fileExtension)) {
        return `Invalid file format. Allowed: ${config.allowedTypes.join(', ')}`;
      }

      // 檢查文件大小
      if (file.size > config.maxFileSize) {
        return `File size must be less than ${Math.round(config.maxFileSize / (1024 * 1024))}MB`;
      }

      return null;
    },
    []
  );

  // 創建圖片預覽
  const createPreview = useCallback((file: File): string => {
    return URL.createObjectURL(file);
  }, []);

  // 處理文件上傳
  const handleUpload = useCallback(
    async (files: File[]) => {
      if (!data?.uploadCardData.config || isEditMode) return;

      const config = data.uploadCardData.config;

      for (const file of files) {
        const error = validateFile(file, config);
        if (error) {
          toast.error(`${file.name}: ${error}`);
          onUploadError?.(error);
          continue;
        }

        try {
          const uploadInput: SingleFileUploadInput = {
            file,
            uploadType: config.uploadType,
            folder: selectedFolder || config.folder,
            requiresAnalysis: config.requiresAnalysis,
            userId: 'current_user', // TODO: 從 context 獲取
          };

          if (config.requiresAnalysis) {
            setIsAnalyzing(true);
          }

          const result = await uploadSingleFile({
            variables: { input: uploadInput },
          });

          const uploadResult = result.data?.uploadSingleFile;
          if (uploadResult?.success) {
            toast.success(`Successfully uploaded ${file.name}`);
            onUploadComplete?.(uploadResult);

            if (uploadResult.analysisResult) {
              setAnalysisResults(prev => [...prev, uploadResult.analysisResult!]);
              onAnalysisComplete?.(uploadResult.analysisResult);
            }

            // 重新獲取數據
            refetch();
          } else {
            throw new Error(uploadResult?.error || 'Upload failed');
          }

        } catch (error) {
          console.error('[UploadCard] Upload error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          toast.error(`Failed to upload ${file.name}: ${errorMessage}`);
          onUploadError?.(errorMessage);
        } finally {
          setIsAnalyzing(false);
        }
      }

      // 清理本地文件
      setLocalFiles([]);
      setPreviews(prev => {
        prev.forEach(p => URL.revokeObjectURL(p.url));
        return [];
      });
    },
    [data?.uploadCardData.config, selectedFolder, isEditMode, validateFile, uploadSingleFile, onUploadComplete, onUploadError, onAnalysisComplete, refetch]
  );

  // 處理文件選擇
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0 || isEditMode || !data?.uploadCardData.config) return;

      const config = data.uploadCardData.config;
      const fileArray = Array.from(files);

      // 限制文件數量
      const limitedFiles = config.allowMultiple 
        ? fileArray.slice(0, config.maxFiles)
        : [fileArray[0]];

      onFileSelect?.(limitedFiles);

      // 創建預覽（如果支持）
      if (config.supportsPreview) {
        const newPreviews = limitedFiles.map(file => ({
          id: `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url: createPreview(file),
          file,
        }));
        setPreviews(prev => {
          // 清理舊預覽
          prev.forEach(p => URL.revokeObjectURL(p.url));
          return newPreviews;
        });
      }

      setLocalFiles(limitedFiles);

      // 自動上傳
      handleUpload(limitedFiles);
    },
    [isEditMode, data?.uploadCardData.config, onFileSelect, createPreview, handleUpload]
  );

  // 拖放處理
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
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  // 點擊上傳
  const handleClick = useCallback(() => {
    if (!isEditMode) {
      fileInputRef.current?.click();
    }
  }, [isEditMode]);

  // 獲取上傳圖標和標題
  const getUploadIcon = () => {
    switch (uploadType) {
      case UploadType.OrderPdf:
        return <DocumentArrowUpIcon className="w-20 h-20 text-blue-500" />;
      case UploadType.Photos:
        return <PhotoIcon className="w-20 h-20 text-green-500" />;
      case UploadType.ProductSpec:
        return <DocumentTextIcon className="w-20 h-20 text-purple-500" />;
      case UploadType.GeneralFiles:
      default:
        return selectedFolder === UploadFolder.StockPic
          ? <PhotoIcon className="w-20 h-20 text-green-500" />
          : <DocumentIcon className="w-20 h-20 text-blue-500" />;
    }
  };

  const getUploadTitle = () => {
    switch (uploadType) {
      case UploadType.OrderPdf:
        return 'Upload Orders';
      case UploadType.Photos:
        return 'Upload Photos';
      case UploadType.ProductSpec:
        return 'Upload Product Specs';
      case UploadType.GeneralFiles:
      default:
        return 'Upload Files';
    }
  };

  const getUploadSubtitle = () => {
    if (!data?.uploadCardData.config) return '';
    const types = data.uploadCardData.config.allowedTypes.join(', ');
    return types.toUpperCase();
  };

  // 錯誤狀態
  if (error && !data) {
    return (
      <div className={cn('flex items-center justify-center p-8 bg-red-50 rounded-lg', className)}>
        <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mr-2" />
        <span className="text-red-700">Failed to load upload configuration: {error.message}</span>
      </div>
    );
  }

  // 加載狀態
  if (loading && !data) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="bg-gray-200 rounded-lg" style={{ height }} />
      </div>
    );
  }

  const config = data?.uploadCardData.config;

  return (
    <div className={cn('bg-white rounded-lg shadow-md overflow-hidden', className)}>
      {/* 主上傳區域 */}
      <div
        className={cn(
          'flex flex-col items-center justify-center p-8 border-2 border-dashed transition-all',
          isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300',
          config?.supportsDragDrop && !isEditMode && 'cursor-pointer hover:border-blue-400 hover:bg-blue-50'
        )}
        style={{ height }}
        onDragOver={config?.supportsDragDrop ? handleDragOver : undefined}
        onDragLeave={config?.supportsDragDrop ? handleDragLeave : undefined}
        onDrop={config?.supportsDragDrop ? handleDrop : undefined}
        onClick={handleClick}
      >
        {/* 上傳圖標 */}
        <div className="relative mb-4">
          {getUploadIcon()}
          {isAnalyzing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500" />
            </div>
          )}
        </div>

        {/* 標題和描述 */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{getUploadTitle()}</h3>
        <p className="text-sm text-gray-500 mb-4">{getUploadSubtitle()}</p>

        {/* 文件夾選擇（通用文件上傳時顯示） */}
        {uploadType === UploadType.GeneralFiles && !isEditMode && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFolder(UploadFolder.StockPic);
              }}
              className={cn(
                'px-3 py-1 rounded-md text-sm font-medium transition-all',
                selectedFolder === UploadFolder.StockPic
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              )}
            >
              Pictures
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFolder(UploadFolder.ProductSpec);
              }}
              className={cn(
                'px-3 py-1 rounded-md text-sm font-medium transition-all',
                selectedFolder === UploadFolder.ProductSpec
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              )}
            >
              Documents
            </button>
          </div>
        )}

        {/* AI 分析狀態 */}
        {isAnalyzing && (
          <div className="flex items-center gap-2 text-yellow-600">
            <SparklesIcon className="w-4 h-4 animate-pulse" />
            <span className="text-sm">Analyzing with AI...</span>
          </div>
        )}

        {/* 拖放提示 */}
        {config?.supportsDragDrop && !isEditMode && (
          <p className="text-xs text-gray-400 mt-2">
            Drag & drop files here or click to browse
          </p>
        )}

        {/* 隱藏的文件輸入 */}
        <input
          ref={fileInputRef}
          type="file"
          multiple={config?.allowMultiple}
          accept={config?.allowedTypes.join(',')}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* 圖片預覽 */}
      {config?.supportsPreview && previews.length > 0 && (
        <div className="p-4 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
          <div className="grid grid-cols-4 gap-2">
            {previews.map((preview) => (
              <div key={preview.id} className="relative">
                <img
                  src={preview.url}
                  alt={preview.file.name}
                  className="w-full h-16 object-cover rounded"
                />
                <button
                  onClick={() => {
                    URL.revokeObjectURL(preview.url);
                    setPreviews(prev => prev.filter(p => p.id !== preview.id));
                    setLocalFiles(prev => prev.filter(f => f !== preview.file));
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 上傳進度 */}
      {showProgress && data?.uploadCardData.activeUploads && data.uploadCardData.activeUploads.length > 0 && (
        <div className="p-4 bg-gray-50 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Upload Progress</h4>
          <div className="space-y-2">
            {data.uploadCardData.activeUploads.map((upload) => (
              <div key={upload.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span className="truncate">{upload.fileName}</span>
                    <span>{Math.round(upload.progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div
                      className={cn(
                        'h-1 rounded-full transition-all',
                        upload.status === UploadStatus.Error
                          ? 'bg-red-500'
                          : upload.status === UploadStatus.Completed
                          ? 'bg-green-500'
                          : 'bg-blue-500'
                      )}
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                  {upload.error && (
                    <p className="text-xs text-red-600 mt-1">{upload.error}</p>
                  )}
                </div>
                {upload.status === UploadStatus.Completed && (
                  <CheckIcon className="w-4 h-4 text-green-500" />
                )}
                {upload.status === UploadStatus.Error && (
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 最近上傳 */}
      {showRecentUploads && data?.uploadCardData.recentUploads && data.uploadCardData.recentUploads.length > 0 && (
        <div className="p-4 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Uploads</h4>
          <div className="space-y-2">
            {data.uploadCardData.recentUploads.slice(0, 5).map((file) => (
              <div key={file.id} className="flex items-center gap-2 text-sm">
                <DocumentIcon className="w-4 h-4 text-gray-400" />
                <span className="flex-1 truncate">{file.originalName}</span>
                <span className="text-xs text-gray-500">
                  {new Date(file.uploadedAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 統計信息 */}
      {showStatistics && data?.uploadCardData.statistics && (
        <div className="p-4 bg-gray-50 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Statistics</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Uploads:</span>
              <span className="ml-1 font-medium">{data.uploadCardData.statistics.totalUploads}</span>
            </div>
            <div>
              <span className="text-gray-500">Success Rate:</span>
              <span className="ml-1 font-medium">
                {Math.round(data.uploadCardData.statistics.successRate * 100)}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Today:</span>
              <span className="ml-1 font-medium">{data.uploadCardData.statistics.todayUploads}</span>
            </div>
            <div>
              <span className="text-gray-500">Total Size:</span>
              <span className="ml-1 font-medium">
                {Math.round(data.uploadCardData.statistics.totalSize / (1024 * 1024))}MB
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 導出類型，方便其他組件使用
export type { UploadType, UploadFolder, SupportedFileType, UploadCardInput, UploadConfig } from '@/types/generated/graphql';