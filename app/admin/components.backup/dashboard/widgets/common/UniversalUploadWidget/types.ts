/**
 * Universal Upload Widget Type Definitions
 * 統一上傳組件的類型定義
 */

import { IconType } from 'react-icons';
import { ReactNode } from 'react';

/**
 * 上傳文件結果
 */
export interface UploadResult {
  success: boolean;
  fileName?: string;
  fileSize?: number;
  url?: string;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * 上傳進度狀態
 */
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * 插件生命週期鉤子
 */
export interface UploadPlugin {
  id: string;
  name: string;
  beforeValidate?: (file: File, config: UniversalUploadWidgetConfig) => Promise<boolean>;
  afterUpload?: (result: UploadResult, config: UniversalUploadWidgetConfig) => Promise<void>;
  renderUI?: (props: UploadPluginUIProps) => ReactNode;
  onProgress?: (progress: UploadProgress) => void;
}

/**
 * 插件 UI 屬性
 */
export interface UploadPluginUIProps {
  config: UniversalUploadWidgetConfig;
  file?: File;
  uploadState: UploadState;
  onAction?: (action: string, data?: any) => void;
}

/**
 * 上傳狀態
 */
export interface UploadState {
  isUploading: boolean;
  progress: number;
  error?: string;
  result?: UploadResult;
  selectedFolder?: string;
  previewUrl?: string;
  aiAnalysisResult?: any;
}

/**
 * 文件驗證規則
 */
export interface FileValidation {
  maxSize?: number;
  minSize?: number;
  allowedTypes?: string[];
  customValidator?: (file: File) => boolean | Promise<boolean>;
}

/**
 * 文件夾選項配置
 */
export interface FolderSelectorConfig {
  enabled: boolean;
  options: string[];
  defaultValue?: string;
  required?: boolean;
}

/**
 * 預覽配置
 */
export interface PreviewConfig {
  enabled: boolean;
  maxPreviewSize?: number;
  previewTypes?: string[];
}

/**
 * AI 分析配置
 */
export interface AIAnalysisConfig {
  enabled: boolean;
  endpoint?: string;
  resultHandler?: (result: any) => void;
  showResultDialog?: boolean;
}

/**
 * Universal Upload Widget 配置
 */
export interface UniversalUploadWidgetConfig {
  // 基本配置
  id: string;
  title: string;
  description?: string;
  icon?: IconType;
  iconColor?: string;
  
  // 文件配置
  fileTypes: string[];
  maxSize: number;
  minSize?: number;
  targetFolder?: string;
  
  // 功能配置
  features: {
    preview?: PreviewConfig | boolean;
    folderSelector?: FolderSelectorConfig | boolean;
    aiAnalysis?: AIAnalysisConfig | boolean;
    multipleFiles?: boolean;
    autoUpload?: boolean;
  };
  
  // 驗證配置
  validation?: FileValidation;
  
  // 後處理
  postProcess?: string | ((result: UploadResult) => Promise<void>);
  
  // 外觀配置
  appearance?: {
    dropzoneClassName?: string;
    buttonClassName?: string;
    progressBarColor?: string;
    showFileInfo?: boolean;
  };
  
  // 事件處理
  events?: {
    onBeforeUpload?: (file: File) => Promise<boolean>;
    onUploadProgress?: (progress: UploadProgress) => void;
    onUploadComplete?: (result: UploadResult) => void;
    onUploadError?: (error: Error) => void;
  };
  
  // 插件
  plugins?: UploadPlugin[];
}

/**
 * 配置創建函數類型
 */
export type CreateUploadConfigFunction = (
  overrides?: Partial<UniversalUploadWidgetConfig>
) => UniversalUploadWidgetConfig;

/**
 * Upload Hook 返回類型
 */
export interface UseUniversalUploadReturn {
  // 狀態
  uploadState: UploadState;
  isDragging: boolean;
  
  // 方法
  handleFileSelect: (file: File) => Promise<void>;
  handleDrop: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  reset: () => void;
  
  // 輔助方法
  validateFile: (file: File) => Promise<boolean>;
  getAcceptString: () => string;
}

/**
 * 通用 Toast 配置
 */
export interface UploadToastConfig {
  title: string;
  description?: string;
  duration?: number;
  variant?: 'default' | 'success' | 'error' | 'warning';
}

/**
 * 上傳動作類型
 */
export enum UploadActionType {
  SELECT_FILE = 'SELECT_FILE',
  START_UPLOAD = 'START_UPLOAD',
  UPDATE_PROGRESS = 'UPDATE_PROGRESS',
  UPLOAD_SUCCESS = 'UPLOAD_SUCCESS',
  UPLOAD_ERROR = 'UPLOAD_ERROR',
  RESET = 'RESET',
  SET_FOLDER = 'SET_FOLDER',
  SET_PREVIEW = 'SET_PREVIEW',
  SET_AI_RESULT = 'SET_AI_RESULT',
}

/**
 * Widget 屬性（用於 Dashboard 集成）
 */
export interface UniversalUploadWidgetProps {
  widget: {
    id: string;
    gridX: number;
    gridY: number;
    gridWidth: number;
    gridHeight: number;
  };
  isEditMode: boolean;
  configId?: string;
  configOverrides?: Partial<UniversalUploadWidgetConfig>;
}

/**
 * 文件類型映射
 */
export const FILE_TYPE_GROUPS = {
  images: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
  documents: ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
  spreadsheets: ['.xls', '.xlsx', '.csv'],
  archives: ['.zip', '.rar', '.7z', '.tar', '.gz'],
} as const;

/**
 * 默認配置值
 */
export const DEFAULT_UPLOAD_CONFIG: Partial<UniversalUploadWidgetConfig> = {
  maxSize: 10 * 1024 * 1024, // 10MB
  features: {
    preview: false,
    folderSelector: false,
    aiAnalysis: false,
    multipleFiles: false,
    autoUpload: false,
  },
  appearance: {
    showFileInfo: true,
  },
};