/**
 * 數據映射器索引文件
 * 統一導出所有數據映射相關的功能
 *
 * @author AI Assistant
 * @version 1.0.0
 */

// PDF 數據映射器
export {
  // 核心映射函數
  prepareQcLabelData,
  prepareGrnLabelData,

  // 數據驗證函數
  validateQcLabelInput,
  validateGrnLabelInput,

  // 類型定義
  type QcLabelInputData,
  type GrnLabelInputData,
  type UnifiedPdfData,

  // 向後兼容性別名
  type QcInputData,
  type GrnInputData,
} from './pdf-data-mappers';
