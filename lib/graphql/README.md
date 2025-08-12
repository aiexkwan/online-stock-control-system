# GraphQL Schema Architecture Documentation

## Overview
This document outlines the robust GraphQL architecture designed to prevent database/schema mismatches and ensure long-term maintainability of the NewPennine WMS GraphQL layer.

## Architecture Components

### 1. Field Mapping System
**Location**: `lib/graphql/config/field-mappings.ts`

The field mapping system provides a configuration-driven approach to handle differences between GraphQL schema expectations and actual database column names.

**Key Features**:
- Declarative field mappings between GraphQL and database
- Support for computed fields when database columns don't exist
- Transformation functions for data type conversions
- Validation of required fields

**Usage**:
```typescript
import { FieldMapper } from '../config/field-mappings';

// Map GraphQL fields to database columns
const dbColumns = FieldMapper.mapSelectFields('record_transfer', ['operatorId', 'action']);
// Returns: ['operator_id', 'action'] (with computed field support)

// Transform database result to GraphQL format
const transformed = FieldMapper.transformResult('record_transfer', dbResult);
```

### 2. Schema Validation Middleware
**Location**: `lib/graphql/middleware/schema-validation.ts`

Runtime validation system that catches database schema mismatches before they cause resolver failures.

**Key Features**:
- Startup validation of database schema consistency
- Runtime validation per query execution
- Caching of validation results for performance
- Different behavior for development vs production environments

**Usage**:
```typescript
import { withSchemaValidation } from '../middleware/schema-validation';

// Wrap resolver with schema validation
const resolver = withSchemaValidation(async (parent, args, context, info) => {
  // Your resolver logic here
});
```

### 3. Database Adapter Pattern
**Location**: `lib/graphql/adapters/database-adapter.ts`

Clean abstraction layer between GraphQL resolvers and database operations, handling field mapping automatically.

**Key Features**:
- Type-safe database operations
- Automatic field mapping
- Built-in error handling with graceful degradation
- Performance optimization with proper querying

**Usage**:
```typescript
import { AdapterFactory } from '../adapters/database-adapter';

const adapter = await AdapterFactory.createDepartmentAdapter();
const stats = await adapter.fetchDepartmentStats('WAREHOUSE', timeRange);
```

### 4. Type Safety System
**Location**: `lib/graphql/types/database-types.ts`

Comprehensive TypeScript interfaces ensuring type safety between database and GraphQL layers.

**Key Features**:
- Separate interfaces for database vs GraphQL formats
- Type transformers for conversion between formats
- Runtime type guards for validation
- Custom error types for better error handling

### 5. Migration System
**Location**: `lib/graphql/migrations/schema-fixes.sql`

Database migration scripts to fix current schema mismatches and prevent future issues.

**Key Features**:
- Adds missing columns (like `action` to `record_transfer`)
- Creates compatibility views for GraphQL
- Implements data consistency triggers
- Provides verification queries

## Implementation Guide

### Step 1: Apply Database Migrations
```sql
-- Run the migration script
\i lib/graphql/migrations/schema-fixes.sql

-- Verify migration success
SELECT * FROM check_graphql_schema_consistency();
```

### Step 2: Update Resolvers
Replace existing resolvers with the new adapter-based approach:

```typescript
// Old approach (direct database access)
const { data, error } = await supabase
  .from('record_transfer')
  .select('user_id, action') // ❌ Wrong field names
  .eq('id', id);

// New approach (adapter-based)
const adapter = await AdapterFactory.createDepartmentAdapter();
const result = await adapter.fetchDepartmentStats('WAREHOUSE', timeRange); // ✅ Field mapping handled
```

### Step 3: Enable Schema Validation
Wrap all resolvers with schema validation:

```typescript
import { withSchemaValidation } from '../middleware/schema-validation';

export const resolvers = {
  Query: {
    departmentWarehouseData: withSchemaValidation(async (parent, args, context, info) => {
      // Resolver logic here
    })
  }
};
```

### Step 4: Configure Field Mappings
Add new table mappings as needed:

```typescript
// In field-mappings.ts
export const DATABASE_FIELD_MAPPINGS = {
  your_new_table: {
    tableName: 'your_new_table',
    fields: [
      { graphqlField: 'id', dbColumn: 'table_id', required: true },
      { graphqlField: 'name', dbColumn: 'display_name' }
    ],
    computedFields: [
      {
        graphqlField: 'status',
        computation: (row) => row.is_active ? 'ACTIVE' : 'INACTIVE',
        dependencies: ['is_active']
      }
    ]
  }
};
```

## Best Practices

### 1. Schema-First Design
- Define GraphQL schema independently of database structure
- Use field mappings to bridge the gap
- Keep GraphQL field names consistent and meaningful

### 2. Error Handling Strategy
- Always provide graceful degradation
- Use `Promise.allSettled()` for parallel operations
- Log errors for monitoring but don't fail the entire query
- Provide default values for missing data

### 3. Performance Considerations
- Use DataLoader pattern for N+1 prevention
- Cache schema validation results
- Use database views for complex joins
- Index frequently queried columns

### 4. Testing Strategy
- Unit tests for field mappings
- Integration tests for adapters
- Schema validation tests
- End-to-end tests for complete workflows

### 5. Monitoring and Observability
- Log schema validation failures
- Monitor query performance
- Track field mapping usage
- Alert on database schema changes

## Development Workflow

### Adding New GraphQL Fields
1. Add field to GraphQL schema
2. Add field mapping in `field-mappings.ts`
3. Update relevant adapter methods
4. Add tests for new functionality
5. Run schema validation to ensure consistency

### Handling Database Changes
1. Update field mappings to reflect changes
2. Create migration script if needed
3. Update type definitions
4. Test all affected resolvers
5. Deploy with proper rollback plan

### Debugging Schema Issues
1. Check schema validation results:
   ```typescript
   const validator = SchemaValidator.getInstance();
   const health = await validator.getHealthStatus();
   console.log(health);
   ```

2. Verify field mappings:
   ```typescript
   const columns = FieldMapper.mapSelectFields('table_name', ['field1', 'field2']);
   console.log('Mapped columns:', columns);
   ```

3. Test adapter functionality:
   ```typescript
   const adapter = await AdapterFactory.createDepartmentAdapter();
   const result = await adapter.fetchDepartmentStats('WAREHOUSE', timeRange);
   console.log('Adapter result:', result);
   ```

## Migration Checklist

- [ ] Apply database migration scripts
- [ ] Update all affected resolvers to use adapters
- [ ] Add schema validation to all resolvers
- [ ] Configure field mappings for all tables
- [ ] Update type definitions
- [ ] Add comprehensive tests
- [ ] Update documentation
- [ ] Set up monitoring and alerting
- [ ] Plan rollback procedures

## Future Enhancements

### 1. Automated Schema Sync
- Automatic detection of database schema changes
- Generation of field mappings from schema introspection
- Migration script generation

### 2. GraphQL Schema Versioning
- Support for multiple schema versions
- Gradual migration between versions
- Backward compatibility guarantees

### 3. Advanced Field Mapping
- Conditional field mappings based on context
- Support for complex data transformations
- Integration with external data sources

### 4. Performance Optimization
- Query plan optimization
- Adaptive caching strategies
- Connection pooling and resource management

This architecture provides a robust, maintainable, and scalable foundation for the GraphQL layer that will prevent future database/schema mismatches while ensuring optimal performance and developer experience.