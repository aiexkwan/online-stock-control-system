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
import {
  CloudArrowUpIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  FolderOpenIcon,
  CalendarIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { DataCard } from '@/lib/card-system/EnhancedGlassmorphicCard';
import { cardTextStyles } from '@/lib/card-system/theme';
import { PDFPreviewOverlay } from '@/components/ui/pdf-preview-overlay';
import { DataExtractionOverlay } from '@/components/ui/data-extraction-overlay';
import type { _DocUploadRecord, UploadCenterCardProps } from '../types/data-management';
import { formatFileSize as formatFileSizeUtil } from '../utils/formatters';
import { StatusOverlay } from '../components/shared';
import { useUploadManager } from '../hooks/useUploadManager';

// Local interface for upload configuration (extends the one from data-management)
interface LocalUploadConfiguration {
  accept: string;
  maxSize: number;
  maxFiles: number;
  multiple: boolean;
  autoUpload?: boolean;
  dropzoneText: string;
  dropzoneSubtext: string;
  showFileList: boolean;
}

export const UploadCenterCard: React.FC<UploadCenterCardProps> = ({
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
    onUploadError: error => {
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
    pdfPreview,
    dataExtraction,
  } = state;

  const {
    fetchUploadRecords,
    handleRefresh,
    handlePreviewPDF,
    closePDFPreview,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    handleOrderPDFUpload,
    handleSpecFilesUpload,
    handleOthersUpload,
    setUploadToast,
    setIsDragging,
    openDataExtractionOverlay,
    closeDataExtractionOverlay,
  } = actions;

  // Initial load
  useEffect(() => {
    fetchUploadRecords();
  }, [fetchUploadRecords, refreshKey]);

  // Render upload record item
  const renderUploadRecord = (record: _DocUploadRecord) => (
    <div
      key={record.uuid}
      className={cn(
        'grid grid-cols-3 gap-4 rounded px-3 py-3 transition-colors hover:bg-white/10',
        record.doc_url && 'cursor-pointer'
      )}
      onClick={() => handlePreviewPDF(record)}
    >
      <div className='flex items-center gap-2'>
        <CalendarIcon className='h-4 w-4 flex-shrink-0 text-gray-400' />
        <p className={cardTextStyles.bodySmall}>
          {format(new Date(record.created_at), 'yyyy-MM-dd HH:mm')}
        </p>
      </div>
      <div className='flex items-center gap-2'>
        <DocumentTextIcon className='h-4 w-4 flex-shrink-0 text-gray-400' />
        <p className={cn(cardTextStyles.bodySmall, 'truncate')} title={record.doc_name}>
          {record.doc_name}
        </p>
      </div>
      <div className='flex items-center gap-2'>
        <UserIcon className='h-4 w-4 flex-shrink-0 text-gray-400' />
        <p className={cn(cardTextStyles.bodySmall, 'truncate')}>{record.upload_by_name}</p>
      </div>
    </div>
  );

  // Upload configuration for Others section
  const othersUploadConfig: LocalUploadConfiguration = {
    accept: '*',
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    multiple: true,
    dropzoneText: 'Drop files here or click to upload',
    dropzoneSubtext: 'Any file type, max 10MB',
    showFileList: false,
  };

  // Interface for BaseUploadCard props
  interface BaseUploadCardProps {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    height?: string | number;
    className?: string;
    uploadConfig?: LocalUploadConfiguration;
    isEditMode?: boolean;
    onUpload?: (files: File[]) => Promise<void>;
  }

  // Simple inline BaseUploadCard component - uses hook functions
  const BaseUploadCard: React.FC<BaseUploadCardProps> = ({
    title,
    description,
    icon: Icon,
    className,
    uploadConfig,
    isEditMode,
    onUpload,
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelectLocal = async (e: React.ChangeEvent<HTMLInputElement>) => {
      await handleFileSelect(e, onUpload);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    return (
      <div className={cn('flex h-full flex-col p-4', className)}>
        <div className='mb-2 flex items-center gap-2'>
          <Icon className='h-5 w-5 text-green-400' />
          <h3 className={cardTextStyles.bodySmall}>{title}</h3>
        </div>
        <p className={cardTextStyles.labelSmall}>{description}</p>

        <div
          className={cn(
            'flex flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all',
            isDragging ? 'border-white/50 bg-white/10' : 'border-gray-600 hover:border-gray-500',
            isEditMode && 'cursor-not-allowed opacity-50'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={e => handleDrop(e, onUpload)}
          onClick={() => !isEditMode && fileInputRef.current?.click()}
        >
          <CloudArrowUpIcon className='mb-2 h-12 w-12 text-gray-500' />
          <p className='text-sm text-gray-400'>{uploadConfig?.dropzoneText || 'Drop files here'}</p>
          <p className='mt-1 text-xs text-gray-500'>
            {uploadConfig?.dropzoneSubtext || 'or click to select'}
          </p>
        </div>

        <input
          ref={fileInputRef}
          type='file'
          className='hidden'
          accept={uploadConfig?.accept}
          multiple={uploadConfig?.multiple}
          onChange={handleFileSelectLocal}
          disabled={isEditMode}
        />
      </div>
    );
  };

  return (
    <div className={cn('flex h-full gap-4', className)} style={{ height: height || '100%' }}>
      {/* Left side: Upload records list (wider) */}
      <div className='h-full flex-1'>
        <DataCard
          className='flex h-full flex-col'
          borderGlow='hover'
          glassmorphicVariant='default'
          padding='none'
        >
          <div className='flex-shrink-0 border-b border-gray-700/50 p-4 pb-3'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className={cardTextStyles.title}>Upload Records</h3>
                <p className={cardTextStyles.labelSmall}>Recent file upload records</p>
              </div>
              <Button variant='outline' size='sm' onClick={handleRefresh} disabled={loading}>
                Refresh
              </Button>
            </div>
          </div>
          <div className='flex min-h-0 flex-1 flex-col p-0'>
            {/* Fixed Header */}
            <div className='grid grid-cols-3 gap-4 border-none bg-white/5 px-3 py-2 text-sm font-medium text-gray-400 backdrop-blur-sm'>
              <div className='flex items-center gap-2'>
                <CalendarIcon className='h-4 w-4' />
                <span>Upload Time</span>
              </div>
              <div className='flex items-center gap-2'>
                <DocumentTextIcon className='h-4 w-4' />
                <span>PDF Name</span>
              </div>
              <div className='flex items-center gap-2'>
                <UserIcon className='h-4 w-4' />
                <span>Upload By</span>
              </div>
            </div>

            {/* Scrollable Content */}
            <ScrollArea className='flex-1'>
              {loading ? (
                <div className='space-y-2 p-3'>
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className='h-12 w-full' />
                  ))}
                </div>
              ) : uploadRecords.length === 0 ? (
                <div className='flex h-48 flex-col items-center justify-center p-4 text-muted-foreground'>
                  <DocumentTextIcon className='mb-2 h-8 w-8' />
                  <p className='text-center text-sm'>No upload records</p>
                </div>
              ) : (
                <div className='space-y-0.5 p-1'>{uploadRecords.map(renderUploadRecord)}</div>
              )}
            </ScrollArea>
          </div>
        </DataCard>
      </div>

      {/* Right side: Three upload areas (vertical layout, narrower) */}
      <div className='flex h-full w-96 flex-col gap-4'>
        {/* Order PDF Upload */}
        <DataCard
          className='flex min-h-0 flex-1 flex-col'
          borderGlow='hover'
          glassmorphicVariant='subtle'
          padding='none'
        >
          <BaseUploadCard
            title='Order PDF'
            description='Upload PDF file for order processing'
            icon={DocumentArrowUpIcon}
            height='100%'
            className='relative z-10'
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
        </DataCard>

        {/* Product Spec Files Upload */}
        <DataCard
          className='flex min-h-0 flex-1 flex-col'
          borderGlow='hover'
          glassmorphicVariant='subtle'
          padding='none'
        >
          <BaseUploadCard
            title='Product Spec Files'
            description='Upload spec files in Excel or PDF format'
            icon={FolderOpenIcon}
            height='100%'
            className='relative z-10'
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
        </DataCard>

        {/* Others Upload */}
        <DataCard
          className='flex min-h-0 flex-1 flex-col'
          borderGlow='hover'
          glassmorphicVariant='subtle'
          padding='none'
        >
          <BaseUploadCard
            title='Others'
            description='Drop files here or click to upload'
            icon={CloudArrowUpIcon}
            height='100%'
            className='relative z-10'
            uploadConfig={othersUploadConfig}
            isEditMode={isEditMode}
            onUpload={handleOthersUpload}
          />
        </DataCard>
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
        mode='modal'
        title={
          uploadToast.status === 'uploading'
            ? 'Uploading PDF...'
            : uploadToast.status === 'processing'
              ? 'Processing Order Data...'
              : uploadToast.status === 'complete'
                ? 'Upload Complete!'
                : 'Upload Failed'
        }
        message={`${uploadToast.fileName} • ${formatFileSizeUtil(uploadToast.fileSize)}`}
        details={
          uploadToast.status === 'error' && uploadToast.error
            ? uploadToast.error
            : uploadToast.status === 'complete'
              ? 'Order data successfully processed and saved!'
              : undefined
        }
        progress={uploadToast.progress}
        progressLabel={uploadToast.status === 'processing' ? 'Analyzing PDF content...' : undefined}
        showCloseButton={uploadToast.status === 'complete' || uploadToast.status === 'error'}
        onClose={() =>
          setUploadToast({
            isOpen: false,
            fileName: '',
            fileSize: 0,
            progress: 0,
            status: 'uploading',
          })
        }
      />

      {/* PDF Preview Overlay - Full screen overlay instead of new tab */}
      <PDFPreviewOverlay
        isOpen={pdfPreview.isOpen}
        pdfUrl={pdfPreview.url || ''}
        fileName={pdfPreview.fileName || 'PDF Document'}
        onClose={closePDFPreview}
      />

      {/* Data Extraction Results Overlay */}
      <DataExtractionOverlay
        isOpen={dataExtraction.isOpen}
        data={dataExtraction.data}
        fileName={dataExtraction.fileName}
        orderRef={dataExtraction.orderRef}
        onClose={closeDataExtractionOverlay}
      />
    </div>
  );
};

export default UploadCenterCard;
