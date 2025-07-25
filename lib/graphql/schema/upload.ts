/**
 * Upload GraphQL Schema
 * 統一上傳功能的 GraphQL 定義
 * 整合 4 個上傳 widgets：UploadFiles, UploadOrders, UploadPhoto, UploadProductSpec
 */

export const uploadSchema = `
# Upload-related scalars
scalar Upload
scalar File

# 文件上傳類型枚舉
enum UploadType {
  GENERAL_FILES     # UploadFilesWidget - 通用文件上傳
  ORDER_PDF         # UploadOrdersWidget - 訂單PDF分析
  PHOTOS           # UploadPhotoWidget - 圖片上傳
  PRODUCT_SPEC     # UploadProductSpecWidget - 產品規格文檔
}

# 文件夾類型
enum UploadFolder {
  STOCK_PIC        # 庫存圖片 (PNG, JPEG, JPG)
  PRODUCT_SPEC     # 產品規格 (PDF, DOC, DOCX)
  PHOTOS          # 照片 (PNG, JPEG, JPG, GIF, WEBP)
  ORDER_PDFS      # 訂單PDF
}

# 支援的文件格式
enum SupportedFileType {
  PNG
  JPEG
  JPG
  GIF
  WEBP
  PDF
  DOC
  DOCX
}

# 上傳狀態
enum UploadStatus {
  PENDING         # 等待中
  UPLOADING       # 上傳中
  ANALYZING       # AI分析中 (僅訂單PDF)
  COMPLETED       # 完成
  ERROR           # 錯誤
  CANCELLED       # 已取消
}

# 文件信息類型
type FileInfo {
  id: ID!
  originalName: String!
  fileName: String!
  mimeType: String!
  size: Int!
  extension: String!
  folder: UploadFolder!
  uploadedAt: DateTime!
  uploadedBy: String!
  checksum: String
  url: String
  thumbnailUrl: String  # 圖片縮略圖
}

# 上傳進度類型
type UploadProgress {
  id: ID!
  fileName: String!
  progress: Float!      # 0-100
  status: UploadStatus!
  error: String
  estimatedTimeRemaining: Int  # 秒
  bytesUploaded: Int
  totalBytes: Int
  uploadSpeed: Float    # bytes/second
}

# AI 分析結果（訂單PDF專用）
type OrderAnalysisResult {
  success: Boolean!
  recordCount: Int!
  processingTime: Int!  # milliseconds
  extractedData: [OrderData!]
  confidence: Float     # 0-1
  warnings: [String!]
  errors: [String!]
  metadata: JSON
}

type OrderData {
  orderNumber: String!
  customerName: String
  orderDate: DateTime
  items: [OrderItem!]
  totalAmount: Float
  currency: String
  confidence: Float
}

type OrderItem {
  productCode: String
  description: String
  quantity: Int
  unitPrice: Float
  totalPrice: Float
}

# 批量上傳結果
type BatchUploadResult {
  totalFiles: Int!
  successful: Int!
  failed: Int!
  uploadIds: [ID!]!
  results: [SingleUploadResult!]!
  analysisResults: [OrderAnalysisResult!]  # 僅當包含訂單PDF時
}

type SingleUploadResult {
  id: ID!
  fileName: String!
  success: Boolean!
  fileInfo: FileInfo
  error: String
  analysisResult: OrderAnalysisResult  # 僅訂單PDF
}

# 上傳配置
type UploadConfig {
  uploadType: UploadType!
  allowedTypes: [SupportedFileType!]!
  maxFileSize: Int!     # bytes
  maxFiles: Int
  folder: UploadFolder!
  requiresAnalysis: Boolean!  # 是否需要AI分析
  allowMultiple: Boolean!
  supportsDragDrop: Boolean!
  supportsPreview: Boolean!   # 圖片預覽
}

# UploadCard 數據類型
type UploadCardData implements WidgetData {
  uploadType: UploadType!
  config: UploadConfig!
  recentUploads: [FileInfo!]!
  activeUploads: [UploadProgress!]!
  statistics: UploadStatistics!
  lastUpdated: DateTime!
  refreshInterval: Int
  dataSource: String!
}

type UploadStatistics {
  totalUploads: Int!
  totalSize: Int!       # bytes
  successRate: Float!   # 0-1
  averageUploadTime: Float!  # seconds
  todayUploads: Int!
  recentErrors: [String!]!
  popularFileTypes: [FileTypeStats!]!
}

type FileTypeStats {
  type: SupportedFileType!
  count: Int!
  totalSize: Int!
}

# 輸入類型

# 單文件上傳輸入
input SingleFileUploadInput {
  file: Upload!
  uploadType: UploadType!
  folder: UploadFolder
  fileName: String        # 自定義文件名
  metadata: JSON         # 額外元數據
  requiresAnalysis: Boolean  # 是否需要AI分析
  userId: String
}

# 批量上傳輸入
input BatchUploadInput {
  files: [Upload!]!
  uploadType: UploadType!
  folder: UploadFolder
  metadata: JSON
  requiresAnalysis: Boolean
  userId: String
}

# UploadCard 查詢輸入
input UploadCardInput {
  uploadType: UploadType!
  folder: UploadFolder
  dateRange: DateRangeInput
  includeStatistics: Boolean = true
  includeRecentUploads: Boolean = true
  includeActiveUploads: Boolean = true
  recentLimit: Int = 10
}

# 文件搜索輸入
input FileSearchInput {
  folder: UploadFolder
  fileTypes: [SupportedFileType!]
  dateRange: DateRangeInput
  searchTerm: String
  uploadedBy: String
  pagination: PaginationInput
  sorting: SortInput
}

# 文件搜索結果
type FileSearchResult {
  files: [FileInfo!]!
  totalCount: Int!
  pageInfo: PageInfo!
}

# 擴展 Query 類型
extend type Query {
  # UploadCard 數據查詢
  uploadCardData(input: UploadCardInput!): UploadCardData!
  
  # 獲取上傳配置
  uploadConfig(uploadType: UploadType!): UploadConfig!
  
  # 搜索文件
  searchFiles(input: FileSearchInput!): FileSearchResult!
  
  # 獲取上傳進度
  uploadProgress(uploadIds: [ID!]!): [UploadProgress!]!
  
  # 獲取文件詳情
  fileInfo(id: ID!): FileInfo
  
  # 獲取訂單分析結果
  orderAnalysisResult(uploadId: ID!): OrderAnalysisResult
}

# 擴展 Mutation 類型
extend type Mutation {
  # 單文件上傳
  uploadSingleFile(input: SingleFileUploadInput!): SingleUploadResult!
  
  # 批量文件上傳
  uploadBatchFiles(input: BatchUploadInput!): BatchUploadResult!
  
  # 取消上傳
  cancelUpload(uploadId: ID!): Boolean!
  
  # 重新上傳失敗的文件
  retryUpload(uploadId: ID!): SingleUploadResult!
  
  # 刪除文件
  deleteFile(fileId: ID!): Boolean!
  
  # 批量刪除文件
  deleteFiles(fileIds: [ID!]!): BatchResult!
  
  # 重新分析訂單PDF
  reanalyzeOrderPDF(fileId: ID!): OrderAnalysisResult!
  
  # 更新文件元數據
  updateFileMetadata(fileId: ID!, metadata: JSON!): FileInfo!
}

# 擴展 Subscription 類型
extend type Subscription {
  # 上傳進度訂閱
  uploadProgressUpdated(uploadIds: [ID!]!): UploadProgress!
  
  # 新文件上傳完成
  fileUploaded(folder: UploadFolder): FileInfo!
  
  # 分析結果更新
  analysisCompleted(uploadId: ID!): OrderAnalysisResult!
  
  # 上傳錯誤
  uploadError(uploadId: ID!): String!
}

# 錯誤類型
type UploadError {
  code: UploadErrorCode!
  message: String!
  fileName: String
  details: JSON
}

enum UploadErrorCode {
  FILE_TOO_LARGE
  INVALID_FILE_TYPE
  UPLOAD_FAILED
  ANALYSIS_FAILED
  STORAGE_ERROR
  PERMISSION_DENIED
  QUOTA_EXCEEDED
  NETWORK_ERROR
  VIRUS_DETECTED
  DUPLICATE_FILE
}
`;

export default uploadSchema;
