/**
 * Universal Upload Hook
 * 統一上傳功能的核心 Hook
 */

import { useState, useCallback, useRef, useReducer } from 'react';
import { useUploadRefresh } from '@/app/admin/contexts/UploadRefreshContext';
import { uploadFile } from '@/app/actions/fileActions';
import { 
  UniversalUploadWidgetConfig, 
  UseUniversalUploadReturn, 
  UploadState, 
  UploadActionType,
  UploadResult,
  UploadProgress,
  FILE_TYPE_GROUPS
} from './types';
import { errorHandler } from '@/app/components/qc-label-form/services/ErrorHandler';

/**
 * Upload State Reducer
 */
interface UploadAction {
  type: UploadActionType;
  payload?: any;
}

const initialState: UploadState = {
  isUploading: false,
  progress: 0,
  error: undefined,
  result: undefined,
  selectedFolder: undefined,
  previewUrl: undefined,
  aiAnalysisResult: undefined,
};

function uploadReducer(state: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    case UploadActionType.SELECT_FILE:
      return { ...state, error: undefined };
      
    case UploadActionType.START_UPLOAD:
      return { ...state, isUploading: true, progress: 0, error: undefined };
      
    case UploadActionType.UPDATE_PROGRESS:
      return { ...state, progress: action.payload };
      
    case UploadActionType.UPLOAD_SUCCESS:
      return { 
        ...state, 
        isUploading: false, 
        progress: 100, 
        result: action.payload,
        error: undefined 
      };
      
    case UploadActionType.UPLOAD_ERROR:
      return { 
        ...state, 
        isUploading: false, 
        progress: 0, 
        error: action.payload,
        result: undefined 
      };
      
    case UploadActionType.RESET:
      return initialState;
      
    case UploadActionType.SET_FOLDER:
      return { ...state, selectedFolder: action.payload };
      
    case UploadActionType.SET_PREVIEW:
      return { ...state, previewUrl: action.payload };
      
    case UploadActionType.SET_AI_RESULT:
      return { ...state, aiAnalysisResult: action.payload };
      
    default:
      return state;
  }
}

/**
 * Universal Upload Hook
 */
