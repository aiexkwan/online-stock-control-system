import { gql } from '@apollo/client';

// GRN Report GraphQL Queries
export const GRN_REPORT_QUERY = gql`
  query GetGrnReportData($grnRef: String!, $materialCode: String!, $userEmail: String!) {
    grnReportData(grnRef: $grnRef, materialCode: $materialCode, userEmail: $userEmail) {
      success
      message
      data {
        grn_ref
        material_code
        material_description
        supplier_name
        report_date
        user_id
        total_gross_weight
        total_net_weight
        weight_difference
        records {
          pallet
          package_type
          gross_weight
          net_weight
          pallet_count
          package_count
        }
      }
    }
  }
`;

export const GRN_OPTIONS_QUERY = gql`
  query GetGrnOptions($limit: Int) {
    grnOptions(limit: $limit) {
      grnRef
      materialCode
      supplierName
      createdAt
      status
    }
  }
`;

export const GET_MATERIAL_CODES_FOR_GRN = gql`
  query GetMaterialCodesForGrn($grnRef: String!) {
    materialCodesForGrn(grnRef: $grnRef) {
      success
      message
      data
    }
  }
`;

// Types
export interface GrnReportVariables {
  grnRef: string;
  materialCode: string;
  userEmail: string;
}

export interface GrnOptionsVariables {
  limit?: number;
}

export interface MaterialCodesVariables {
  grnRef: string;
}

export interface GrnRecord {
  pallet: string | null;
  package_type: string | null;
  gross_weight: number | null;
  net_weight: number | null;
  pallet_count: number | null;
  package_count: number | null;
}

export interface GrnReportDataResult {
  grn_ref: string;
  material_code: string;
  material_description: string;
  supplier_name: string;
  report_date: string;
  user_id: string;
  total_gross_weight: number;
  total_net_weight: number;
  weight_difference: number;
  records: GrnRecord[];
}

export interface GrnReportData {
  grnReportData: {
    success: boolean;
    message?: string;
    data?: GrnReportDataResult;
  };
}

export interface GrnOption {
  grnRef: string;
  materialCode: string;
  supplierName: string;
  createdAt: string;
  status: string;
}

export interface GrnOptionsData {
  grnOptions: GrnOption[];
}

export interface MaterialCodesData {
  materialCodesForGrn: {
    success: boolean;
    message?: string;
    data?: string[];
  };
}