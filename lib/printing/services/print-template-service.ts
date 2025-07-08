/**
 * Print Template Service
 * Manages print templates and data formatting
 */

import { PrintType, TemplateConfig } from '../types';

export class PrintTemplateService {
  private templates: Map<PrintType, TemplateConfig> = new Map();
  private initialized = false;

  constructor() {
    this.loadDefaultTemplates();
  }

  /**
   * Get template for a print type
   */
  async getTemplate(type: PrintType): Promise<TemplateConfig | null> {
    return this.templates.get(type) || null;
  }

  /**
   * Apply template to data
   */
  async applyTemplate(template: TemplateConfig, data: any): Promise<any> {
    try {
      // Validate data against schema if available
      if (template.schema) {
        this.validateData(data, template.schema);
      }

      // Format data based on print type
      switch (template.type) {
        case PrintType.QC_LABEL:
          return this.formatQcLabelData(data);

        case PrintType.GRN_LABEL:
          return this.formatGrnLabelData(data);

        case PrintType.TRANSACTION_REPORT:
          return this.formatTransactionReportData(data);

        case PrintType.INVENTORY_REPORT:
          return this.formatInventoryReportData(data);

        case PrintType.ACO_ORDER_REPORT:
          return this.formatAcoOrderReportData(data);

        case PrintType.GRN_REPORT:
          return this.formatGrnReportData(data);

        default:
          return data;
      }
    } catch (error) {
      console.error('[PrintTemplateService] Error applying template:', error);
      throw error;
    }
  }

  /**
   * Register a custom template
   */
  registerTemplate(template: TemplateConfig): void {
    this.templates.set(template.type, template);
  }

  // Private formatting methods
  private formatQcLabelData(data: any): any {
    // Ensure all required fields for QC label
    return {
      // Product information
      productCode: data.productCode || '',
      productDescription: data.productInfo?.description || '',
      productNameChinese: data.productInfo?.chineseName || '',

      // Quantity and count
      quantity: data.quantity || 0,
      count: data.count || 0,

      // Pallet information
      palletIds: data.palletIds || [],
      palletCount: data.palletIds?.length || 0,

      // Order information
      acoOrderRef: data.acoOrderRef || '',
      customerName: data.acoOrderDetails?.[0]?.customer_name || '',

      // Slate details
      slateDetail: {
        batchNumber: data.slateDetail?.batchNumber || '',
        ...data.slateDetail,
      },

      // Operator information
      operatorClockNum: data.operator || '',
      printDate: new Date().toISOString(),

      // Additional data
      ...data,
    };
  }

  private formatGrnLabelData(data: any): any {
    // Ensure all required fields for GRN label
    return {
      // GRN information
      grnNumber: data.grnNumber || '',
      supplierId: data.supplierId || '',
      supplierName: data.supplierName || '',

      // Material information
      materialCode: data.materialCode || '',
      materialDescription: data.materialDescription || '',

      // Pallet information
      palletType: data.palletType || '',
      packageType: data.packageType || '',
      palletIds: data.palletIds || [],

      // Weight information
      weights: data.weights || [],
      totalGrossWeight: data.totalGrossWeight || 0,
      totalNetWeight: data.totalNetWeight || 0,

      // Operator information
      operatorClockNum: data.operatorClockNum || '',
      printDate: new Date().toISOString(),

      // Additional data
      ...data,
    };
  }

  private formatTransactionReportData(data: any): any {
    return {
      // Report parameters
      startDate: data.startDate || new Date().toISOString(),
      endDate: data.endDate || new Date().toISOString(),

      // Filter options
      transactionType: data.transactionType || 'all',
      location: data.location || 'all',
      productCode: data.productCode || '',

      // Report data
      transactions: data.transactions || [],
      summary: data.summary || {},

      // Metadata
      generatedAt: new Date().toISOString(),
      generatedBy: data.userId || '',

      ...data,
    };
  }

