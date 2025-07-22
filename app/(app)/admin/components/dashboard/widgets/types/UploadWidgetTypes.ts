/**
 * Strategy 1: Zod 驗證 + Strategy 2: DTO/自定義 interface - Upload Widget 類型定義
 * 為文件上傳相關組件提供類型安全
 */

import { z } from 'zod';

// 文件類型枚舉
export enum SupportedFileType {
  PDF = 'application/pdf',
  XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  XLS = 'application/vnd.ms-excel',
  CSV = 'text/csv',
  JPG = 'image/jpeg',
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  GIF = 'image/gif',
  WEBP = 'image/webp',
}

// 文件驗證 Schema
export const FileUploadSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  size: z
    .number()
    .min(1, 'File size must be greater than 0')
    .max(50 * 1024 * 1024, 'File size must be less than 50MB'),
  type: z.nativeEnum(SupportedFileType, {
    errorMap: () => ({ message: 'Unsupported file type' }),
  }),
  lastModified: z.number().optional(),
});

// 批量上傳文件 Schema
export const FileListSchema = z.array(FileUploadSchema).min(1, 'At least one file is required');

// 上傳配置 Schema
export const UploadConfigSchema = z.object({
  maxFiles: z.number().min(1).max(20).default(5),
  maxFileSize: z
    .number()
    .min(1024)
    .max(50 * 1024 * 1024)
    .default(10 * 1024 * 1024), // 10MB
  allowedTypes: z
    .array(z.nativeEnum(SupportedFileType))
    .default([SupportedFileType.PDF, SupportedFileType.XLSX, SupportedFileType.CSV]),
  uploadPath: z.string().min(1, 'Upload path is required'),
  autoUpload: z.boolean().default(false),
});

// 上傳進度類型
export interface UploadProgress {
  fileName: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  uploadedSize?: number;
  totalSize?: number;
}

// 上傳響應類型
export interface UploadResponse {
  success: boolean;
  fileName: string;
  filePath?: string;
  fileUrl?: string;
  message?: string;
  error?: string;
  metadata?: {
    originalName: string;
    size: number;
    type: string;
    uploadDate: string;
  };
}

// 批量上傳響應類型
export interface BatchUploadResponse {
  totalFiles: number;
  successCount: number;
  failureCount: number;
  results: UploadResponse[];
  summary: {
    totalSize: number;
    uploadDuration: number;
    errors: string[];
  };
}

// 文件預覽類型
export interface FilePreview {
  file: File;
  previewUrl?: string;
  isImage: boolean;
  metadata: {
    name: string;
    size: string;
    type: string;
    lastModified: string;
  };
}

// 上傳狀態類型
export interface UploadState {
  files: FilePreview[];
  uploads: UploadProgress[];
  isUploading: boolean;
  completed: boolean;
  error: string | null;
  config: z.infer<typeof UploadConfigSchema>;
}

// Event Handler 類型
export interface UploadEventHandlers {
  onFileSelect: (files: FileList) => void;
  onFileRemove: (index: number) => void;
  onUploadStart: () => void;
  onUploadProgress: (progress: UploadProgress) => void;
  onUploadComplete: (response: BatchUploadResponse) => void;
  onUploadError: (error: string) => void;
  onUploadCancel: () => void;
}

// 類型保護函數
export function isValidFile(file: unknown): file is File {
  return file instanceof File;
}

export function isValidFileList(files: unknown): files is FileList {
  return files instanceof FileList;
}

export function isImageFile(type: string): boolean {
  return [
    SupportedFileType.JPG,
    SupportedFileType.JPEG,
    SupportedFileType.PNG,
    SupportedFileType.GIF,
    SupportedFileType.WEBP,
  ].includes(type as SupportedFileType);
}

export function isSpreadsheetFile(type: string): boolean {
  return [SupportedFileType.XLSX, SupportedFileType.XLS, SupportedFileType.CSV].includes(
    type as SupportedFileType
  );
}

// 文件驗證工具
export class FileValidator {
  static validateFile(
    file: File,
    config: z.infer<typeof UploadConfigSchema>
  ): { valid: boolean; error?: string } {
    try {
      // 驗證文件基本信息
      FileUploadSchema.parse({
        name: file.name,
        size: file.size,
        type: file.type as SupportedFileType,
        lastModified: file.lastModified,
      });

      // 驗證文件大小
      if (file.size > config.maxFileSize) {
        return {
          valid: false,
          error: `File size exceeds maximum allowed size of ${(config.maxFileSize / (1024 * 1024)).toFixed(1)}MB`,
        };
      }

      // 驗證文件類型
      if (!config.allowedTypes.includes(file.type as SupportedFileType)) {
        return {
          valid: false,
          error: `File type ${file.type} is not allowed`,
        };
      }

      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          error: error.errors[0]?.message || 'File validation failed',
        };
      }
      return {
        valid: false,
        error: 'Unknown validation error',
      };
    }
  }

  static validateFileList(
    files: FileList,
    config: z.infer<typeof UploadConfigSchema>
  ): {
    valid: boolean;
    validFiles: File[];
    errors: string[];
  } {
    const validFiles: File[] = [];
    const errors: string[] = [];

    // 檢查文件數量
    if (files.length > config.maxFiles) {
      errors.push(`Too many files. Maximum allowed: ${config.maxFiles}`);
      return { valid: false, validFiles: [], errors };
    }

    // 驗證每個文件
    Array.from(files).forEach((file, index) => {
      const validation = this.validateFile(file, config);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`File ${index + 1} (${file.name}): ${validation.error}`);
      }
    });

    return {
      valid: errors.length === 0,
      validFiles,
      errors,
    };
  }
}

// 文件格式化工具
export class FileFormatter {
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static formatFileName(name: string, maxLength: number = 30): string {
    if (name.length <= maxLength) return name;
    const extension = name.split('.').pop() || '';
    const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 4);
    return `${truncatedName}...${extension}`;
  }

  static getFileIcon(type: string): string {
    if (isImageFile(type)) return '🖼️';
    if (isSpreadsheetFile(type)) return '📊';
    if (type === SupportedFileType.PDF) return '📄';
    return '📎';
  }
}

// 預設配置
export const DEFAULT_UPLOAD_CONFIG: z.infer<typeof UploadConfigSchema> = {
  maxFiles: 5,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [SupportedFileType.PDF, SupportedFileType.XLSX, SupportedFileType.CSV],
  uploadPath: '/uploads',
  autoUpload: false,
};

// 專門的圖片上傳配置
export const IMAGE_UPLOAD_CONFIG: z.infer<typeof UploadConfigSchema> = {
  maxFiles: 10,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: [
    SupportedFileType.JPG,
    SupportedFileType.JPEG,
    SupportedFileType.PNG,
    SupportedFileType.WEBP,
  ],
  uploadPath: '/uploads/images',
  autoUpload: false,
};

// 訂單文件上傳配置
export const ORDER_UPLOAD_CONFIG: z.infer<typeof UploadConfigSchema> = {
  maxFiles: 3,
  maxFileSize: 20 * 1024 * 1024, // 20MB
  allowedTypes: [SupportedFileType.PDF, SupportedFileType.XLSX],
  uploadPath: '/uploads/orders',
  autoUpload: true,
};
