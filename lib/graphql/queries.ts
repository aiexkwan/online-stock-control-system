/**
 * GraphQL Queries for NewPennine WMS
 * 根據 Supabase 數據庫結構定義查詢
 */

import { gql } from '../graphql-client';

// ============= Production Stats Queries =============

/**
 * 獲取生產統計數據
 * 用於 OutputStatsWidget
 */
export const GET_PRODUCTION_STATS = gql`
  query GetProductionStats($startDate: Datetime!, $endDate: Datetime!) {
    record_palletinfoCollection(
      filter: {
        plt_remark: { ilike: "%finished in production%" }
        generate_time: { gte: $startDate, lte: $endDate }
      }
    ) {
      edges {
        node {
          plt_num
          product_qty
          product_code
        }
      }
    }
  }
`;

/**
 * 獲取生產詳情（包含產品資料）
 * 用於 ProductionDetailsWidget
 */
export const GET_PRODUCTION_DETAILS = gql`
  query GetProductionDetails($startDate: Datetime!, $endDate: Datetime!, $productFilter: String) {
    record_palletinfoCollection(
      filter: {
        plt_remark: { ilike: "%finished in production%" }
        generate_time: { gte: $startDate, lte: $endDate }
      }
      orderBy: [{ generate_time: DescNullsLast }]
    ) {
      edges {
        node {
          plt_num
          product_code
          product_qty
          generate_time
          plt_remark
          data_code {
            description
            colour
            type
          }
        }
      }
    }
  }
`;

// ============= Inventory Queries =============

/**
 * 庫存搜尋查詢
 * 用於 InventorySearchWidget
 */
export const SEARCH_INVENTORY = gql`
  query SearchInventory($searchTerm: String!) {
    record_inventoryCollection(
      filter: {
        or: [
          { product_code: { ilike: $searchTerm } }
          { plt_num: { ilike: $searchTerm } }
        ]
      }
    ) {
      edges {
        node {
          uuid
          product_code
          plt_num
          injection
          pipeline
          prebook
          await
          fold
          bulk
          backcarpark
          damage
          latest_update
          data_code {
            description
            colour
            standard_qty
          }
        }
      }
    }
  }
`;

/**
 * 獲取庫存統計
 * 用於庫存總覽
 */
export const GET_STOCK_SUMMARY = gql`
  query GetStockSummary {
    stock_levelCollection(
      filter: { stock_level: { gt: 0 } }
      orderBy: [{ stock_level: DescNullsLast }]
    ) {
      edges {
        node {
          stock
          description
          stock_level
          update_time
        }
      }
    }
  }
`;

// ============= Staff Workload Queries =============

/**
 * 獲取員工工作量
 * 用於 StaffWorkloadWidget
 */
export const GET_STAFF_WORKLOAD = gql`
  query GetStaffWorkload($date: Datetime!) {
    work_levelCollection(
      filter: { 
        latest_update: { gte: $date }
      }
    ) {
      edges {
        node {
          id
          qc
          move
          grn
          latest_update
          data_id {
            name
            email
          }
        }
      }
    }
  }
`;

// ============= ACO Orders Queries =============

/**
 * 獲取 ACO 訂單狀態
 * 用於 ACO 訂單追蹤
 */
export const GET_ACO_ORDERS = gql`
  query GetACOOrders {
    record_acoCollection(
      orderBy: [{ latest_update: DescNullsLast }]
    ) {
      edges {
        node {
          uuid
          order_ref
          latest_update
        }
      }
    }
  }
`;

// ============= GRN (Goods Receipt Note) Queries =============

/**
 * 獲取 GRN 統計
 * 用於收貨統計
 */
export const GET_GRN_STATS = gql`
  query GetGRNStats($startDate: Datetime!, $endDate: Datetime!) {
    grn_levelCollection(
      filter: {
        latest_update: { gte: $startDate, lte: $endDate }
      }
      orderBy: [{ grn_ref: DescNullsLast }]
    ) {
      edges {
        node {
          grn_ref
          total_gross
          total_net
          total_unit
          latest_update
        }
      }
    }
  }
`;

// ============= Document Upload Queries =============

/**
 * 獲取文件上傳記錄
 * 用於 Upload 頁面的各種 widgets
 */
export const GET_UPLOAD_HISTORY = gql`
  query GetUploadHistory($docType: String!, $limit: Int = 15) {
    doc_uploadCollection(
      filter: {
        doc_type: { eq: $docType }
      }
      orderBy: [{ created_at: DescNullsLast }]
      first: $limit
    ) {
      edges {
        node {
          uuid
          doc_name
          doc_type
          created_at
          upload_by
          file_size
        }
      }
    }
  }
`;

/**
 * 獲取訂單文件列表
 * 用於 OrdersListWidget GraphQL 版本
 */
export const GET_ORDER_UPLOADS = gql`
  query GetOrderUploads($offset: Int = 0, $limit: Int = 15) {
    doc_uploadCollection(
      filter: {
        doc_type: { eq: "order" }
      }
      orderBy: [{ created_at: DescNullsLast }]
      offset: $offset
      first: $limit
    ) {
      edges {
        node {
          uuid
          doc_name
          upload_by
          created_at
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

/**
 * 獲取其他文件列表
 * 用於 OtherFilesListWidget GraphQL 版本
 */
export const GET_OTHER_UPLOADS = gql`
  query GetOtherUploads($offset: Int = 0, $limit: Int = 15) {
    doc_uploadCollection(
      filter: {
        doc_type: { neq: "order" }
      }
      orderBy: [{ created_at: DescNullsLast }]
      offset: $offset
      first: $limit
    ) {
      edges {
        node {
          uuid
          doc_name
          upload_by
          created_at
          doc_type
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

/**
 * 批量獲取用戶資料
 * 用於文件上傳 widgets 的用戶名稱查詢
 */
export const GET_USERS_BY_IDS = gql`
  query GetUsersByIds($userIds: [Int!]!) {
    data_idCollection(
      filter: {
        id: { in: $userIds }
      }
    ) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

// ============= Real-time Subscriptions =============

/**
 * 訂閱生產更新
 * 用於實時監控生產狀態
 */
export const PRODUCTION_UPDATES_SUBSCRIPTION = gql`
  subscription ProductionUpdates($todayStart: Datetime!) {
    record_palletinfoCollection(
      filter: { 
        plt_remark: { ilike: "%finished in production%" }
        generate_time: { gte: $todayStart }
      }
    ) {
      edges {
        node {
          plt_num
          product_code
          product_qty
          generate_time
        }
      }
    }
  }
`;

/**
 * 訂閱庫存變化
 * 用於實時監控庫存移動
 */
export const INVENTORY_UPDATES_SUBSCRIPTION = gql`
  subscription InventoryUpdates {
    record_transferCollection(
      filter: {
        tran_date: { gte: "TODAY" }
      }
      orderBy: [{ tran_date: DescNullsLast }]
    ) {
      edges {
        node {
          uuid
          tran_date
          f_loc
          t_loc
          plt_num
          operator_id
          data_id {
            name
          }
        }
      }
    }
  }
`;