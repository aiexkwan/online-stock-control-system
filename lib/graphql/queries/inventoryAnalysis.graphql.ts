/**
 * GraphQL Queries for InventoryAnalysisCard
 * P1 Component - Phase 2 Migration
 */

import { gql } from '@apollo/client';

export const INVENTORY_ANALYSIS_QUERY = gql`
  query InventoryOrderAnalysis(
    $productCodes: [String!]
    $stockTypes: [String!]
    $dateRange: DateRangeInput
    $matchingStatus: InventoryMatchingStatus
  ) {
    inventoryOrderAnalysis(
      productCodes: $productCodes
      stockTypes: $stockTypes
      dateRange: $dateRange
      matchingStatus: $matchingStatus
    ) {
      summary {
        totalProducts
        sufficientProducts
        warningProducts
        insufficientProducts
        overallMatchingScore
        lastUpdated
      }
      products {
        productCode
        productDescription
        stockType
        currentStock
        orderedQuantity
        availableStock
        matchingStatus
        matchingPercentage
        recommendations
      }
      stockTypes
      lastUpdated
    }
  }
`;

// Fragment for reusable product analysis data
export const PRODUCT_ANALYSIS_FRAGMENT = gql`
  fragment ProductAnalysisData on ProductAnalysisData {
    productCode
    productDescription
    stockType
    currentStock
    orderedQuantity
    availableStock
    matchingStatus
    matchingPercentage
    recommendations
  }
`;

// Fragment for inventory analysis summary
export const INVENTORY_ANALYSIS_SUMMARY_FRAGMENT = gql`
  fragment InventoryAnalysisSummary on InventoryAnalysisSummary {
    totalProducts
    sufficientProducts
    warningProducts
    insufficientProducts
    overallMatchingScore
    lastUpdated
  }
`;

// Query with fragments (for better performance)
export const INVENTORY_ANALYSIS_WITH_FRAGMENTS = gql`
  ${PRODUCT_ANALYSIS_FRAGMENT}
  ${INVENTORY_ANALYSIS_SUMMARY_FRAGMENT}
  
  query InventoryOrderAnalysisWithFragments(
    $productCodes: [String!]
    $stockTypes: [String!]
    $dateRange: DateRangeInput
    $matchingStatus: InventoryMatchingStatus
  ) {
    inventoryOrderAnalysis(
      productCodes: $productCodes
      stockTypes: $stockTypes
      dateRange: $dateRange
      matchingStatus: $matchingStatus
    ) {
      summary {
        ...InventoryAnalysisSummary
      }
      products {
        ...ProductAnalysisData
      }
      stockTypes
      lastUpdated
    }
  }
`;

// Types for TypeScript
export interface InventoryAnalysisVariables {
  productCodes?: string[];
  stockTypes?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  matchingStatus?: 'SUFFICIENT' | 'WARNING' | 'INSUFFICIENT';
}

export interface InventoryAnalysisData {
  inventoryOrderAnalysis: {
    summary: {
      totalProducts: number;
      sufficientProducts: number;
      warningProducts: number;
      insufficientProducts: number;
      overallMatchingScore: number;
      lastUpdated: string;
    };
    products: Array<{
      productCode: string;
      productDescription: string;
      stockType: string;
      currentStock: number;
      orderedQuantity: number;
      availableStock: number;
      matchingStatus: 'SUFFICIENT' | 'WARNING' | 'INSUFFICIENT';
      matchingPercentage: number;
      recommendations: string[];
    }>;
    stockTypes: string[];
    lastUpdated: string;
  };
}