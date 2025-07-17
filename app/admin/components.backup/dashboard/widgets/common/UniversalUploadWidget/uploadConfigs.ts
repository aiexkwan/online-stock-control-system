/**
 * Universal Upload Widget Configurations
 * 統一上傳組件配置
 */

import { 
  DocumentArrowUpIcon,
  PhotoIcon,
  DocumentTextIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import {
  UniversalUploadWidgetConfig,
  CreateUploadConfigFunction,
  FolderSelectorConfig,
  PreviewConfig,
  AIAnalysisConfig,
  DEFAULT_UPLOAD_CONFIG,
} from './types';

/**
 * 1. Upload Files Widget Configuration
 * 支援多種文件類型和文件夾選擇
 */
export const UploadFilesConfig: CreateUploadConfigFunction = (overrides = {}) => ({
  ...DEFAULT_UPLOAD_CONFIG,
  id: 'upload-files',
  title: 'Upload Files',
  description: 'Upload images or documents',
  icon: DocumentArrowUpIcon,
  iconColor: 'from-blue-500 to-cyan-500',
  
  fileTypes: ['.png', '.jpeg', '.jpg', '.pdf', '.doc', '.docx'],
  maxSize: 10 * 1024 * 1024, // 10MB
  
  features: {
    folderSelector: {
      enabled: true,
      options: ['stockPic', 'productSpec'],
      defaultValue: 'stockPic',
      required: true,
    } as FolderSelectorConfig,
    preview: false,
    aiAnalysis: false,
    multipleFiles: false,
    autoUpload: false,
  },
  
  validation: {
    customValidator: async (file: File) => {
      // 圖片文件必須選擇 stockPic
      if (file.type.startsWith('image/')) {
        return true; // 在組件層面檢查文件夾
      }
      // 文檔文件必須選擇 productSpec
      return true;
    },
  },
  
  appearance: {
    dropzoneClassName: 'border-blue-500/50',
    buttonClassName: 'bg-blue-600 hover:bg-blue-700',
    showFileInfo: true,
  },
  
  ...overrides,
});

/**
 * 2. Upload Photo Widget Configuration
 * 專門用於圖片上傳，支援預覽
 */
export const UploadPhotoConfig: CreateUploadConfigFunction = (overrides = {}) => ({
  ...DEFAULT_UPLOAD_CONFIG,
  id: 'upload-photo',
  title: 'Upload Photo',
  description: 'Upload product images',
  icon: PhotoIcon,
  iconColor: 'from-green-500 to-emerald-500',
  
  fileTypes: ['.png', '.jpeg', '.jpg', '.gif', '.webp'],
  maxSize: 10 * 1024 * 1024, // 10MB
  targetFolder: 'photos',
  
  features: {
    preview: {
      enabled: true,
      maxPreviewSize: 5 * 1024 * 1024, // 5MB
      previewTypes: ['.png', '.jpeg', '.jpg', '.gif', '.webp'],
    } as PreviewConfig,
    folderSelector: false,
    aiAnalysis: false,
    multipleFiles: false,
    autoUpload: false,
  },
  
  appearance: {
    dropzoneClassName: 'border-green-500/50',
    buttonClassName: 'bg-green-600 hover:bg-green-700',
    showFileInfo: true,
  },
  
  ...overrides,
});

/**
 * 3. Upload Product Spec Widget Configuration
 * 用於產品規格文檔上傳
 */
export const UploadProductSpecConfig: CreateUploadConfigFunction = (overrides = {}) => ({
  ...DEFAULT_UPLOAD_CONFIG,
  id: 'upload-product-spec',
  title: 'Upload Product Spec',
  description: 'Upload product specification documents',
  icon: DocumentTextIcon,
  iconColor: 'from-purple-500 to-pink-500',
  
  fileTypes: ['.pdf', '.doc', '.docx'],
  maxSize: 10 * 1024 * 1024, // 10MB
  targetFolder: 'productSpec',
  
  features: {
    preview: false,
    folderSelector: false,
    aiAnalysis: false,
    multipleFiles: false,
    autoUpload: false,
  },
  
  appearance: {
    dropzoneClassName: 'border-purple-500/50',
    buttonClassName: 'bg-purple-600 hover:bg-purple-700',
    showFileInfo: true,
  },
  
  ...overrides,
});

/**
 * 4. Upload Orders Widget Configuration
 * 支援 AI 分析的訂單 PDF 上傳
 */
export const UploadOrdersConfig: CreateUploadConfigFunction = (overrides = {}) => ({
  ...DEFAULT_UPLOAD_CONFIG,
  id: 'upload-orders',
  title: 'Upload Orders',
  description: 'Upload order PDFs for AI analysis',
  icon: DocumentIcon,
  iconColor: 'from-orange-500 to-red-500',
  
  fileTypes: ['.pdf'],
  maxSize: 10 * 1024 * 1024, // 10MB
  
  features: {
    preview: false,
    folderSelector: false,
    aiAnalysis: {
      enabled: true,
      endpoint: '/api/analyze-order-pdf-new',
      showResultDialog: true,
      resultHandler: (result: any) => {
        // 自定義結果處理邏輯
        console.log('AI Analysis Result:', result);
      },
    } as AIAnalysisConfig,
    multipleFiles: false,
    autoUpload: true,
  },
  
  postProcess: 'analyzeOrderPDF',
  
  appearance: {
    dropzoneClassName: 'border-orange-500/50',
    buttonClassName: 'bg-orange-600 hover:bg-orange-700',
    showFileInfo: true,
  },
  
  events: {
    onUploadComplete: (result) => {
      console.log('Order uploaded:', result);
    },
  },
  
  ...overrides,
});

/**
 * 配置註冊表 - 映射 widget ID 到配置函數
 */
export const UPLOAD_WIDGET_CONFIGS = {
  UploadFilesWidget: UploadFilesConfig,
  UploadPhotoWidget: UploadPhotoConfig,
  UploadProductSpecWidget: UploadProductSpecConfig,
  UploadOrdersWidgetV2: UploadOrdersConfig,
} as const;

/**
 * 獲取 Upload Widget 配置
 */
export function getUploadWidgetConfig(
  widgetId: keyof typeof UPLOAD_WIDGET_CONFIGS,
  overrides?: Partial<UniversalUploadWidgetConfig>
): UniversalUploadWidgetConfig {
  const configFn = UPLOAD_WIDGET_CONFIGS[widgetId];
  if (!configFn) {
    throw new Error(`Unknown upload widget configuration: ${widgetId}`);
  }
  return configFn(overrides);
}

/**
 * 驗證配置完整性
 */
export function validateUploadConfig(config: UniversalUploadWidgetConfig): boolean {
  return !!(
    config.id &&
    config.title &&
    config.fileTypes?.length &&
    config.maxSize > 0
  );
}

/**
 * 獲取所有可用的 Upload Widget IDs
 */
export function getAvailableUploadWidgetIds(): string[] {
  return Object.keys(UPLOAD_WIDGET_CONFIGS);
}

/**
 * 創建默認配置的輔助函數
 */
export function createDefaultUploadConfig(
  baseConfig: Partial<UniversalUploadWidgetConfig>
): UniversalUploadWidgetConfig {
  return {
    ...DEFAULT_UPLOAD_CONFIG,
    id: 'default-upload',
    title: 'Upload File',
    fileTypes: ['.pdf', '.doc', '.docx'],
    maxSize: 10 * 1024 * 1024,
    ...baseConfig,
  } as UniversalUploadWidgetConfig;
}