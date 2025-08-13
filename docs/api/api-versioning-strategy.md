# NewPennine WMS API Versioning Strategy

## Overview

This document outlines the API versioning strategy for the NewPennine WMS platform. Following the successful completion of the Alert System removal (August 2025), this strategy establishes best practices for future API evolution and system cleanup initiatives.

## Versioning Philosophy

### Core Principles
1. **Backwards Compatibility First**: Maintain compatibility whenever possible
2. **Clear Communication**: Transparent deprecation timelines and migration paths
3. **Gradual Migration**: Phased approach to minimize disruption
4. **Developer Experience**: Prioritize ease of migration and adoption
5. **Semantic Versioning**: Predictable version numbering system

### Version Types

| Version Type | Format | Purpose | Breaking Changes | Example |
|--------------|---------|---------|------------------|---------|
| **Major** | `v{N}` | Significant overhauls | Yes | `v1`, `v2` |
| **Minor** | `v{N}.{M}` | New features | No | `v1.1`, `v1.2` |
| **Patch** | `v{N}.{M}.{P}` | Bug fixes | No | `v1.1.1`, `v1.1.2` |

## Current API Architecture

### Current API Architecture Example

```
├── Legacy (No version in URL)
│   ├── /api/inventory/items
│   ├── /api/printing/labels
│   ├── /api/system/health
│   └── /api/auth/login
│
└── V1 (Explicit versioning)
    ├── /api/v1/inventory/items
    ├── /api/v1/printing/labels
    ├── /api/v1/system/health
    └── /api/v1/auth/login
```

### URL Versioning Strategy

**Pattern**: `/api/v{major}/[v{major}.{minor}/]{resource}`

**Examples**:
```
/api/v1/inventory/items        # Major version only
/api/v1.2/inventory/items      # Major.minor for feature releases
/api/v2/inventory/items        # Next major version
```

### Header-Based Versioning (Alternative)

For clients that cannot modify URLs:

```http
GET /api/inventory/items HTTP/1.1
Accept: application/json
API-Version: v1.2
```

## Version Lifecycle Management

### 1. Development Phase
- **Duration**: 4-8 weeks
- **Status**: Internal development and testing
- **Access**: Development environments only
- **Stability**: Unstable, breaking changes expected

### 2. Preview/Beta Phase
- **Duration**: 2-4 weeks
- **Status**: Feature-complete but may have minor changes
- **Access**: Staging environments and opt-in production usage
- **Stability**: Stable for testing, minor breaking changes possible

### 3. Stable Release
- **Duration**: 12-24 months (minimum)
- **Status**: Production-ready with backwards compatibility guarantees
- **Access**: Full production availability
- **Stability**: Backwards compatible within major version

### 4. Deprecated Phase
- **Duration**: 6-12 months
- **Status**: Marked for removal, migration encouraged
- **Access**: Full availability with deprecation warnings
- **Stability**: Bug fixes only, no new features

### 5. End of Life (EOL)
- **Status**: Removed from service
- **Access**: HTTP 410 Gone responses
- **Migration**: Required to newer version

## Deprecation Process

### Phase 1: Deprecation Announcement (6 months before EOL)

**Actions**:
- Update API documentation with deprecation notices
- Add `Deprecated: true` to OpenAPI specifications
- Send notifications to registered API consumers
- Create migration guides and tooling

**Response Headers**:
```http
HTTP/1.1 200 OK
API-Version: legacy
Deprecated: true
Sunset: Wed, 31 Jul 2025 23:59:59 GMT
Link: </docs/migration>; rel="successor-version"
```

**Response Body Enhancement**:
```json
{
  "success": true,
  "data": { ... },
  "_deprecation": {
    "deprecated": true,
    "sunset": "2026-07-31T23:59:59Z",
    "message": "This endpoint is deprecated. Please migrate to /api/v1/inventory/items",
    "migrationGuide": "https://docs.newpennine.com/api/migration/inventory"
  }
}
```

### Phase 2: Active Deprecation (3 months before EOL)

**Actions**:
- Return deprecation warnings in all responses
- Implement rate limiting for deprecated endpoints
- Increase migration support and outreach
- Monitor usage analytics

**Warning Headers**:
```http
HTTP/1.1 200 OK
Warning: 299 - "This API version is deprecated and will be removed on 2025-07-31"
Retry-After: 3600
```

### Phase 3: End of Life

**Actions**:
- Remove endpoint handlers
- Return HTTP 410 Gone with migration information
- Redirect documentation to new versions
- Archive legacy documentation

