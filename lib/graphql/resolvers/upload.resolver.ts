/**
 * Upload GraphQL Resolver
 * 統一上傳功能的 GraphQL 解析器
 * 整合 4 個上傳 widgets 的功能
 */

import { 
  UploadType, 
  UploadFolder, 
  SupportedFileType, 
  UploadStatus,
  UploadCardInput,
  SingleFileUploadInput,
  BatchUploadInput,
  FileSearchInput,
  UploadCardData,
  UploadConfig,
  FileInfo,
  UploadProgress,
  SingleUploadResult,
  BatchUploadResult,
  OrderAnalysisResult,
  FileSearchResult,
  UploadStatistics,
  FileTypeStats
} from '@/types/generated/graphql';
import { GraphQLContext } from '@/lib/types/graphql-resolver.types';
import { UploadedFileRow, UploadStatisticsRow, AnalyzeOrderPDFResult } from '@/lib/types/upload-resolver.types';
import { createClient } from '@/app/utils/supabase/server';
import { uploadFile } from '@/app/actions/fileActions';
import { analyzeOrderPDF } from '@/app/actions/orderUploadActions';

// 文件類型配置映射
const UPLOAD_CONFIGS: Record<UploadType, UploadConfig> = {
  [UploadType.GeneralFiles]: {
    uploadType: UploadType.GeneralFiles,
    allowedTypes: [SupportedFileType.Png, SupportedFileType.Jpeg, SupportedFileType.Jpg, SupportedFileType.Pdf, SupportedFileType.Doc, SupportedFileType.Docx],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
    folder: UploadFolder.StockPic, // 可動態切換
    requiresAnalysis: false,
    allowMultiple: true,
    supportsDragDrop: true,
    supportsPreview: false,
  },
  [UploadType.OrderPdf]: {
    uploadType: UploadType.OrderPdf,
    allowedTypes: [SupportedFileType.Pdf],
    maxFileSize: 10 * 1024 * 1024,
    maxFiles: 1,
    folder: UploadFolder.OrderPdfs,
    requiresAnalysis: true,
    allowMultiple: false,
    supportsDragDrop: true,
    supportsPreview: false,
  },
  [UploadType.Photos]: {
    uploadType: UploadType.Photos,
    allowedTypes: [SupportedFileType.Png, SupportedFileType.Jpeg, SupportedFileType.Jpg, SupportedFileType.Gif, SupportedFileType.Webp],
    maxFileSize: 10 * 1024 * 1024,
    maxFiles: 20,
    folder: UploadFolder.Photos,
    requiresAnalysis: false,
    allowMultiple: true,
    supportsDragDrop: true,
    supportsPreview: true,
  },
  [UploadType.ProductSpec]: {
    uploadType: UploadType.ProductSpec,
    allowedTypes: [SupportedFileType.Pdf, SupportedFileType.Doc, SupportedFileType.Docx],
    maxFileSize: 10 * 1024 * 1024,
    maxFiles: 5,
    folder: UploadFolder.ProductSpec,
    requiresAnalysis: false,
    allowMultiple: true,
    supportsDragDrop: true,
    supportsPreview: false,
  },
};

// 內存中的上傳進度追蹤
const activeUploads = new Map<string, UploadProgress>();

