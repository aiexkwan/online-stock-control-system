/**
 * GraphQL Schema Validator
 * Week 1.2: Schema Design Principles Enhancement
 * Date: 2025-07-03
 * 
 * This validator checks if our GraphQL schema follows the established design principles.
 */

import { 
  NamingConventions, 
  PaginationRules, 
  SchemaBestPracticesChecker,
  PerformanceGuidelines,
  CommonValidationRules,
  CURRENT_SCHEMA_VERSION
} from './schema-design-principles';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface ValidationError {
  type: 'NAMING' | 'PAGINATION' | 'ERROR_HANDLING' | 'PERFORMANCE' | 'VALIDATION';
  severity: 'ERROR' | 'WARNING';
  path: string;
  message: string;
  fix?: string;
}

export interface ValidationWarning {
  type: string;
  path: string;
  message: string;
  suggestion?: string;
}

export class SchemaValidator {
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];
  private suggestions: string[] = [];

  /**
   * Validate the entire GraphQL schema
   */
  validateSchema(schemaString: string): ValidationResult {
    this.reset();
    
    try {
      // Parse and validate schema structure
      this.validateSchemaStructure(schemaString);
      
      // Validate naming conventions
      this.validateNamingConventions(schemaString);
      
      // Validate pagination patterns
      this.validatePaginationPatterns(schemaString);
      
      // Validate error handling
      this.validateErrorHandling(schemaString);
      
      // Validate performance considerations
      this.validatePerformanceGuidelines(schemaString);
      
      // Check for best practices
      this.validateBestPractices(schemaString);
      
    } catch (error) {
      this.addError('VALIDATION', 'ERROR', 'schema', `Schema parsing failed: ${error.message}`);
    }

    return {
      isValid: this.errors.filter(e => e.severity === 'ERROR').length === 0,
      errors: this.errors,
      warnings: this.warnings,
      suggestions: this.suggestions
    };
  }

  /**
   * Validate schema structure and basic syntax
   */
  private validateSchemaStructure(schema: string): void {
    // Check for required root types
    const requiredTypes = ['Query', 'Mutation', 'Subscription'];
    
    requiredTypes.forEach(type => {
      if (!schema.includes(`type ${type}`)) {
        this.addWarning('STRUCTURE', `schema.${type}`, `Missing ${type} root type`);
      }
    });

    // Check for proper schema definition
    if (!schema.includes('schema {') && !schema.includes('type Query')) {
      this.addError('VALIDATION', 'ERROR', 'schema', 'Schema must define either a schema directive or Query type');
    }
  }

  /**
   * Validate naming conventions
   */
  private validateNamingConventions(schema: string): void {
    // Extract type definitions
    const typeMatches = schema.match(/type\s+(\w+)/g) || [];
    typeMatches.forEach(match => {
      const typeName = match.replace('type ', '');
      const errors = SchemaBestPracticesChecker.validateNaming(typeName, 'TYPE');
      errors.forEach(error => {
        this.addError('NAMING', 'ERROR', `type.${typeName}`, error);
      });
    });

    // Extract field definitions
    const fieldMatches = schema.match(/\s+(\w+)(?:\([^)]*\))?\s*:/g) || [];
    fieldMatches.forEach(match => {
      const fieldName = match.trim().split(/[\(\:]/)[0];
      if (fieldName && !['ID', 'String', 'Int', 'Float', 'Boolean'].includes(fieldName)) {
        const errors = SchemaBestPracticesChecker.validateNaming(fieldName, 'FIELD');
        errors.forEach(error => {
          this.addError('NAMING', 'ERROR', `field.${fieldName}`, error);
        });
      }
    });

    // Extract Query/Mutation definitions
    this.validateOperationNaming(schema, 'Query');
    this.validateOperationNaming(schema, 'Mutation');
  }

  private validateOperationNaming(schema: string, operationType: string): void {
    const operationRegex = new RegExp(`type\\s+${operationType}\\s*{([^}]*)}`, 'g');
    const match = operationRegex.exec(schema);
    
    if (match) {
      const operationBody = match[1];
      const operations = operationBody.match(/\s+(\w+)(?:\([^)]*\))?\s*:/g) || [];
      
      operations.forEach(op => {
        const operationName = op.trim().split(/[\(\:]/)[0];
        if (operationName) {
          const errors = SchemaBestPracticesChecker.validateNaming(
            operationName, 
            operationType.toUpperCase() as 'QUERY' | 'MUTATION'
          );
          errors.forEach(error => {
            this.addError('NAMING', 'ERROR', `${operationType.toLowerCase()}.${operationName}`, error);
          });
        }
      });
    }
  }

  /**
   * Validate pagination patterns
   */
  private validatePaginationPatterns(schema: string): void {
    // Check for Connection types
    const connectionTypes = schema.match(/type\s+(\w+Connection)/g) || [];
    const hasConnections = connectionTypes.length > 0;

    if (!hasConnections) {
      this.addWarning('PAGINATION', 'schema', 'No Connection types found. Consider using Relay-style pagination.');
    }

    // Validate Connection type structure
    connectionTypes.forEach(match => {
      const typeName = match.replace('type ', '');
      this.validateConnectionType(schema, typeName);
    });

    // Check for list queries without pagination
    const listQueries = schema.match(/\s+(\w+s)(?:\([^)]*\))?\s*:\s*\[/g) || [];
    listQueries.forEach(match => {
      const queryName = match.trim().split(/[\(\:]/)[0];
      this.addWarning(
        'PAGINATION', 
        `query.${queryName}`, 
        'List query should use Connection pattern for pagination',
        'Consider changing return type to a Connection'
      );
    });
  }

  private validateConnectionType(schema: string, typeName: string): void {
    const typeRegex = new RegExp(`type\\s+${typeName}\\s*{([^}]*)}`, 'g');
    const match = typeRegex.exec(schema);
    
    if (match) {
      const typeBody = match[1];
      const requiredFields = ['edges', 'pageInfo', 'totalCount'];
      
      requiredFields.forEach(field => {
        if (!typeBody.includes(field)) {
          this.addError(
            'PAGINATION', 
            'ERROR', 
            `type.${typeName}.${field}`, 
            `Connection type missing required field: ${field}`
          );
        }
      });
    }
  }

  /**
   * Validate error handling patterns
   */
  private validateErrorHandling(schema: string): void {
    // Check for Error types
    const errorTypes = ['UserError', 'SystemError'];
    const hasErrorTypes = errorTypes.some(type => schema.includes(`type ${type}`));

    if (!hasErrorTypes) {
      this.addWarning('ERROR_HANDLING', 'schema', 'No error types defined. Consider adding UserError and SystemError types.');
    }

    // Check for union types with errors
    const unionTypes = schema.match(/union\s+(\w+)\s*=\s*([^}\n]+)/g) || [];
    if (unionTypes.length === 0) {
      this.addWarning('ERROR_HANDLING', 'schema', 'No union types found. Consider using unions for error handling.');
    }

    // Validate that mutations return result unions
    const mutationRegex = /type\s+Mutation\s*{([^}]*)}/g;
    const mutationMatch = mutationRegex.exec(schema);
    
    if (mutationMatch) {
      const mutationBody = mutationMatch[1];
      const mutations = mutationBody.match(/\s+(\w+)(?:\([^)]*\))?\s*:\s*(\w+)/g) || [];
      
      mutations.forEach(mutation => {
        const parts = mutation.trim().split(':');
        const mutationName = parts[0].trim();
        const returnType = parts[1]?.trim();
        
        if (returnType && !returnType.includes('Result') && !returnType.includes('Union')) {
          this.addWarning(
            'ERROR_HANDLING',
            `mutation.${mutationName}`,
            'Mutation should return a result union type for proper error handling',
            'Consider using a Result union type'
          );
        }
      });
    }
  }

  /**
   * Validate performance guidelines
   */
  private validatePerformanceGuidelines(schema: string): void {
    // Check for expensive field patterns
    PerformanceGuidelines.fieldResolution.expensiveFields.forEach(expensiveField => {
      if (schema.includes(expensiveField)) {
        this.addWarning(
          'PERFORMANCE',
          `field.${expensiveField}`,
          `Field '${expensiveField}' may be expensive to resolve`,
          'Consider making this field optional or implementing lazy loading'
        );
      }
    });

    // Check for deeply nested types
    const nestedDepthMatches = schema.match(/type\s+\w+\s*{[^}]*{[^}]*{/g) || [];
    if (nestedDepthMatches.length > 0) {
      this.addWarning(
        'PERFORMANCE',
        'schema',
        'Deep nesting detected in schema',
        'Consider flattening deeply nested structures for better performance'
      );
    }

    // Check for subscription patterns
    const subscriptionRegex = /type\s+Subscription\s*{([^}]*)}/g;
    const subscriptionMatch = subscriptionRegex.exec(schema);
    
    if (subscriptionMatch) {
      const subscriptionCount = (subscriptionMatch[1].match(/\w+\s*:/g) || []).length;
      
      if (subscriptionCount > PerformanceGuidelines.subscriptions.maxConcurrentSubscriptions) {
        this.addWarning(
          'PERFORMANCE',
          'subscription',
          `High number of subscriptions (${subscriptionCount}) may impact performance`,
          'Consider implementing subscription filtering and rate limiting'
        );
      }
    }
  }

  /**
   * Validate general best practices
   */
  private validateBestPractices(schema: string): void {
    // Check for documentation
    const hasDocumentation = schema.includes('"""') || schema.includes('#');
    if (!hasDocumentation) {
      this.addWarning(
        'DOCUMENTATION',
        'schema',
        'Schema lacks documentation',
        'Add descriptions to types and fields using """ or # comments'
      );
    }

    // Check for scalar definitions
    const customScalars = ['DateTime', 'PositiveInt', 'ProductCode'];
    customScalars.forEach(scalar => {
      if (schema.includes(scalar) && !schema.includes(`scalar ${scalar}`)) {
        this.addWarning(
          'VALIDATION',
          `scalar.${scalar}`,
          `Custom scalar '${scalar}' used but not defined`,
          `Add scalar definition: scalar ${scalar}`
        );
      }
    });

    // Check for input validation
    const inputTypes = schema.match(/input\s+(\w+)/g) || [];
    if (inputTypes.length === 0) {
      this.addWarning(
        'VALIDATION',
        'schema',
        'No input types defined',
        'Consider using input types for mutations and complex queries'
      );
    }

    // General suggestions
    this.suggestions.push('Consider implementing query complexity analysis');
    this.suggestions.push('Add rate limiting for mutations and subscriptions');
    this.suggestions.push('Implement field-level caching for frequently accessed data');
    this.suggestions.push('Use DataLoader pattern to prevent N+1 queries');
  }

  /**
   * Helper methods
   */
  private addError(type: ValidationError['type'], severity: 'ERROR' | 'WARNING', path: string, message: string, fix?: string): void {
    this.errors.push({
      type,
      severity,
      path,
      message,
      fix
    });
  }

  private addWarning(type: string, path: string, message: string, suggestion?: string): void {
    this.warnings.push({
      type,
      path,
      message,
      suggestion
    });
  }

  private reset(): void {
    this.errors = [];
    this.warnings = [];
    this.suggestions = [];
  }

  /**
   * Generate validation report
   */
  generateReport(result: ValidationResult): string {
    const lines: string[] = [];
    
    lines.push('='.repeat(60));
    lines.push('GraphQL Schema Validation Report');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Schema Version: ${CURRENT_SCHEMA_VERSION.version}`);
    lines.push('='.repeat(60));
    lines.push('');

    // Summary
    lines.push('SUMMARY:');
    lines.push(`✅ Valid: ${result.isValid ? 'YES' : 'NO'}`);
    lines.push(`❌ Errors: ${result.errors.filter(e => e.severity === 'ERROR').length}`);
    lines.push(`⚠️  Warnings: ${result.warnings.length}`);
    lines.push(`💡 Suggestions: ${result.suggestions.length}`);
    lines.push('');

    // Errors
    if (result.errors.length > 0) {
      lines.push('ERRORS:');
      result.errors.forEach(error => {
        lines.push(`${error.severity === 'ERROR' ? '❌' : '⚠️'} [${error.type}] ${error.path}`);
        lines.push(`   ${error.message}`);
        if (error.fix) {
          lines.push(`   💡 Fix: ${error.fix}`);
        }
        lines.push('');
      });
    }

    // Warnings
    if (result.warnings.length > 0) {
      lines.push('WARNINGS:');
      result.warnings.forEach(warning => {
        lines.push(`⚠️ [${warning.type}] ${warning.path}`);
        lines.push(`   ${warning.message}`);
        if (warning.suggestion) {
          lines.push(`   💡 Suggestion: ${warning.suggestion}`);
        }
        lines.push('');
      });
    }

    // Suggestions
    if (result.suggestions.length > 0) {
      lines.push('SUGGESTIONS:');
      result.suggestions.forEach(suggestion => {
        lines.push(`💡 ${suggestion}`);
      });
      lines.push('');
    }

    lines.push('='.repeat(60));
    
    return lines.join('\n');
  }
}

// Export for use in validation scripts
export default SchemaValidator; 