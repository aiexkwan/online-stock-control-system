/**
 * Schema Validation Middleware
 * Validates database schema consistency with GraphQL expectations
 */

import { GraphQLError } from 'graphql';
import { createClient } from '../../../app/utils/supabase/server';
import { DATABASE_FIELD_MAPPINGS, FieldMapper } from '../config/field-mappings';

export interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingColumns: Record<string, string[]>;
}

export class SchemaValidator {
  private static instance: SchemaValidator;
  private validationCache = new Map<
    string,
    { result: SchemaValidationResult; timestamp: number }
  >();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): SchemaValidator {
    if (!SchemaValidator.instance) {
      SchemaValidator.instance = new SchemaValidator();
    }
    return SchemaValidator.instance;
  }

  /**
   * Validates all configured table schemas
   */
  async validateAllSchemas(): Promise<SchemaValidationResult> {
    const cacheKey = 'all_schemas';
    const cached = this.validationCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result;
    }

    const supabase = await createClient();
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingColumns: Record<string, string[]> = {};
    let valid = true;

    for (const [tableName, _mapping] of Object.entries(DATABASE_FIELD_MAPPINGS)) {
      try {
        const validation = await FieldMapper.validateTableSchema(supabase, tableName);

        if (!validation.valid) {
          valid = false;
          errors.push(`Table ${tableName}: Missing required columns`);
          missingColumns[tableName] = validation.missing;
        }

        warnings.push(...validation.warnings);
      } catch (error) {
        valid = false;
        errors.push(
          `Failed to validate ${tableName}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    const result: SchemaValidationResult = {
      valid,
      errors,
      warnings,
      missingColumns,
    };

    // Cache the result
    this.validationCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });

    return result;
  }

  /**
   * Validates a specific table schema
   */
  async validateTableSchema(tableName: string): Promise<SchemaValidationResult> {
    const cacheKey = `table_${tableName}`;
    const cached = this.validationCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result;
    }

    const supabase = await createClient();

    try {
      const validation = await FieldMapper.validateTableSchema(supabase, tableName);

      const result: SchemaValidationResult = {
        valid: validation.valid,
        errors: validation.valid
          ? []
          : [`Missing columns in ${tableName}: ${validation.missing.join(', ')}`],
        warnings: validation.warnings,
        missingColumns: validation.valid ? {} : { [tableName]: validation.missing },
      };

      this.validationCache.set(cacheKey, {
        result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      const result: SchemaValidationResult = {
        valid: false,
        errors: [
          `Failed to validate ${tableName}: ${error instanceof Error ? error.message : String(error)}`,
        ],
        warnings: [],
        missingColumns: {},
      };

      return result;
    }
  }

  /**
   * Middleware function to validate schema before resolver execution
   */
  static createValidationMiddleware() {
    const validator = SchemaValidator.getInstance();

    interface GraphQLResolverInfo {
      fieldName: string;
    }

    return async (
      resolve: (
        root: unknown,
        args: unknown,
        context: unknown,
        info: GraphQLResolverInfo
      ) => Promise<unknown>,
      root: unknown,
      args: unknown,
      context: unknown,
      info: GraphQLResolverInfo
    ) => {
      // Extract table names from the GraphQL operation
      const tablesToValidate = SchemaValidator.extractTableNames(info);

      // Validate relevant tables
      for (const tableName of tablesToValidate) {
        const validation = await validator.validateTableSchema(tableName);

        if (!validation.valid) {
          console.error(`Schema validation failed for ${tableName}:`, validation.errors);

          // In production, log error but don't fail
          if (process.env.NODE_ENV === 'production') {
            console.error('Schema mismatch detected:', validation);
          } else {
            // In development, throw error to alert developers
            throw new GraphQLError(`Schema validation failed: ${validation.errors.join(', ')}`, {
              extensions: {
                code: 'SCHEMA_VALIDATION_ERROR',
                details: validation,
              },
            });
          }
        }

        // Log warnings
        if (validation.warnings.length > 0) {
          console.warn(`Schema warnings for ${tableName}:`, validation.warnings);
        }
      }

      return resolve(root, args, context, info);
    };
  }

  /**
   * Extracts table names from GraphQL info object
   */
  private static extractTableNames(info: { fieldName: string }): string[] {
    const tables = new Set<string>();

    // Simple heuristic: check resolver name and field selections
    const resolverName = info.fieldName;

    // Map resolver names to tables (this could be more sophisticated)
    const resolverTableMap: Record<string, string[]> = {
      departmentInjectionData: ['record_palletinfo', 'record_history'],
      departmentPipeData: ['record_palletinfo', 'record_history'],
      departmentWarehouseData: ['record_transfer', 'record_palletinfo', 'record_history'],
      palletHistoryByProduct: ['record_history', 'record_palletinfo'],
      palletHistoryByNumber: ['record_history', 'record_palletinfo'],
      transferTimeFlow: ['record_transfer', 'record_history'],
    };

    const relatedTables = resolverTableMap[resolverName];
    if (relatedTables) {
      relatedTables.forEach(table => tables.add(table));
    }

    return Array.from(tables);
  }

  /**
   * Health check endpoint for schema validation
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: SchemaValidationResult;
    timestamp: Date;
  }> {
    const validation = await this.validateAllSchemas();

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (validation.valid && validation.warnings.length === 0) {
      status = 'healthy';
    } else if (validation.valid && validation.warnings.length > 0) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      details: validation,
      timestamp: new Date(),
    };
  }

  /**
   * Clear validation cache (useful for testing)
   */
  clearCache(): void {
    this.validationCache.clear();
  }
}

/**
 * Utility function to create schema-aware resolver
 */
export function withSchemaValidation<
  TRoot = unknown,
  TArgs = unknown,
  TContext = unknown,
  TResult = unknown,
>(
  resolver: (
    root: TRoot,
    args: TArgs,
    context: TContext,
    info: { fieldName: string }
  ) => Promise<TResult>
) {
  const validationMiddleware = SchemaValidator.createValidationMiddleware();

  return async (root: TRoot, args: TArgs, context: TContext, info: { fieldName: string }) => {
    return validationMiddleware(
      () => resolver(root, args, context, info) as Promise<unknown>,
      root,
      args,
      context,
      info
    ) as Promise<TResult>;
  };
}
