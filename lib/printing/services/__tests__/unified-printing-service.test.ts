/**
 * Tests for UnifiedPrintingService
 */

import { UnifiedPrintingService } from '../unified-printing-service';
import { PrintHistoryService } from '../print-history-service';
import { PrintTemplateService } from '../print-template-service';
import { getHardwareAbstractionLayer } from '@/lib/hardware/hardware-abstraction-layer';
import { 
  PrintRequest, 
  PrintType, 
  PrintPriority,
  PaperSize,
  BatchPrintRequest 
} from '../../types';

// Mock dependencies
jest.mock('@/lib/hardware/hardware-abstraction-layer');
jest.mock('../print-history-service');
jest.mock('../print-template-service');

describe('UnifiedPrintingService', () => {
  let service: UnifiedPrintingService;
  let mockHAL: any; // TODO: Fix mock HAL type
  let mockHistoryService: any; // TODO: Fix PrintHistoryService mock type
  let mockTemplateService: any; // TODO: Fix PrintTemplateService mock type

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock HAL
    mockHAL = {
      initialize: jest.fn().mockResolvedValue(undefined),
      isInitialized: true,
      printer: {
        selectPrinter: jest.fn().mockResolvedValue(undefined)
      },
      print: jest.fn().mockResolvedValue({
        success: true,
        jobId: 'test-job-123',
        printedAt: new Date().toISOString()
      }),
      queue: {
        getQueueStatus: jest.fn().mockResolvedValue({
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0
        }),
        removeFromQueue: jest.fn().mockResolvedValue(true),
        on: jest.fn()
      },
      monitoring: {
        on: jest.fn()
      },
      shutdown: jest.fn().mockResolvedValue(undefined)
    };

    (getHardwareAbstractionLayer as jest.Mock).mockReturnValue(mockHAL);

    // Mock services
    mockHistoryService = new PrintHistoryService() as any; // TODO: Proper mock service typing
    mockTemplateService = new PrintTemplateService() as any; // TODO: Proper mock service typing

    mockHistoryService.record = jest.fn().mockResolvedValue(undefined);
    mockHistoryService.getById = jest.fn();
    mockHistoryService.getStatistics = jest.fn();

    mockTemplateService.getTemplate = jest.fn().mockResolvedValue(null);
    mockTemplateService.applyTemplate = jest.fn();

    // Create service instance
    service = new UnifiedPrintingService({
      historyService: mockHistoryService,
      templateService: mockTemplateService,
      enableHistory: true
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await service.initialize();

      expect(mockHAL.initialize).toHaveBeenCalledTimes(1);
      expect(service.isInitialized()).toBe(true);
    });

    it('should not initialize twice', async () => {
      await service.initialize();
      await service.initialize();

      expect(mockHAL.initialize).toHaveBeenCalledTimes(1);
    });

    it('should handle initialization errors', async () => {
      mockHAL.initialize.mockRejectedValue(new Error('Init failed'));

      await expect(service.initialize()).rejects.toThrow('Init failed');
    });

    it('should check initialization status correctly', () => {
      expect(service.isInitialized()).toBe(false);
      
      service['initialized'] = true;
      expect(service.isInitialized()).toBe(true);

      mockHAL.isInitialized = false;
      expect(service.isInitialized()).toBe(false);
    });
  });

  describe('Print Operations', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should print QC label successfully', async () => {
      const request: PrintRequest = {
        type: 'qc-label' as any, // PrintType
        data: { // TODO: Fix PrintData type
          productCode: 'TEST001',
          quantity: 100,
          operator: 'OP123'
        } as any,
        options: {
          copies: 1,
          priority: PrintPriority.NORMAL,
          paperSize: PaperSize.A4,
          orientation: 'portrait'
        }
      };

      const result = await service.print(request);

      expect(result.success).toBe(true);
      expect(result.jobId).toBe('test-job-123');
      expect(mockHAL.print).toHaveBeenCalledWith({
        type: 'qc-label' as any, // PrintType enum
        data: request.data,
        copies: 1,
        priority: 'normal',
        metadata: undefined
      });
    });

    it('should handle report type mapping', async () => {
      const request: PrintRequest = {
        type: 'grn-report' as any, // PrintType
        data: { // TODO: Fix PrintData type
          grnRef: 'GRN001' 
        } as any,
        options: { 
          copies: 1,
          paperSize: PaperSize.A4,
          orientation: 'portrait'
        }
      };

      await service.print(request);

      expect(mockHAL.print).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'report'
        })
      );
    });

    it('should select printer if preference provided', async () => {
      const request: PrintRequest = {
        type: 'qc-label' as any, // PrintType
        data: { test: 'data' } as any, // TODO: Fix PrintData type
        options: {
          copies: 1,
          printerPreference: 'printer-123',
          paperSize: PaperSize.A4,
          orientation: 'portrait'
        }
      };

      await service.print(request);

      expect(mockHAL.printer.selectPrinter).toHaveBeenCalledWith('printer-123');
    });

    it('should record history when enabled', async () => {
      const request: PrintRequest = {
        type: 'qc-label' as any, // PrintType
        data: { test: 'data' } as any, // TODO: Fix PrintData type
        options: { 
          copies: 1,
          paperSize: PaperSize.A4,
          orientation: 'portrait'
        }
      };

      await service.print(request);

      expect(mockHistoryService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: 'test-job-123',
          type: 'qc-label' as any, // PrintType
          data: request.data,
          options: request.options,
          result: expect.objectContaining({ success: true })
        })
      );
    });

    it('should handle print errors', async () => {
      mockHAL.print.mockRejectedValue(new Error('Print failed'));

      const request: PrintRequest = {
        type: 'qc-label' as any, // PrintType
        data: { test: 'data' } as any, // TODO: Fix PrintData type
        options: { 
          copies: 1,
          paperSize: PaperSize.A4,
          orientation: 'portrait'
        }
      };

      const result = await service.print(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Print failed');
    });

    it('should apply template if available', async () => {
      const template = {
        id: 'test-template',
        name: 'Test Template',
        type: 'qc-label' as any, // PrintType
        version: '1.0',
        template: 'test'
      };

      mockTemplateService.getTemplate.mockResolvedValue(template);
      mockTemplateService.applyTemplate.mockResolvedValue({ formatted: 'data' });

      const request: PrintRequest = {
        type: 'qc-label' as any, // PrintType
        data: { test: 'data' } as any, // TODO: Fix PrintData type
        options: { 
          copies: 1,
          paperSize: PaperSize.A4,
          orientation: 'portrait'
        }
      };

      await service.print(request);

      expect(mockTemplateService.getTemplate).toHaveBeenCalledWith('qc-label' as any); // PrintType
      expect(mockTemplateService.applyTemplate).toHaveBeenCalledWith(template as any, request.data as any);
      expect(mockHAL.print).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { formatted: 'data' } // TODO: Fix PrintData type
        })
      );
    });

    it('should emit print events', async () => {
      const completedSpy = jest.fn();
      service.on('printCompleted', completedSpy);

      const request: PrintRequest = {
        type: 'qc-label' as any, // PrintType
        data: { test: 'data' } as any, // TODO: Fix PrintData type
        options: { 
          copies: 1,
          paperSize: PaperSize.A4,
          orientation: 'portrait'
        }
      };

      await service.print(request);

      expect(completedSpy).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should throw error if not initialized', async () => {
      const uninitializedService = new UnifiedPrintingService();

      const request: PrintRequest = {
        type: 'qc-label' as any, // PrintType
        data: { test: 'data' } as any, // TODO: Fix PrintData type
        options: { 
          copies: 1,
          paperSize: PaperSize.A4,
          orientation: 'portrait'
        }
      };

      await expect(uninitializedService.print(request)).rejects.toThrow(
        'UnifiedPrintingService not initialized'
      );
    });
  });

  describe('Batch Print', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should process batch print sequentially by default', async () => {
      const batch: BatchPrintRequest = {
        requests: [
          {
            type: 'qc-label' as any, // PrintType
            data: { test: '1' } as any, // TODO: Fix PrintData type
            options: { 
          copies: 1,
          paperSize: PaperSize.A4,
          orientation: 'portrait'
        }
      },
          {
            type: 'qc-label' as any, // PrintType
            data: { test: '2' } as any, // TODO: Fix PrintData type
            options: { 
          copies: 1,
          paperSize: PaperSize.A4,
          orientation: 'portrait'
        }
      }
        ],
        options: {}
      };

      const result = await service.batchPrint(batch);

      expect(result.totalJobs).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(mockHAL.print).toHaveBeenCalledTimes(2);
    });

    it('should process batch print in parallel if requested', async () => {
      const batch: BatchPrintRequest = {
        requests: [
          {
            type: 'qc-label' as any, // PrintType
            data: { test: '1' } as any, // TODO: Fix PrintData type
            options: { 
          copies: 1,
          paperSize: PaperSize.A4,
          orientation: 'portrait'
        }
      },
          {
            type: 'qc-label' as any, // PrintType
            data: { test: '2' } as any, // TODO: Fix PrintData type
            options: { 
          copies: 1,
          paperSize: PaperSize.A4,
          orientation: 'portrait'
        }
      }
        ],
        options: { parallel: true }
      };

      const result = await service.batchPrint(batch);

      expect(result.totalJobs).toBe(2);
      expect(result.successful).toBe(2);
      expect(mockHAL.print).toHaveBeenCalledTimes(2);
    });

    it('should stop on error if requested', async () => {
      mockHAL.print
        .mockResolvedValueOnce({ success: true, jobId: 'job-1' })
        .mockResolvedValueOnce({ success: false, jobId: 'job-2', error: 'Failed' });

      const batch: BatchPrintRequest = {
        requests: [
          {
            type: 'qc-label' as any, // PrintType
            data: { test: '1' } as any, // TODO: Fix PrintData type
            options: { 
          copies: 1,
          paperSize: PaperSize.A4,
          orientation: 'portrait'
        }
      },
          {
            type: 'qc-label' as any, // PrintType
            data: { test: '2' } as any, // TODO: Fix PrintData type
            options: { 
          copies: 1,
          paperSize: PaperSize.A4,
          orientation: 'portrait'
        }
      },
          {
            type: 'qc-label' as any, // PrintType
            data: { test: '3' } as any, // TODO: Fix PrintData type
            options: { 
          copies: 1,
          paperSize: PaperSize.A4,
          orientation: 'portrait'
        }
      }
        ],
        options: { stopOnError: true }
      };

      const result = await service.batchPrint(batch);

      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(mockHAL.print).toHaveBeenCalledTimes(2); // Should stop after error
    });

    it('should group by type if requested', async () => {
      const batch: BatchPrintRequest = {
        requests: [
          {
            type: 'qc-label' as any, // PrintType
            data: { test: '1' } as any, // TODO: Fix PrintData type
            options: { 
          copies: 1,
          paperSize: PaperSize.A4,
          orientation: 'portrait'
        }
      },
          {
            type: 'grn-label' as any, // PrintType
            data: { test: '2' } as any, // TODO: Fix PrintData type
            options: { 
          copies: 1,
          paperSize: PaperSize.A4,
          orientation: 'portrait'
        }
      },
          {
            type: 'qc-label' as any, // PrintType
            data: { test: '3' } as any, // TODO: Fix PrintData type
            options: { 
          copies: 1,
          paperSize: PaperSize.A4,
          orientation: 'portrait'
        }
      }
        ],
        options: { groupByType: true }
      };

      await service.batchPrint(batch);

      // First group: QC labels
      expect(mockHAL.print).toHaveBeenNthCalledWith(1, 
        expect.objectContaining({ type: 'qc-label' as any }) // PrintType
      );
      expect(mockHAL.print).toHaveBeenNthCalledWith(2,
        expect.objectContaining({ type: 'qc-label' as any }) // PrintType
      );
      // Second group: GRN label
      expect(mockHAL.print).toHaveBeenNthCalledWith(3,
        expect.objectContaining({ type: 'grn-label' as any }) // PrintType
      );
    });
  });

  describe('Reprint', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should reprint from history', async () => {
      const historyEntry = {
        id: 'history-123',
        jobId: 'job-123',
        type: 'qc-label' as any, // PrintType
        data: { test: 'original' } as any, // TODO: Fix PrintData type
        options: {
          copies: 2,
          paperSize: PaperSize.A4,
          orientation: 'portrait' as const
        },
        metadata: { userId: 'user-123', original: true },
        result: { success: true, jobId: 'job-123' },
        createdAt: new Date().toISOString()
      };

      mockHistoryService.getById.mockResolvedValue(historyEntry);

      await service.reprint('history-123');

      expect(mockHistoryService.getById).toHaveBeenCalledWith('history-123');
      expect(mockHAL.print).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'qc-label' as any, // PrintType
          data: { test: 'original' } as any, // TODO: Fix PrintData type
          metadata: expect.objectContaining({
            original: true,
            reference: 'history-123',
            source: 'reprint'
          })
        })
      );
    });

    it('should throw error if history not found', async () => {
      mockHistoryService.getById.mockResolvedValue(null);

      await expect(service.reprint('not-found')).rejects.toThrow(
        'Print history not-found not found'
      );
    });
  });

  describe('Queue Management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should get queue status', async () => {
      const expectedStatus = {
        pending: 5,
        processing: 1,
        completed: 10,
        failed: 2
      };
      mockHAL.queue.getQueueStatus.mockResolvedValue(expectedStatus);

      const status = await service.getQueueStatus();

      expect(status).toEqual(expectedStatus);
    });

    it('should return empty status if not initialized', async () => {
      const uninitializedService = new UnifiedPrintingService();

      const status = await uninitializedService.getQueueStatus();

      expect(status).toEqual({
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
      });
    });

    it('should cancel job', async () => {
      const result = await service.cancelJob('job-123');

      expect(mockHAL.queue.removeFromQueue).toHaveBeenCalledWith('job-123');
      expect(result).toBe(true);
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should get statistics from history service', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const expectedStats = {
        totalJobs: 100,
        successRate: 0.95,
        averageTime: 2500,
        byType: {
          'qc-label': 50,
          'grn-label': 30,
          'transaction-report': 20,
          'inventory-report': 0,
          'aco-order-report': 0,
          'grn-report': 0,
          'custom-document': 0
        },
        byUser: { 'user-123': 100 },
        errorRate: 0.05
      };

      mockHistoryService.getStatistics.mockResolvedValue(expectedStats);

      const stats = await service.getStatistics(startDate, endDate);

      expect(mockHistoryService.getStatistics).toHaveBeenCalledWith(startDate, endDate);
      expect(stats).toEqual(expectedStats);
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should forward HAL queue events', () => {
      const jobEventSpy = jest.fn();
      service.on('jobQueued', jobEventSpy);

      // Simulate HAL queue event
      const eventHandler = mockHAL.queue.on.mock.calls.find(
        (call: [string, Function]) => call[0] === 'job.added'
      )?.[1];
      
      const testJob = { id: 'test-job', type: 'qc-label' };
      eventHandler?.(testJob);

      expect(jobEventSpy).toHaveBeenCalledWith(testJob);
    });

    it('should forward monitoring events', () => {
      const statusSpy = jest.fn();
      service.on('printerStatusChange', statusSpy);

      // Simulate monitoring event
      const eventHandler = mockHAL.monitoring.on.mock.calls.find(
        (call: [string, Function]) => call[0] === 'statusChange'
      )?.[1];

      const status = { online: true, queue: 0 };
      eventHandler?.(status);

      expect(statusSpy).toHaveBeenCalledWith(status);
    });
  });

  describe('Shutdown', () => {
    it('should shutdown cleanly', async () => {
      await service.initialize();
      await service.shutdown();

      expect(mockHAL.shutdown).toHaveBeenCalled();
      expect(service.isInitialized()).toBe(false);
    });

    it('should handle shutdown when not initialized', async () => {
      await service.shutdown();

      expect(mockHAL.shutdown).not.toHaveBeenCalled();
    });

    it('should handle shutdown errors', async () => {
      await service.initialize();
      mockHAL.shutdown.mockRejectedValue(new Error('Shutdown failed'));

      // Should not throw
      await expect(service.shutdown()).resolves.not.toThrow();
    });
  });
});