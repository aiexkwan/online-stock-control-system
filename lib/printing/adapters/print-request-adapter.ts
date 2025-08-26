/**
 * Adapter to convert between old and new PrintRequest formats
 */

import type { PrintRequest as OldPrintRequest } from '../types';
import { PrintType, PaperSize } from '../types';
import type { PrintRequest as NewPrintRequest } from '../unified-print-service';

/**
 * Convert old PrintRequest format to new format
 */
export function adaptPrintRequest(oldRequest: OldPrintRequest): NewPrintRequest {
  // Extract PDF blob from data
  let pdfBlobs: Blob[] = [];

  if (oldRequest.data && 'pdfBlob' in oldRequest.data && oldRequest.data.pdfBlob instanceof Blob) {
    pdfBlobs = [oldRequest.data.pdfBlob];
  } else if (
    oldRequest.data &&
    'pdfBlobs' in oldRequest.data &&
    Array.isArray(oldRequest.data.pdfBlobs)
  ) {
    pdfBlobs = oldRequest.data.pdfBlobs;
  }

  // Map print type to simplified version
  let type: 'qc-label' | 'grn-label' | 'report' = 'report';
  if (oldRequest.type === PrintType.QC_LABEL) {
    type = 'qc-label';
  } else if (oldRequest.type === PrintType.GRN_LABEL) {
    type = 'grn-label';
  }

  // Build metadata from old format
  const metadata: NewPrintRequest['metadata'] = {
    userId: oldRequest.metadata?.userId || 'system',
    source: oldRequest.metadata?.source || 'unknown',
    timestamp: oldRequest.metadata?.timestamp || new Date().toISOString(),
  };

  // Add extra data fields to metadata
  if (oldRequest.data && 'productCode' in oldRequest.data) {
    metadata.productCode = oldRequest.data.productCode as string;
  }
  if (oldRequest.data && 'palletNumbers' in oldRequest.data) {
    metadata.palletNumbers = oldRequest.data.palletNumbers as string[];
  }
  if (oldRequest.data && 'series' in oldRequest.data) {
    metadata.series = oldRequest.data.series as string[];
  }
  if (oldRequest.data && 'quantity' in oldRequest.data) {
    metadata.quantity = oldRequest.data.quantity as number;
  }
  if (oldRequest.data && 'operator' in oldRequest.data) {
    metadata.operator = oldRequest.data.operator as string;
  }

  return {
    type,
    pdfBlobs,
    metadata,
    options: {
      copies: oldRequest.options.copies,
      paperSize: oldRequest.options.paperSize === PaperSize.LETTER ? 'Letter' : 'A4',
      orientation: oldRequest.options.orientation,
    },
  };
}

/**
 * Check if request is in old format
 */
export function isOldPrintRequest(request: unknown): request is OldPrintRequest {
  return (
    request !== null &&
    typeof request === 'object' &&
    'data' in request &&
    'options' in request &&
    'type' in request
  );
}

/**
 * Check if request is in new format
 */
export function isNewPrintRequest(request: unknown): request is NewPrintRequest {
  return (
    request !== null &&
    typeof request === 'object' &&
    'pdfBlobs' in request &&
    'metadata' in request &&
    'type' in request
  );
}
