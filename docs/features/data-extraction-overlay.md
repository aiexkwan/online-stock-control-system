# Data Extraction Overlay

## Overview

The Data Extraction Overlay is a full-screen overlay component that displays the results of PDF data extraction after successful upload and processing. It provides an intuitive interface for users to review, search, export, and manage extracted order data.

## Features

### Core Features
- **Full-screen overlay** with glassmorphic design consistent with the existing UI theme
- **Responsive layout** that works on both desktop and mobile devices
- **Data visualization** in an organized, searchable list format
- **Interactive selection** with checkbox support for individual items
- **Real-time search** to filter products by code, description, or order reference

### Export Capabilities
- **CSV Export** - Standard comma-separated values format
- **Excel Export** - Tab-separated format compatible with Microsoft Excel
- **JSON Export** - Machine-readable JSON format for integration
- **Print Function** - Formatted printable view with summary statistics
- **Share Function** - Native sharing via Web Share API or clipboard fallback

### User Experience
- **Keyboard shortcuts** for common actions (Escape to close, Ctrl+A to select all, etc.)
- **Accessibility support** with proper ARIA labels and keyboard navigation
- **Loading states** and error handling
- **Copy to clipboard** functionality for quick data sharing
- **Summary statistics** showing totals, unique products, and data quality indicators

## Technical Implementation

### Component Structure
```
DataExtractionOverlay/
├── Main overlay container (full-screen)
├── Header section (title, actions)
├── Content area
│   ├── Main table (3/4 width)
│   │   ├── Search bar
│   │   ├── Data table with selection
│   │   └── Export controls
│   └── Sidebar (1/4 width)
│       ├── Summary statistics
│       ├── Order details (collapsible)
│       └── Status indicators
└── Keyboard shortcuts handler
```

### Data Flow
1. PDF upload triggers extraction in `useUploadManager`
2. Successful extraction calls `openDataExtractionOverlay` with results
3. Overlay displays formatted data with search and export capabilities
4. User can interact, export, or close the overlay
5. State is cleaned up on close via `closeDataExtractionOverlay`

### Integration Points
- **useUploadManager Hook**: Manages overlay state and PDF processing results
- **UploadCenterCard**: Renders the overlay component
- **Export Utils**: Handles data export in various formats
- **Glassmorphic Card System**: Provides consistent theming

## Usage

### Basic Usage
The overlay is automatically triggered after successful PDF upload and data extraction. Users don't need to manually invoke it.

### Manual Testing
For development and testing purposes, use the `DataExtractionOverlayExample` component:

```typescript
import { DataExtractionOverlayExample } from '@/components/ui/data-extraction-overlay-example';

// Renders a button that opens the overlay with mock data
<DataExtractionOverlayExample />
```

### Export Functions
```typescript
// Export to different formats
onExport={(format: 'csv' | 'excel' | 'json') => {
  // Handles automatic download of data in specified format
}}

// Print formatted view
onPrint={() => {
  // Opens print dialog with formatted data table
}}

// Share data
onShare={() => {
  // Uses Web Share API or clipboard fallback
}}
```

## Configuration

### Data Structure
The overlay expects data in the `ExtractedOrderData` format:

```typescript
interface ExtractedOrderData {
  order_ref: string;
  account_num: string;
  delivery_add: string;
  invoice_to: string;
  customer_ref?: string;
  product_code: string;
  product_desc: string;
  product_qty: number;
  weight?: number;
  unit_price?: string;
}
```

### Enhanced Fields
Optional metadata to show data quality indicators:

```typescript
interface EnhancedFields {
  hasInvoiceTo: boolean;
  hasCustomerRef: boolean;
  hasWeights: boolean;
  hasUnitPrices: boolean;
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Escape` | Close overlay |
| `Ctrl+A` / `Cmd+A` | Select all items |
| `Ctrl+C` / `Cmd+C` | Copy selected items to clipboard |
| `Ctrl+E` / `Cmd+E` | Export to CSV |

## Accessibility

- **ARIA labels** for screen readers
- **Keyboard navigation** support
- **High contrast** glassmorphic theme
- **Focus management** with proper tab order
- **Screen reader** compatible status updates

## Browser Support

- **Modern browsers** with ES6+ support
- **Web Share API** support (mobile browsers, progressive enhancement)
- **Clipboard API** support (HTTPS required)
- **CSS backdrop-filter** support for glassmorphic effects

## Future Enhancements

### Potential Improvements
- **Advanced Excel export** with proper XLSX format using libraries like `xlsx`
- **Data validation** indicators for extracted content
- **Batch operations** for multiple orders
- **Integration** with inventory management systems
- **Real-time collaboration** features
- **Audit trail** for data extraction history

### Performance Optimizations
- **Virtual scrolling** for large datasets
- **Lazy loading** of non-visible items
- **Debounced search** for better performance
- **Memoized calculations** for summary statistics

## Files

### Core Components
- `components/ui/data-extraction-overlay.tsx` - Main overlay component
- `components/ui/data-extraction-overlay-example.tsx` - Testing/demo component

### Utilities
- `lib/utils/export-utils.ts` - Export functionality helpers

### Integration
- `app/(app)/admin/hooks/useUploadManager.ts` - Hook integration
- `app/(app)/admin/cards/UploadCenterCard.tsx` - UI integration

### Documentation
- `docs/features/data-extraction-overlay.md` - This document