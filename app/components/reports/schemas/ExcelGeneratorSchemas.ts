/**
 * Zod schemas for Excel Generator - Strategy 1: Runtime validation
 */
import { z } from 'zod';

// ExcelJS 樣式相關 schemas
const ExcelColorSchema = z.object({
  argb: z.string().optional(),
  rgb: z.string().optional(),
});

const ExcelFontSchema = z.object({
  size: z.number().optional(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  color: ExcelColorSchema.optional(),
  name: z.string().optional(),
});

const ExcelFillSchema = z.object({
  type: z.literal('pattern'),
  pattern: z.enum(['solid', 'darkGray', 'mediumGray', 'lightGray']),
  fgColor: ExcelColorSchema.optional(),
  bgColor: ExcelColorSchema.optional(),
});

const ExcelAlignmentSchema = z.object({
  horizontal: z.enum(['left', 'center', 'right']).optional(),
  vertical: z.enum(['top', 'middle', 'bottom']).optional(),
});

const ExcelBorderLineSchema = z.object({
  style: z.enum(['thin', 'medium', 'thick']),
  color: ExcelColorSchema.optional(),
});

const ExcelBorderSchema = z.object({
  top: ExcelBorderLineSchema.optional(),
  left: ExcelBorderLineSchema.optional(),
  bottom: ExcelBorderLineSchema.optional(),
  right: ExcelBorderLineSchema.optional(),
});

const ExcelCellStyleSchema = z.object({
  font: ExcelFontSchema.optional(),
  fill: ExcelFillSchema.optional(),
  alignment: ExcelAlignmentSchema.optional(),
  border: ExcelBorderSchema.optional(),
  numFmt: z.string().optional(),
});

// 基本數據類型 schemas
export const ColumnConfigSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['text', 'number', 'date', 'currency', 'percentage']).optional(),
  width: z.number().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  format: z.string().optional(),
  sortable: z.boolean().optional(),
  exportOnly: z.boolean().optional(),
});

export const SectionConfigSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['summary', 'table', 'chart', 'custom']),
  dataSource: z.string(),
  hideInFormats: z.array(z.enum(['pdf', 'excel', 'csv'])).optional(),
  config: z
    .object({
      columns: z.array(ColumnConfigSchema).optional(),
      summaryFields: z
        .array(
          z.object({
            id: z.string(),
            label: z.string(),
            type: z.enum(['count', 'sum', 'average', 'min', 'max', 'custom']),
            field: z.string().optional(),
            format: z.string().optional(),
            customCalculation: z.string().optional(),
          })
        )
        .optional(),
      showTotals: z.boolean().optional(),
    })
    .optional(),
});

export const ReportConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.enum(['operational', 'inventory', 'financial', 'quality']),
  formats: z.array(z.enum(['pdf', 'excel', 'csv'])),
  defaultFormat: z.enum(['pdf', 'excel', 'csv']),
  filters: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      type: z.enum(['date', 'dateRange', 'select', 'multiSelect', 'text', 'number']),
      required: z.boolean(),
      defaultValue: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
      placeholder: z.string().optional(),
    })
  ),
  sections: z.array(SectionConfigSchema),
  permissions: z.array(z.string()).optional(),
  styleOverrides: z
    .object({
      excel: z
        .object({
          headerStyle: ExcelCellStyleSchema.optional(),
          dataStyle: ExcelCellStyleSchema.optional(),
          summaryStyle: ExcelCellStyleSchema.optional(),
        })
        .optional(),
    })
    .optional(),
});

// 處理後嘅數據 schemas
export const MetadataSchema = z.object({
  generatedAt: z.string(),
  filters: z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.date()])),
  recordCount: z.number(),
});

export const ProcessedReportDataSchema = z.object({
  metadata: MetadataSchema,
  sections: z.record(z.array(z.record(z.unknown()))),
  summary: z.record(z.unknown()).optional(),
});

// 運行時類型
export type ValidatedColumnConfig = z.infer<typeof ColumnConfigSchema>;
export type ValidatedSectionConfig = z.infer<typeof SectionConfigSchema>;
export type ValidatedReportConfig = z.infer<typeof ReportConfigSchema>;
export type ValidatedProcessedReportData = z.infer<typeof ProcessedReportDataSchema>;
export type ValidatedMetadata = z.infer<typeof MetadataSchema>;

// 驗證輔助函數
export function validateAndParseReportConfig(data: unknown): ValidatedReportConfig {
  return ReportConfigSchema.parse(data);
}

export function validateAndParseProcessedData(data: unknown): ValidatedProcessedReportData {
  return ProcessedReportDataSchema.parse(data);
}

export function validateColumnConfig(data: unknown): ValidatedColumnConfig {
  return ColumnConfigSchema.parse(data);
}

export function validateSectionConfig(data: unknown): ValidatedSectionConfig {
  return SectionConfigSchema.parse(data);
}

// 安全類型保護函數
export function isValidReportConfig(data: unknown): data is ValidatedReportConfig {
  try {
    ReportConfigSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function isValidProcessedData(data: unknown): data is ValidatedProcessedReportData {
  try {
    ProcessedReportDataSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}
