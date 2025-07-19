/**
 * Tests for PrintTemplateService
 */

import { PrintTemplateService } from '../print-template-service';
import { PrintType } from '@/lib/schemas/printing';

describe('PrintTemplateService', () => {
  let service: PrintTemplateService;

  beforeEach(() => {
    service = new PrintTemplateService();
  });

  describe('Template Management', () => {
    it('should load default templates on initialization', async () => {
      // Check QC Label template
      const qcTemplate = await service.getTemplate('QC_LABEL');
      expect(qcTemplate).toBeDefined();
      expect(qcTemplate?.type).toBe('QC_LABEL');
      expect(qcTemplate?.name).toBe('Default QC Label');

      // Check GRN Label template
      const grnTemplate = await service.getTemplate('GRN_LABEL');
      expect(grnTemplate).toBeDefined();
      expect(grnTemplate?.type).toBe('GRN_LABEL');

      // Check all report templates
      const reportTypes: PrintType[] = [
        'TRANSACTION_REPORT',
        'INVENTORY_REPORT',
        'PALLET_LABEL',
        'TRANSFER_SLIP',
        'VOID_REPORT'
      ];

      for (const type of reportTypes) {
        const template = await service.getTemplate(type);
        expect(template).toBeDefined();
        expect(template?.type).toBe(type);
      }
    });

    it('should return null for non-existent template', async () => {
      const template = await service.getTemplate('NON_EXISTENT' as PrintType);
      expect(template).toBeNull();
    });

    it('should register custom templates', async () => {
      const customTemplate = {
        id: 'custom-qc-label',
        name: 'Custom QC Label',
        type: 'QC_LABEL' as const,
        template: 'custom-template',
        pageSize: 'A4' as const,
        orientation: 'portrait' as const,
        margins: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20
        },
        variables: {},
        version: '1.0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      service.registerTemplate(customTemplate);

      const retrieved = await service.getTemplate('QC_LABEL');
      expect(retrieved).toEqual(customTemplate);
    });
  });

  describe('Data Formatting - QC Label', () => {
    it('should format QC label data correctly', async () => {
      const template = await service.getTemplate('QC_LABEL');
      const inputData = {
        productCode: 'PROD001',
        quantity: 100,
        count: 50,
        operator: 'OP123',
        palletIds: ['P1', 'P2'],
        acoOrderRef: 'ACO001',
        productInfo: {
          description: 'Test Product',
          chineseName: '測試產品'
        },
        acoOrderDetails: [{
          customer_name: 'Test Customer'
        }],
        slateDetail: {
          batchNumber: 'BATCH001'
        }
      };

      const formatted = await service.applyTemplate(template!, [inputData]);

      expect((formatted as any).formattedData).toBeDefined();
      expect(Array.isArray(formatted.formattedData)).toBe(true);
      expect((formatted as any).template).toBeDefined();
      expect((formatted as any).metadata).toBeDefined();
      // Check metadata contains expected information
      expect((formatted as any).metadata.type).toBe('QC_LABEL');
    });

    it('should handle missing optional QC label data', async () => {
      const template = await service.getTemplate('QC_LABEL');
      // Provide required fields only
      const inputData = {
        productCode: 'TEST',
        quantity: 0,
        operator: ''
      };

      const formatted = await service.applyTemplate(template as any, inputData as any);

      expect((formatted as any).productCode).toBe('TEST');
      expect((formatted as any).productDescription).toBe('');
      expect((formatted as any).quantity).toBe(0);
      expect((formatted as any).count).toBe(0);
      expect((formatted as any).palletIds).toEqual([]);
      expect((formatted as any).palletCount).toBe(0);
      expect((formatted as any).operatorClockNum).toBe('');
    });
  });

  describe('Data Formatting - GRN Label', () => {
    it('should format GRN label data correctly', async () => {
      const template = await service.getTemplate('GRN_LABEL');
      const inputData = {
        grnNumber: 'GRN001',
        supplierId: 'SUP001',
        supplierName: 'Test Supplier',
        materialCode: 'MAT001',
        materialDescription: 'Test Material',
        palletType: 'Standard',
        packageType: 'Box',
        palletIds: ['P1', 'P2', 'P3'],
        weights: [100, 200, 150],
        totalGrossWeight: 450,
        totalNetWeight: 400,
        operatorClockNum: 'OP456'
      };

      const formatted = await service.applyTemplate(template as any, inputData as any);

      expect((formatted as any).grnNumber).toBe('GRN001');
      expect((formatted as any).supplierId).toBe('SUP001');
      expect((formatted as any).supplierName).toBe('Test Supplier');
      expect((formatted as any).materialCode).toBe('MAT001');
      expect((formatted as any).materialDescription).toBe('Test Material');
      expect((formatted as any).palletType).toBe('Standard');
      expect((formatted as any).packageType).toBe('Box');
      expect((formatted as any).palletIds).toEqual(['P1', 'P2', 'P3']);
      expect((formatted as any).weights).toEqual([100, 200, 150]);
      expect((formatted as any).totalGrossWeight).toBe(450);
      expect((formatted as any).totalNetWeight).toBe(400);
      expect((formatted as any).operatorClockNum).toBe('OP456');
      expect((formatted as any).printDate).toBeDefined();
    });

    it('should handle missing optional GRN label data', async () => {
      const template = await service.getTemplate('GRN_LABEL');
      // Provide required fields only
      const inputData = {
        grnNumber: 'GRN001',
        supplierId: 'SUP001',
        materialCode: 'MAT001',
        operatorClockNum: 'OP001'
      };

      const formatted = await service.applyTemplate(template as any, inputData as any);

      expect((formatted as any).grnNumber).toBe('GRN001');
      expect((formatted as any).supplierId).toBe('SUP001');
      expect((formatted as any).materialCode).toBe('MAT001');
      expect((formatted as any).weights).toEqual([]);
      expect((formatted as any).totalGrossWeight).toBe(0);
    });
  });

  describe('Data Formatting - Reports', () => {
    it('should format transaction report data', async () => {
      const template = await service.getTemplate('TRANSACTION_REPORT');
      const inputData = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        transactionType: 'inbound',
        location: 'Warehouse A',
        productCode: 'PROD001',
        transactions: [{ id: 1 }, { id: 2 }],
        summary: { total: 100 },
        userId: 'USER001'
      };

      const formatted = await service.applyTemplate(template as any, inputData as any);

      expect((formatted as any).transactionType).toBe('inbound');
      expect((formatted as any).location).toBe('Warehouse A');
      expect((formatted as any).productCode).toBe('PROD001');
      expect((formatted as any).transactions).toHaveLength(2);
      expect((formatted as any).summary.total).toBe(100);
      expect((formatted as any).generatedBy).toBe('USER001');
      expect((formatted as any).generatedAt).toBeDefined();
    });

    it('should format inventory report data', async () => {
      const template = await service.getTemplate('INVENTORY_REPORT');
      const inputData = {
        reportDate: '2024-01-15',
        location: 'Warehouse B',
        category: 'Electronics',
        inventoryItems: [{ id: 1 }, { id: 2 }, { id: 3 }],
        totalValue: 50000,
        itemCount: 150,
        stockLevels: { low: 10, medium: 50, high: 90 },
        turnoverRates: { fast: 30, slow: 70 },
        userId: 'USER002'
      };

      const formatted = await service.applyTemplate(template as any, inputData as any);

      expect((formatted as any).location).toBe('Warehouse B');
      expect((formatted as any).category).toBe('Electronics');
      expect((formatted as any).inventoryItems).toHaveLength(3);
      expect((formatted as any).totalValue).toBe(50000);
      expect((formatted as any).itemCount).toBe(150);
      expect((formatted as any).stockLevels.low).toBe(10);
      expect((formatted as any).turnoverRates.fast).toBe(30);
      expect((formatted as any).generatedBy).toBe('USER002');
    });

    it('should format ACO order report data', async () => {
      const template = await service.getTemplate('QC_LABEL' as any); // PrintType.ACO_ORDER_REPORT
      const inputData = {
        orderRef: 'ORD001',
        orders: [{ id: 1 }, { id: 2 }],
        orderSummary: { total: 5 },
        progressData: { completed: 3, pending: 2 },
        completionRate: 60,
        userId: 'USER003'
      };

      const formatted = await service.applyTemplate(template as any, inputData as any);

      expect((formatted as any).orderRef).toBe('ORD001');
      expect((formatted as any).orders).toHaveLength(2);
      expect((formatted as any).orderSummary.total).toBe(5);
      expect((formatted as any).progressData.completed).toBe(3);
      expect((formatted as any).completionRate).toBe(60);
      expect((formatted as any).generatedBy).toBe('USER003');
    });

    it('should format GRN report data', async () => {
      const template = await service.getTemplate('QC_LABEL' as any); // PrintType.GRN_REPORT);
      const inputData = {
        grnRef: 'GRN001',
        materialCode: 'MAT001',
        palletData: [{ id: 1 }, { id: 2 }],
        summary: { totalWeight: 1000 },
        userId: 'USER004'
      };

      const formatted = await service.applyTemplate(template as any, inputData as any);

      expect((formatted as any).grnRef).toBe('GRN001');
      expect((formatted as any).materialCode).toBe('MAT001');
      expect((formatted as any).palletData).toHaveLength(2);
      expect((formatted as any).summary.totalWeight).toBe(1000);
      expect((formatted as any).reportType).toBe('grn');
      expect((formatted as any).generatedBy).toBe('USER004');
    });
  });

  describe('Data Validation', () => {
    it('should validate required fields', async () => {
      const template = await service.getTemplate('QC_LABEL');
      const invalidData = {
        quantity: 100
        // Missing productCode and operator
      };

      await expect(
        service.applyTemplate(template as any, invalidData as any)
      ).rejects.toThrow('Missing required field: productCode');
    });

    it('should pass validation with all required fields', async () => {
      const template = await service.getTemplate('QC_LABEL');
      const validData = {
        productCode: 'PROD001',
        quantity: 100,
        operator: 'OP123'
      };

      await expect(
        service.applyTemplate(template as any, validData as any)
      ).resolves.toBeDefined();
    });

    it('should handle null and undefined values in validation', async () => {
      const template = await service.getTemplate('QC_LABEL');
      const dataWithNull = {
        productCode: null,
        quantity: 100,
        operator: 'OP123'
      };

      await expect(
        service.applyTemplate(template as any, dataWithNull as any)
      ).rejects.toThrow('Missing required field: productCode');

      const dataWithUndefined = {
        productCode: undefined,
        quantity: 100,
        operator: 'OP123'
      };

      await expect(
        service.applyTemplate(template as any, dataWithUndefined as any)
      ).rejects.toThrow('Missing required field: productCode');
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown print type', async () => {
      const unknownTemplate = {
        id: 'unknown',
        name: 'Unknown',
        type: 'UNKNOWN_TYPE' as PrintType,
        version: '1.0',
        template: 'unknown'
      };

      service.registerTemplate(unknownTemplate as any);
      const data = { test: 'data' };

      const result = await service.applyTemplate(unknownTemplate as any, data as any);

      // Should return data unchanged for unknown types
      expect(result).toEqual(data);
    });

    it('should preserve additional data fields', async () => {
      const template = await service.getTemplate('QC_LABEL');
      const inputData = {
        productCode: 'PROD001',
        quantity: 100,
        operator: 'OP123',
        customField1: 'value1',
        customField2: 'value2'
      };

      const formatted = await service.applyTemplate(template as any, inputData as any);

      expect((formatted as any).customField1).toBe('value1');
      expect((formatted as any).customField2).toBe('value2');
    });

    it('should handle deeply nested data', async () => {
      const template = await service.getTemplate('QC_LABEL');
      const inputData = {
        productCode: 'PROD001',
        quantity: 100,
        operator: 'OP123',
        slateDetail: {
          batchNumber: 'BATCH001',
          nested: {
            deep: {
              value: 'test'
            }
          }
        }
      };

      const formatted = await service.applyTemplate(template as any, inputData as any);

      expect((formatted as any).slateDetail.batchNumber).toBe('BATCH001');
      expect((formatted as any).slateDetail.nested.deep.value).toBe('test');
    });
  });
});