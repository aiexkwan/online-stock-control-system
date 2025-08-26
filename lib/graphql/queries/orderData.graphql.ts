/**
 * GraphQL Queries for Order Data Management
 * Unified Order Data Hook - Complete order data fetching solution
 */

import { gql } from '@apollo/client';

// Warehouse Orders Queries
export const WAREHOUSE_ORDERS_QUERY = gql`
  query WarehouseOrders($input: WarehouseOrderFilterInput) {
    warehouseOrders(input: $input) {
      items {
        id
        orderRef
        customerName
        status
        items {
          id
          productCode
          productDesc
          quantity
          loadedQuantity
          status
        }
        totalQuantity
        loadedQuantity
        remainingQuantity
        createdAt
        updatedAt
        completedAt
      }
      total
      aggregates {
        totalOrders
        pendingOrders
        completedOrders
        totalQuantity
        loadedQuantity
      }
    }
  }
`;

export const WAREHOUSE_ORDER_QUERY = gql`
  query WarehouseOrder($id: ID, $orderRef: String) {
    warehouseOrder(id: $id, orderRef: $orderRef) {
      id
      orderRef
      customerName
      status
      items {
        id
        orderId
        productCode
        productDesc
        quantity
        loadedQuantity
        status
      }
      totalQuantity
      loadedQuantity
      remainingQuantity
      createdAt
      updatedAt
      completedAt
    }
  }
`;

// ACO Order Report Query
export const ACO_ORDER_REPORT_QUERY = gql`
  query AcoOrderReport($reference: String!) {
    acoOrderReport(reference: $reference) {
      data {
        orderRef
        productCode
        productDesc
        quantityOrdered
        quantityUsed
        remainingQuantity
        completionStatus
        lastUpdated
      }
      total
      reference
      generatedAt
    }
  }
`;

// Order Loading Records Query
export const ORDER_LOADING_RECORDS_QUERY = gql`
  query OrderLoadingRecords($input: OrderLoadingFilterInput!) {
    orderLoadingRecords(input: $input) {
      records {
        timestamp
        orderNumber
        productCode
        loadedQty
        userName
        action
      }
      total
      summary {
        totalLoaded
        uniqueOrders
        uniqueProducts
        averageLoadPerOrder
      }
    }
  }
`;

// Order Status Update Mutation
export const UPDATE_WAREHOUSE_ORDER_STATUS = gql`
  mutation UpdateWarehouseOrderStatus($orderId: ID!, $status: WarehouseOrderStatus!) {
    updateWarehouseOrderStatus(orderId: $orderId, status: $status) {
      id
      orderRef
      customerName
      status
      totalQuantity
      loadedQuantity
      remainingQuantity
      updatedAt
    }
  }
`;

// ACO Order Update Mutation
export const UPDATE_ACO_ORDER = gql`
  mutation UpdateAcoOrder($input: UpdateAcoOrderInput!) {
    updateAcoOrder(input: $input) {
      success
      message
      order {
        orderRef
        productCode
        productDesc
        quantityOrdered
        quantityUsed
        remainingQuantity
        completionStatus
        lastUpdated
      }
      emailSent
      error {
        code
        message
      }
    }
  }
`;

// Cancel Order Mutation
export const CANCEL_WAREHOUSE_ORDER = gql`
  mutation CancelWarehouseOrder($orderId: ID!, $reason: String) {
    cancelWarehouseOrder(orderId: $orderId, reason: $reason) {
      id
      orderRef
      customerName
      status
      totalQuantity
      loadedQuantity
      remainingQuantity
      updatedAt
    }
  }
`;

// Fragments for reusability
export const WAREHOUSE_ORDER_ITEM_FRAGMENT = gql`
  fragment WarehouseOrderItemData on WarehouseOrderItem {
    id
    orderId
    productCode
    productDesc
    quantity
    loadedQuantity
    status
  }
`;

export const WAREHOUSE_ORDER_FRAGMENT = gql`
  fragment WarehouseOrderData on WarehouseOrder {
    id
    orderRef
    customerName
    status
    items {
      ...WarehouseOrderItemData
    }
    totalQuantity
    loadedQuantity
    remainingQuantity
    createdAt
    updatedAt
    completedAt
  }
  ${WAREHOUSE_ORDER_ITEM_FRAGMENT}
`;

