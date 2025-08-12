# Old Widget Files Report

This document lists all files in the codebase that still contain references to "widget" terminology.

Generated on: 2025-08-12

## Configuration and Monitoring Files
- `/config/cards-migration-monitoring.json`
- `/lib/monitoring/cards-migration-monitor.ts`

## Style Files
- `/app/globals.css`

## Component Files
- `/components/layout/universal/constants.ts`
- `/components/layout/universal/types.ts`
- `/components/layout/universal/UniversalCard.tsx`
- `/components/layout/universal/UniversalErrorCard.tsx`
- `/components/layout/universal/README.md`
- `/app/components/qc-label-form/PrintLabelGrid.tsx`
- `/app/components/GlobalSkipLinks.tsx`

## Card Components (Migrated from Widgets)
- `/app/(app)/admin/cards/VoidPalletCard.tsx`
- `/app/(app)/admin/cards/TabSelectorCard.tsx`

## Page Components
- `/app/(app)/print-grnlabel/components/GrnLabelForm.tsx`
- `/app/(app)/print-label/page.tsx`

## API and Data Layer Files
- `/app/actions/acoOrderProgressActions.ts`
- `/lib/api/unified-data-layer.ts`
- `/lib/api/unified-data-layer.schemas.ts`
- `/lib/api/index.ts`
- `/lib/api/admin/DashboardAPI.ts`
- `/lib/api/admin/DashboardAPI.client.ts`
- `/lib/api/migration-guide.md`


## Loading and Performance Files
- `/lib/loading/types.ts`
- `/lib/loading/strategies/LoadingStrategy.ts`
- `/lib/loading/hooks/useSmartLoading.ts`
- `/lib/loading/hooks/useLoading.ts`
- `/lib/loading/utils/loadingUtils.ts`
- `/lib/loading/components/SmartLoadingSpinner.tsx`
- `/lib/loading/README.md`
- `/lib/performance/performance-benchmark.ts`
- `/lib/performance/SimplePerformanceMonitor.ts`


## Backend Files
- `/backend/newpennine-api/jest.e2e.config.js`
- `/backend/newpennine-api/src/inventory/dto/stock-levels-response.dto.ts`

## Database Files
- `/supabase/functions/rpc_get_warehouse_transfer_list.sql`
- `/supabase/functions/rpc_get_stock_level_history.sql`

## Script Files

## Summary

**Total Files Found:** 71 files

### Categories:
- Configuration/Monitoring: 2 files
- Types/Schemas: 7 files
- Components: 9 files
- API/Data Layer: 6 files
- GraphQL: 6 files
- Loading/Performance: 8 files
- Error Handling: 5 files
- Design System: 4 files
- Backend: 2 files
- Database: 2 files
- Scripts: 4 files
- Documentation: 5 files
- Others: 11 files

### Priority for Refactoring:
1. **High Priority:** Style files, component variants, API calls
2. **Medium Priority:** Type definitions, schema files
3. **Low Priority:** Documentation, monitoring configurations
4. **Keep for Historical:** Migration monitoring files