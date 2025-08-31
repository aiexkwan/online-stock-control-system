/**
 * Export All Data Configuration
 *
 * @fileoverview 導出全部數據的報表配置，支援多表導出功能
 * @author System Generated
 * @since 2025-08-30
 */

import { ReportConfig } from '../core/ReportConfig';

/**
 * 全數據導出報表配置
 *
 * 企業級配置物件，提供完整的數據導出功能：
 * - 支援多表選擇性導出
 * - 靈活的日期範圍篩選
 * - Excel 格式輸出
 * - 動態欄位配置
 *
 * @readonly 確保配置不可變性
 */
export const exportAllDataReportConfig: ReportConfig = {
  /** @readonly 報表唯一標識符 */
  id: 'export-all-data',
  /** @readonly 報表顯示名稱 */
  _name: 'Export All Data',
  /** @readonly 報表功能描述 */
  description: 'Export selected tables',
  /** @readonly 報表分類 */
  category: 'operational',
  /** @readonly 支援的輸出格式 */
  formats: ['excel'], // Using excel to represent CSV export
  /** @readonly 預設輸出格式 */
  defaultFormat: 'excel',
  /** @readonly 報表區段配置 */
  sections: [
    {
      /** @readonly 區段唯一標識符 */
      id: 'all-data',
      /** @readonly 區段標題 */
      title: 'Database Export',
      /** @readonly 區段類型 */
      type: 'table',
      /** @readonly 數據源標識 */
      dataSource: 'all-data',
      /** @readonly 區段配置 - 修正屬性名稱 */
      config: {
        /** @readonly 動態欄位配置，基於選定的表格 */
        columns: [], // Dynamic based on selected tables
      },
    },
  ],
  /** @readonly 篩選器配置陣列 */
  filters: [
    {
      /** @readonly 篩選器標識符 */
      id: 'selectedTables',
      /** @readonly 篩選器標籤 */
      label: 'Tables to Export',
      /** @readonly 篩選器類型 */
      type: 'multiSelect',
      /** @readonly 是否必填 */
      required: true,
      /** @readonly 可選項目列表 */
      options: [
        { value: 'record_palletinfo', label: 'Pallet Information' },
        { value: 'data_code', label: 'Code List' },
        { value: 'report_void', label: 'Voided Inventory' },
        { value: 'record_history', label: 'Operation History' },
        { value: 'record_inventory', label: 'Full Inventory' },
      ],
    },
    {
      /** @readonly 開始日期篩選器標識符 */
      id: 'startDate',
      /** @readonly 開始日期篩選器標籤 */
      label: 'Start Date',
      /** @readonly 篩選器類型 */
      type: 'date',
      /** @readonly 是否必填 - 僅特定表格需要 */
      required: false, // Only required for certain tables
    },
    {
      /** @readonly 結束日期篩選器標識符 */
      id: 'endDate',
      /** @readonly 結束日期篩選器標籤 */
      label: 'End Date',
      /** @readonly 篩選器類型 */
      type: 'date',
      /** @readonly 是否必填 - 僅特定表格需要 */
      required: false, // Only required for certain tables
    },
  ],
} as const;
