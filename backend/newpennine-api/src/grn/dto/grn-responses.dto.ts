export class GrnReferencesResponseDto {
  references: string[];
  total: number;
  offset: number;
  limit: number;
}

export class GrnMaterialCodesResponseDto {
  grnRef: string;
  materialCodes: string[];
  total: number;
}

export class GrnReportRecordDto {
  supplier_invoice_number?: string;
  date_received?: string;
  package_count?: number;
  gross_weight?: number;
  net_weight?: number;
  pallet_weight?: number;
}

export class GrnReportDataResponseDto {
  grnRef: string;
  material_description?: string;
  supplier_name?: string;
  report_date?: string;
  records: GrnReportRecordDto[];
  total_records: number;
}