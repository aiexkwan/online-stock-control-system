/**
 * GRN Label Card Runtime Validation Schemas
 * 
 * This file provides Zod schemas for runtime validation of form inputs and API responses
 * in the GRNLabelCard component system. It replaces unsafe `unknown` type assertions
 * with strict runtime validation.
 * 
 * @see /app/(app)/admin/cards/GRNLabelCard.tsx
 */

import { z } from 'zod';
import type { PalletTypeKey, PackageTypeKey, LabelMode } from './grn';

// Base validation schemas for primitive types
const StringSchema = z.string().min(0);
const NonEmptyStringSchema = z.string().min(1, "Field is required");
const OptionalStringSchema = z.string().optional().default('');
const NumberStringSchema = z.string().regex(/^\d*\.?\d*$/, "Must be a valid number");

/**
 * Product information schema for validating QC Label ProductInfo
 * Used in adaptProductInfo function (line 94-108 in GRNLabelCard.tsx)
 */
export const ProductInfoSchema = z.object({
  code: StringSchema.describe("Product code"),
  description: StringSchema.describe("Product description"),
  // Additional fields that might come from QC system
  weight: OptionalStringSchema.describe("Product weight"),
  unit: OptionalStringSchema.describe("Weight unit"),
  category: OptionalStringSchema.describe("Product category"),
}).strict();

/**
 * Refined schema for GRN-specific product info
 * Used as the output of adaptProductInfo function
 */
export const GrnProductInfoSchema = z.object({
  code: NonEmptyStringSchema.describe("Product code"),
  description: NonEmptyStringSchema.describe("Product description"),
});

/**
 * Supplier information schema for validating supplier data
 * Used in handleSupplierInfoChange function (line 198-210 in GRNLabelCard.tsx)
 */
export const SupplierInfoSchema = z.object({
  supplier_code: StringSchema.describe("Supplier code"),
  supplier_name: StringSchema.describe("Supplier name"),
  // Additional supplier fields that might be present
  supplier_address: OptionalStringSchema.describe("Supplier address"),
  supplier_contact: OptionalStringSchema.describe("Supplier contact"),
  supplier_email: z.string().email().optional().describe("Supplier email"),
  supplier_phone: OptionalStringSchema.describe("Supplier phone"),
}).strict();

/**
 * Refined schema for GRN-specific supplier info
 * Used in the state management system
 */
export const GrnSupplierInfoSchema = z.object({
  code: NonEmptyStringSchema.describe("Supplier code"),
  name: NonEmptyStringSchema.describe("Supplier name"),
});

/**
 * Form data validation schema
 * Validates the main form fields in GRNLabelCard
 */
export const GrnFormDataSchema = z.object({
  grnNumber: NonEmptyStringSchema.describe("GRN number"),
  materialSupplier: NonEmptyStringSchema.describe("Material supplier"),
  productCode: NonEmptyStringSchema.describe("Product code"),
  // Additional form fields
  batchNumber: OptionalStringSchema.describe("Batch number"),
  expiryDate: OptionalStringSchema.describe("Expiry date"),
  notes: OptionalStringSchema.describe("Additional notes"),
});

/**
 * Pallet type schema
 * Validates pallet type selections and weights
 */
export const PalletTypeSchema = z.object({
  whiteDry: NumberStringSchema.default(''),
  whiteWet: NumberStringSchema.default(''),
  chepDry: NumberStringSchema.default(''),
  chepWet: NumberStringSchema.default(''),
  euro: NumberStringSchema.default(''),
  notIncluded: NumberStringSchema.default(''),
}).strict();

/**
 * Package type schema
 * Validates package type selections and quantities
 */
export const PackageTypeSchema = z.object({
  still: NumberStringSchema.default(''),
  bag: NumberStringSchema.default(''),
  tote: NumberStringSchema.default(''),
  octo: NumberStringSchema.default(''),
  notIncluded: NumberStringSchema.default(''),
}).strict();

/**
 * Label mode validation
 */
export const LabelModeSchema = z.enum(['qty', 'weight'] as const);

/**
 * Gross weights validation schema
 * Validates the array of weight inputs
 */
export const GrossWeightsSchema = z.array(NumberStringSchema).min(1, "At least one weight is required");

/**
 * Progress state validation
 */
export const ProgressStateSchema = z.object({
  current: z.number().int().min(0),
  total: z.number().int().min(0),
  status: z.enum(['idle', 'processing', 'completed', 'error'] as const),
});

/**
 * Complete GRN state validation schema
 * Validates the entire state object from useGrnFormReducer
 */
