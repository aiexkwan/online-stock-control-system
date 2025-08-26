/**
 * GraphQL Queries for DashboardReportCard
 * P1 Component - Phase 2 Migration
 */

import { gql } from '@apollo/client';

export const DASHBOARD_REPORT_QUERY = gql`
  query DashboardReport(
    $reportType: DashboardReportType!
    $params: DashboardReportParams!
    $format: ReportFormat = JSON
  ) {
    dashboardReport(reportType: $reportType, params: $params, format: $format) {
      reportType
      data
      metadata {
        totalRecords
        processingTime
        dataSource
        version
        filters
      }
      generatedAt
    }
  }
`;

export const DASHBOARD_REPORT_SELECTOR_OPTIONS_QUERY = gql`
  query DashboardReportSelectorOptions(
    $selectorType: DashboardSelectorType!
    $filters: ReportSelectorFilters
  ) {
    dashboardReportSelectorOptions(selectorType: $selectorType, filters: $filters) {
      value
      label
      status
      metadata
    }
  }
`;

// Fragment for report metadata
export const REPORT_METADATA_FRAGMENT = gql`
  fragment ReportMetadataFields on ReportMetadata {
    totalRecords
    processingTime
    dataSource
    version
    filters
  }
`;

// Query with fragments for better performance
export const DASHBOARD_REPORT_WITH_FRAGMENTS = gql`
  ${REPORT_METADATA_FRAGMENT}

  query DashboardReportWithFragments(
    $reportType: DashboardReportType!
    $params: DashboardReportParams!
    $format: ReportFormat = JSON
  ) {
    dashboardReport(reportType: $reportType, params: $params, format: $format) {
      reportType
      data
      metadata {
        ...ReportMetadataFields
      }
      generatedAt
    }
  }
`;

// Subscription for report generation progress
export const REPORT_GENERATION_PROGRESS_SUBSCRIPTION = gql`
  subscription ReportGenerationProgress($reportId: String!) {
    reportGenerationProgress(reportId: $reportId) {
      reportId
      progress
      status
      message
      estimatedCompletion
    }
  }
`;

// Types for TypeScript
export interface DashboardReportVariables {
  reportType: 'TRANSACTION' | 'INVENTORY' | 'PRODUCTION' | 'QUALITY' | 'CUSTOM';
  params: {
    dateRange?: {
      start: string;
      end: string;
    };
    filters?: Record<string, unknown>;
    aggregations?: string[];
    groupBy?: string[];
    metrics?: string[];
  };
  format?: 'JSON' | 'CSV' | 'EXCEL' | 'PDF';
}

export interface DashboardReportSelectorVariables {
  selectorType: 'ORDER' | 'GRN' | 'DATE' | 'PRODUCT' | 'WAREHOUSE' | 'CUSTOM';
  filters?: {
    status?: string;
    dateRange?: {
      start: string;
      end: string;
    };
    searchTerm?: string;
    limit?: number;
  };
}

// Type for report data - varies by report type
export type ReportDataType =
  | Record<string, unknown> // Generic object data
  | unknown[] // Array data for lists
  | {
      records: unknown[];
      totals?: Record<string, number>;
      summary?: Record<string, unknown>;
    } // Structured report data
  | null;

// Type for report filters
export type ReportFilters = Record<
  string,
  string | number | boolean | string[] | { start: string; end: string }
>;

// Type for selector metadata
export interface SelectorMetadata {
  count?: number;
  lastUpdated?: string;
  category?: string;
  tags?: string[];
  [key: string]: unknown; // Allow additional properties
}

export interface DashboardReportData {
  dashboardReport: {
    reportType: string;
    data: ReportDataType;
    metadata: {
      totalRecords: number;
      processingTime: number;
      dataSource: string;
      version: string;
      filters: ReportFilters;
    };
    generatedAt: string;
  };
}

export interface DashboardReportSelectorData {
  dashboardReportSelectorOptions: Array<{
    value: string;
    label: string;
    status: string | null;
    metadata: SelectorMetadata | null;
  }>;
}

// Helper function to build report params
export function buildReportParams(
  dateRange?: { from: Date; to: Date },
  filters?: Record<string, unknown>,
  selectedValue?: string
): DashboardReportVariables['params'] {
  const params: DashboardReportVariables['params'] = {};

  if (dateRange) {
    params.dateRange = {
      start: dateRange.from.toISOString(),
      end: dateRange.to.toISOString(),
    };
  }

  if (filters || selectedValue) {
    params.filters = {
      ...filters,
      ...(selectedValue && { selectedValue }),
    };
  }

  return params;
}