export const uploadResolvers = {
  Query: {
    // 獲取 UploadCard 數據
    uploadCardData: async (
      _: unknown, 
      { input }: { input: UploadCardInput }, 
      context: GraphQLContext
    ): Promise<UploadCardData> => {
      const supabase = await createClient();
      const startTime = performance.now();

      try {
        const config = UPLOAD_CONFIGS[input.uploadType];
        
        // 獲取最近上傳的文件
        let recentUploads: FileInfo[] = [];
        if (input.includeRecentUploads) {
          const { data: files } = await supabase
            .from('uploaded_files')
            .select('*')
            .eq('folder', config.folder)
            .order('uploaded_at', { ascending: false })
            .limit(input.recentLimit || 10);

          recentUploads = files?.map((file: UploadedFileRow) => ({
            id: file.id,
            originalName: file.original_name,
            fileName: file.file_name,
            mimeType: file.mime_type,
            size: file.size,
            extension: file.extension,
            folder: file.folder as UploadFolder,
            uploadedAt: file.uploaded_at,
            uploadedBy: file.uploaded_by,
            checksum: file.checksum,
            url: file.url,
            thumbnailUrl: file.thumbnail_url,
          })) || [];
        }

        // 獲取活躍上傳
        const activeUploadsList = input.includeActiveUploads 
          ? Array.from(activeUploads.values()).filter(upload => 
              upload.status === UploadStatus.Uploading || 
              upload.status === UploadStatus.Analyzing
            )
          : [];

        // 計算統計數據
        let statistics: UploadStatistics = {
          totalUploads: 0,
          totalSize: 0,
          successRate: 1.0,
          averageUploadTime: 0,
          averageProcessingTime: 0,
          todayUploads: 0,
          failureRate: 0,
          recentErrors: [],
          popularFileTypes: [],
          errorReasons: [],
          uploadTrends: [],
          dataSource: `upload_${input.uploadType}`,
          lastUpdated: new Date().toISOString(),
        };

        if (input.includeStatistics) {
          const { data: stats } = await supabase.rpc('get_upload_statistics', {
            folder_filter: config.folder,
          });

          if (stats) {
            statistics = {
              totalUploads: stats.total_uploads || 0,
              totalSize: stats.total_size || 0,
              successRate: stats.success_rate || 1.0,
              averageUploadTime: stats.average_upload_time || 0,
              averageProcessingTime: stats.average_processing_time || 0,
              todayUploads: stats.today_uploads || 0,
              failureRate: stats.failure_rate || 0,
              recentErrors: stats.recent_errors || [],
              popularFileTypes: stats.popular_file_types?.map((type: FileTypeStatRow) => ({
                type: type.extension as SupportedFileType,
                count: type.count,
                totalSize: type.total_size,
              })) || [],
              errorReasons: stats.error_reasons || [],
              uploadTrends: stats.upload_trends || [],
              dataSource: `upload_${input.uploadType}`,
              lastUpdated: new Date().toISOString(),
            };
          }
        }

        return {
          uploadType: input.uploadType,
          config,
          recentUploads,
          activeUploads: activeUploadsList,
          statistics,
          lastUpdated: new Date().toISOString(),
          refreshInterval: 30,
          dataSource: `upload_${input.uploadType.toLowerCase()}`,
        };

      } catch (error) {
        console.error('[UploadResolver] uploadCardData error:', error);
        throw new Error(`Failed to fetch upload data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    // 獲取上傳配置
    uploadConfig: async (
      _: unknown, 
      { uploadType }: { uploadType: UploadType }
    ): Promise<UploadConfig> => {
      return UPLOAD_CONFIGS[uploadType];
    },

    // 搜索文件
    searchFiles: async (
      _: unknown,
      { input }: { input: FileSearchInput },
      context: GraphQLContext
    ): Promise<FileSearchResult> => {
      const supabase = await createClient();
      
      try {
        let query = supabase
          .from('uploaded_files')
          .select('*', { count: 'exact' });

        // 應用篩選條件
        if (input.folder) {
          query = query.eq('folder', input.folder);
        }

        if (input.fileTypes && input.fileTypes.length > 0) {
          query = query.in('extension', input.fileTypes);
        }

        if (input.uploadedBy) {
          query = query.eq('uploaded_by', input.uploadedBy);
        }

        if (input.searchTerm) {
          query = query.or(`original_name.ilike.%${input.searchTerm}%,file_name.ilike.%${input.searchTerm}%`);
        }

        if (input.dateRange) {
          query = query
            .gte('uploaded_at', input.dateRange.start)
            .lte('uploaded_at', input.dateRange.end);
        }

        // 分頁和排序
        const page = input.pagination?.page || 1;
        const limit = input.pagination?.limit || 20;
        const offset = (page - 1) * limit;

        query = query.range(offset, offset + limit - 1);

        if (input.sorting?.field) {
          const direction = input.sorting.direction === 'ASC' ? { ascending: true } : { ascending: false };
          query = query.order(input.sorting.field, direction);
        } else {
          query = query.order('uploaded_at', { ascending: false });
        }

        const { data: files, count } = await query;

        const fileInfos: FileInfo[] = files?.map(file => ({
          id: file.id,
          originalName: file.original_name,
          fileName: file.file_name,
          mimeType: file.mime_type,
          size: file.size,
          extension: file.extension,
          folder: file.folder as UploadFolder,
          uploadedAt: file.uploaded_at,
          uploadedBy: file.uploaded_by,
          checksum: file.checksum,
          url: file.url,
          thumbnailUrl: file.thumbnail_url,
        })) || [];

        return {
          files: fileInfos,
          totalCount: count || 0,
          pageInfo: {
            hasNextPage: (count || 0) > offset + limit,
            hasPreviousPage: page > 1,
            totalCount: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
            currentPage: page,
          },
        };

      } catch (error) {
        console.error('[UploadResolver] searchFiles error:', error);
        throw new Error(`Failed to search files: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    // 獲取上傳進度
    uploadProgress: async (
      _: unknown,
      { uploadIds }: { uploadIds: string[] }
    ): Promise<UploadProgress[]> => {
      return uploadIds.map(id => activeUploads.get(id)).filter(Boolean) as UploadProgress[];
    },

    // 獲取文件詳情
    fileInfo: async (
      _: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ): Promise<FileInfo | null> => {
      const supabase = await createClient();

      try {
        const { data: file } = await supabase
          .from('uploaded_files')
          .select('*')
          .eq('id', id)
          .single();

        if (!file) return null;

        return {
          id: file.id,
          originalName: file.original_name,
          fileName: file.file_name,
          mimeType: file.mime_type,
          size: file.size,
          extension: file.extension,
          folder: file.folder as UploadFolder,
          uploadedAt: file.uploaded_at,
          uploadedBy: file.uploaded_by,
          checksum: file.checksum,
          url: file.url,
          thumbnailUrl: file.thumbnail_url,
        };

      } catch (error) {
        console.error('[UploadResolver] fileInfo error:', error);
        return null;
      }
    },
  },

  Mutation: {
    // 單文件上傳
    uploadSingleFile: async (
      _: unknown,
      { input }: { input: SingleFileUploadInput },
      context: GraphQLContext
    ): Promise<SingleUploadResult> => {
      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        // 創建上傳進度記錄
        const progress: UploadProgress = {
          id: uploadId,
          fileName: input.file.name || 'unknown',
          progress: 0,
          status: UploadStatus.Uploading,
          estimatedTimeRemaining: 0,
          bytesUploaded: 0,
          totalBytes: input.file.size || 0,
          uploadSpeed: 0,
        };
        
        activeUploads.set(uploadId, progress);

        // 模擬上傳進度更新
        const updateProgress = (newProgress: number, status?: UploadStatus) => {
          const current = activeUploads.get(uploadId);
          if (current) {
            activeUploads.set(uploadId, {
              ...current,
              progress: newProgress,
              status: status || current.status,
              bytesUploaded: Math.floor((newProgress / 100) * (current.totalBytes || 0)),
            });
          }
        };

        updateProgress(20);

        // 使用現有的 Server Action 上傳文件
        const formData = new FormData();
        formData.append('file', input.file);
        formData.append('folder', input.folder || UPLOAD_CONFIGS[input.uploadType].folder);
        formData.append('fileName', input.fileName || input.file.name);

        updateProgress(40);
        const uploadResult = await uploadFile(formData);
        updateProgress(70);

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Upload failed');
        }

        // 如果需要 AI 分析（訂單 PDF）
        let analysisResult: OrderAnalysisResult | undefined;
        if (input.requiresAnalysis && input.uploadType === UploadType.OrderPdf) {
          updateProgress(80, UploadStatus.Analyzing);
          
          const arrayBuffer = await input.file.arrayBuffer();
          const analysis = await analyzeOrderPDF(
            {
              buffer: arrayBuffer,
              name: input.file.name,
            },
            input.userId || '',
            true
          );

          if (analysis.success) {
            analysisResult = {
              success: true,
              recordCount: analysis.recordCount || 0,
              processingTime: 0, // TODO: 實際時間
              extractedData: analysis.extractedData?.map((order: any) => ({
                orderNumber: order?.orderNumber || '',
                customerName: order?.customerName || undefined,
                orderDate: order?.orderDate || undefined,
                items: order.items || [],
                totalAmount: order.totalAmount || undefined,
                currency: order.currency || undefined,
                confidence: Number(order.confidence) || 0,
              })) || [],
              confidence: 0.9,
              warnings: [],
              errors: [],
              metadata: JSON.stringify(analysis) || undefined,
            };
          }
        }

        updateProgress(100, UploadStatus.Completed);

        // 創建文件信息對象
        const fileInfo: FileInfo = {
          id: uploadResult.data?.id || uploadId,
          originalName: input.file.name,
          fileName: input.fileName || input.file.name,
          mimeType: input.file.type,
          size: input.file.size,
          extension: '.' + input.file.name.split('.').pop()?.toLowerCase(),
          folder: input.folder || UPLOAD_CONFIGS[input.uploadType].folder,
          uploadedAt: new Date().toISOString(),
          uploadedBy: input.userId || 'anonymous',
          checksum: uploadResult.data?.path || undefined,
          url: uploadResult.data?.url || undefined,
          thumbnailUrl: uploadResult.data?.url || undefined,
        };

        // 移除進度記錄
        setTimeout(() => activeUploads.delete(uploadId), 5000);

        return {
          id: uploadId,
          fileName: input.file.name,
          success: true,
          fileInfo,
          analysisResult,
        };

      } catch (error) {
        const current = activeUploads.get(uploadId);
        if (current) {
          activeUploads.set(uploadId, {
            ...current,
            status: UploadStatus.Error,
            error: error instanceof Error ? error.message : 'Upload failed',
          });
        }

        return {
          id: uploadId,
          fileName: input.file.name,
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed',
        };
      }
    },

    // 批量文件上傳
    uploadBatchFiles: async (
      _: unknown,
      { input }: { input: BatchUploadInput },
      context: GraphQLContext
    ): Promise<BatchUploadResult> => {
      const results: SingleUploadResult[] = [];
      const uploadIds: string[] = [];

      for (const file of input.files) {
        const singleInput: SingleFileUploadInput = {
          file,
          uploadType: input.uploadType,
          folder: input.folder,
          metadata: input.metadata,
          requiresAnalysis: input.requiresAnalysis,
          userId: input.userId,
        };

        const result = await uploadResolvers.Mutation.uploadSingleFile(
          _,
          { input: singleInput },
          context
        );

        results.push(result);
        uploadIds.push(result.id);
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      const analysisResults = results
        .filter(r => r.analysisResult)
        .map(r => r.analysisResult!) as OrderAnalysisResult[];

      return {
        totalFiles: input.files.length,
        successful,
        failed,
        uploadIds,
        results,
        analysisResults,
      };
    },

    // 取消上傳
    cancelUpload: async (
      _: unknown,
      { uploadId }: { uploadId: string }
    ): Promise<boolean> => {
      const upload = activeUploads.get(uploadId);
      if (upload) {
        activeUploads.set(uploadId, {
          ...upload,
          status: UploadStatus.Cancelled,
        });
        setTimeout(() => activeUploads.delete(uploadId), 2000);
        return true;
      }
      return false;
    },

    // 刪除文件
    deleteFile: async (
      _: unknown,
      { fileId }: { fileId: string },
      context: GraphQLContext
    ): Promise<boolean> => {
      const supabase = await createClient();

      try {
        const { error } = await supabase
          .from('uploaded_files')
          .delete()
          .eq('id', fileId);

        return !error;

      } catch (error) {
        console.error('[UploadResolver] deleteFile error:', error);
        return false;
      }
    },
  },

  // 訂閱功能（可選實現）
  Subscription: {
    uploadProgressUpdated: {
      // 實現上傳進度的實時更新
      subscribe: () => {
        // TODO: 實現 WebSocket 或 Server-Sent Events
      },
    },
  },
};

export default uploadResolvers;