export const ACO_ORDER_FRAGMENT = gql`
  fragment AcoOrderData on AcoOrder {
    orderRef
    productCode
    productDesc
    quantityOrdered
    quantityUsed
    remainingQuantity
    completionStatus
    lastUpdated
  }
`;

export const ORDER_LOADING_RECORD_FRAGMENT = gql`
  fragment OrderLoadingRecordData on OrderLoadingRecord {
    timestamp
    orderNumber
    productCode
    loadedQty
    userName
    action
  }
`;

// Subscription for real-time order updates
export const ORDER_UPDATES_SUBSCRIPTION = gql`
  subscription OrderUpdates($orderIds: [ID!]) {
    orderUpdates(orderIds: $orderIds) {
      orderId
      status
      loadedQuantity
      updatedAt
      action
    }
  }
`;

// TypeScript Types
export interface WarehouseOrderFilterInput {
  orderRef?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  dateRange?: {
    start: string;
    end: string;
  };
  customerName?: string;
}

export interface OrderLoadingFilterInput {
  startDate: string;
  endDate: string;
  orderRef?: string;
  productCode?: string;
  actionBy?: string;
}

export interface UpdateAcoOrderInput {
  orderRef: number;
  productCode: string;
  quantityUsed: number;
  skipUpdate?: boolean;
  orderCompleted?: boolean;
}

export interface WarehouseOrdersVariables {
  input?: WarehouseOrderFilterInput;
}

export interface WarehouseOrderVariables {
  id?: string;
  orderRef?: string;
}

export interface AcoOrderReportVariables {
  reference: string;
}

export interface OrderLoadingRecordsVariables {
  input: OrderLoadingFilterInput;
}

export interface UpdateWarehouseOrderStatusVariables {
  orderId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface UpdateAcoOrderVariables {
  input: UpdateAcoOrderInput;
}

export interface CancelWarehouseOrderVariables {
  orderId: string;
  reason?: string;
}

// Response Types
export interface WarehouseOrderItem {
  id: string;
  orderId: string;
  productCode: string;
  productDesc?: string;
  quantity: number;
  loadedQuantity: number;
  status: 'PENDING' | 'PARTIAL' | 'COMPLETED';
}

export interface WarehouseOrder {
  id: string;
  orderRef: string;
  customerName?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  items: WarehouseOrderItem[];
  totalQuantity: number;
  loadedQuantity: number;
  remainingQuantity: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface WarehouseOrderAggregates {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalQuantity: number;
  loadedQuantity: number;
}

export interface WarehouseOrdersData {
  warehouseOrders: {
    items: WarehouseOrder[];
    total: number;
    aggregates: WarehouseOrderAggregates;
  };
}

export interface WarehouseOrderData {
  warehouseOrder: WarehouseOrder;
}

export interface AcoOrder {
  orderRef: number;
  productCode: string;
  productDesc?: string;
  quantityOrdered: number;
  quantityUsed: number;
  remainingQuantity: number;
  completionStatus: string;
  lastUpdated?: string;
}

export interface AcoOrderReportData {
  acoOrderReport: {
    data: AcoOrder[];
    total: number;
    reference: string;
    generatedAt: string;
  };
}

export interface OrderLoadingRecord {
  timestamp: string;
  orderNumber: string;
  productCode: string;
  loadedQty: number;
  userName: string;
  action: string;
}

export interface LoadingSummary {
  totalLoaded: number;
  uniqueOrders: number;
  uniqueProducts: number;
  averageLoadPerOrder: number;
}

export interface OrderLoadingRecordsData {
  orderLoadingRecords: {
    records: OrderLoadingRecord[];
    total: number;
    summary: LoadingSummary;
  };
}

export interface UpdateAcoOrderData {
  updateAcoOrder: {
    success: boolean;
    message?: string;
    order?: AcoOrder;
    emailSent?: boolean;
    error?: {
      code: string;
      message: string;
    };
  };
}

export interface UpdateWarehouseOrderStatusData {
  updateWarehouseOrderStatus: WarehouseOrder;
}

export interface CancelWarehouseOrderData {
  cancelWarehouseOrder: WarehouseOrder;
}