**EOL Response**:
**Alert System Removal Example**:
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": "Alert System has been permanently removed",
  "code": "SYSTEM_REMOVED",
  "removedOn": "2025-08-13T00:00:00Z",
  "reason": "Security and maintainability improvements",
  "alternatives": {
    "monitoring": "/api/v1/system/health",
    "notifications": "Use external monitoring solutions"
  }
}
```

## Version Support Matrix

### Current Support Status

| Version | Status | Release Date | EOL Date | Support Level |
|---------|--------|--------------|----------|---------------|
| **Legacy** | 🟡 Maintenance | 2022-01-01 | 2026-01-31 | Security fixes only |
| **V1.0** | ✅ Stable | 2024-01-15 | 2026-01-15 | Full support |
| **V1.1** | ✅ Stable | 2024-06-01 | 2026-06-01 | Full support |
| **V1.2** | ✅ Stable | 2024-12-01 | 2026-12-01 | Full support |
| **V2.0** | 🟡 Preview | 2025-06-01 | - | Preview support |

### Support Level Definitions

**Full Support**:
- New feature development
- Bug fixes and security patches
- Performance improvements
- Documentation updates
- Developer support

**Maintenance Support**:
- Bug fixes only
- Security patches
- Critical issue resolution
- Limited developer support

**Security Support**:
- Security patches only
- Critical vulnerability fixes
- No feature development
- Minimal support

**End of Life**:
- No support provided
- Endpoints return 410 Gone
- Documentation archived

## Content Negotiation Strategy

### Accept Header Versioning

Clients can request specific API versions using Accept headers:

```http
GET /api/inventory/items HTTP/1.1
Accept: application/vnd.newpennine.v1+json
```

**Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/vnd.newpennine.v1+json
API-Version: v1.2
```

### Version Precedence Order

1. URL path version (`/api/v1/...`)
2. Custom API-Version header
3. Accept header version
4. Default to latest stable version

### Version Resolution Logic

```typescript
function resolveApiVersion(request: Request): ApiVersion {
  // 1. Check URL path
  const urlVersion = extractVersionFromPath(request.path);
  if (urlVersion) return urlVersion;
  
  // 2. Check API-Version header
  const headerVersion = request.headers.get('API-Version');
  if (headerVersion) return parseVersion(headerVersion);
  
  // 3. Check Accept header
  const acceptVersion = extractVersionFromAccept(request.headers.get('Accept'));
  if (acceptVersion) return acceptVersion;
  
  // 4. Default to latest stable
  return getLatestStableVersion();
}
```

## Migration Strategy Framework

### 1. Change Classification

**Non-Breaking Changes** (Same major version):
- Adding new endpoints
- Adding optional request parameters
- Adding response fields
- Bug fixes
- Performance improvements

**Breaking Changes** (New major version):
- Removing endpoints
- Removing request/response fields
- Changing field types or formats
- Changing HTTP status codes
- Changing authentication requirements

### 2. Migration Tools and Utilities

**API Diff Tool**:
```bash
# Generate API diff between versions
npx newpennine-api-diff v1.0 v1.1 --format=html --output=diff.html

# Check breaking changes
npx newpennine-api-diff v1.0 v2.0 --breaking-only
```

**Migration Assistant**:
```typescript
import { MigrationAssistant } from '@newpennine/api-migration';

const assistant = new MigrationAssistant({
  from: 'legacy',
  to: 'v1',
  module: 'inventory'
});

// Analyze codebase for migration needs
const analysis = await assistant.analyzeCodebase('./src');

// Generate migration report
const report = assistant.generateMigrationPlan(analysis);

// Apply automatic migrations where possible
await assistant.applyAutomaticMigrations(analysis);
```

**Code Transformation Tool**:
```bash
# Transform legacy API calls to v1
npx newpennine-codemod transform-api --from=legacy --to=v1 --module=inventory src/
```

### 3. Testing Strategy

**Contract Testing**:
```typescript
describe('API Contract Tests', () => {
  test('v1 maintains compatibility with v1.0', async () => {
    const v1Response = await apiClient.v1.getInventoryItems();
    const v1_0Response = await apiClient.v1_0.getInventoryItems();
    
    // Verify backwards compatibility
    expect(isCompatible(v1_0Response, v1Response)).toBe(true);
  });
  
  test('v2 provides migration path from v1', async () => {
    const v1Data = await apiClient.v1.getInventoryItems();
    const v2Data = await migrateData(v1Data);
    
    const v2Response = await apiClient.v2.getInventoryItems();
    expect(v2Response).toMatchObject(v2Data);
  });
});
```