export function useUniversalUpload(
  config: UniversalUploadWidgetConfig
): UseUniversalUploadReturn {
  const [uploadState, dispatch] = useReducer(uploadReducer, initialState);
  const [isDragging, setIsDragging] = useState(false);
  const { triggerRefresh } = useUploadRefresh();
  const dragCounter = useRef(0);
  const uploadAbortController = useRef<AbortController | null>(null);

  /**
   * 獲取接受的文件類型字符串
   */
  const getAcceptString = useCallback(() => {
    // 如果配置了文件組，展開它們
    const expandedTypes = config.fileTypes.flatMap(type => {
      const groupKey = type.replace('.', '') as keyof typeof FILE_TYPE_GROUPS;
      return FILE_TYPE_GROUPS[groupKey] || [type];
    });
    
    return expandedTypes.join(',');
  }, [config.fileTypes]);

  /**
   * 驗證文件
   */
  const validateFile = useCallback(async (file: File): Promise<boolean> => {
    // 檢查文件大小
    if (file.size > config.maxSize) {
      const maxSizeMB = config.maxSize / (1024 * 1024);
      dispatch({ 
        type: UploadActionType.UPLOAD_ERROR, 
        payload: `File size exceeds ${maxSizeMB}MB limit` 
      });
      return false;
    }

    if (config.minSize && file.size < config.minSize) {
      const minSizeMB = config.minSize / (1024 * 1024);
      dispatch({ 
        type: UploadActionType.UPLOAD_ERROR, 
        payload: `File size is below ${minSizeMB}MB minimum` 
      });
      return false;
    }

    // 檢查文件類型
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const acceptedTypes = getAcceptString().split(',').map(t => t.trim().toLowerCase());
    
    if (!acceptedTypes.some(type => fileExtension === type)) {
      dispatch({ 
        type: UploadActionType.UPLOAD_ERROR, 
        payload: `File type ${fileExtension} is not allowed` 
      });
      return false;
    }

    // 自定義驗證
    if (config.validation?.customValidator) {
      try {
        const isValid = await config.validation.customValidator(file);
        if (!isValid) {
          dispatch({ 
            type: UploadActionType.UPLOAD_ERROR, 
            payload: 'File failed custom validation' 
          });
          return false;
        }
      } catch (error) {
        dispatch({ 
          type: UploadActionType.UPLOAD_ERROR, 
          payload: 'Validation error occurred' 
        });
        return false;
      }
    }

    // 執行插件的 beforeValidate hooks
    if (config.plugins) {
      for (const plugin of config.plugins) {
        if (plugin.beforeValidate) {
          try {
            const isValid = await plugin.beforeValidate(file, config);
            if (!isValid) {
              dispatch({ 
                type: UploadActionType.UPLOAD_ERROR, 
                payload: `File failed ${plugin.name} validation` 
              });
              return false;
            }
          } catch (error) {
            dispatch({ 
              type: UploadActionType.UPLOAD_ERROR, 
              payload: `${plugin.name} validation error` 
            });
            return false;
          }
        }
      }
    }

    return true;
  }, [config, getAcceptString]);

  /**
   * 模擬上傳進度
   */
  const simulateProgress = useCallback((onProgress?: (progress: UploadProgress) => void) => {
    const stages = [20, 40, 60, 80];
    let currentStage = 0;

    const interval = setInterval(() => {
      if (currentStage < stages.length) {
        const progress = stages[currentStage];
        dispatch({ type: UploadActionType.UPDATE_PROGRESS, payload: progress });
        
        if (onProgress) {
          onProgress({ loaded: progress, total: 100, percentage: progress });
        }
        
        // 通知插件
        config.plugins?.forEach(plugin => {
          if (plugin.onProgress) {
            plugin.onProgress({ loaded: progress, total: 100, percentage: progress });
          }
        });
        
        currentStage++;
      } else {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [config.plugins]);

  /**
   * 處理文件選擇
   */
  const handleFileSelect = useCallback(async (file: File) => {
    dispatch({ type: UploadActionType.SELECT_FILE });

    // 驗證文件
    const isValid = await validateFile(file);
    if (!isValid) return;

    // 觸發事件
    if (config.events?.onBeforeUpload) {
      const shouldContinue = await config.events.onBeforeUpload(file);
      if (!shouldContinue) return;
    }

    // 處理預覽
    if (config.features.preview && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        dispatch({ 
          type: UploadActionType.SET_PREVIEW, 
          payload: e.target?.result as string 
        });
      };
      reader.readAsDataURL(file);
    }

    // 開始上傳
    dispatch({ type: UploadActionType.START_UPLOAD });
    
    // 創建 AbortController
    uploadAbortController.current = new AbortController();
    
    // 開始進度模擬
    const clearProgress = simulateProgress(config.events?.onUploadProgress);

    try {
      // 準備 FormData
      const formData = new FormData();
      formData.append('file', file);
      
      // 添加目標文件夾
      const targetFolder = uploadState.selectedFolder || config.targetFolder;
      if (targetFolder) {
        formData.append('folder', targetFolder);
      }

      // 執行上傳
      const result = await uploadFile(formData);
      
      clearProgress();
      dispatch({ type: UploadActionType.UPDATE_PROGRESS, payload: 100 });

      const uploadResult: UploadResult = {
        success: result.success,
        fileName: file.name,
        fileSize: file.size,
        url: result.url,
        error: result.error,
        metadata: result.metadata,
      };

      // 後處理
      if (config.postProcess) {
        if (typeof config.postProcess === 'string') {
          // TODO: 動態調用 server action
          console.log(`Calling post process: ${config.postProcess}`);
        } else {
          await config.postProcess(uploadResult);
        }
      }

      // 執行插件的 afterUpload hooks
      if (config.plugins) {
        for (const plugin of config.plugins) {
          if (plugin.afterUpload) {
            await plugin.afterUpload(uploadResult, config);
          }
        }
      }

      dispatch({ 
        type: UploadActionType.UPLOAD_SUCCESS, 
        payload: uploadResult 
      });

      // 觸發事件
      if (config.events?.onUploadComplete) {
        config.events.onUploadComplete(uploadResult);
      }

      // 刷新數據
      triggerRefresh();

      // 成功通知
      errorHandler.handleSuccess(
        `Successfully uploaded ${file.name}`,
        { component: 'UniversalUploadWidget', action: 'upload_file' }
      );

    } catch (error) {
      clearProgress();
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      dispatch({ 
        type: UploadActionType.UPLOAD_ERROR, 
        payload: errorMessage 
      });

      // 觸發事件
      if (config.events?.onUploadError) {
        config.events.onUploadError(error as Error);
      }

      // 錯誤通知
      errorHandler.handleApiError(
        error as Error,
        { component: 'UniversalUploadWidget', action: 'upload_file' },
        'Failed to upload file. Please try again.'
      );
    } finally {
      uploadAbortController.current = null;
    }
  }, [config, uploadState.selectedFolder, simulateProgress, validateFile]);

  /**
   * 處理拖放
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0]; // 暫時只處理第一個文件
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  /**
   * 處理拖動進入
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  /**
   * 處理拖動離開
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  /**
   * 重置狀態
   */
  const reset = useCallback(() => {
    dispatch({ type: UploadActionType.RESET });
    setIsDragging(false);
    dragCounter.current = 0;
    
    // 中止進行中的上傳
    if (uploadAbortController.current) {
      uploadAbortController.current.abort();
      uploadAbortController.current = null;
    }
  }, []);

  return {
    uploadState,
    isDragging,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    reset,
    validateFile,
    getAcceptString,
  };
}