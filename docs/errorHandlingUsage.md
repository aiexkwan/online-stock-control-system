# Error Handling System Usage Guide

## Overview

The new error handling system provides a unified approach to handling errors, logging, and user feedback across the QC Label Form components. It consists of three main parts:

1. **ErrorHandler Service** - Centralized error handling and logging
2. **useErrorHandler Hook** - React hook for easy error handling in components
3. **ErrorBoundary Component** - React error boundary for catching component errors
4. **ErrorStats Component** - Development tool for monitoring errors

## Quick Start

### 1. Using the useErrorHandler Hook

```tsx
import { useErrorHandler } from '@/app/components/qc-label-form/hooks/useErrorHandler';

function MyComponent() {
  const { handleApiError, handleSuccess, withErrorHandling } = useErrorHandler({
    component: 'MyComponent',
    userId: '12345'
  });

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      handleSuccess('Data loaded successfully', 'data_fetch');
      return data;
    } catch (error) {
      handleApiError(error as Error, 'data_fetch');
    }
  };

  // Or use the wrapper for automatic error handling
  const fetchDataWithWrapper = withErrorHandling(
    async () => {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    'data_fetch',
    'Data loaded successfully',
    'Failed to load data'
  );

  return (
    <div>
      <button onClick={fetchData}>Fetch Data</button>
      <button onClick={fetchDataWithWrapper}>Fetch Data (Auto-handled)</button>
    </div>
  );
}
```

### 2. Using ErrorBoundary

```tsx
import { ErrorBoundary } from '@/app/components/qc-label-form';

function App() {
  return (
    <ErrorBoundary context={{ component: 'App', userId: '12345' }}>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### 3. Adding Error Stats (Development)

```tsx
import { ErrorStats } from '@/app/components/qc-label-form';

function App() {
  return (
    <div>
      <MyComponent />
      <ErrorStats /> {/* Only shows in development by default */}
    </div>
  );
}
```

## Error Handler Methods

### handleApiError(error, action, userMessage?, additionalData?)
Handles API and database errors with automatic severity detection.

```tsx
try {
  await supabase.from('table').insert(data);
} catch (error) {
  handleApiError(error, 'data_insert', 'Failed to save data', { table: 'products' });
}
```

### handleNetworkError(error, action, additionalData?)
Specifically for network-related errors.

```tsx
fetch('/api/data').catch(error => {
  handleNetworkError(error, 'api_call', { endpoint: '/api/data' });
});
```

### handleAuthError(error, action, additionalData?)
For authentication and authorization errors.

```tsx
if (response.status === 401) {
  handleAuthError(new Error('Unauthorized'), 'api_access');
}
```

### handlePdfError(error, action, palletNumber?, additionalData?)
Specialized for PDF generation errors.

```tsx
try {
  await generatePdf(data);
} catch (error) {
  handlePdfError(error, 'pdf_generation', palletNumber);
}
```

### handleSuccess(message, action, details?, additionalData?)
For success notifications and logging.

```tsx
handleSuccess('Label printed successfully', 'label_print', `Pallet: ${palletNumber}`);
```

### handleWarning(message, action, showToast?, additionalData?)
For warning messages.

```tsx
handleWarning('Product code not found in recent history', 'product_search', true);
```

### handleValidationError(fieldName, error, action?, additionalData?)
For form validation errors (logged but not shown as toast).

```tsx
if (!email.includes('@')) {
  handleValidationError('email', 'Invalid email format', 'form_validation');
}
```

## Error Severity Levels

The system automatically determines error severity:

- **Critical**: System-breaking errors
- **High**: Authentication, database errors
- **Medium**: Network, PDF generation errors
- **Low**: Validation, minor errors

## Error Context

Each error is logged with context information:

```tsx
interface ErrorContext {
  component: string;        // Component name
  action: string;          // Action being performed
  userId?: string;         // Current user ID
  additionalData?: Record<string, any>; // Custom data
}
```

## Best Practices

### 1. Component-Level Error Handling

```tsx
function ProductForm() {
  const { handleError, handleSuccess } = useErrorHandler({
    component: 'ProductForm',
    userId: currentUser?.id,
    defaultContext: { 
      additionalData: { 
        page: 'product-management',
        feature: 'form-submission'
      }
    }
  });

  const handleSubmit = async (formData) => {
    try {
      await submitProduct(formData);
      handleSuccess('Product saved successfully', 'form_submit');
    } catch (error) {
      // Automatic error type detection
      handleError(error, 'form_submit');
    }
  };
}
```

### 2. Wrapping Async Operations

```tsx
const saveProduct = withErrorHandling(
  async () => {
    const result = await api.saveProduct(productData);
    return result;
  },
  'product_save',
  'Product saved successfully',
  'Failed to save product'
);
```

### 3. Error Boundary Usage

```tsx
// Wrap major sections
<ErrorBoundary context={{ component: 'ProductSection', userId }}>
  <ProductForm />
  <ProductList />
</ErrorBoundary>

// Or individual components
<ErrorBoundary context={{ component: 'ProductForm', userId }}>
  <ProductForm />
</ErrorBoundary>
```

## Development Tools

### Error Stats Component

Shows real-time error statistics during development:

- Total error count
- Breakdown by severity
- Breakdown by component
- Clear and log functions

```tsx
<ErrorStats 
  showInProduction={false}  // Default: false
  refreshInterval={5000}    // Default: 5000ms
/>
```

### Console Logging

All errors are logged to console with structured format:

```
[ComponentName] Error Type in action_name: Error details
```

### Database Logging

Errors are automatically logged to the `record_history` table for monitoring and analysis.

## Migration Guide

### From Direct Toast Usage

**Before:**
```tsx
try {
  await api.call();
  toast.success('Success!');
} catch (error) {
  toast.error('Error occurred');
}
```

**After:**
```tsx
const { handleApiError, handleSuccess } = useErrorHandler({
  component: 'MyComponent',
  userId
});

try {
  await api.call();
  handleSuccess('Success!', 'api_call');
} catch (error) {
  handleApiError(error, 'api_call');
}
```

### From Try-Catch Blocks

**Before:**
```tsx
const fetchData = async () => {
  try {
    const data = await api.getData();
    setData(data);
    toast.success('Data loaded');
  } catch (error) {
    console.error('Error:', error);
    toast.error('Failed to load data');
  }
};
```

**After:**
```tsx
const fetchData = withErrorHandling(
  async () => {
    const data = await api.getData();
    setData(data);
    return data;
  },
  'data_fetch',
  'Data loaded successfully',
  'Failed to load data'
);
```

## Error Monitoring

### Getting Error Reports

```tsx
import { errorHandler } from '@/app/components/qc-label-form/services/ErrorHandler';

// Get all error reports
const reports = errorHandler.getErrorReports();

// Get error statistics
const stats = errorHandler.getErrorStats();

// Clear error reports
errorHandler.clearErrorReports();
```

### Production Monitoring

In production, errors are automatically logged to the database for monitoring and analysis. The error reports include:

- Error ID and timestamp
- Component and action context
- Error severity and messages
- User information
- Additional context data

This enables tracking of error patterns and system health monitoring. 