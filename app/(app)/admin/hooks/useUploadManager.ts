/**
 * useUploadManager Hook
 * 
 * Extracted from UploadCenterCard component for better reusability and testability
 * Handles file upload management, progress tracking, and record management
 * 
 * Features:
 * - File drag and drop handling
 * - Upload progress tracking with toast UI
 * - Upload records management (fetch, refresh)
 * - File preview functionality
 * - Multiple upload types support (PDF analysis, spec files, others)
 * - Error handling and status management
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/app/utils/supabase/client';
import type {
  UploadConfiguration,
  DocUploadRecord,
  UploadToastState,
} from '../types/data-management';

// Hook state interface
export interface UploadManagerState {
  uploadRecords: DocUploadRecord[];
  loading: boolean;
  refreshKey: number;
  uploadToast: UploadToastState;
  isDragging: boolean;
}

// Hook actions interface
export interface UploadManagerActions {
  fetchUploadRecords: () => Promise<void>;
  handleRefresh: () => void;
  handlePreviewPDF: (record: DocUploadRecord) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, onUpload?: (files: File[]) => Promise<void>) => Promise<void>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>, onUpload?: (files: File[]) => Promise<void>) => Promise<void>;
  handleOrderPDFUpload: (files: File[]) => Promise<void>;
  handleSpecFilesUpload: (files: File[]) => Promise<void>;
  handleOthersUpload: (files: File[]) => Promise<void>;
  setUploadToast: (toast: UploadToastState) => void;
  setIsDragging: (isDragging: boolean) => void;
}

// Hook props interface
export interface UseUploadManagerProps {
  isEditMode?: boolean;
  onUploadComplete?: (files: File[], uploadType: 'order-pdf' | 'spec-files' | 'others') => void;
  onUploadError?: (error: Error) => void;
}

// Hook return interface
export interface UseUploadManagerReturn {
  state: UploadManagerState;
  actions: UploadManagerActions;
}

export const useUploadManager = ({
  isEditMode = false,
  onUploadComplete,
  onUploadError,
}: UseUploadManagerProps = {}): UseUploadManagerReturn => {
  // State management
  const [uploadRecords, setUploadRecords] = useState<DocUploadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploadToast, setUploadToast] = useState<UploadToastState>({
    isOpen: false,
    fileName: '',
    fileSize: 0,
    progress: 0,
    status: 'uploading',
    error: undefined,
  });
  const [isDragging, setIsDragging] = useState(false);

  const supabase = createClient();

  // Fetch upload records from database
  const fetchUploadRecords = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get upload records
      const { data: records, error: recordsError } = await supabase
        .from('doc_upload')
        .select('uuid, doc_name, upload_by, created_at, doc_url, doc_type')
        .order('created_at', { ascending: false })
        .limit(50);

      if (recordsError) throw recordsError;

      if (records && records.length > 0) {
        // Get unique upload_by IDs
        const userIds = [...new Set(records.map((r) => r.upload_by))];
        
        // Batch fetch user data
        const { data: users, error: usersError } = await supabase
          .from('data_id')
          .select('id, name')
          .in('id', userIds as number[]);

        if (usersError) {
          console.error('Error fetching users:', usersError);
        }

        // Create user ID to name mapping
        const userMap = new Map(users?.map(u => [u.id, u.name]) || []);

        // Merge data
        const recordsWithNames = records.map(record => ({
          uuid: record.uuid,
          doc_name: record.doc_name,
          upload_by: record.upload_by,
          created_at: record.created_at,
          doc_url: record.doc_url,
          doc_type: record.doc_type,
          upload_by_name: userMap.get(Number(record.upload_by)) || `User ${record.upload_by}`,
          id: record.uuid,
          file: {
            id: record.uuid,
            name: record.doc_name,
            size: 0,
            type: record.doc_type,
            status: 'completed' as const
          },
          uploadedAt: new Date(record.created_at as string),
          uploadedBy: record.upload_by
        } as DocUploadRecord));

        setUploadRecords(recordsWithNames);
      } else {
        setUploadRecords([]);
      }
    } catch (error) {
      console.error('[useUploadManager] Error fetching records:', error);
      toast.error('Failed to load upload records');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Refresh records
  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Handle PDF preview
  const handlePreviewPDF = useCallback((record: DocUploadRecord) => {
    if (record.doc_url && record.doc_type === 'application/pdf') {
      window.open(record.doc_url, '_blank');
    } else if (record.doc_url) {
      window.open(record.doc_url, '_blank');
    } else {
      toast.error('No preview available for this file');
    }
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isEditMode) setIsDragging(true);
  }, [isEditMode]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, onUpload?: (files: File[]) => Promise<void>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (isEditMode) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && onUpload) {
      await onUpload(files);
    }
  }, [isEditMode]);

  // File selection handler
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, onUpload?: (files: File[]) => Promise<void>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onUpload) {
      await onUpload(files);
    }
  }, []);

  // Order PDF upload handler - extracted from UploadCenterCard
  const handleOrderPDFUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    let progressInterval: NodeJS.Timeout | undefined;
    let processInterval: NodeJS.Timeout | undefined;
    
    try {
      // Get current user ID
      const { getCurrentUserId } = await import('@/app/actions/orderUploadActions');
      const userId = await getCurrentUserId();
      
      if (!userId) {
        toast.error('User not authenticated. Please login again.');
        return;
      }
      
      // Show Google Drive style upload toast
      setUploadToast({
        isOpen: true,
        fileName: file.name,
        fileSize: file.size,
        progress: 0,
        status: 'uploading',
        error: undefined,
      });
      
      // Simulate upload progress
      progressInterval = setInterval(() => {
        setUploadToast(prev => {
          if (prev.progress >= 30) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, progress: prev.progress + 10 };
        });
      }, 200);
      
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Update to processing status
      setUploadToast(prev => ({ ...prev, status: 'processing', progress: 40 }));
      
      // Call analyzeOrderPDF server action
      const { analyzeOrderPDF } = await import('@/app/actions/orderUploadActions');
      
      // Simulate processing progress
      processInterval = setInterval(() => {
        setUploadToast(prev => {
          if (prev.progress >= 90) {
            clearInterval(processInterval);
            return prev;
          }
          return { ...prev, progress: prev.progress + 10 };
        });
      }, 300);
      
      const result = await analyzeOrderPDF(
        {
          buffer: arrayBuffer,
          name: file.name,
        },
        userId.toString(),
        true // saveToStorage
      );
      
      clearInterval(processInterval);
      
      if (result.success) {
        // Update to complete status
        setUploadToast(prev => ({ ...prev, status: 'complete', progress: 100 }));
        
        const recordCount = result.recordCount || 0;
        
        // Auto close upload toast after 3 seconds
        setTimeout(() => {
          setUploadToast(prev => ({ ...prev, isOpen: false }));
        }, 3000);
        
        // Show additional success notification
        setTimeout(() => {
          toast.success(`Successfully analyzed ${recordCount} order items`);
          
          if (result.data && typeof result.data === 'object' && 'order_ref' in result.data) {
            const orderRef = (result.data as { order_ref: string }).order_ref;
            toast.info(`Order ${orderRef} has been processed`);
          }
        }, 500);
        
        // Refresh upload records and trigger callback
        handleRefresh();
        if (onUploadComplete) {
          onUploadComplete(files, 'order-pdf');
        }
      } else {
        // Update to error status
        setUploadToast(prev => ({ 
          ...prev, 
          status: 'error', 
          error: result.error || 'Failed to analyze PDF' 
        }));
        
        // Auto close after 5 seconds
        setTimeout(() => {
          setUploadToast(prev => ({ ...prev, isOpen: false }));
        }, 5000);
        
        if (onUploadError) {
          onUploadError(new Error(result.error || 'Failed to analyze PDF'));
        }
      }
    } catch (error) {
      console.error('[OrderPDF] Analysis error:', error);
      
      // Clear any progress intervals
      if (progressInterval) clearInterval(progressInterval);
      if (processInterval) clearInterval(processInterval);
      
      // Update to error status
      setUploadToast(prev => ({ 
        ...prev, 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Failed to process PDF' 
      }));
      
      // Auto close after 5 seconds
      setTimeout(() => {
        setUploadToast(prev => ({ ...prev, isOpen: false }));
      }, 5000);
      
      if (onUploadError) {
        onUploadError(error instanceof Error ? error : new Error('Failed to process PDF'));
      }
    }
  }, [handleRefresh, onUploadComplete, onUploadError]);

  // Product spec files upload handler
  const handleSpecFilesUpload = useCallback(async (files: File[]) => {
    console.log('[ProductSpec] Files to upload:', files);
    toast.success(`Successfully uploaded ${files.length} spec file(s)`);
    handleRefresh();
    if (onUploadComplete) {
      onUploadComplete(files, 'spec-files');
    }
  }, [handleRefresh, onUploadComplete]);

  // Others upload handler
  const handleOthersUpload = useCallback(async (files: File[]) => {
    console.log('[OthersUpload] Files to upload:', files);
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast.success(`Successfully uploaded ${files.length} file(s)`);
    handleRefresh();
    if (onUploadComplete) {
      onUploadComplete(files, 'others');
    }
  }, [handleRefresh, onUploadComplete]);

  // State object
  const state: UploadManagerState = {
    uploadRecords,
    loading,
    refreshKey,
    uploadToast,
    isDragging,
  };

  // Actions object
  const actions: UploadManagerActions = {
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
  };

  return { state, actions };
};

export default useUploadManager;