**Load Testing Across Versions**:
```javascript
// K6 load test configuration
export let options = {
  scenarios: {
    legacy_load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
      tags: { version: 'legacy' },
    },
    v1_load: {
      executor: 'constant-vus',
      vus: 50, 
      duration: '5m',
      tags: { version: 'v1' },
    },
  },
};
```

## Documentation Strategy

### 1. Version-Specific Documentation

**Directory Structure**:
```
docs/
├── api/
│   ├── legacy/
│   │   ├── inventory-system.md
│   │   └── deprecated-notice.md
│   ├── v1/
│   │   ├── inventory-system.md
│   │   ├── printing-system.md
│   │   └── changelog.md
│   ├── v1.1/
│   │   ├── enhanced-features.md
│   │   └── changelog.md
│   └── v2/  (preview)
│       └── next-generation-api.md
├── migration/
│   ├── legacy-to-v1.md
│   ├── v1-to-v2.md
│   └── alert-system-removal.md
└── versioning/
    └── strategy.md
```

### 2. OpenAPI Specification Versioning

**File Organization**:
```
openapi/
├── legacy/
│   ├── inventory-system.yml
│   └── printing-system.yml
├── v1/
│   ├── inventory-system.yml
│   ├── printing-system.yml
│   └── common/
│       ├── schemas.yml
│       └── responses.yml
└── v1.1/
    ├── enhanced-features.yml
    └── changes.yml
```

**Specification Metadata**:
```yaml
openapi: 3.0.3
info:
  title: NewPennine WMS Inventory System API
  version: 1.2.0
  description: |
    Inventory System API v1.2 with enhanced real-time features.
    
    **Important**: Alert System was permanently removed in August 2025.
    
    **Migration Information**:
    - Migrating from Legacy: See [migration guide](../migration/legacy-to-v1.md)
    - Previous version (v1.1): [changelog](./changelog.md)
  
  contact:
    name: API Support Team
    email: api-support@newpennine.com
  
  x-api-id: inventory-system
  x-lifecycle-stage: stable
  x-supported-until: 2026-01-15
  
servers:
  - url: https://api.newpennine.com/v1
    description: Production server
  - url: https://staging-api.newpennine.com/v1
    description: Staging server
  - url: https://api.newpennine.com/graphql
    description: GraphQL endpoint
```

### 3. Interactive Documentation

**Swagger UI Configuration**:
```typescript
const swaggerConfig = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'NewPennine WMS API',
      version: '1.1.0',
    },
    servers: [
      {
        url: 'https://api.newpennine.com/{version}',
        variables: {
          version: {
            enum: ['v1', 'v1.1'],
            default: 'v1.1'
          }
        }
      }
    ]
  },
  apis: ['./docs/openapi/**/*.yml'],
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'NewPennine WMS API Documentation'
};
```

## Monitoring and Analytics

### 1. Version Usage Analytics

**Metrics Collection**:
```typescript
class ApiVersionAnalytics {
  trackRequest(version: string, endpoint: string, clientId?: string) {
    this.metrics.increment('api.requests.total', {
      version,
      endpoint,
      client_id: clientId || 'unknown'
    });
  }
  
  trackError(version: string, endpoint: string, errorCode: string) {
    this.metrics.increment('api.errors.total', {
      version,
      endpoint,
      error_code: errorCode
    });
  }
  
  trackDeprecationWarning(version: string, endpoint: string) {
    this.metrics.increment('api.deprecation_warnings.total', {
      version,
      endpoint
    });
  }
}
```

**Dashboard Queries**:
```sql
-- Version adoption rates
SELECT 
  version,
  COUNT(*) as request_count,
  COUNT(DISTINCT client_id) as unique_clients,
  AVG(response_time_ms) as avg_response_time
FROM api_requests 
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY version
ORDER BY request_count DESC;

-- Deprecation readiness
SELECT 
  version,
  endpoint,
  COUNT(*) as daily_requests,
  COUNT(DISTINCT client_id) as affected_clients
FROM api_requests 
WHERE version = 'legacy' 
AND timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY version, endpoint
HAVING daily_requests > 100;
```

### 2. Migration Progress Tracking

