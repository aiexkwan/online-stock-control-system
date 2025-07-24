# ConfigCard GraphQL Resolver Implementation

## Overview
The ConfigCard GraphQL resolver has been implemented to provide a comprehensive configuration management system for the NewPennine stock control system. This implementation follows the established patterns from other card resolvers while adding specific functionality for configuration management.

## Key Features

### 1. **Multi-Scope Configuration**
- **GLOBAL**: System-wide configurations
- **DEPARTMENT**: Department-specific settings
- **USER**: Individual user preferences
- **ROLE**: Role-based configurations

### 2. **Configuration Categories**
- SYSTEM_CONFIG: Core system settings
- USER_PREFERENCES: User-specific preferences
- DEPARTMENT_CONFIG: Department-level settings
- NOTIFICATION_CONFIG: Notification preferences
- API_CONFIG: API-related configurations
- SECURITY_CONFIG: Security settings
- DISPLAY_CONFIG: UI/UX preferences
- WORKFLOW_CONFIG: Business process configurations

### 3. **Data Type Support**
- STRING, NUMBER, BOOLEAN
- JSON objects and ARRAY
- DATE values
- COLOR (hex format validation)
- URL (with validation)

### 4. **Access Control**
- Five access levels: PUBLIC, AUTHENTICATED, DEPARTMENT, ADMIN, SUPER_ADMIN
- Row-level security (RLS) policies
- Permission-based filtering
- Inherited configurations with proper access control

### 5. **Configuration History**
- Full audit trail of all changes
- Previous/new value tracking
- Change metadata and reasons
- User attribution

### 6. **Import/Export**
- Multiple format support: JSON, YAML, ENV, INI
- Batch import with validation
- Overwrite protection
- Format conversion

### 7. **Templates**
- Pre-defined configuration sets
- Public/private templates
- Usage tracking
- Easy application to new scopes

## Implementation Details

### File Structure
```
/lib/graphql/
├── resolvers/
│   ├── config.resolver.ts    # Main resolver implementation
│   └── index.ts              # Updated to include config resolver
├── schema/
│   └── config.ts             # GraphQL schema definition
└── /lib/sql/
    └── config-tables.sql     # Database schema
```

### Database Tables
1. **system_configs**: Main configuration storage
2. **config_history**: Change audit trail
3. **config_templates**: Reusable configuration sets

### Key Services
- **ConfigService**: Singleton service managing all config operations
- **Caching**: 5-minute cache for read operations
- **Validation**: Type checking and custom validation rules
- **Permission checking**: RBAC integration

## GraphQL Queries

### configCardData
```graphql
query GetConfigCardData($input: ConfigCardInput!) {
  configCardData(input: $input) {
    configs {
      id
      key
      value
      category
      scope
      isEditable
    }
    summary {
      totalConfigs
      editableConfigs
    }
    permissions {
      canWrite
      canManageGlobal
    }
  }
}
```

### configItem
```graphql
query GetConfigItem($key: String!, $scope: ConfigScope!, $scopeId: String) {
  configItem(key: $key, scope: $scope, scopeId: $scopeId) {
    id
    value
    defaultValue
    validation
  }
}
```

## GraphQL Mutations

### updateConfig
```graphql
mutation UpdateConfig($input: ConfigUpdateInput!) {
  updateConfig(input: $input) {
    id
    value
    updatedAt
  }
}
```

### batchUpdateConfigs
```graphql
mutation BatchUpdate($input: ConfigBatchUpdateInput!) {
  batchUpdateConfigs(input: $input) {
    succeeded
    failed
    errors {
      configId
      error
    }
  }
}
```

### Import/Export
```graphql
mutation ExportConfigs($category: ConfigCategory, $format: ExportFormat!) {
  exportConfigs(category: $category, format: $format)
}

mutation ImportConfigs($data: String!, $format: ExportFormat!) {
  importConfigs(data: $data, format: $format) {
    succeeded
    failed
  }
}
```

## Usage Examples

### Reading User Preferences
```typescript
const { data } = await apolloClient.query({
  query: CONFIG_CARD_DATA,
  variables: {
    input: {
      category: 'USER_PREFERENCES',
      scope: 'USER',
      userId: currentUser.id
    }
  }
});
```

### Updating a Configuration
```typescript
const { data } = await apolloClient.mutate({
  mutation: UPDATE_CONFIG,
  variables: {
    input: {
      id: configId,
      value: newValue,
      metadata: { reason: 'User preference update' }
    }
  }
});
```

### Applying a Template
```typescript
const { data } = await apolloClient.mutate({
  mutation: APPLY_CONFIG_TEMPLATE,
  variables: {
    templateId: selectedTemplate.id,
    scope: 'DEPARTMENT',
    scopeId: departmentId
  }
});
```

## Security Considerations

1. **Row-Level Security**: All database operations respect RLS policies
2. **Permission Checking**: Every operation validates user permissions
3. **Value Masking**: Sensitive configs are masked for unauthorized users
4. **Audit Trail**: All changes are logged with user attribution
5. **Validation**: Input validation prevents malformed configurations

## Performance Optimizations

1. **Caching**: 5-minute cache for read operations
2. **Batch Operations**: Efficient bulk updates
3. **Indexed Queries**: Database indexes on key lookup fields
4. **Lazy Loading**: History loaded on demand
5. **Selective Fields**: GraphQL allows requesting only needed fields

## Migration from Legacy Systems

The resolver supports migration from:
- localStorage (browser storage)
- Dashboard settings service
- Legacy widget configurations
- Department selector localStorage

## Future Enhancements

1. **Real-time Subscriptions**: Live config updates
2. **Version Control**: Config versioning and rollback
3. **Conflict Resolution**: Multi-user edit handling
4. **Advanced Validation**: Schema-based validation
5. **Performance Metrics**: Config access analytics

## Testing

### Unit Tests
- Validation logic
- Permission checking
- Data transformation

### Integration Tests
- Database operations
- GraphQL queries/mutations
- Cache behavior

### E2E Tests
- Full configuration workflows
- Import/export functionality
- Template application

## Deployment Notes

1. **Database Migration**: Run `config-tables.sql` before deployment
2. **Environment Variables**: No additional env vars required
3. **Dependencies**: Requires `js-yaml` package (already installed)
4. **Permissions**: Ensure RLS policies are applied
5. **Initial Data**: Default configs are inserted automatically

## Support

For issues or questions regarding the ConfigCard resolver:
1. Check error logs in resolver error handlers
2. Verify database permissions and RLS policies
3. Ensure GraphQL schema is up to date
4. Contact the development team for assistance