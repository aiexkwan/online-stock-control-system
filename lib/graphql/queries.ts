/**
 * GraphQL Queries for NewPennine WMS
 * 根據 Supabase 數據庫結構定義查詢
 */

import { gql } from '../graphql-client-stable';

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

// ============= Warehouse Dashboard Queries =============

/**
 * 獲取 Await Location 總數量
 * @deprecated 使用 RPC function get_current_await_pallet_count 代替
 * 用於 Warehouse Dashboard - Await Location Qty Widget
 */
// export const GET_AWAIT_LOCATION_QTY = gql`
//   query GetAwaitLocationQty {
//     aggregatedAwaitQty: record_inventoryCollection {
//       aggregate {
//         sum {
//           await
//         }
//       }
//     }
//   }
// `;

/**
 * 獲取轉移記錄統計
 * @deprecated GraphQL 不支援 aggregate，改用 edges + totalCount
 * 用於 Warehouse Dashboard - Transfer Stats Widget
 */
export const GET_TRANSFER_STATS = gql`
  query GetTransferStats($startDate: Datetime!, $endDate: Datetime!) {
    record_transferCollection(
      filter: {
        tran_date: { gte: $startDate, lte: $endDate }
      }
    ) {
      edges {
        node {
          nodeId
        }
      }
    }
  }
`;

/**
 * 獲取轉移時間分布
 * 用於 Warehouse Dashboard - Transfer Time Distribution Chart
 */
export const GET_TRANSFER_TIME_DISTRIBUTION = gql`
  query GetTransferTimeDistribution($startDate: Datetime!, $endDate: Datetime!) {
    record_transferCollection(
      filter: {
        tran_date: { gte: $startDate, lte: $endDate }
      }
      orderBy: [{ tran_date: AscNullsLast }]
    ) {
      edges {
        node {
          tran_date
        }
      }
    }
  }
`;

/**
 * 獲取訂單進度列表
 * 用於 Warehouse Dashboard - Order State List Widget
 */
export const GET_ORDER_PROGRESS = gql`
  query GetOrderProgress($limit: Int = 5) {
    data_orderCollection(
      orderBy: [{ created_at: DescNullsLast }]
      first: $limit
    ) {
      edges {
        node {
          uuid
          order_ref
          account_num
          product_code
          product_desc
          product_qty
          loaded_qty
          created_at
        }
      }
    }
  }
`;

/**
 * 獲取所有未完成訂單
 * 用於 Warehouse Dashboard - Order State List Widget (未完成訂單)
 */
export const GET_PENDING_ORDERS = gql`
  query GetPendingOrders {
    data_orderCollection(
      filter: {
        or: [
          { loaded_qty: { is: null } },
          { loaded_qty: { lt: "product_qty" } }
        ]
      }
      orderBy: [{ created_at: DescNullsLast }]
    ) {
      edges {
        node {
          uuid
          order_ref
          account_num
          product_code
          product_desc
          product_qty
          loaded_qty
          created_at
        }
      }
    }
  }
`;

/**
 * 獲取倉庫部門轉移記錄
 * 用於 Warehouse Dashboard - Transfer List Widget
 * 注意：需要在客戶端過濾部門，因為 GraphQL 不支援 nested filter
 */
export const GET_WAREHOUSE_TRANSFERS = gql`
  query GetWarehouseTransfers($startDate: Datetime!, $endDate: Datetime!, $limit: Int = 50) {
    record_transferCollection(
      filter: {
        tran_date: { gte: $startDate, lte: $endDate }
      }
      orderBy: [{ tran_date: DescNullsLast }]
      first: $limit
    ) {
      edges {
        node {
          tran_date
          plt_num
          operator_id
          data_id {
            id
            name
            department
          }
        }
      }
    }
  }
`;

/**
 * 獲取倉庫部門工作量
 * 用於 Warehouse Dashboard - Work Level Area Chart
 */
export const GET_WAREHOUSE_WORK_LEVEL = gql`
  query GetWarehouseWorkLevel($startDate: Datetime!, $endDate: Datetime!) {
    work_levelCollection(
      filter: {
        latest_update: { gte: $startDate, lte: $endDate }
      }
      orderBy: [{ latest_update: AscNullsLast }]
    ) {
      edges {
        node {
          id
          move
          latest_update
          data_id {
            name
            department
          }
        }
      }
    }
  }
`;

/**
 * 獲取昨天完成但今天仍在 Await 的棧板
 * 用於 Warehouse Dashboard - Still in Await Stats
 */
export const GET_STILL_IN_AWAIT_STATS = gql`
  query GetStillInAwaitStats($startDate: Datetime!, $endDate: Datetime!) {
    # 第一步：獲取指定時間範圍內移動到 Await 的記錄
    historyRecords: record_historyCollection(
      filter: {
        time: { gte: $startDate, lte: $endDate }
        action: { eq: "Move" }
        loc: { eq: "Await" }
      }
    ) {
      edges {
        node {
          plt_num
          time
        }
      }
    }
    
    # 第二步：獲取所有庫存中 await > 0 的記錄
    inventoryRecords: record_inventoryCollection(
      filter: {
        await: { gt: 0 }
      }
    ) {
      edges {
        node {
          plt_num
          await
          # 關聯 palletinfo 獲取數量
          record_palletinfo {
            product_qty
          }
        }
      }
    }
  }
`;

/**
 * 獲取 Transfer 統計數據
 * 用於 BookedOutStatsWidget
 */
export const GET_TRANSFER_STATS_DETAILED = gql`
  query GetTransferStatsDetailed($startDate: Datetime!, $endDate: Datetime!) {
    # 總數統計
    transferStats: record_transferCollection(
      filter: {
        tran_date: { gte: $startDate, lt: $endDate }
      }
      first: 1000
    ) {
      edges {
        node {
          nodeId
        }
      }
    }
    
    # 詳細記錄（用於操作員統計和圖表）
    transferRecords: record_transferCollection(
      filter: {
        tran_date: { gte: $startDate, lt: $endDate }
      }
      orderBy: [{ tran_date: AscNullsLast }]
    ) {
      edges {
        node {
          operator_id
          tran_date
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