/**
 * GraphQL Queries for BaseAnalysisCard
 * P1 Component - Phase 2 Migration
 */

import { gql } from '@apollo/client';

export const BASE_ANALYSIS_DATA_QUERY = gql`
  query BaseAnalysisData(
    $analysisType: BaseAnalysisType!
    $filters: AnalysisFiltersInput
    $pagination: PaginationInput
  ) {
    baseAnalysisData(analysisType: $analysisType, filters: $filters, pagination: $pagination) {
      analysisType
      data
      metadata {
        totalRecords
        processingTime
        cacheHit
        lastRefresh
        dataQuality
      }
      filters {
        applied
        available
      }
      pagination {
        page
        limit
        total
        hasNext
        hasPrev
      }
    }
  }
`;

// Fragment for analysis metadata
export const ANALYSIS_METADATA_FRAGMENT = gql`
  fragment AnalysisMetadata on AnalysisMetadata {
    totalRecords
    processingTime
    cacheHit
    lastRefresh
    dataQuality
  }
`;

// Fragment for pagination data
export const PAGINATION_DATA_FRAGMENT = gql`
  fragment PaginationData on PaginationData {
    page
    limit
    total
    hasNext
    hasPrev
  }
`;

// Fragment for analysis filters
export const ANALYSIS_FILTERS_FRAGMENT = gql`
  fragment AnalysisFiltersData on AnalysisFiltersData {
    applied
    available
  }
`;

// Query with fragments
export const BASE_ANALYSIS_WITH_FRAGMENTS = gql`
  ${ANALYSIS_METADATA_FRAGMENT}
  ${PAGINATION_DATA_FRAGMENT}
  ${ANALYSIS_FILTERS_FRAGMENT}

  query BaseAnalysisWithFragments(
    $analysisType: BaseAnalysisType!
    $filters: AnalysisFiltersInput
    $pagination: PaginationInput
  ) {
    baseAnalysisData(analysisType: $analysisType, filters: $filters, pagination: $pagination) {
      analysisType
      data
      metadata {
        ...AnalysisMetadata
      }
      filters {
        ...AnalysisFiltersData
      }
      pagination {
        ...PaginationData
      }
    }
  }
`;

// Query for expandable analysis
export const EXPANDABLE_ANALYSIS_QUERY = gql`
  query ExpandableAnalysis($filters: AnalysisFiltersInput, $pagination: PaginationInput) {
    baseAnalysisData(analysisType: EXPANDABLE, filters: $filters, pagination: $pagination) {
      analysisType
      data
      metadata {
        totalRecords
        processingTime
        cacheHit
        lastRefresh
        dataQuality
      }
      filters {
        applied
        available
      }
      pagination {
        page
        limit
        total
        hasNext
        hasPrev
      }
    }
  }
`;

// Query for paged analysis
export const PAGED_ANALYSIS_QUERY = gql`
  query PagedAnalysis($filters: AnalysisFiltersInput, $pagination: PaginationInput) {
    baseAnalysisData(analysisType: PAGED, filters: $filters, pagination: $pagination) {
      analysisType
      data
      metadata {
        totalRecords
        processingTime
        cacheHit
        lastRefresh
        dataQuality
      }
      filters {
        applied
        available
      }
      pagination {
        page
        limit
        total
        hasNext
        hasPrev
      }
    }
  }
`;

// Query for progress analysis
export const PROGRESS_ANALYSIS_QUERY = gql`
  query ProgressAnalysis($filters: AnalysisFiltersInput, $pagination: PaginationInput) {
    baseAnalysisData(analysisType: PROGRESS, filters: $filters, pagination: $pagination) {
      analysisType
      data
      metadata {
        totalRecords
        processingTime
        cacheHit
        lastRefresh
        dataQuality
      }
      filters {
        applied
        available
      }
      pagination {
        page
        limit
        total
        hasNext
        hasPrev
      }
    }
  }
`;

// Query for trend analysis
export const TREND_ANALYSIS_QUERY = gql`
  query TrendAnalysis($filters: AnalysisFiltersInput, $pagination: PaginationInput) {
    baseAnalysisData(analysisType: TREND, filters: $filters, pagination: $pagination) {
      analysisType
      data
      metadata {
        totalRecords
        processingTime
        cacheHit
        lastRefresh
        dataQuality
      }
      filters {
        applied
        available
      }
      pagination {
        page
        limit
        total
        hasNext
        hasPrev
      }
    }
  }
`;

// Query for distribution analysis
export const DISTRIBUTION_ANALYSIS_QUERY = gql`
  query DistributionAnalysis($filters: AnalysisFiltersInput, $pagination: PaginationInput) {
    baseAnalysisData(analysisType: DISTRIBUTION, filters: $filters, pagination: $pagination) {
      analysisType
      data
      metadata {
        totalRecords
        processingTime
        cacheHit
        lastRefresh
        dataQuality
      }
      filters {
        applied
        available
      }
      pagination {
        page
        limit
        total
        hasNext
        hasPrev
      }
    }
  }
`;

// Types for TypeScript
export interface BaseAnalysisVariables {
  analysisType: 'EXPANDABLE' | 'PAGED' | 'PROGRESS' | 'CUSTOM' | 'TREND' | 'DISTRIBUTION';
  filters?: {
    dateRange?: {
      from: string;
      to: string;
    };
    productCodes?: string[];
    stockTypes?: string[];
    departments?: string[];
    users?: string[];
    customFilters?: Record<string, unknown>;
  };
  pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  };
}

export interface ExpandableAnalysisVariables {
  filters?: {
    dateRange?: {
      from: string;
      to: string;
    };
    productCodes?: string[];
    stockTypes?: string[];
    departments?: string[];
    users?: string[];
    customFilters?: Record<string, unknown>;
  };
  pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  };
}

export interface PagedAnalysisVariables {
  filters?: {
    dateRange?: {
      from: string;
      to: string;
    };
    productCodes?: string[];
    stockTypes?: string[];
    departments?: string[];
    users?: string[];
    customFilters?: Record<string, unknown>;
  };
  pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  };
}

// Type for analysis data - varies by analysis type
export type AnalysisDataType =
  | Record<string, unknown> // Generic object data
  | unknown[] // Array data
  | {
      items: unknown[];
      summary?: Record<string, unknown>;
    } // Structured data with items and summary
  | null;

// Type for filter configurations
export interface FilterConfig {
  type: string;
  value: unknown;
  label?: string;
  options?: Array<{ value: string; label: string }>;
}

export interface BaseAnalysisData {
  baseAnalysisData: {
    analysisType: 'EXPANDABLE' | 'PAGED' | 'PROGRESS' | 'CUSTOM' | 'TREND' | 'DISTRIBUTION';
    data: AnalysisDataType;
    metadata: {
      totalRecords: number;
      processingTime: number;
      cacheHit: boolean;
      lastRefresh: string;
      dataQuality: number;
    };
    filters: {
      applied: Record<string, FilterConfig>;
      available: Record<string, FilterConfig>;
    } | null;
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasNext: boolean;
      hasPrev: boolean;
    } | null;
  };
}
