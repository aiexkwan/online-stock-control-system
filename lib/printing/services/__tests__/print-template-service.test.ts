/**
 * Tests for PrintTemplateService
 */

import { PrintTemplateService } from '../print-template-service';
import { PrintType } from '../../types';

describe('PrintTemplateService', () => {
  let service: PrintTemplateService;

  beforeEach(() => {
    service = new PrintTemplateService();
  });

  describe('Template Management', () => {
    it('should load default templates on initialization', async () => {
      // Check QC Label template
      const qcTemplate = await service.getTemplate(PrintType.QC_LABEL);
      expect(qcTemplate).toBeDefined();
      expect(qcTemplate?.type).toBe(PrintType.QC_LABEL);
      expect(qcTemplate?.name).toBe('Default QC Label');

      // Check GRN Label template
      const grnTemplate = await service.getTemplate(PrintType.GRN_LABEL);
      expect(grnTemplate).toBeDefined();
      expect(grnTemplate?.type).toBe(PrintType.GRN_LABEL);

      // Check all report templates
      const reportTypes = [
        PrintType.TRANSACTION_REPORT,
        PrintType.INVENTORY_REPORT,
        PrintType.ACO_ORDER_REPORT,
        PrintType.GRN_REPORT
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
        type: PrintType.QC_LABEL,
        version: '2.0',
        template: 'custom-template'
      };

      service.registerTemplate(customTemplate);

      const retrieved = await service.getTemplate(PrintType.QC_LABEL);
      expect(retrieved).toEqual(customTemplate);
    });
  });

  describe('Data Formatting - QC Label', () => {
    it('should format QC label data correctly', async () => {
      const template = await service.getTemplate(PrintType.QC_LABEL);
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

      const formatted = await service.applyTemplate(template!, inputData);

      expect(formatted.productCode).toBe('PROD001');
      expect(formatted.productDescription).toBe('Test Product');
      expect(formatted.productNameChinese).toBe('測試產品');
      expect(formatted.quantity).toBe(100);
      expect(formatted.count).toBe(50);
      expect(formatted.palletIds).toEqual(['P1', 'P2']);
      expect(formatted.palletCount).toBe(2);
      expect(formatted.acoOrderRef).toBe('ACO001');
      expect(formatted.customerName).toBe('Test Customer');
      expect(formatted.slateDetail.batchNumber).toBe('BATCH001');
      expect(formatted.operatorClockNum).toBe('OP123');
      expect(formatted.printDate).toBeDefined();
    });

    it('should handle missing optional QC label data', async () => {
      const template = await service.getTemplate(PrintType.QC_LABEL);
      // Provide required fields only
      const inputData = {
        productCode: 'TEST',
        quantity: 0,
        operator: ''
      };

      const formatted = await service.applyTemplate(template!, inputData);

      expect(formatted.productCode).toBe('TEST');
      expect(formatted.productDescription).toBe('');
      expect(formatted.quantity).toBe(0);
      expect(formatted.count).toBe(0);
      expect(formatted.palletIds).toEqual([]);
      expect(formatted.palletCount).toBe(0);
      expect(formatted.operatorClockNum).toBe('');
    });
  });

  describe('Data Formatting - GRN Label', () => {
    it('should format GRN label data correctly', async () => {
      const template = await service.getTemplate(PrintType.GRN_LABEL);
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

      const formatted = await service.applyTemplate(template!, inputData);

      expect(formatted.grnNumber).toBe('GRN001');
      expect(formatted.supplierId).toBe('SUP001');
      expect(formatted.supplierName).toBe('Test Supplier');
      expect(formatted.materialCode).toBe('MAT001');
      expect(formatted.materialDescription).toBe('Test Material');
      expect(formatted.palletType).toBe('Standard');
      expect(formatted.packageType).toBe('Box');
      expect(formatted.palletIds).toEqual(['P1', 'P2', 'P3']);
      expect(formatted.weights).toEqual([100, 200, 150]);
      expect(formatted.totalGrossWeight).toBe(450);
      expect(formatted.totalNetWeight).toBe(400);
      expect(formatted.operatorClockNum).toBe('OP456');
      expect(formatted.printDate).toBeDefined();
    });

    it('should handle missing optional GRN label data', async () => {
      const template = await service.getTemplate(PrintType.GRN_LABEL);
      // Provide required fields only
      const inputData = {
        grnNumber: 'GRN001',
        supplierId: 'SUP001',
        materialCode: 'MAT001',
        operatorClockNum: 'OP001'
      };

      const formatted = await service.applyTemplate(template!, inputData);

      expect(formatted.grnNumber).toBe('GRN001');
      expect(formatted.supplierId).toBe('SUP001');
      expect(formatted.materialCode).toBe('MAT001');
      expect(formatted.weights).toEqual([]);
      expect(formatted.totalGrossWeight).toBe(0);
    });
  });

  describe('Data Formatting - Reports', () => {
    it('should format transaction report data', async () => {
      const template = await service.getTemplate(PrintType.TRANSACTION_REPORT);
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

      const formatted = await service.applyTemplate(template!, inputData);

      expect(formatted.transactionType).toBe('inbound');
      expect(formatted.location).toBe('Warehouse A');
      expect(formatted.productCode).toBe('PROD001');
      expect(formatted.transactions).toHaveLength(2);
      expect(formatted.summary.total).toBe(100);
      expect(formatted.generatedBy).toBe('USER001');
      expect(formatted.generatedAt).toBeDefined();
    });

    it('should format inventory report data', async () => {
      const template = await service.getTemplate(PrintType.INVENTORY_REPORT);
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

      const formatted = await service.applyTemplate(template!, inputData);

      expect(formatted.location).toBe('Warehouse B');
      expect(formatted.category).toBe('Electronics');
      expect(formatted.inventoryItems).toHaveLength(3);
      expect(formatted.totalValue).toBe(50000);
      expect(formatted.itemCount).toBe(150);
      expect(formatted.stockLevels.low).toBe(10);
      expect(formatted.turnoverRates.fast).toBe(30);
      expect(formatted.generatedBy).toBe('USER002');
    });

    it('should format ACO order report data', async () => {
      const template = await service.getTemplate(PrintType.ACO_ORDER_REPORT);
      const inputData = {
        orderRef: 'ORD001',
        orders: [{ id: 1 }, { id: 2 }],
        orderSummary: { total: 5 },
        progressData: { completed: 3, pending: 2 },
        completionRate: 60,
        userId: 'USER003'
      };

      const formatted = await service.applyTemplate(template!, inputData);

      expect(formatted.orderRef).toBe('ORD001');
      expect(formatted.orders).toHaveLength(2);
      expect(formatted.orderSummary.total).toBe(5);
      expect(formatted.progressData.completed).toBe(3);
      expect(formatted.completionRate).toBe(60);
      expect(formatted.generatedBy).toBe('USER003');
    });

    it('should format GRN report data', async () => {
      const template = await service.getTemplate(PrintType.GRN_REPORT);
      const inputData = {
        grnRef: 'GRN001',
        materialCode: 'MAT001',
        palletData: [{ id: 1 }, { id: 2 }],
        summary: { totalWeight: 1000 },
        userId: 'USER004'
      };

      const formatted = await service.applyTemplate(template!, inputData);

      expect(formatted.grnRef).toBe('GRN001');
      expect(formatted.materialCode).toBe('MAT001');
      expect(formatted.palletData).toHaveLength(2);
      expect(formatted.summary.totalWeight).toBe(1000);
      expect(formatted.reportType).toBe('grn');
      expect(formatted.generatedBy).toBe('USER004');
    });
  });

  describe('Data Validation', () => {
    it('should validate required fields', async () => {
      const template = await service.getTemplate(PrintType.QC_LABEL);
      const invalidData = {
        quantity: 100
        // Missing productCode and operator
      };

      await expect(
        service.applyTemplate(template!, invalidData)
      ).rejects.toThrow('Missing required field: productCode');
    });

    it('should pass validation with all required fields', async () => {
      const template = await service.getTemplate(PrintType.QC_LABEL);
      const validData = {
        productCode: 'PROD001',
        quantity: 100,
        operator: 'OP123'
      };

      await expect(
        service.applyTemplate(template!, validData)
      ).resolves.toBeDefined();
    });

    it('should handle null and undefined values in validation', async () => {
      const template = await service.getTemplate(PrintType.QC_LABEL);
      const dataWithNull = {
        productCode: null,
        quantity: 100,
        operator: 'OP123'
      };

      await expect(
        service.applyTemplate(template!, dataWithNull)
      ).rejects.toThrow('Missing required field: productCode');

      const dataWithUndefined = {
        productCode: undefined,
        quantity: 100,
        operator: 'OP123'
      };

      await expect(
        service.applyTemplate(template!, dataWithUndefined)
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

      service.registerTemplate(unknownTemplate);
      const data = { test: 'data' };

      const result = await service.applyTemplate(unknownTemplate, data);

      // Should return data unchanged for unknown types
      expect(result).toEqual(data);
    });

    it('should preserve additional data fields', async () => {
      const template = await service.getTemplate(PrintType.QC_LABEL);
      const inputData = {
        productCode: 'PROD001',
        quantity: 100,
        operator: 'OP123',
        customField1: 'value1',
        customField2: 'value2'
      };

      const formatted = await service.applyTemplate(template!, inputData);

      expect(formatted.customField1).toBe('value1');
      expect(formatted.customField2).toBe('value2');
    });

    it('should handle deeply nested data', async () => {
      const template = await service.getTemplate(PrintType.QC_LABEL);
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

      const formatted = await service.applyTemplate(template!, inputData);

      expect(formatted.slateDetail.batchNumber).toBe('BATCH001');
      expect(formatted.slateDetail.nested.deep.value).toBe('test');
    });
  });
});