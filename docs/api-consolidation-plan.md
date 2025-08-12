# API Consolidation Plan
## Project Overview
Date: 2025-08-11
Status: In Progress

### Current Structure
```
/api/
├── health/           # Basic health check (7 dependencies)
├── v1/              # Full monitoring suite (12 endpoints, 30+ dependencies)
│   ├── alerts/      # Alert management
│   ├── cache/       # Cache metrics
│   ├── health/      # Enhanced health checks
│   └── metrics/     # Performance metrics
└── v2/              # Simplified version (1 endpoint, 2 dependencies)
    └── health/      # Enhanced health with metrics
```

### Target Structure
```
/api/
├── health/          # Keep basic health check (unchanged)
├── monitoring/      # Consolidated monitoring endpoints
│   ├── alerts/      # From v1/alerts
│   ├── cache/       # From v1/cache
│   ├── metrics/     # From v1/metrics
│   └── deep/        # From v1/health/deep
└── [redirects]      # Backward compatibility layer
```

## Migration Strategy

### Phase 1: Analysis and Planning ✅
- [x] Map all existing endpoints
- [x] Identify dependencies
- [x] Create migration plan

### Phase 2: Create New Structure
- [ ] Create /api/monitoring directory structure
- [ ] Move v1 endpoints to new locations
- [ ] Update imports and references

### Phase 3: Backward Compatibility
- [ ] Create redirect middleware
- [ ] Map old routes to new routes
- [ ] Test all existing integrations

### Phase 4: Cleanup
- [ ] Remove v2 endpoints
- [ ] Remove v1 directory
- [ ] Update documentation

## Endpoint Mapping

### Health Endpoints
| Current Path | New Path | Action |
|-------------|----------|--------|
| /api/health | /api/health | Keep as-is |
| /api/v1/health | /api/monitoring/health | Move & redirect |
| /api/v1/health/deep | /api/monitoring/deep | Move & redirect |
| /api/v2/health | - | Remove (duplicate functionality) |

### Alert Endpoints
| Current Path | New Path | Action |
|-------------|----------|--------|
| /api/v1/alerts/config | /api/alerts/config | Move & redirect |
| /api/v1/alerts/history | /api/alerts/history | Move & redirect |
| /api/v1/alerts/notifications | /api/alerts/notifications | Move & redirect |
| /api/v1/alerts/rules | /api/alerts/rules | Move & redirect |
| /api/v1/alerts/rules/[id] | /api/alerts/rules/[id] | Move & redirect |
| /api/v1/alerts/rules/[id]/test | /api/alerts/rules/[id]/test | Move & redirect |

### Metrics Endpoints
| Current Path | New Path | Action |
|-------------|----------|--------|
| /api/v1/metrics | /api/metrics | Move & redirect |
| /api/v1/metrics/business | /api/metrics/business | Move & redirect |
| /api/v1/metrics/database | /api/metrics/database | Move & redirect |
| /api/v1/cache/metrics | /api/cache/metrics | Move & redirect |

## Files Requiring Updates

### Critical Dependencies
1. **middleware.ts** - References all three API versions
2. **lib/api/unified-api-client.ts** - Main API client
3. **types/api/endpoints.ts** - API type definitions
4. **lib/middleware/apiVersioning.ts** - Version handling

### Test Files
1. **__tests__/mocks/handlers.ts** - Mock handlers
2. **backend/newpennine-api/test/*.e2e-spec.ts** - E2E tests

### Deployment Scripts
1. **scripts/run-migration-tests.sh**
2. **scripts/migration-rollback.sh**
3. **deployment/scripts/config/environments/*.env**

## Redirect Mapping
```typescript
// Redirect configuration
const redirectMap = {
  '/api/v1/health': '/api/monitoring/health',
  '/api/v1/health/deep': '/api/monitoring/deep',
  '/api/v1/alerts/*': '/api/alerts/$1',
  '/api/v1/metrics/*': '/api/metrics/$1',
  '/api/v1/cache/*': '/api/cache/$1',
  '/api/v2/health': '/api/monitoring/health'
};
```

## Risk Assessment
- **Low Risk**: Basic health endpoint remains unchanged
- **Medium Risk**: Multiple dependencies on v1 endpoints
- **Mitigation**: Comprehensive redirect layer ensures backward compatibility

## Testing Plan
1. Unit tests for all moved endpoints
2. Integration tests for redirect functionality
3. E2E tests for critical paths
4. Performance testing to ensure no degradation
5. Deployment script validation

## Timeline
- Phase 1: Complete ✅
- Phase 2: 2-3 days
- Phase 3: 1-2 days
- Phase 4: 1 day
- Testing: 2 days
- Total: ~1 week

## Success Criteria
- [ ] All endpoints accessible at new locations
- [ ] Zero breaking changes for existing integrations
- [ ] Improved API organization and discoverability
- [ ] Reduced code duplication
- [ ] Updated documentation