# PDF Preview Implementation Guide

## Overview
This document outlines the implementation of PDF preview functionality, replacing the previous new-tab approach with a fullscreen overlay dialog.

## Implementation Files

### 1. Core Component
- **File**: `/components/ui/pdf-preview-dialog.tsx`
- **Purpose**: Main PDF preview dialog using iframe approach
- **Dependencies**: Native HTML iframe, no external PDF libraries required

### 2. Alternative Implementation
- **File**: `/components/ui/pdf-preview-dialog-react-pdf.tsx`
- **Purpose**: Enhanced PDF preview using react-pdf library
- **Dependencies**: Requires `react-pdf` package installation

### 3. Hook Integration
- **File**: `/app/(app)/admin/hooks/useUploadManager.ts`
- **Changes**: Added PDF preview state management and updated preview handler

### 4. Component Integration
- **File**: `/app/(app)/admin/cards/UploadCenterCard.tsx`
- **Changes**: Integrated PDF preview dialog with existing upload manager

## Features

### Basic Features (iframe approach)
- ✅ Fullscreen overlay display
- ✅ Zoom controls (25% - 300%)
- ✅ Rotation controls (90° increments)  
- ✅ Download functionality
- ✅ Keyboard shortcuts
- ✅ Escape key handling
- ✅ Error handling
- ✅ Loading states
- ✅ Mobile responsive
- ✅ Accessibility support

### Enhanced Features (react-pdf approach)
- ✅ All basic features
- ✅ Page navigation
- ✅ Better rendering control
- ✅ Client-side PDF processing
- ❌ Requires additional dependencies
- ❌ Larger bundle size
- ❌ Complex webpack configuration

## Performance Considerations

### Iframe Approach (Recommended)
**Advantages:**
- No additional dependencies
- Small bundle impact
- Browser-native PDF rendering
- Good performance for most use cases
- Works with all PDF files

**Disadvantages:**
- Limited customization
- Depends on browser PDF support
- Less control over rendering

### React-PDF Approach
**Advantages:**
- Full control over PDF rendering
- Better user experience
- Client-side processing
- Custom styling possibilities

**Disadvantages:**
- +2MB bundle size increase
- Requires webpack configuration
- More complex implementation
- Potential memory usage issues with large PDFs

## Security Considerations

### 1. Content Security Policy (CSP)
```javascript
// Ensure iframe src allows your document URLs
const cspPolicy = {
  'frame-src': ['self', 'https://your-storage-domain.com'],
  'object-src': ['none']
};
```

### 2. Sandboxing
The iframe implementation uses sandbox attributes:
```html
sandbox="allow-scripts allow-same-origin"
```

### 3. URL Validation
Always validate PDF URLs before passing to the component:
```typescript
const isValidPDFUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:';
  } catch {
    return false;
  }
};
```

### 4. CORS Considerations
Ensure your storage backend properly handles CORS headers:
```
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Methods: GET
Access-Control-Allow-Headers: Content-Type
```

## Usage Examples

### Basic Usage
```tsx
import { PDFPreviewDialog } from '@/components/ui/pdf-preview-dialog';

function MyComponent() {
  const [pdfPreview, setPdfPreview] = useState({
    isOpen: false,
    url: '',
    fileName: ''
  });

  const handleOpenPDF = (url: string, fileName: string) => {
    setPdfPreview({
      isOpen: true,
      url,
      fileName
    });
  };

  return (
    <>
      <button onClick={() => handleOpenPDF('path/to/file.pdf', 'Document.pdf')}>
        View PDF
      </button>
      
      <PDFPreviewDialog
        url={pdfPreview.url}
        fileName={pdfPreview.fileName}
        open={pdfPreview.isOpen}
        onOpenChange={(open) => !open && setPdfPreview(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}
```

### With Upload Manager Hook
```tsx
// The useUploadManager hook now includes PDF preview state
const { state, actions } = useUploadManager();
const { pdfPreview } = state;
const { handlePreviewPDF, closePDFPreview } = actions;

// Use in component
<PDFPreviewDialog
  url={pdfPreview.url}
  fileName={pdfPreview.fileName}
  open={pdfPreview.isOpen}
  onOpenChange={(open) => !open && closePDFPreview()}
/>
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Escape` | Close dialog |
| `Ctrl/Cmd + Plus` | Zoom in |
| `Ctrl/Cmd + Minus` | Zoom out |
| `Ctrl/Cmd + R` | Rotate 90° |
| `Ctrl/Cmd + F` | Toggle fullscreen |
| `←/→` | Navigate pages (react-pdf only) |

## Error Handling

The component handles various error scenarios:

1. **Invalid URL**: Shows error message with retry option
2. **Network errors**: Graceful fallback with retry
3. **PDF load failures**: Clear error indication
4. **CORS issues**: Helpful error messages

## Testing

### Unit Testing
```typescript
// Example test cases
describe('PDFPreviewDialog', () => {
  it('should open when URL is provided', () => {});
  it('should handle zoom controls correctly', () => {});
  it('should close on escape key', () => {});
  it('should handle PDF load errors', () => {});
});
```

### E2E Testing
```typescript
// Playwright test example
test('PDF preview functionality', async ({ page }) => {
  await page.goto('/admin');
  await page.click('[data-testid="pdf-preview-button"]');
  await expect(page.locator('[data-testid="pdf-dialog"]')).toBeVisible();
  
  // Test zoom controls
  await page.click('[data-testid="zoom-in"]');
  // Assert zoom level changed
  
  // Test close
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-testid="pdf-dialog"]')).not.toBeVisible();
});
```

## Migration Guide

### From window.open() to Overlay

**Before:**
```typescript
const handlePreviewPDF = (record: DocUploadRecord) => {
  window.open(record.doc_url, '_blank');
};
```

**After:**
```typescript
const [pdfPreview, setPdfPreview] = useState({
  isOpen: false,
  url: undefined,
  fileName: undefined
});

const handlePreviewPDF = (record: DocUploadRecord) => {
  if (record.doc_type === 'application/pdf') {
    setPdfPreview({
      isOpen: true,
      url: record.doc_url,
      fileName: record.doc_name
    });
  } else {
    window.open(record.doc_url, '_blank'); // Keep for non-PDF files
  }
};
```

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Fallback Behavior
For unsupported browsers, the component:
1. Falls back to opening in new tab
2. Shows appropriate error messages
3. Maintains core functionality

## Future Enhancements

### Planned Features
- [ ] Text selection and copy
- [ ] Search within PDF
- [ ] Thumbnail navigation
- [ ] Annotation support
- [ ] Print functionality
- [ ] Multiple file viewer
- [ ] Comparison mode

### Performance Optimizations
- [ ] Lazy loading for large PDFs
- [ ] Caching mechanism
- [ ] Progressive loading
- [ ] Memory management improvements

## Troubleshooting

### Common Issues

1. **PDF not loading**
   - Check CORS headers
   - Verify URL accessibility
   - Check browser console for errors

2. **Performance issues**
   - Monitor memory usage
   - Consider file size limits
   - Implement loading indicators

3. **Mobile responsiveness**
   - Test on various screen sizes
   - Adjust zoom controls for touch
   - Optimize for mobile browsers

### Debug Mode
Enable debug logging by adding:
```typescript
const DEBUG_PDF = process.env.NODE_ENV === 'development';
```

This implementation provides a robust, secure, and user-friendly PDF preview experience while maintaining good performance and browser compatibility.