export const GrnStateSchema = z.object({
  formData: GrnFormDataSchema,
  labelMode: LabelModeSchema,
  palletType: PalletTypeSchema,
  packageType: PackageTypeSchema,
  grossWeights: GrossWeightsSchema,
  productInfo: GrnProductInfoSchema.nullable(),
  supplierInfo: GrnSupplierInfoSchema.nullable(),
  progress: ProgressStateSchema,
  ui: z.object({
    isProcessing: z.boolean(),
    isClockNumberDialogOpen: z.boolean(),
    supplierError: z.string().nullable(),
  }),
});

/**
 * API response validation schemas
 */

/**
 * Validates responses from product lookup APIs
 */
export const ProductLookupResponseSchema = z.object({
  success: z.boolean(),
  data: ProductInfoSchema.optional(),
  error: z.string().optional(),
});

/**
 * Validates responses from supplier lookup APIs
 */
export const SupplierLookupResponseSchema = z.object({
  success: z.boolean(),
  data: SupplierInfoSchema.optional(),
  error: z.string().optional(),
});

/**
 * Validates print request responses
 */
export const PrintRequestResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  labelCount: z.number().int().min(0).optional(),
  errors: z.array(z.string()).optional(),
});

/**
 * Type exports for use in components
 */
export type ProductInfo = z.infer<typeof ProductInfoSchema>;
export type GrnProductInfo = z.infer<typeof GrnProductInfoSchema>;
export type SupplierInfo = z.infer<typeof SupplierInfoSchema>;
export type GrnSupplierInfo = z.infer<typeof GrnSupplierInfoSchema>;
export type GrnFormData = z.infer<typeof GrnFormDataSchema>;
export type GrnState = z.infer<typeof GrnStateSchema>;
export type ProductLookupResponse = z.infer<typeof ProductLookupResponseSchema>;
export type SupplierLookupResponse = z.infer<typeof SupplierLookupResponseSchema>;
export type PrintRequestResponse = z.infer<typeof PrintRequestResponseSchema>;

/**
 * Validation helper functions
 */

/**
 * Safely parses and validates product information from unknown data
 * Replacement for the adaptProductInfo function's manual type checking
 */
export function validateProductInfo(data: unknown): GrnProductInfo | null {
  try {
    const parsed = ProductInfoSchema.parse(data);
    return GrnProductInfoSchema.parse({
      code: parsed.code,
      description: parsed.description,
    });
  } catch (error) {
    console.warn('Product info validation failed:', error);
    return null;
  }
}

/**
 * Safely parses and validates supplier information from unknown data
 * Replacement for handleSupplierInfoChange's manual type checking
 */
export function validateSupplierInfo(data: unknown): GrnSupplierInfo | null {
  try {
    const parsed = SupplierInfoSchema.parse(data);
    return GrnSupplierInfoSchema.parse({
      code: parsed.supplier_code,
      name: parsed.supplier_name,
    });
  } catch (error) {
    console.warn('Supplier info validation failed:', error);
    return null;
  }
}

/**
 * Validates a complete GRN form state
 */
export function validateGrnState(data: unknown): GrnState | null {
  try {
    return GrnStateSchema.parse(data);
  } catch (error) {
    console.warn('GRN state validation failed:', error);
    return null;
  }
}

/**
 * Validates API responses with proper error handling
 */
export function validateApiResponse<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  context: string
): T | null {
  try {
    return schema.parse(data);
  } catch (error) {
    console.error(`API response validation failed in ${context}:`, error);
    return null;
  }
}

/**
 * Type guards using Zod validation
 */
export function isValidProductInfo(data: unknown): data is ProductInfo {
  return ProductInfoSchema.safeParse(data).success;
}

export function isValidSupplierInfo(data: unknown): data is SupplierInfo {
  return SupplierInfoSchema.safeParse(data).success;
}

export function isValidGrnFormData(data: unknown): data is GrnFormData {
  return GrnFormDataSchema.safeParse(data).success;
}

/**
 * Partial validation for form updates
 * Allows validating individual form fields during user input
 */
export const PartialGrnFormDataSchema = GrnFormDataSchema.partial();

export function validateFormField(
  field: keyof GrnFormData,
  value: unknown
): boolean {
  const fieldSchema = GrnFormDataSchema.shape[field];
  return fieldSchema.safeParse(value).success;
}

/**
 * Weight validation helpers
 */
export function validateGrossWeight(weight: string): boolean {
  return NumberStringSchema.safeParse(weight).success;
}

export function validateGrossWeights(weights: unknown): string[] {
  const result = GrossWeightsSchema.safeParse(weights);
  return result.success ? result.data : [];
}

/**
 * Clock number validation
 */
export const ClockNumberSchema = z.string()
  .min(1, "Clock number is required")
  .regex(/^[a-zA-Z0-9]+$/, "Clock number must be alphanumeric");

export function validateClockNumber(clockNumber: unknown): string | null {
  const result = ClockNumberSchema.safeParse(clockNumber);
  return result.success ? result.data : null;
}