**Migration Dashboard**:
```typescript
interface MigrationMetrics {
  totalClients: number;
  migratedClients: number;
  legacyTraffic: number;
  v1Traffic: number;
  migrationErrors: number;
  estimatedCompletion: Date;
}

class MigrationTracker {
  async getMigrationStatus(): Promise<MigrationMetrics> {
    const [legacy, v1] = await Promise.all([
      this.getTrafficByVersion('legacy'),
      this.getTrafficByVersion('v1')
    ]);
    
    return {
      totalClients: legacy.uniqueClients + v1.uniqueClients,
      migratedClients: v1.uniqueClients,
      legacyTraffic: legacy.requestCount,
      v1Traffic: v1.requestCount,
      migrationErrors: await this.getMigrationErrorCount(),
      estimatedCompletion: this.estimateCompletionDate(legacy, v1)
    };
  }
}
```

## Future Versioning Roadmap

### Upcoming Versions

**V1.3 (Q4 2025)**:
- Enhanced real-time inventory tracking
- Advanced analytics and reporting
- Improved mobile API support
- Performance optimizations

**V2.0 (Q2 2026)**:
- Complete microservice architecture
- Real-time WebSocket support  
- Multi-tenant architecture
- Event sourcing implementation
- ML-powered inventory predictions

### Long-term Strategy

**Microservice Versioning**:
```
api/
├── inventory/v1/       # Inventory service v1
├── inventory/v2/       # Inventory service v2  
├── printing/v1/        # Printing service v1
├── auth/v1/           # Authentication service v1
├── system/v1/         # System management v1
└── gateway/            # API gateway with routing
```

**API Gateway Configuration**:
```yaml
routes:
  - path: /api/v1/inventory/*
    service: inventory-service-v1
    load_balancer: round_robin
    
  - path: /api/v2/inventory/*
    service: inventory-service-v2
    load_balancer: round_robin
    
  - path: /api/inventory/*  # Legacy redirect
    service: inventory-service-v1
    middleware: 
      - deprecation_warning
      - usage_analytics
      
  - path: /api/alerts/*     # Removed system
    response: 404
    body: '{"error": "Alert System permanently removed", "removedOn": "2025-08-13"}'
```

## Best Practices for Development Teams

### 1. Version-First Development

**Design Principles**:
- Design APIs with future versions in mind
- Use extensible data structures (avoid arrays of primitives)
- Prefer additive changes over breaking changes
- Plan for backwards compatibility from the start

**Code Organization**:
```typescript
// Version-specific controllers
src/
├── controllers/
│   ├── v1/
│   │   ├── InventoryController.ts
│   │   └── PrintingController.ts
│   └── v2/
│       ├── InventoryController.ts
│       └── PrintingController.ts
├── services/
│   ├── InventoryService.ts  # Shared business logic
│   └── PrintingService.ts
└── models/
    ├── v1/
    │   └── InventoryItem.ts
    └── v2/
        └── InventoryItem.ts
```

### 2. Testing Strategy

**Version Compatibility Tests**:
```typescript
describe('API Version Compatibility', () => {
  const versions = ['v1.0', 'v1.1', 'v1.2'];
  
  versions.forEach(version => {
    describe(`Version ${version}`, () => {
      test('maintains backwards compatibility', async () => {
        const client = new ApiClient({ version });
        const response = await client.inventory.getItems();
        
        expect(response).toMatchSchema(InventoryItemsSchema);
        expect(response).toBeBackwardsCompatible();
      });
    });
  });
});
```

### 3. Documentation Requirements

**API Documentation Checklist**:
- [ ] Version clearly indicated in all documentation
- [ ] Breaking changes highlighted and explained
- [ ] Migration guides provided for major versions
- [ ] Deprecation timelines documented
- [ ] Code examples updated for each version
- [ ] Interactive API explorer available

## Conclusion

This versioning strategy provides a framework for managing API evolution while maintaining developer experience and system stability. The successful Alert System removal demonstrates how deprecated systems can be cleanly removed when they pose security risks, serving as a template for future system cleanup initiatives across the NewPennine WMS platform.

### Key Takeaways

1. **Predictable Versioning**: Clear numbering and lifecycle management
2. **Gradual Migration**: Phased deprecation with adequate notice
3. **Developer Support**: Comprehensive tooling and documentation
4. **Monitoring**: Data-driven migration decisions
5. **Future Planning**: Extensible architecture for long-term evolution

---

**Related Documentation**:
- [API Documentation Overview](./README.md)
- [System Cleanup Guidelines](../planning/system-cleanup-guidelines.md)
- [GraphQL Integration Guide](../graphql/README.md)
- [Performance Optimization Guide](../performance/api-optimization.md)