# Navigation System Dependency Graph

## Overview
This document maps all dependencies for removing `config/navigation.ts` and `DynamicActionBar` from the system.

## Core Components to Remove

### 1. Primary Configuration File
- **File**: `/config/navigation.ts`
- **Purpose**: Defines navigation structure and items
- **Exports**: 
  - `NavigationItem` interface
  - `SubNavigationItem` interface
  - `MAIN_NAVIGATION` constant array

### 2. DynamicActionBar Component Directory
- **Path**: `/components/ui/dynamic-action-bar/`
- **Files to Remove**:
  ```
  ├── index.tsx                     # Main export
  ├── NavigationItem.tsx            # Navigation item component
  ├── SubMenu.tsx                   # Submenu component
  ├── MobileView.tsx                # Mobile navigation view
  ├── QuickAccess.tsx               # Quick access features
  ├── SmartReminder.tsx             # Smart reminder component
  ├── VirtualizedNavigation.tsx     # Virtualized navigation
  ├── NavigationProvider.tsx        # Navigation context provider
  ├── NavigationErrorBoundary.tsx   # Error boundary
  └── NavigationSkeleton.tsx        # Loading skeleton
  ```

## Direct Dependencies

### Files That Import `config/navigation.ts`
All 7 files are within `/components/ui/dynamic-action-bar/`:
1. `index.tsx`
2. `VirtualizedNavigation.tsx`
3. `SmartReminder.tsx`
4. `NavigationItem.tsx`
5. `MobileView.tsx`
6. `SubMenu.tsx`
7. `QuickAccess.tsx`

### Files That Import `DynamicActionBar`
1. `/app/components/visual-system/core/ClientVisualSystemProvider.tsx`
   - **Usage**: Renders DynamicActionBar conditionally based on path
   - **Action Required**: Remove import and rendering logic

2. `/app/components/visual-system/index.ts`
   - **Usage**: Comment mentions DynamicActionBar but doesn't export
   - **Action Required**: Remove comment

## Configuration Dependencies

### Visual System Configuration
- **File**: `/app/components/visual-system/config/visual-config.ts`
- **Relevant Config**: `bottomNav` section
  ```typescript
  bottomNav: {
    visibility: {
      hiddenPaths: [
        '/main-login',
        '/main-login/register',
        '/main-login/reset',
        '/main-login/change',
        '/new-password',
        '/change-password',
      ],
      alwaysShowPaths: ['/admin'],
    },
    animation: { ... },
    style: { ... },
  }
  ```
- **Action Required**: Remove `bottomNav` configuration section

### Navigation Paths Configuration
- **File**: `/lib/constants/navigation-paths.ts`
- **Purpose**: Defines frequent paths and time-based suggestions
- **Dependencies**: References navigation routes
- **Action Required**: Review if still needed for new Card system

## Route References

### Files Referencing Navigation Routes
35 files reference navigation paths (`/print-label`, `/stock-transfer`, etc.):

#### Critical Files:
1. **`/middleware.ts`**
   - References routes for authentication
   - No direct navigation dependency

2. **`/app/hooks/useAuth.ts`**
   - May handle route protection
   - Review for navigation dependencies

3. **`/lib/graphql/resolvers/navigation.resolver.ts`**
   - GraphQL resolver for navigation
   - May need complete refactoring

4. **Admin Cards**: `/app/(app)/admin/cards/`
   - `GRNLabelCard.tsx`
   - `OrderLoadCard.tsx`
   - `index.ts`
   - These may be the new Card system components

#### Action Files:
- `/app/actions/stockTransferActions.ts`
- `/app/actions/orderLoadingActions.ts`

#### Page Files:
- `/app/(app)/admin/page.tsx`
- `/app/(auth)/main-login/change/page.tsx`

#### Component Files:
- `/app/components/reports/ReportsDashboardDialog.tsx`
- `/app/components/reports/GlobalReportDialogs.tsx`
- `/app/components/GlobalSkipLinks.tsx`
- `/app/components/AuthChecker.tsx`

## Dependency Chain

```
config/navigation.ts
    ↓
components/ui/dynamic-action-bar/* (10 files)
    ↓
app/components/visual-system/core/ClientVisualSystemProvider.tsx
    ↓
Rendered in app layout
```

## Migration Path to Card System

### Current Card Architecture
Based on the codebase structure, the new Card system appears to be:
- **Base Cards**: Located in `/lib/design-system/` or similar
- **Operation Cards**: `/app/(app)/admin/cards/`
  - `GRNLabelCard.tsx`
  - `OrderLoadCard.tsx`
  - Likely replacing navigation items

### Relationship Mapping

| Old Navigation Item | New Card Component |
|-------------------|-------------------|
| Print Label → Q.C. Label | Likely QCLabelCard |
| Print Label → GRN Label | GRNLabelCard.tsx |
| Stock Transfer | Likely StockTransferCard |
| Loading Order | OrderLoadCard.tsx |
| Admin → Analytics | Likely AnalyticsCard |
| Admin → Stock Count | Likely StockCountCard |

## Action Items for Complete Removal

### Phase 1: Remove Direct Dependencies
1. Delete `/components/ui/dynamic-action-bar/` directory (10 files)
2. Delete `/config/navigation.ts`
3. Update `/app/components/visual-system/core/ClientVisualSystemProvider.tsx`
   - Remove DynamicActionBar import
   - Remove conditional rendering logic
4. Clean up `/app/components/visual-system/index.ts` comment

### Phase 2: Update Configurations
1. Remove `bottomNav` section from `/app/components/visual-system/config/visual-config.ts`
2. Evaluate `/lib/constants/navigation-paths.ts` for Card system compatibility

### Phase 3: Refactor Route References
1. Update GraphQL resolver (`/lib/graphql/resolvers/navigation.resolver.ts`)
2. Ensure Admin cards handle their own navigation
3. Update any hardcoded route references to use Card-based navigation

### Phase 4: Testing
1. Verify all pages are accessible through new Card system
2. Check authentication flows still work
3. Ensure no broken imports or references

## Affected Features
- Bottom navigation bar
- Quick access menu
- Smart reminders based on time
- Mobile navigation view
- Submenu navigation

## New Card System Integration Points
- Admin page cards already exist in `/app/(app)/admin/cards/`
- Need to verify complete Card coverage for all old navigation items
- May need to create missing Cards for full feature parity

## Risk Assessment
- **High Risk**: Removing navigation without complete Card replacement
- **Medium Risk**: Breaking authentication flow redirects
- **Low Risk**: Removing unused configuration

## Recommendations
1. Verify Card system has complete feature coverage before removal
2. Create migration test suite
3. Implement feature flag for gradual rollout
4. Keep backup of navigation code until Card system is proven stable