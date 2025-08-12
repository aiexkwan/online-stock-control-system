/**
 * UploadCenterCard Component
 * Upload center with left side upload records and right side three upload areas
 * Left: Upload records list
 * Right: Three upload areas (Order PDF, Product Spec Files, Others)
 * 
 * Refactored to use useUploadManager hook for better organization and reusability
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { CloudArrowUpIcon, DocumentArrowUpIcon, DocumentTextIcon, FolderOpenIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { GlassmorphicCard } from '../components/GlassmorphicCard';

// Import individual upload components - deleted files
// import { BaseUploadCard, UploadConfiguration, UploadFile } from './BaseUploadCard';
// import { UploadOrdersCard } from './UploadOrdersCard';
// import { UploadProductSpecCard } from './UploadProductSpecCard';

// Import types from centralized type definitions
import type {
  UploadConfiguration,
  UploadFile,
  UploadRecord,
  DocUploadRecord,
  UploadCenterCardProps,
  UploadToastState
} from '../types/data-management';
import type { UserInfo } from '../types/common';
import { formatFileSize as formatFileSizeUtil } from '../utils/formatters';
import { StatusOverlay } from '../components/shared';
import { useUploadManager } from '../hooks/useUploadManager';

export const UploadCenterCard: React.FC<UploadCenterCardProps> = ({
  title = 'Upload Center',
  description = 'Manage all file uploads',
  className,
  height = '100%',
  isEditMode = false,
}) => {
  // Use the upload manager hook
  const { state, actions } = useUploadManager({
    isEditMode,
    onUploadComplete: (files, uploadType) => {
      console.log(`Upload completed: ${files.length} files of type ${uploadType}`);
    },
    onUploadError: (error) => {
      console.error('Upload error:', error);
    },
  });
  
  // Destructure state and actions for easier access
  const {
    uploadRecords,
    loading,
    refreshKey,
    uploadToast,
    isDragging,
  } = state;
  
  const {
    fetchUploadRecords,
    handleRefresh,
    handlePreviewPDF,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    handleOrderPDFUpload,
    handleSpecFilesUpload,
    handleOthersUpload,
    setUploadToast,
    setIsDragging,
  } = actions;

  // Initial load
  useEffect(() => {
    fetchUploadRecords();
  }, [fetchUploadRecords, refreshKey]);

  // Render upload record item
  const renderUploadRecord = (record: DocUploadRecord) => (
    <div
      key={record.uuid}
      className={cn(
        "grid grid-cols-3 gap-4 px-3 py-3 hover:bg-gray-700/50 transition-colors rounded",
        record.doc_url && "cursor-pointer"
      )}
      onClick={() => handlePreviewPDF(record)}
    >
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <p className="text-sm text-gray-300">
          {format(new Date(record.created_at), 'yyyy-MM-dd HH:mm')}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <DocumentTextIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <p className="text-sm text-gray-300 truncate" title={record.doc_name}>
          {record.doc_name}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <UserIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <p className="text-sm text-gray-300 truncate">
          {record.upload_by_name}
        </p>
      </div>
    </div>
  );

  // Upload configuration for Others section
  const othersUploadConfig: UploadConfiguration = {
    accept: '*',
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    multiple: true,
    dropzoneText: 'Drop files here or click to upload',
    dropzoneSubtext: 'Any file type, max 10MB',
    showFileList: false,
  };

  // Use formatFileSize from utils
  const formatFileSize = formatFileSizeUtil;

  // Simple inline BaseUploadCard component - uses hook functions
  const BaseUploadCard: React.FC<{
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    height?: string | number;
    className?: string;
    uploadConfig?: UploadConfiguration;
    isEditMode?: boolean;
    onUpload?: (files: File[]) => Promise<void>;
  }> = ({ title, description, icon: Icon, className, uploadConfig, isEditMode, onUpload }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelectLocal = async (e: React.ChangeEvent<HTMLInputElement>) => {
      await handleFileSelect(e, onUpload);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    return (
      <div className={cn('flex flex-col h-full p-4', className)}>
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-5 w-5 text-white/70" />
          <h3 className="text-sm font-medium text-white">{title}</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">{description}</p>
        
        <div
          className={cn(
            'flex-1 border-2 border-dashed rounded-lg transition-all flex flex-col items-center justify-center cursor-pointer',
            isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500',
            isEditMode && 'opacity-50 cursor-not-allowed'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, onUpload)}
          onClick={() => !isEditMode && fileInputRef.current?.click()}
        >
          <CloudArrowUpIcon className="h-12 w-12 text-gray-500 mb-2" />
          <p className="text-sm text-gray-400">{uploadConfig?.dropzoneText || 'Drop files here'}</p>
          <p className="text-xs text-gray-500 mt-1">{uploadConfig?.dropzoneSubtext || 'or click to select'}</p>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={uploadConfig?.accept}
          multiple={uploadConfig?.multiple}
          onChange={handleFileSelectLocal}
          disabled={isEditMode}
        />
      </div>
    );
  };

  return (
    <div className={cn('h-full flex gap-4', className)} style={{ height: height || '100%' }}>
          {/* Left side: Upload records list (wider) */}
          <div className="flex-1 h-full">
            <GlassmorphicCard 
              variant="default"
              hover={false}
              borderGlow={false}
              padding="none"
              className="h-full flex flex-col"
            >
              <div className="pb-3 flex-shrink-0 p-4 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-white">Upload Records</h3>
                    <p className="text-xs text-gray-400">Recent file upload records</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    Refresh
                  </Button>
                </div>
              </div>
              <div className="p-0 flex-1 min-h-0 flex flex-col">
                {/* Fixed Header */}
                <div className="grid grid-cols-3 gap-4 px-3 py-2 border-b border-gray-700 bg-gray-800/50 text-sm font-medium text-gray-400">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Upload Time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="h-4 w-4" />
                    <span>PDF Name</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    <span>Upload By</span>
                  </div>
                </div>
                
                {/* Scrollable Content */}
                <ScrollArea className="flex-1">
                  {loading ? (
                    <div className="space-y-2 p-3">
                      {[...Array(10)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : uploadRecords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground p-4">
                      <DocumentTextIcon className="h-8 w-8 mb-2" />
                      <p className="text-sm text-center">No upload records</p>
                    </div>
                  ) : (
                    <div className="space-y-0.5 p-1">
                      {uploadRecords.map(renderUploadRecord)}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </GlassmorphicCard>
          </div>

          {/* Right side: Three upload areas (vertical layout, narrower) */}
          <div className="w-96 flex flex-col gap-4 h-full">
            {/* Order PDF Upload */}
            <div className="flex-1 flex flex-col min-h-0 relative rounded-lg overflow-hidden bg-transparent backdrop-blur-[10px] border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 pointer-events-none" />
              <BaseUploadCard
                title="Order PDF"
                description="Upload PDF file for order processing"
                icon={DocumentArrowUpIcon}
                height="100%"
                className="!bg-transparent !border-0 !shadow-none [&>div]:!bg-transparent [&>div]:!border-0 [&>div]:!shadow-none [&_*]:!text-white [&_.text-muted-foreground]:!text-gray-400 [&_.text-xs]:!text-gray-400 [&_.border-dashed]:!border-gray-600"
                uploadConfig={{
                  accept: '.pdf',
                  maxSize: 10 * 1024 * 1024,
                  maxFiles: 1,
                  multiple: false,
                  autoUpload: true,
                  dropzoneText: 'Upload PDF file',
                  dropzoneSubtext: 'PDF Only',
                  showFileList: false,
                }}
                isEditMode={isEditMode}
                onUpload={handleOrderPDFUpload}
              />
            </div>
            
            {/* Product Spec Files Upload */}
            <div className="flex-1 flex flex-col min-h-0 relative rounded-lg overflow-hidden bg-transparent backdrop-blur-[10px] border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 pointer-events-none" />
              <BaseUploadCard
                title="Product Spec Files"
                description="Upload spec files in Excel or PDF format"
                icon={FolderOpenIcon}
                height="100%"
                className="!bg-transparent !border-0 !shadow-none [&>div]:!bg-transparent [&>div]:!border-0 [&>div]:!shadow-none [&_*]:!text-white [&_.text-muted-foreground]:!text-gray-400 [&_.text-xs]:!text-gray-400 [&_.border-dashed]:!border-gray-600"
                uploadConfig={{
                  accept: '.xls,.xlsx,.pdf',
                  maxSize: 10 * 1024 * 1024,
                  maxFiles: 5,
                  multiple: true,
                  dropzoneText: 'Upload spec files',
                  dropzoneSubtext: 'Excel or PDF format',
                  showFileList: false,
                }}
                isEditMode={isEditMode}
                onUpload={handleSpecFilesUpload}
              />
            </div>
            
            {/* Others Upload */}
            <div className="flex-1 flex flex-col min-h-0 relative rounded-lg overflow-hidden bg-transparent backdrop-blur-[10px] border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 pointer-events-none" />
              <BaseUploadCard
                title="Others"
                description="Drop files here or click to upload"
                icon={CloudArrowUpIcon}
                height="100%"
                className="!bg-transparent !border-0 !shadow-none [&>div]:!bg-transparent [&>div]:!border-0 [&>div]:!shadow-none [&_*]:!text-white [&_.text-muted-foreground]:!text-gray-400 [&_.text-xs]:!text-gray-400 [&_.border-dashed]:!border-gray-600"
                uploadConfig={othersUploadConfig}
                isEditMode={isEditMode}
                onUpload={handleOthersUpload}
              />
            </div>
          </div>
          
          {/* Upload Progress Overlay - Using StatusOverlay */}
          <StatusOverlay
            open={uploadToast.isOpen}
            status={
              uploadToast.status === 'uploading' || uploadToast.status === 'processing' 
                ? 'progress' 
                : uploadToast.status === 'complete' 
                  ? 'success' 
                  : 'error'
            }
            mode="modal"
            title={
              uploadToast.status === 'uploading' ? 'Uploading PDF...' :
              uploadToast.status === 'processing' ? 'Processing Order Data...' :
              uploadToast.status === 'complete' ? 'Upload Complete!' :
              'Upload Failed'
            }
            message={`${uploadToast.fileName} • ${formatFileSize(uploadToast.fileSize)}`}
            details={
              uploadToast.status === 'error' && uploadToast.error ? uploadToast.error :
              uploadToast.status === 'complete' ? 'Order data successfully processed and saved!' :
              undefined
            }
            progress={uploadToast.progress}
            progressLabel={uploadToast.status === 'processing' ? 'Analyzing PDF content...' : undefined}
            showCloseButton={uploadToast.status === 'complete' || uploadToast.status === 'error'}
            onClose={() => setUploadToast({ 
              isOpen: false, 
              fileName: '', 
              fileSize: 0, 
              progress: 0, 
              status: 'uploading' 
            })}
          />
    </div>
  );
};

export default UploadCenterCard;