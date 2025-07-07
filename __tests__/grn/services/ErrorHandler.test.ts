import { GrnErrorHandler } from '@/app/print-grnlabel/services/ErrorHandler';
import { toast } from 'sonner';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));

describe('GrnErrorHandler - GRN 錯誤處理服務', () => {
  let errorHandler: GrnErrorHandler;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorHandler = GrnErrorHandler.getInstance();
    jest.clearAllMocks();
    // Mock console.error
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('handleValidationError', () => {
    test('處理驗證錯誤 - 不顯示 toast', () => {
      const context = {
        component: 'GrnLabelForm',
        action: 'validation',
      };

      // Mock console.warn
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      errorHandler.handleValidationError('grnNumber', '請輸入 GRN 編號', context);

      // 驗證錯誤不應顯示 toast
      expect(toast.error).not.toHaveBeenCalled();
      
      // 應該記錄到 console
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[GrnLabelForm] Validation error in grnNumber: 請輸入 GRN 編號'
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('handleSupplierError', () => {
    test('處理供應商錯誤 - 預設消息', () => {
      const context = {
        component: 'GrnLabelForm',
        action: 'supplierLookup',
      };

      errorHandler.handleSupplierError('供應商不存在', 'SUP001', context);

      expect(toast.error).toHaveBeenCalledWith(
        'Supplier validation failed. Please check the supplier code.',
        {
          duration: 5000,
          id: 'supplier-SUP001',
        }
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[GrnLabelForm] Supplier Error for SUP001:',
        '供應商不存在'
      );
    });

    test('處理供應商錯誤 - not found 錯誤', () => {
      const context = {
        component: 'GrnLabelForm',
        action: 'supplierLookup',
      };

      const error = new Error('Supplier not found');
      errorHandler.handleSupplierError(error, 'SUP002', context);

      expect(toast.error).toHaveBeenCalledWith(
        'Supplier code "SUP002" not found. Please verify the code.',
        {
          duration: 5000,
          id: 'supplier-SUP002',
        }
      );
    });

    test('處理供應商錯誤 - network 錯誤', () => {
      const context = {
        component: 'GrnLabelForm',
        action: 'supplierLookup',
      };

      const error = new Error('network timeout');
      errorHandler.handleSupplierError(error, 'SUP003', context);

      expect(toast.error).toHaveBeenCalledWith(
        'Network error while validating supplier. Please try again.',
        {
          duration: 5000,
          id: 'supplier-SUP003',
        }
      );
    });
  });

  describe('handlePalletGenerationError', () => {
    test('處理托盤生成錯誤 - 包含數量', () => {
      const context = {
        component: 'GrnLabelForm',
        action: 'palletGeneration',
      };

      const error = new Error('Database connection failed');
      errorHandler.handlePalletGenerationError(error, context, 5);

      expect(toast.error).toHaveBeenCalledWith(
        'Failed to generate 5 pallet numbers. Please try again.',
        {
          duration: 6000,
          id: 'pallet-generation',
        }
      );
    });

    test('處理托盤生成錯誤 - 無數量', () => {
      const context = {
        component: 'GrnLabelForm',
        action: 'palletGeneration',
      };

      const error = new Error('Invalid parameters');
      errorHandler.handlePalletGenerationError(error, context);

      expect(toast.error).toHaveBeenCalledWith(
        'Failed to generate pallet numbers. Please try again.',
        {
          duration: 6000,
          id: 'pallet-generation',
        }
      );
    });
  });

  describe('handleDatabaseError', () => {
    test('處理數據庫錯誤 - timeout 錯誤', () => {
      const context = {
        component: 'WeightInputList',
        action: 'save',
      };

      const error = new Error('Connection timeout');
      errorHandler.handleDatabaseError(error, context, 'INSERT');

      expect(toast.error).toHaveBeenCalledWith(
        'Database operation timed out. Please try again.',
        {
          duration: 5000,
          id: 'db-INSERT',
        }
      );
    });

    test('處理數據庫錯誤 - already exists 錯誤', () => {
      const context = {
        component: 'WeightInputList',
        action: 'save',
      };

      errorHandler.handleDatabaseError('Record already exists', context);

      expect(toast.error).toHaveBeenCalledWith(
        'This record already exists in the system.',
        {
          duration: 5000,
          id: 'db-unknown',
        }
      );
    });
  });

  describe('handlePdfError', () => {
    test('處理 PDF 生成錯誤 - 包含托盤編號', () => {
      const context = {
        component: 'PdfButton',
        action: 'generate',
      };

      const error = new Error('PDF generation failed');
      errorHandler.handlePdfError(error, context, 'PAL001', 'GRN001');

      expect(toast.error).toHaveBeenCalledWith(
        'Failed to generate PDF for pallet PAL001. Please try again.',
        {
          duration: 6000,
          id: 'pdf-PAL001',
        }
      );
    });

    test('處理 PDF 生成錯誤 - 無托盤編號', () => {
      const context = {
        component: 'PdfButton',
        action: 'generate',
      };

      const error = new Error('Unknown error');
      errorHandler.handlePdfError(error, context);

      expect(toast.error).toHaveBeenCalledWith(
        'PDF generation failed. Please try again.',
        {
          duration: 6000,
          id: 'pdf-unknown',
        }
      );
    });
  });

  describe('handleWeightError', () => {
    test('處理重量錯誤', () => {
      const context = {
        component: 'WeightInputList',
        action: 'validation',
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      errorHandler.handleWeightError('重量必須大於零', 2, '0', context);

      expect(toast.error).toHaveBeenCalledWith('重量必須大於零', {
        duration: 4000,
        id: 'weight-2',
      });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[WeightInputList] Weight Error for pallet 3: 重量必須大於零'
      );

      consoleWarnSpy.mockRestore();
    });

    test('處理無效格式的重量錯誤', () => {
      const context = {
        component: 'WeightInputList',
        action: 'validation',
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      errorHandler.handleWeightError('請輸入有效的數字', 0, 'abc', context);

      expect(toast.error).toHaveBeenCalledWith('請輸入有效的數字', {
        duration: 4000,
        id: 'weight-0',
      });

      consoleWarnSpy.mockRestore();
    });
  });

  describe('錯誤統計', () => {
    test('記錄不同類型的錯誤', () => {
      const context1 = {
        component: 'GrnLabelForm',
        action: 'validation',
      };

      const context2 = {
        component: 'WeightInputList',
        action: 'save',
      };

      // Mock console methods
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // 記錄多個錯誤
      errorHandler.handleValidationError('field1', 'error1', context1);
      errorHandler.handleValidationError('field2', 'error2', context1);
      errorHandler.handleDatabaseError(new Error('db error'), context2);

      const stats = errorHandler.getErrorStats();

      expect(stats.total).toBe(3);
      expect(stats.bySeverity.low).toBe(2); // validation errors are low severity
      expect(stats.bySeverity.medium).toBe(1); // "db error" returns medium severity
      expect(stats.byComponent['GrnLabelForm']).toBe(2);
      expect(stats.byComponent['WeightInputList']).toBe(1);

      consoleWarnSpy.mockRestore();
    });

    test('清除錯誤統計', () => {
      const context = {
        component: 'GrnLabelForm',
        action: 'validation',
      };

      // Mock console.warn
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // 添加一些錯誤
      errorHandler.handleValidationError('field', 'error', context);
      
      // 清除統計
      errorHandler.clearErrorReports();

      const stats = errorHandler.getErrorStats();
      expect(stats.total).toBe(0);

      consoleWarnSpy.mockRestore();
    });
  });

  describe('單例模式', () => {
    test('多次導入應返回相同實例', async () => {
      // 動態導入兩次
      const { grnErrorHandler: handler1 } = await import('@/app/print-grnlabel/services/ErrorHandler');
      const { grnErrorHandler: handler2 } = await import('@/app/print-grnlabel/services/ErrorHandler');

      expect(handler1).toBe(handler2);
    });
  });
});