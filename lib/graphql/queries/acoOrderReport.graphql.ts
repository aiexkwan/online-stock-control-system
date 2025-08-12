/**
 * GraphQL Queries for AcoOrderReportCard
 * P1 Component - Phase 2 Migration
 */

import { gql } from '@apollo/client';

export const ACO_ORDER_REPORT_QUERY = gql`
  query AcoOrderReportAnalytics(
    $orderRef: String!
    $includeProgress: Boolean = true
    $includeHistory: Boolean = false
  ) {
    acoOrderReportAnalytics(
      orderRef: $orderRef
      includeProgress: $includeProgress
      includeHistory: $includeHistory
    ) {
      orderRef
      products {
        productCode
        requiredQty
        pallets {
          pltNum
          productQty
          generateTime
          status
        }
        palletCount
        completedQty
        progressPercentage
      }
      totalProducts
      completedProducts
      inProgressProducts
      pendingProducts
      overallProgress
      estimatedCompletion
      generatedAt
    }
  }
`;

export const ACO_ORDER_OPTIONS_QUERY = gql`
  query AcoOrderOptions(
    $limit: Int = 100
    $status: OrderStatus
  ) {
    acoOrderOptions(
      limit: $limit
      status: $status
    ) {
      orderRef
      description
      status
      createdAt
      priority
    }
  }
`;

// Fragment for ACO product data
export const ACO_PRODUCT_FRAGMENT = gql`
  fragment AcoProductData on AcoProductData {
    productCode
    requiredQty
    pallets {
      pltNum
      productQty
      generateTime
      status
    }
    palletCount
    completedQty
    progressPercentage
  }
`;

// Fragment for ACO pallet data
export const ACO_PALLET_FRAGMENT = gql`
  fragment AcoPalletData on AcoPalletData {
    pltNum
    productQty
    generateTime
    status
  }
`;

// Query with fragments (for better performance)
export const ACO_ORDER_REPORT_WITH_FRAGMENTS = gql`
  ${ACO_PRODUCT_FRAGMENT}
  
  query AcoOrderReportAnalyticsWithFragments(
    $orderRef: String!
    $includeProgress: Boolean = true
    $includeHistory: Boolean = false
  ) {
    acoOrderReportAnalytics(
      orderRef: $orderRef
      includeProgress: $includeProgress
      includeHistory: $includeHistory
    ) {
      orderRef
      products {
        ...AcoProductData
      }
      totalProducts
      completedProducts
      inProgressProducts
      pendingProducts
      overallProgress
      estimatedCompletion
      generatedAt
    }
  }
`;

// Subscription for real-time ACO order updates
export const ACO_ORDER_PROGRESS_SUBSCRIPTION = gql`
  subscription AcoOrderProgress($orderRef: String!) {
    acoOrderProgress(orderRef: $orderRef) {
      orderRef
      overallProgress
      completedProducts
      inProgressProducts
      pendingProducts
      lastUpdated
    }
  }
`;

// Types for TypeScript
export interface AcoOrderReportVariables {
  orderRef: string;
  includeProgress?: boolean;
  includeHistory?: boolean;
}

export interface AcoOrderOptionsVariables {
  limit?: number;
  status?: 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD';
}

export interface AcoOrderReportData {
  acoOrderReportAnalytics: {
    orderRef: string;
    products: Array<{
      productCode: string;
      requiredQty: number | null;
      pallets: Array<{
        pltNum: string | null;
        productQty: number | null;
        generateTime: string | null;
        status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | null;
      }>;
      palletCount: number;
      completedQty: number;
      progressPercentage: number;
    }>;
    totalProducts: number;
    completedProducts: number;
    inProgressProducts: number;
    pendingProducts: number;
    overallProgress: number;
    estimatedCompletion: string | null;
    generatedAt: string;
  };
}

export interface AcoOrderOptionsData {
  acoOrderOptions: Array<{
    orderRef: string;
    description: string | null;
    status: 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD';
    createdAt: string;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | null;
  }>;
}