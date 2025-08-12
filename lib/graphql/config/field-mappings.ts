/**
 * Database Field Mapping Configuration
 * Maps GraphQL schema fields to actual database column names
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface FieldMapping {
  graphqlField: string;
  dbColumn: string;
  transformer?: (value: unknown) => unknown;
  defaultValue?: unknown;
  required?: boolean;
}

export interface TableMapping {
  tableName: string;
  fields: FieldMapping[];
  computedFields?: ComputedField[];
}

export interface ComputedField {
  graphqlField: string;
  computation: (row: Record<string, unknown>) => unknown;
  dependencies: string[]; // Database columns needed for computation
}

/**
 * Field mappings for problematic tables
 */
export const DATABASE_FIELD_MAPPINGS: Record<string, TableMapping> = {
  record_transfer: {
    tableName: 'record_transfer',
    fields: [
      { graphqlField: 'transferDate', dbColumn: 'tran_date', required: true },
      { graphqlField: 'fromLocation', dbColumn: 'f_loc', required: true },
      { graphqlField: 'toLocation', dbColumn: 't_loc', required: true },
      { graphqlField: 'palletNumber', dbColumn: 'plt_num', required: true },
      { graphqlField: 'operatorId', dbColumn: 'operator_id', required: true },
      { graphqlField: 'id', dbColumn: 'uuid', required: true },
    ],
    computedFields: [
      {
        graphqlField: 'action',
        computation: (row) => 'TRANSFERRED', // Default action for transfers
        dependencies: ['f_loc', 't_loc']
      },
      {
        graphqlField: 'actionType',
        computation: (row) => 'MOVEMENT',
        dependencies: []
      }
    ]
  },

  record_palletinfo: {
    tableName: 'record_palletinfo',
    fields: [
      { graphqlField: 'generateTime', dbColumn: 'generate_time', required: true },
      { graphqlField: 'palletNumber', dbColumn: 'plt_num', required: true },
      { graphqlField: 'productCode', dbColumn: 'product_code', required: true },
      { graphqlField: 'series', dbColumn: 'series', required: true },
      { graphqlField: 'remark', dbColumn: 'plt_remark' },
      { graphqlField: 'quantity', dbColumn: 'product_qty', required: true },
      { graphqlField: 'pdfUrl', dbColumn: 'pdf_url' },
    ],
    computedFields: [
      {
        graphqlField: 'action',
        computation: (row) => 'CREATED',
        dependencies: []
      }
    ]
  },

  record_history: {
    tableName: 'record_history',
    fields: [
      { graphqlField: 'timestamp', dbColumn: 'time', required: true },
      { graphqlField: 'operatorId', dbColumn: 'id', required: true },
      { graphqlField: 'action', dbColumn: 'action', required: true },
      { graphqlField: 'palletNumber', dbColumn: 'plt_num', required: true },
      { graphqlField: 'remark', dbColumn: 'remark' },
    ]
  }
};

/**
 * Utility functions for field mapping
 */
export class FieldMapper {
  /**
   * Maps GraphQL fields to database columns for SELECT queries
   */
  static mapSelectFields(tableName: string, graphqlFields: string[]): string[] {
    const mapping = DATABASE_FIELD_MAPPINGS[tableName];
    if (!mapping) {
      console.warn(`No field mapping found for table: ${tableName}`);
      return graphqlFields;
    }

    const dbColumns: string[] = [];
    const computedDependencies = new Set<string>();

    // Add computed field dependencies
    mapping.computedFields?.forEach(cf => {
      if (graphqlFields.includes(cf.graphqlField)) {
        cf.dependencies.forEach(dep => computedDependencies.add(dep));
      }
    });

    // Map regular fields
    graphqlFields.forEach(field => {
      const fieldMapping = mapping.fields.find(f => f.graphqlField === field);
      if (fieldMapping) {
        dbColumns.push(fieldMapping.dbColumn);
      }
    });

    // Add computed dependencies
    for (const dep of computedDependencies) {
      dbColumns.push(dep);
    }

    return [...new Set(dbColumns)]; // Remove duplicates
  }

  /**
   * Transforms database result to GraphQL format
   */
  static transformResult(tableName: string, dbResult: Record<string, unknown>): Record<string, unknown> {
    const mapping = DATABASE_FIELD_MAPPINGS[tableName];
    if (!mapping) {
      return dbResult;
    }

    const transformed: Record<string, unknown> = {};

    // Map regular fields
    mapping.fields.forEach(fieldMapping => {
      const dbValue = dbResult[fieldMapping.dbColumn];
      if (dbValue !== undefined) {
        transformed[fieldMapping.graphqlField] = fieldMapping.transformer 
          ? fieldMapping.transformer(dbValue)
          : dbValue;
      } else if (fieldMapping.defaultValue !== undefined) {
        transformed[fieldMapping.graphqlField] = fieldMapping.defaultValue;
      }
    });

    // Compute derived fields
    mapping.computedFields?.forEach(computedField => {
      transformed[computedField.graphqlField] = computedField.computation(dbResult);
    });

    return transformed;
  }

  /**
   * Validates that required database columns exist
   */
  static async validateTableSchema(
    supabase: SupabaseClient, 
    tableName: string
  ): Promise<{ valid: boolean; missing: string[]; warnings: string[] }> {
    const mapping = DATABASE_FIELD_MAPPINGS[tableName];
    if (!mapping) {
      return { valid: true, missing: [], warnings: [`No mapping defined for ${tableName}`] };
    }

    try {
      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', tableName);

      if (error) throw error;

      const existingColumns = new Set(columns?.map((c: { column_name: string }) => c.column_name) || []);
      const missing: string[] = [];
      const warnings: string[] = [];

      // Check required fields
      mapping.fields
        .filter(f => f.required)
        .forEach(field => {
          if (!existingColumns.has(field.dbColumn)) {
            missing.push(field.dbColumn);
          }
        });

      // Check computed field dependencies
      mapping.computedFields?.forEach(cf => {
        cf.dependencies.forEach(dep => {
          if (!existingColumns.has(dep)) {
            warnings.push(`Computed field '${cf.graphqlField}' depends on missing column '${dep}'`);
          }
        });
      });

      return {
        valid: missing.length === 0,
        missing,
        warnings
      };
    } catch (error) {
      return {
        valid: false,
        missing: [],
        warnings: [`Failed to validate schema for ${tableName}: ${error}`]
      };
    }
  }
}