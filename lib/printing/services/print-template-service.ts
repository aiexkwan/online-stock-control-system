/**
 * Print Template Service
 * Manages print templates and data formatting
 */

import {
  PrintType,
  PrintTypeSchema,
  TemplateConfig,
  TemplateConfigSchema,
  QcLabelData,
  GrnLabelData,
  formatPrintData
} from '@/lib/schemas/printing';
import type { Database } from '@/lib/types/supabase-generated';

// TODO: 使用更具體的表類型定義，現在使用 any 作為臨時解決方案
// 未來應該根據具體的列印類型使用對應的表類型
type DatabaseRecord = any;

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
  async applyTemplate(template: TemplateConfig, data: DatabaseRecord[]): Promise<{
    formattedData: unknown;
    template: string;
    metadata: Record<string, string | number>;
  }> {
    try {
      // Validate data against schema if available
      if (template.schema) {
        this.validateData(data, template.schema);
      }

      // Format data based on print type
      switch (template.type) {
        case 'QC_LABEL':
          return this.formatQcLabelData(data);

        case 'GRN_LABEL':
          return this.formatGrnLabelData(data);

        case 'TRANSACTION_REPORT':
          return this.formatTransactionReportData(data);

        case 'INVENTORY_REPORT':
          return this.formatInventoryReportData(data);

        case 'PALLET_LABEL':
          return this.formatPalletLabelData(data);

        case 'TRANSFER_SLIP':
          return this.formatTransferSlipData(data);

        case 'VOID_REPORT':
          return this.formatVoidReportData(data);

        default:
          return {
            formattedData: data,
            template: template.template,
            metadata: { type: template.type, timestamp: Date.now() }
          };
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
  private formatQcLabelData(data: DatabaseRecord[]): {
    formattedData: QcLabelData[];
    template: string;
    metadata: Record<string, string | number>;
  } {
    try {
      const formattedData = data.map((record) => {
        // Convert DatabaseRecord to QcLabelData format
        const qcData = {
          plt_num: record.plt_num || '',
          product_code: record.product_code || '',
          product_qty: Number(record.product_qty || 0),
          generate_time: record.generate_time || new Date().toISOString(),
          series: record.series || '',
          pdf_url: record.pdf_url || undefined,
          plt_remark: record.plt_remark || undefined,
        };
        
        // Validate using Zod
        return formatPrintData.qcLabel(qcData);
      });

      return {
        formattedData,
        template: 'qc-label-template',
        metadata: {
          type: 'QC_LABEL',
          count: formattedData.length,
          generatedAt: Date.now()
        }
      };
    } catch (error) {
      console.error('[PrintTemplateService] QC Label formatting error:', error);
      throw error;
    }
  }

  private formatGrnLabelData(data: DatabaseRecord[]): {
    formattedData: GrnLabelData[];
    template: string;
    metadata: Record<string, string | number>;
  } {
    try {
      const formattedData = data.map((record) => {
        // Convert DatabaseRecord to GrnLabelData format
        const grnData = {
          grn_ref: Number(record.grn_ref || 0),
          plt_num: record.plt_num || '',
          material_code: record.material_code || '',
          gross_weight: Number(record.gross_weight || 0),
          net_weight: Number(record.net_weight || 0),
          package: record.package || '',
          package_count: Number(record.package_count || 1),
          pallet: record.pallet || '',
          pallet_count: Number(record.pallet_count || 1),
          sup_code: record.sup_code || '',
          creat_time: record.creat_time || new Date().toISOString(),
        };
        
        // Validate using Zod
        return formatPrintData.grnLabel(grnData);
      });

      return {
        formattedData,
        template: 'grn-label-template',
        metadata: {
          type: 'GRN_LABEL',
          count: formattedData.length,
          generatedAt: Date.now()
        }
      };
    } catch (error) {
      console.error('[PrintTemplateService] GRN Label formatting error:', error);
      throw error;
    }
  }

  private formatTransactionReportData(data: DatabaseRecord[]): {
    formattedData: DatabaseRecord[];
    template: string;
    metadata: Record<string, string | number>;
  } {
    return {
      formattedData: data,
      template: 'transaction-report-template',
      metadata: {
        type: 'TRANSACTION_REPORT',
        count: data.length,
        generatedAt: Date.now(),
        dateFrom: new Date().toISOString(),
        dateTo: new Date().toISOString()
      }
    };
  }

  private formatInventoryReportData(data: DatabaseRecord[]): {
    formattedData: DatabaseRecord[];
    template: string;
    metadata: Record<string, string | number>;
  } {
    return {
      formattedData: data,
      template: 'inventory-report-template',
      metadata: {
        type: 'INVENTORY_REPORT',
        count: data.length,
        generatedAt: Date.now(),
        totalItems: data.length
      }
    };
  }

  private formatPalletLabelData(data: DatabaseRecord[]): {
    formattedData: DatabaseRecord[];
    template: string;
    metadata: Record<string, string | number>;
  } {
    return {
      formattedData: data,
      template: 'pallet-label-template',
      metadata: {
        type: 'PALLET_LABEL',
        count: data.length,
        generatedAt: Date.now()
      }
    };
  }

  private formatTransferSlipData(data: DatabaseRecord[]): {
    formattedData: DatabaseRecord[];
    template: string;
    metadata: Record<string, string | number>;
  } {
    return {
      formattedData: data,
      template: 'transfer-slip-template',
      metadata: {
        type: 'TRANSFER_SLIP',
        count: data.length,
        generatedAt: Date.now()
      }
    };
  }

  private formatVoidReportData(data: DatabaseRecord[]): {
    formattedData: DatabaseRecord[];
    template: string;
    metadata: Record<string, string | number>;
  } {
    return {
      formattedData: data,
      template: 'void-report-template',
      metadata: {
        type: 'VOID_REPORT',
        count: data.length,
        generatedAt: Date.now()
      }
    };
  }

  private validateData(data: DatabaseRecord[], schema: { required?: string[] }): void {
    // Basic validation - can be enhanced with a proper schema validator
    const requiredFields = schema.required || [];

    for (const record of data) {
      for (const field of requiredFields) {
        if (!(field in record) || record[field] === null || record[field] === undefined) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
    }
  }

  private loadDefaultTemplates(): void {
    // QC Label Template
    this.templates.set('QC_LABEL', {
      id: 'qc-label-default',
      type: 'QC_LABEL',
      name: 'Default QC Label',
      description: 'Default QC Label Template',
      template: 'qc-label-template',
      pageSize: 'A4',
      orientation: 'portrait',
      schema: {
        required: ['plt_num', 'product_code', 'product_qty'],
      },
    });

    // GRN Label Template
    this.templates.set('GRN_LABEL', {
      id: 'grn-label-default',
      type: 'GRN_LABEL',
      name: 'Default GRN Label',
      description: 'Default GRN Label Template',
      template: 'grn-label-template',
      pageSize: 'A4',
      orientation: 'portrait',
      schema: {
        required: ['grn_ref', 'plt_num', 'material_code'],
      },
    });

    // Transaction Report Template
    this.templates.set('TRANSACTION_REPORT', {
      id: 'transaction-report-default',
      type: 'TRANSACTION_REPORT',
      name: 'Default Transaction Report',
      description: 'Default Transaction Report Template',
      template: 'transaction-report-template',
      pageSize: 'A4',
      orientation: 'portrait',
      schema: {
        required: [],
      },
    });

    // Inventory Report Template
    this.templates.set('INVENTORY_REPORT', {
      id: 'inventory-report-default',
      type: 'INVENTORY_REPORT',
      name: 'Default Inventory Report',
      description: 'Default Inventory Report Template',
      template: 'inventory-report-template',
      pageSize: 'A4',
      orientation: 'portrait',
      schema: {
        required: [],
      },
    });

    // Pallet Label Template
    this.templates.set('PALLET_LABEL', {
      id: 'pallet-label-default',
      type: 'PALLET_LABEL',
      name: 'Default Pallet Label',
      description: 'Default Pallet Label Template',
      template: 'pallet-label-template',
      pageSize: 'A4',
      orientation: 'portrait',
      schema: {
        required: ['plt_num'],
      },
    });

    // Transfer Slip Template
    this.templates.set('TRANSFER_SLIP', {
      id: 'transfer-slip-default',
      type: 'TRANSFER_SLIP',
      name: 'Default Transfer Slip',
      description: 'Default Transfer Slip Template',
      template: 'transfer-slip-template',
      pageSize: 'A4',
      orientation: 'portrait',
      schema: {
        required: [],
      },
    });

    // Void Report Template
    this.templates.set('VOID_REPORT', {
      id: 'void-report-default',
      type: 'VOID_REPORT',
      name: 'Default Void Report',
      description: 'Default Void Report Template',
      template: 'void-report-template',
      pageSize: 'A4',
      orientation: 'portrait',
      schema: {
        required: [],
      },
    });
  }
}