  private formatInventoryReportData(data: any): any {
    return {
      // Report parameters
      reportDate: data.reportDate || new Date().toISOString(),
      location: data.location || 'all',
      category: data.category || 'all',

      // Report data
      inventoryItems: data.inventoryItems || [],
      totalValue: data.totalValue || 0,
      itemCount: data.itemCount || 0,

      // Analysis data
      stockLevels: data.stockLevels || {},
      turnoverRates: data.turnoverRates || {},

      // Metadata
      generatedAt: new Date().toISOString(),
      generatedBy: data.userId || '',

      ...data,
    };
  }

  private formatAcoOrderReportData(data: any): any {
    return {
      // Report parameters
      orderRef: data.orderRef || '',
      startDate: data.startDate || new Date().toISOString(),
      endDate: data.endDate || new Date().toISOString(),

      // Order data
      orders: data.orders || [],
      orderSummary: data.orderSummary || {},

      // Progress tracking
      progressData: data.progressData || {},
      completionRate: data.completionRate || 0,

      // Metadata
      generatedAt: new Date().toISOString(),
      generatedBy: data.userId || '',

      ...data,
    };
  }

  private formatGrnReportData(data: any): any {
    return {
      // GRN parameters
      grnRef: data.grnRef || '',
      materialCode: data.materialCode || '',

      // Report data
      palletData: data.palletData || [],
      summary: data.summary || {},

      // Metadata
      generatedAt: new Date().toISOString(),
      generatedBy: data.userId || '',
      reportType: 'grn',

      ...data,
    };
  }

  private validateData(data: any, schema: any): void {
    // Basic validation - can be enhanced with a proper schema validator
    const requiredFields = schema.required || [];

    for (const field of requiredFields) {
      if (!(field in data) || data[field] === null || data[field] === undefined) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  private loadDefaultTemplates(): void {
    // QC Label Template
    this.templates.set(PrintType.QC_LABEL, {
      id: 'qc-label-default',
      name: 'Default QC Label',
      type: PrintType.QC_LABEL,
      version: '1.0',
      template: 'qc-label-template',
      schema: {
        required: ['productCode', 'quantity', 'operator'],
      },
    });

    // GRN Label Template
    this.templates.set(PrintType.GRN_LABEL, {
      id: 'grn-label-default',
      name: 'Default GRN Label',
      type: PrintType.GRN_LABEL,
      version: '1.0',
      template: 'grn-label-template',
      schema: {
        required: ['grnNumber', 'supplierId', 'materialCode', 'operatorClockNum'],
      },
    });

    // Transaction Report Template
    this.templates.set(PrintType.TRANSACTION_REPORT, {
      id: 'transaction-report-default',
      name: 'Default Transaction Report',
      type: PrintType.TRANSACTION_REPORT,
      version: '1.0',
      template: 'transaction-report-template',
      schema: {
        required: ['startDate', 'endDate'],
      },
    });

    // Inventory Report Template
    this.templates.set(PrintType.INVENTORY_REPORT, {
      id: 'inventory-report-default',
      name: 'Default Inventory Report',
      type: PrintType.INVENTORY_REPORT,
      version: '1.0',
      template: 'inventory-report-template',
      schema: {
        required: ['reportDate'],
      },
    });

    // ACO Order Report Template
    this.templates.set(PrintType.ACO_ORDER_REPORT, {
      id: 'aco-order-report-default',
      name: 'Default ACO Order Report',
      type: PrintType.ACO_ORDER_REPORT,
      version: '1.0',
      template: 'aco-order-report-template',
      schema: {
        required: ['orderRef'],
      },
    });

    // GRN Report Template
    this.templates.set(PrintType.GRN_REPORT, {
      id: 'grn-report-default',
      name: 'Default GRN Report',
      type: PrintType.GRN_REPORT,
      version: '1.0',
      template: 'grn-report-template',
      schema: {
        required: ['grnRef'],
      },
    });
  }
}
