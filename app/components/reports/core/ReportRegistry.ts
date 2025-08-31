/**
 * 報表註冊中心
 * 管理所有報表配置和數據源
 */

import { ReportConfig, ReportDataSource, RegisteredReport } from './ReportConfig';

class ReportRegistryClass {
  private reports = new Map<string, RegisteredReport>();

  /**
   * 註冊報表
   */
  register(_config: ReportConfig, dataSources: Map<string, ReportDataSource>): void {
    if (this.reports.has(_config.id)) {
      (process.env.NODE_ENV as string) !== 'production' &&
        console.warn(`Report "${_config.id}" is already registered. Overwriting...`);
    }

    // 驗證數據源
    const missingDataSources = _config.sections
      .map(section => section.dataSource)
      .filter(dsId => !dataSources.has(dsId));

    if (missingDataSources.length > 0) {
      throw new Error(
        `Missing data sources for report "${_config.id}": ${missingDataSources.join(', ')}`
      );
    }

    this.reports.set(_config.id, {
      _config,
      dataSources,
    });

    (process.env.NODE_ENV as string) !== 'production' &&
      console.log(`Report "${_config.id}" registered successfully`);
  }

  /**
   * 取消註冊報表
   */
  unregister(reportId: string): boolean {
    return this.reports.delete(reportId);
  }

  /**
   * 獲取報表配置
   */
  getReport(reportId: string): RegisteredReport | undefined {
    return this.reports.get(reportId);
  }

  /**
   * 獲取所有報表
   */
  getAllReports(): RegisteredReport[] {
    return Array.from(this.reports.values());
  }

  /**
   * 按類別獲取報表
   */
  getReportsByCategory(category: string): RegisteredReport[] {
    return this.getAllReports().filter(report => report._config.category === category);
  }

  /**
   * 檢查報表是否已註冊
   */
  isRegistered(reportId: string): boolean {
    return this.reports.has(reportId);
  }

  /**
   * 清空所有報表
   */
  clear(): void {
    this.reports.clear();
  }
}

// 單例實例
export const ReportRegistry = new ReportRegistryClass();
