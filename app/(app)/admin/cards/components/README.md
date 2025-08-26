# Stock Transfer UI Components

## Overview

This directory contains UI components specifically designed for the Stock Transfer Card, including error boundaries and loading states optimized for industrial warehouse environments.

## Components

### StockTransferErrorBoundary

A comprehensive error boundary component that provides user-friendly error handling for the stock transfer functionality.

**Features:**

- Smart error analysis and categorization
- Industrial environment optimizations (large touch targets, high contrast)
- Glassmorphic design language integration
- Multiple recovery strategies
- Sound feedback integration
- Accessibility compliance (WCAG 2.1 AA)

**Usage:**

```jsx
import StockTransferErrorBoundary from './components/StockTransferErrorBoundary';

<StockTransferErrorBoundary>
  <YourComponent />
</StockTransferErrorBoundary>;
```

### StockTransferLoadingState

Loading skeleton and progress indicators for the stock transfer card.

**Features:**

- Shimmer animations
- Progress step tracking
- Multiple size variants
- Glassmorphic styling consistency

**Usage:**

```jsx
import { StockTransferLoadingState, CompactLoadingState } from './components/StockTransferLoadingState';

// Full loading state
<StockTransferLoadingState
  loadingMessage="Loading stock transfer..."
  showProgress={true}
  progressSteps={['Verifying operator', 'Loading locations', 'Ready']}
  currentStep={1}
/>

// Compact loading state
<CompactLoadingState
  message="Processing..."
  size="md"
/>
```

## Design System Integration

### Color Themes

- **Critical**: Red theme for system crashes
- **High**: Orange theme for major functionality failures
- **Medium**: Yellow theme for partial functionality impact
- **Low**: Blue theme for minor issues

### Error Categories

- **Network**: Connection issues, timeouts
- **Auth**: Authentication/authorization failures
- **Validation**: Input validation errors
- **Business**: Business logic violations
- **System**: Critical system errors

### Recovery Strategies

- **Auto-retry**: For transient network errors
- **Manual retry**: User-initiated retry with backoff
- **Form reset**: Clear state and start over
- **Home navigation**: Return to dashboard for critical errors

## Accessibility Features

- High contrast text (4.5:1 ratio minimum)
- Large touch targets (44px+ for industrial glove use)
- ARIA attributes for screen readers
- Keyboard navigation support
- Sound feedback integration

## Industrial Environment Optimizations

- **Physical considerations**: Gloved operation support, distance reading
- **Visual clarity**: Strong borders, glow effects for visibility
- **Quick recognition**: Category-specific icons and color coding
- **Robust interaction**: Debounced actions, clear feedback

## Technical Implementation

### Dependencies

- React 18.3.1+
- Lucide React (icons)
- Tailwind CSS 3.4.17+
- Radix UI components
- Custom sound feedback system

### Build Requirements

- TypeScript 5.8.3+
- Next.js 15.4.4+
- ESLint compliance

### Performance Features

- React.memo optimization
- Debounced retry operations
- State persistence across re-renders
- Lazy loading of error details

## Testing

The components have been verified with:

- ✅ TypeScript compilation
- ✅ Next.js production build
- ✅ ESLint validation
- ✅ Accessibility requirements

## File Structure

```
components/
├── StockTransferErrorBoundary.tsx  # Main error boundary
├── StockTransferLoadingState.tsx   # Loading states
└── README.md                       # This file
```

## Integration

These components are automatically integrated with the main `StockTransferCard` component and work seamlessly with the existing design system and sound feedback mechanisms.
