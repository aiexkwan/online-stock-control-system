/**
 * Tests for DefaultPrinterService
 */

import { DefaultPrinterService } from '../printer-service';
import { PrintJob, PrintJobType } from '../../types';

// Define specific data types for different print job types
interface QCLabelData {
  pdfBlob?: Blob;
  productCode: string;
  quantity?: number;
}

interface DocumentData {
  pdfBlob: Blob;
}

// Type guard functions
function isQCLabelData(data: unknown): data is QCLabelData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'productCode' in data &&
    typeof (data as QCLabelData).productCode === 'string'
  );
}

function isDocumentData(data: unknown): data is DocumentData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'pdfBlob' in data &&
    (data as DocumentData).pdfBlob instanceof Blob
  );
}

// Mock fetch for testing
global.fetch = jest.fn();

// Mock DOM methods
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('DefaultPrinterService', () => {
  let service: DefaultPrinterService;
  let mockIframe: any;

  beforeEach(() => {
    service = new DefaultPrinterService();

    // Mock document methods
    mockIframe = {
      style: { display: '' },
      src: '',
      onload: null,
      contentWindow: {
        focus: jest.fn(),
        print: jest.fn()
      },
      parentNode: document.body
    };

    document.createElement = jest.fn().mockReturnValue(mockIframe);
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();

    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();

    // Use fake timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('Printer Management', () => {
    it('should list available printers', async () => {
      const printers = await service.listPrinters();

      expect(printers).toHaveLength(1);
      expect(printers[0]).toMatchObject({
        id: 'default',
        name: 'System Default Printer',
        isOnline: true,
        isDefault: true
      });
    });

    it('should get default printer', async () => {
      const defaultPrinter = await service.getDefaultPrinter();

      expect(defaultPrinter).toBeDefined();
      expect(defaultPrinter?.isDefault).toBe(true);
    });

    it('should select printer', async () => {
      await service.selectPrinter('default');

      // Should not throw
      expect(service['selectedPrinterId']).toBe('default');
    });

    it('should throw error when selecting non-existent printer', async () => {
      await expect(service.selectPrinter('non-existent')).rejects.toThrow(
        'Printer non-existent not found'
      );
    });

    it('should get printer status by ID', async () => {
      const status = await service.getStatus('default');

      expect(status).toMatchObject({
        id: 'default',
        name: 'System Default Printer',
        isOnline: true
      });
    });

    it('should get all printer statuses', async () => {
      const statuses = await service.getStatus();

      expect(Array.isArray(statuses)).toBe(true);
      expect(statuses).toHaveLength(1);
    });

    it('should throw error for non-existent printer status', async () => {
      await expect(service.getStatus('non-existent')).rejects.toThrow(
        'Printer non-existent not found'
      );
    });
  });

  describe('Print Operations - QC Label', () => {
    it('should print QC label with PDF blob', async () => {
      const job: PrintJob = {
        type: 'qc-label',
        data: {
          pdfBlob: new Blob(['test'], { type: 'application/pdf' }),
          productCode: 'TEST001'
        },
        copies: 1,
        priority: 'normal'
      };

      const printPromise = service.print(job);

      // Trigger iframe onload immediately
      mockIframe.onload();

      // Fast forward timers to cleanup
      jest.advanceTimersByTime(10000);

      const result = await printPromise;

      expect(result.success).toBe(true);
      expect(result.jobId).toBeDefined();
      expect(result.pdfUrl).toBe('blob:mock-url');
      expect(result.message).toBe('QC label printed successfully');
      
      // Type assertion with proper type
      const data = job.data as QCLabelData;
      expect(URL.createObjectURL).toHaveBeenCalledWith(data.pdfBlob);
    });

    it('should print QC label via API when no blob provided', async () => {
      const mockBlob = new Blob(['pdf-content'], { type: 'application/pdf' });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: jest.fn().mockResolvedValue(mockBlob)
      });

      const job: PrintJob = {
        type: 'qc-label',
        data: {
          productCode: 'TEST001',
          quantity: 100
        },
        copies: 1,
        priority: 'normal'
      };

      // Mock the triggerPrint method to avoid iframe complications
      // @ts-expect-error - Accessing private method for testing
      jest.spyOn(service, 'triggerPrint').mockResolvedValue(undefined);

      const result = await service.print(job);

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith('/api/print-label-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job.data)
      });
    });

    it('should handle QC label API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error'
      });

      const job: PrintJob = {
        type: 'qc-label',
        data: { productCode: 'TEST001' },
        copies: 1,
        priority: 'normal'
      };

      const result = await service.print(job);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Print failed: Internal Server Error');
    });
  });

  describe('Print Operations - GRN Label', () => {
    it('should print GRN label with PDF blob', async () => {
      const job: PrintJob = {
        type: 'grn-label',
        data: {
          pdfBlob: new Blob(['test'], { type: 'application/pdf' }),
          grnNumber: 'GRN001'
        },
        copies: 1,
        priority: 'normal'
      };

      const printPromise = service.print(job);

      // Trigger iframe onload
      mockIframe.onload();

      // Fast forward timers
      jest.advanceTimersByTime(10000);

      const result = await printPromise;

      expect(result.success).toBe(true);
      expect(result.message).toBe('GRN label printed successfully');
    });

    it('should fail GRN label without PDF blob', async () => {
      const job: PrintJob = {
        type: 'grn-label',
        data: { grnNumber: 'GRN001' },
        copies: 1,
        priority: 'normal'
      };

      const result = await service.print(job);

      expect(result.success).toBe(false);
      expect(result.error).toBe('GRN label printing requires PDF blob');
    });
  });

  describe('Print Operations - Documents', () => {
    it('should print document with PDF blob', async () => {
      const job: PrintJob = {
        type: 'document',
        data: {
          pdfBlob: new Blob(['test'], { type: 'application/pdf' })
        },
        copies: 1,
        priority: 'normal'
      };

      const printPromise = service.print(job);

      // Trigger iframe onload
      mockIframe.onload();

      // Fast forward timers
      jest.advanceTimersByTime(10000);

      const result = await printPromise;

      expect(result.success).toBe(true);
      expect(result.message).toBe('Document printed successfully');
    });

    it('should fail document print without PDF blob', async () => {
      const job: PrintJob = {
        type: 'document',
        data: {},
        copies: 1,
        priority: 'normal'
      };

      const result = await service.print(job);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Document printing requires PDF blob');
    });

    it('should handle report type as document', async () => {
      const job: PrintJob = {
        type: 'report',
        data: {
          pdfBlob: new Blob(['test'], { type: 'application/pdf' })
        },
        copies: 1,
        priority: 'normal'
      };

      const printPromise = service.print(job);

      // Trigger iframe onload
      mockIframe.onload();

      // Fast forward timers
      jest.advanceTimersByTime(10000);

      const result = await printPromise;

      expect(result.success).toBe(true);
    });
  });

  describe('Print Operations - General', () => {
    it('should handle unsupported print job type', async () => {
      const job: PrintJob = {
        type: 'unsupported' as PrintJobType,
        data: {},
        copies: 1,
        priority: 'normal'
      };

      const result = await service.print(job);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unsupported print job type: unsupported');
    });

    it('should generate unique job IDs', async () => {
      const job: PrintJob = {
        type: 'document',
        data: { pdfBlob: new Blob(['test']) },
        copies: 1,
        priority: 'normal'
      };

      const printPromise1 = service.print(job);
      mockIframe.onload();
      jest.advanceTimersByTime(10000);
      const result1 = await printPromise1;

      const printPromise2 = service.print(job);
      mockIframe.onload();
      jest.advanceTimersByTime(10000);
      const result2 = await printPromise2;

      expect((result1 as any).jobId).not.toBe((result2 as any).jobId);
      expect((result1 as any).jobId).toMatch(/^job-\d+-[a-z0-9]+$/);
    });

    it('should handle print with multiple copies', async () => {
      const job: PrintJob = {
        type: 'document',
        data: { pdfBlob: new Blob(['test']) },
        copies: 3,
        priority: 'normal'
      };

      const printPromise = service.print(job);

      // Trigger iframe onload
      (mockIframe as any).onload();

      // Fast forward timers
      jest.advanceTimersByTime(10000);

      await printPromise;

      expect(mockIframe.contentWindow.print).toHaveBeenCalledTimes(3);
    });

    it('should handle generic errors', async () => {
      const job: PrintJob = {
        type: 'qc-label',
        data: {},
        copies: 1,
        priority: 'normal'
      };

      // Mock error during print
      (global.fetch as jest.Mock).mockRejectedValue('Network error');

      const result = await service.print(job);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('Batch Operations', () => {
    it('should process batch print', async () => {
      const jobs: PrintJob[] = [
        {
          type: 'document',
          data: { pdfBlob: new Blob(['test1']) },
          copies: 1,
          priority: 'normal'
        },
        {
          type: 'document',
          data: { pdfBlob: new Blob(['test2']) },
          copies: 1,
          priority: 'normal'
        }
      ];

      // Mock the internal print method to avoid iframe issues
      jest.spyOn(service, 'print').mockImplementation(async (job) => ({
        success: true,
        jobId: `job-${Date.now()}-${Math.random()}`,
        message: 'Mocked print'
      }));

      const results = await service.batchPrint(jobs);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should handle empty batch', async () => {
      const results = await service.batchPrint([]);

      expect(results).toHaveLength(0);
    });

    it('should process queue sequentially', async () => {
      const printSpy = jest.spyOn(service, 'print').mockImplementation(async (job) => ({
        success: true,
        jobId: `job-${Date.now()}-${Math.random()}`,
        message: 'Mocked print'
      }));

      const jobs: PrintJob[] = [
        { type: 'document', data: { pdfBlob: new Blob(['1']) }, copies: 1, priority: 'normal' },
        { type: 'document', data: { pdfBlob: new Blob(['2']) }, copies: 1, priority: 'normal' },
        { type: 'document', data: { pdfBlob: new Blob(['3']) }, copies: 1, priority: 'normal' }
      ];

      await service.batchPrint(jobs);

      expect(printSpy).toHaveBeenCalledTimes(3);

      // Verify sequential processing
      const calls = printSpy.mock.calls;
      expect((calls[0][0].data as DocumentData).pdfBlob).toBeDefined();
      expect((calls[1][0].data as DocumentData).pdfBlob).toBeDefined();
      expect((calls[2][0].data as DocumentData).pdfBlob).toBeDefined();
    });
  });

  describe('Queue Management', () => {
    it('should get queue status', async () => {
      const status = await service.getQueueStatus();

      expect(status).toEqual({
        pending: 0,
        processing: 0
      });
    });

    it('should update queue status during batch processing', async () => {
      // Mock print to control timing
      const printSpy = jest.spyOn(service, 'print').mockImplementation(async () => {
        return {
          success: true,
          jobId: 'test-job',
          message: 'Mocked'
        };
      });

      const jobs: PrintJob[] = [
        { type: 'document', data: { pdfBlob: new Blob(['1']) }, copies: 1, priority: 'normal' },
        { type: 'document', data: { pdfBlob: new Blob(['2']) }, copies: 1, priority: 'normal' }
      ];

      // Process batch print
      await service.batchPrint(jobs);

      // Verify the print was called for each job
      expect(printSpy).toHaveBeenCalledTimes(2);

      const statusAfter = await service.getQueueStatus();
      expect(statusAfter.processing).toBe(0);
      expect(statusAfter.pending).toBe(0);
    }, 10000);

    it('should clear queue', async () => {
      const jobs: PrintJob[] = [
        { type: 'document', data: { pdfBlob: new Blob(['1']) }, copies: 1, priority: 'normal' },
        { type: 'document', data: { pdfBlob: new Blob(['2']) }, copies: 1, priority: 'normal' }
      ];

      // Add to queue but don't process
      service['printQueue'] = [...jobs];

      await service.clearQueue();

      const status = await service.getQueueStatus();
      expect(status.pending).toBe(0);
    });

    it('should cancel job from queue', async () => {
      const job: PrintJob = {
        id: 'job-to-cancel',
        type: 'document',
        data: { pdfBlob: new Blob(['test']) },
        copies: 1,
        priority: 'normal'
      };

      service['printQueue'] = [job];

      const result = await service.cancelJob('job-to-cancel');

      expect(result).toBe(true);
      expect(service['printQueue']).toHaveLength(0);
    });

    it('should return false when canceling non-existent job', async () => {
      const result = await service.cancelJob('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('Status Change Events', () => {
    it('should handle status change subscription', () => {
      const callback = jest.fn();
      const unsubscribe = service.onStatusChange(callback);

      const status = {
        id: 'default',
        name: 'Test Printer',
        isOnline: false,
        jobsInQueue: 5
      };

      service.emit('statusChange', status);

      expect(callback).toHaveBeenCalledWith(status);

      // Test unsubscribe
      unsubscribe();
      callback.mockClear();

      service.emit('statusChange', status);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Print Dialog Handling', () => {
    it('should create and manage iframe for printing', async () => {
      const job: PrintJob = {
        type: 'document',
        data: { pdfBlob: new Blob(['test']) },
        copies: 1,
        priority: 'normal'
      };

      const printPromise = service.print(job);

      // Verify iframe created
      expect(document.createElement).toHaveBeenCalledWith('iframe');
      expect(mockIframe.style.display).toBe('none');
      expect(mockIframe.src).toBe('blob:mock-url');
      expect(document.body.appendChild).toHaveBeenCalledWith(mockIframe);

      // Trigger iframe load
      mockIframe.onload();

      // Verify print called
      expect(mockIframe.contentWindow.focus).toHaveBeenCalled();
      expect(mockIframe.contentWindow.print).toHaveBeenCalled();

      // Fast forward to cleanup time
      jest.advanceTimersByTime(10000);

      await printPromise;

      // Verify cleanup
      expect(document.body.removeChild).toHaveBeenCalledWith(mockIframe);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should handle iframe removal when already removed', async () => {
      const job: PrintJob = {
        type: 'document',
        data: { pdfBlob: new Blob(['test']) },
        copies: 1,
        priority: 'normal'
      };

      const printPromise = service.print(job);

      // Trigger iframe load
      mockIframe.onload();

      // Simulate iframe already removed
      mockIframe.parentNode = null;

      // Fast forward to cleanup time
      jest.advanceTimersByTime(10000);

      await printPromise;

      // Should not throw error
      expect(document.body.removeChild).not.toHaveBeenCalled();
    });
  });
});
