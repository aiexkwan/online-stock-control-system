/**
 * Safe Export Utilities
 * Provides secure data export functionality without security vulnerabilities
 */

import type { ExtractedOrderItem } from '@/lib/types/order-extraction';

/**
 * Safely download a file by creating a blob URL
 */
const safeDownloadFile = (content: string, filename: string, mimeType: string): void => {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
    throw new Error('Failed to download file');
  }
};

/**
 * Escape CSV values to prevent injection attacks
 */
const escapeCsvValue = (value: string | number | undefined): string => {
  if (value === undefined || value === null) return '';
  
  const stringValue = String(value);
  
  // Remove any potential malicious content
  const sanitized = stringValue
    .replace(/[=@+\-]/g, '') // Remove formula prefixes
    .replace(/[\r\n]/g, ' ') // Replace line breaks with spaces
    .trim();
  
  // Escape quotes and wrap in quotes if contains comma or quotes
  if (sanitized.includes(',') || sanitized.includes('"')) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  
  return sanitized;
};

/**
 * Export data to CSV format (safe implementation)
 */
export const exportToCSV = (data: ExtractedOrderItem[], filename: string = 'order-data'): void => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const headers = [
    'Order Ref',
    'Product Code', 
    'Product Description',
    'Quantity',
    'Unit Price',
    'Weight',
    'Customer Ref',
    'Account Number',
    'Delivery Address',
    'Invoice To'
  ];

  const csvRows = [
    headers.join(','),
    ...data.map(item => [
      escapeCsvValue(item.order_ref),
      escapeCsvValue(item.product_code),
      escapeCsvValue(item.product_desc),
      escapeCsvValue(item.product_qty),
      escapeCsvValue(item.unit_price),
      escapeCsvValue(item.weight),
      escapeCsvValue(item.customer_ref),
      escapeCsvValue(item.account_num),
      escapeCsvValue(item.delivery_add),
      escapeCsvValue(item.invoice_to)
    ].join(','))
  ];

  const csvContent = csvRows.join('\n');
  safeDownloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
};

/**
 * Export data to JSON format (safe implementation)
 */
export const exportToJSON = (data: ExtractedOrderItem[], filename: string = 'order-data'): void => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    totalRecords: data.length,
    data: data.map(item => ({
      order_ref: item.order_ref,
      product_code: item.product_code,
      product_desc: item.product_desc,
      product_qty: item.product_qty,
      unit_price: item.unit_price,
      weight: item.weight,
      customer_ref: item.customer_ref,
      account_num: item.account_num,
      delivery_add: item.delivery_add,
      invoice_to: item.invoice_to,
      // Include data quality flags if available
      ...(item.was_corrected && { was_corrected: true }),
      ...(item.original_code && { original_code: item.original_code }),
      ...(item.confidence_score && { confidence_score: item.confidence_score }),
    }))
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  safeDownloadFile(jsonContent, `${filename}.json`, 'application/json;charset=utf-8;');
};

/**
 * Copy data to clipboard (safe implementation)
 */
export const copyToClipboard = async (data: ExtractedOrderItem[]): Promise<void> => {
  if (!data || data.length === 0) {
    throw new Error('No data to copy');
  }

  const csvContent = [
    'Product Code\tDescription\tQuantity\tUnit Price',
    ...data.map(item => 
      `${item.product_code}\t${item.product_desc}\t${item.product_qty}\t${item.unit_price || 'N/A'}`
    )
  ].join('\n');

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(csvContent);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = csvContent;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    throw new Error('Failed to copy to clipboard');
  }
};

/**
 * Share data using Web Share API (safe implementation)
 */
export const shareData = async (data: ExtractedOrderItem[], orderRef: string): Promise<void> => {
  if (!data || data.length === 0) {
    throw new Error('No data to share');
  }

  const summary = `Order ${orderRef}\n${data.length} items extracted\n\nProducts:\n${
    data.slice(0, 5).map(item => `• ${item.product_code}: ${item.product_qty}x ${item.product_desc}`).join('\n')
  }${data.length > 5 ? '\n...and more' : ''}`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: `Order ${orderRef} - Extraction Results`,
        text: summary,
      });
    } else {
      // Fallback: copy to clipboard
      await copyToClipboard(data);
      throw new Error('Web Share not supported, copied to clipboard instead');
    }
  } catch (error) {
    console.error('Share failed:', error);
    throw error;
  }
};

/**
 * Generate summary text for the extraction results
 */
export const generateSummaryText = (data: ExtractedOrderItem[], orderRef: string): string => {
  if (!data || data.length === 0) {
    return `Order ${orderRef}: No data extracted`;
  }

  const totalItems = data.length;
  const uniqueProducts = new Set(data.map(item => item.product_code)).size;
  const totalQuantity = data.reduce((sum, item) => sum + (item.product_qty || 0), 0);
  const correctedItems = data.filter(item => item.was_corrected).length;

  return `Order ${orderRef} Extraction Summary:
• Total Items: ${totalItems}
• Unique Products: ${uniqueProducts}
• Total Quantity: ${totalQuantity}
${correctedItems > 0 ? `• Auto-corrected: ${correctedItems}` : ''}

Generated: ${new Date().toLocaleString()}`;
};

/**
 * Validate data before export
 */
export const validateExportData = (data: unknown): data is ExtractedOrderItem[] => {
  if (!Array.isArray(data)) {
    return false;
  }

  return data.every(item => 
    item && 
    typeof item === 'object' && 
    typeof item.product_code === 'string' &&
    typeof item.product_desc === 'string' &&
    typeof item.product_qty === 'number' &&
    item.product_code.length > 0 &&
    item.product_desc.length > 0 &&
    item.product_qty >= 0
  );
};