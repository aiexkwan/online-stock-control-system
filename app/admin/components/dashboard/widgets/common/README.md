# Widget Common Components

This directory contains reusable components and utilities for dashboard widgets.

## WidgetStates Components

A set of unified state components to reduce code duplication across widgets.

### Components

#### 1. WidgetSkeleton
Loading skeleton with customizable rows and animation.

```tsx
import { WidgetSkeleton } from './common/WidgetStates';

<WidgetSkeleton rows={5} showHeader={true} />
```

#### 2. WidgetError
Error state with retry functionality.

```tsx
import { WidgetError } from './common/WidgetStates';

<WidgetError
  message="Failed to load data"
  error={error}
  onRetry={handleRetry}
/>
```

#### 3. WidgetEmpty
Empty state with optional action button.

```tsx
import { WidgetEmpty } from './common/WidgetStates';

<WidgetEmpty
  message="No data found"
  description="Try adjusting your filters"
  action={{ label: "Add Item", onClick: handleAdd }}
/>
```

#### 4. WidgetLoadingOverlay
Loading overlay for async operations.

```tsx
import { WidgetLoadingOverlay } from './common/WidgetStates';

<WidgetLoadingOverlay
  isLoading={isProcessing}
  message="Saving changes..."
/>
```

#### 5. WidgetStateWrapper (Recommended)
Automatic state handling wrapper.

```tsx
import { WidgetStateWrapper } from './common/WidgetStates';

<WidgetStateWrapper
  loading={loading}
  error={error}
  empty={data.length === 0}
  onRetry={handleRetry}
>
  {/* Your widget content */}
</WidgetStateWrapper>
```

### Migration Guide

Replace repetitive loading/error/empty state code:

**Before:**
```tsx
{loading ? (
  <div className='animate-pulse'>...</div>
) : error ? (
  <div className='text-red-400'>{error}</div>
) : data.length === 0 ? (
  <div>No data</div>
) : (
  <div>Content</div>
)}
```

**After:**
```tsx
<WidgetStateWrapper loading={loading} error={error} empty={!data.length}>
  <div>Content</div>
</WidgetStateWrapper>
```

### Styling

All components use consistent Tailwind CSS classes that match the existing dashboard theme:
- Dark background with slate colors
- Cyan/blue accent colors
- Smooth animations with framer-motion
- Responsive design

### Examples

See `WidgetStates.example.tsx` for complete usage examples.
