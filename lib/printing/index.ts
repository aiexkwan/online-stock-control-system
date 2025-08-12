/**
 * Unified Printing Module
 * Export all printing functionality
 */

// Types
export * from './types';

// Services
export {
  UnifiedPrintingService,
  getUnifiedPrintingService,
} from './services/unified-printing-service';
// PrintHistoryService removed - redundant with existing record_history
export { PrintTemplateService } from './services/print-template-service';
export { PrintStatusMonitor, getPrintStatusMonitor } from './services/print-status-monitor';

// Hooks
export { usePrinting } from './hooks/usePrinting';
export type { UsePrintingOptions, UsePrintingReturn } from './hooks/usePrinting';

// Components
export * from './components';
