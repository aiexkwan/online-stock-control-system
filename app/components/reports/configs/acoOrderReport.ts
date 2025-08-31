/**
 * ACO Order Report Configuration
 *
 * @description 提供 ACO 訂單報表的配置，包括數據來源、過濾器和輸出格式設定
 * @category operational
 * @since 1.0.0
 */

import { ReportConfig } from '../core/ReportConfig';

/**
 * ACO 訂單報表配置對象
 *
 * @readonly 確保配置的不可變性
 */
export const acoOrderReportConfig: ReportConfig = {
  /** @readonly 報表唯一識別碼 */
  id: 'aco-order-report',

  /** @readonly 報表顯示名稱 */
  _name: 'ACO Order Report',

  /** @readonly 報表描述 */
  description: 'Export ACO order reports',

  /** @readonly 報表分類 */
  category: 'operational',

  /** @readonly 支援的輸出格式 */
  formats: ['excel'],

  /** @readonly 預設輸出格式 */
  defaultFormat: 'excel',

  /** @readonly 報表區段配置 */
  sections: [
    {
      /** @readonly 區段識別碼 */
      id: 'aco-data',

      /** @readonly 區段標題 */
      title: 'ACO Order Data',

      /** @readonly 區段類型 */
      type: 'table',

      /** @readonly 數據來源識別碼 */
      dataSource: 'aco-order-data',

      /** @readonly 區段特定配置 */
      config: {
        /** @readonly 表格列配置 */
        columns: [
          { id: 'product_code', label: 'Product Code', type: 'text' },
          { id: 'pallet_number', label: 'Pallet Number', type: 'text' },
          { id: 'qty', label: 'Quantity', type: 'number' },
          { id: 'qc_date', label: 'QC Date', type: 'date' },
          { id: 'required_qty', label: 'Required Qty', type: 'number' },
          { id: 'aco_order', label: 'ACO Order', type: 'text' },
        ],
      },
    },
  ],

  /** @readonly 過濾器配置 */
  filters: [
    {
      /** @readonly 過濾器識別碼 */
      id: 'acoOrder',

      /** @readonly 過濾器標籤 */
      label: 'ACO Order',

      /** @readonly 過濾器類型 */
      type: 'select',

      /** @readonly 是否為必填欄位 */
      required: true,

      /** @readonly 動態數據來源配置 */
      dataSource: {
        /** @readonly 數據來源類型 */
        type: 'rpc',

        /** @readonly RPC 函數名稱 */
        _name: 'getUniqueAcoOrderRefs',
      },
    },
  ],
};
