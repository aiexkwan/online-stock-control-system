/**
 * 統一報表生成引擎
 * 注意：此引擎不處理標籤生成，標籤保持現有實現
 */

import {
  ReportConfig,
  FilterValues,
  ProcessedReportData,
  ReportFormat,
  ReportDataSource,
  ReportGenerator,
} from './ReportConfig';
import { PdfGenerator } from '../generators/PdfGenerator';
import { ExcelGenerator } from '../generators/ExcelGenerator';
import { CsvGenerator } from '../generators/CsvGenerator';
import { ReportCache } from './ReportCache';
import { DatabaseRecord } from '@/types/database/tables';

export class ReportEngine {
  private _config: ReportConfig;
  private dataSources: Map<string, ReportDataSource>;
  private generators: Map<ReportFormat, ReportGenerator>;

  constructor(
    _config: ReportConfig,
    dataSources: Map<string, ReportDataSource>,
    customGenerators?: Map<ReportFormat, ReportGenerator>
  ) {
    this._config = _config;
    this.dataSources = dataSources;

    // 初始化生成器，支援自定義生成器以保持現有報表格式
    this.generators = customGenerators || this.initDefaultGenerators();
  }

  private initDefaultGenerators(): Map<ReportFormat, ReportGenerator> {
    const generators = new Map<ReportFormat, ReportGenerator>();

    // 檢查是否需要使用舊版樣式
    const useLegacyStyles = this._config.styleOverrides?.pdf?.useLegacyStyles;

    generators.set('pdf', new PdfGenerator(useLegacyStyles));
    generators.set('excel', new ExcelGenerator());
    generators.set('csv', new CsvGenerator());

    return generators;
  }

  /**
   * 驗證過濾器值
   */
  private validateFilters(filters: FilterValues): void {
    for (const filterConfig of this._config.filters) {
      const value = filters[filterConfig.id];

      // 檢查必填
      if (filterConfig.required && (value === undefined || value === null || value === '')) {
        throw new Error(`Filter "${filterConfig.label}" is required`);
      }

      // 驗證規則
      if (value !== undefined && value !== null && filterConfig.validation) {
        const { min, max, pattern, message } = filterConfig.validation;

        if (min !== undefined && Number(value) < min) {
          throw new Error(message || `${filterConfig.label} must be at least ${min}`);
        }

        if (max !== undefined && Number(value) > max) {
          throw new Error(message || `${filterConfig.label} must be at most ${max}`);
        }

        if (pattern && !new RegExp(pattern).test(String(value))) {
          throw new Error(message || `${filterConfig.label} format is invalid`);
        }
      }
    }
  }

  /**
   * 獲取報表數據（支援緩存）
   */
  private async fetchData(filters: FilterValues): Promise<Record<string, unknown>> {
    const cache = ReportCache.getInstance();

    // 檢查緩存
    const cachedData = cache.get(this._config.id, filters);
    if (cachedData) {
      // 將緩存的 DatabaseRecord[] 轉換為所需的結構
      return { cachedResult: cachedData };
    }

    const data: Record<string, unknown> = {};

    // 並行獲取所有數據源
    const fetchPromises = this._config.sections.map(async section => {
      const dataSource = this.dataSources.get(section.dataSource);
      if (!dataSource) {
        throw new Error(
          `Data source "${section.dataSource}" not found for section "${section.id}"`
        );
      }

      const sectionData = await dataSource.fetch(filters);

      // 應用數據轉換
      const transformedData = dataSource.transform
        ? dataSource.transform(sectionData)
        : sectionData;

      // 策略4: unknown + type narrowing - 安全的數據驗證
      if (dataSource.validate) {
        // 確保 transformedData 符合 DatabaseRecord[] 類型
        const validatedData = Array.isArray(transformedData) ? transformedData : [];
        if (!dataSource.validate(validatedData)) {
          throw new Error(`Invalid data from source "${section.dataSource}"`);
        }
      }

      data[section.id] = transformedData;
    });

    await Promise.all(fetchPromises);

    // 緩存數據 - 轉換為 DatabaseRecord[] 類型
    const cacheData: unknown[] = [];
    for (const key in data) {
      const sectionData = data[key];
      if (Array.isArray(sectionData)) {
        cacheData.push(...sectionData);
      }
    }
    cache.set(this._config.id, filters, cacheData as DatabaseRecord[]);

    return data;
  }

  /**
   * 處理數據，生成報表所需的結構
   */
  private processData(
    rawData: Record<string, unknown>,
    filters: FilterValues
  ): ProcessedReportData {
    // 計算總記錄數
    let recordCount = 0;
    for (const sectionId in rawData) {
      const sectionData = rawData[sectionId];
      if (Array.isArray(sectionData)) {
        recordCount += sectionData.length;
      }
    }

    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        filters,
        recordCount,
      },
      sections: rawData,
      summary: this.generateSummary(rawData),
    };
  }

  /**
   * 生成摘要數據
   */
  private generateSummary(data: Record<string, unknown>): Record<string, unknown> {
    const summary: Record<string, unknown> = {};

    // 根據配置生成摘要
    for (const section of this._config.sections) {
      if (section.type === 'summary' && section.config?.summaryFields) {
        const sectionData = data[section.id];

        for (const field of section.config.summaryFields) {
          switch (field.type) {
            case 'count':
              summary[field.id] = Array.isArray(sectionData) ? sectionData.length : 0;
              break;
            case 'sum':
              if (field.field && Array.isArray(sectionData)) {
                summary[field.id] = sectionData.reduce(
                  (sum, item) => sum + (Number(item[field.field as keyof typeof item]) || 0),
                  0
                );
              }
              break;
            case 'average':
              if (field.field && Array.isArray(sectionData) && sectionData.length > 0) {
                const sum = sectionData.reduce(
                  (sum, item) => sum + (Number(item[field.field as keyof typeof item]) || 0),
                  0
                );
                summary[field.id] = sum / sectionData.length;
              }
              break;
            // 其他聚合類型...
          }
        }
      }
    }

    return summary;
  }

  /**
   * 生成報表
   */
  async generateReport(format: ReportFormat, filters: FilterValues): Promise<Blob> {
    // 驗證格式支援
    if (!this._config.formats.includes(format)) {
      throw new Error(`Format "${format}" is not supported for this report`);
    }

    // 驗證過濾器
    this.validateFilters(filters);

    try {
      // 獲取數據
      const rawData = await this.fetchData(filters);

      // 處理數據
      const processedData = this.processData(rawData, filters);

      // 獲取生成器
      const generator = this.generators.get(format);
      if (!generator) {
        throw new Error(`Generator for format "${format}" not found`);
      }

      // 生成報表
      return await generator.generate(processedData, this._config);
    } catch (error) {
      console.error('Report generation failed:', error);
      throw new Error(
        `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 獲取報表配置（用於 UI 渲染）
   */
  getConfig(): ReportConfig {
    return this._config;
  }

  /**
   * 獲取過濾器的動態選項
   */
  async getFilterOptions(filterId: string): Promise<unknown[]> {
    const filterConfig = this._config.filters.find(f => f.id === filterId);
    if (!filterConfig?.dataSource) {
      return [];
    }

    // 實現動態選項加載邏輯
    // 這裡需要根據 dataSource 配置從數據庫獲取選項
    return [];
  }
}
