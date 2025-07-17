/**
 * Alert System Initializer
 * 告警系統初始化器 - 統一初始化所有告警系統組件
 */

import { AlertConfigManager } from '../config/AlertConfigManager';
import { AlertMonitoringService } from '../services/AlertMonitoringService';
import { AlertResponse } from '../types';

export class AlertSystemInitializer {
  private configManager: AlertConfigManager;
  private monitoringService: AlertMonitoringService;

  constructor() {
    this.configManager = new AlertConfigManager();
    this.monitoringService = new AlertMonitoringService();
  }

  /**
   * 初始化告警系統
   */
  public async initialize(): Promise<AlertResponse> {
    try {
      console.log('Initializing Alert System...');

      // 1. 創建數據庫 schema
      console.log('Creating database schema...');
      const schemaResult = await this.configManager.createDatabaseSchema();
      if (!schemaResult.success) {
        throw new Error(`Database schema creation failed: ${schemaResult.message}`);
      }

      // 2. 初始化預設規則
      console.log('Initializing default alert rules...');
      const rulesResult = await this.configManager.initializeDefaultRules();
      if (!rulesResult.success) {
        throw new Error(`Default rules initialization failed: ${rulesResult.message}`);
      }

      // 3. 初始化通知模板
      console.log('Initializing notification templates...');
      const templatesResult = await this.configManager.initializeDefaultTemplates();
      if (!templatesResult.success) {
        throw new Error(`Templates initialization failed: ${templatesResult.message}`);
      }

      // 4. 啟動監控服務
      console.log('Starting monitoring service...');
      const monitoringResult = await this.monitoringService.start();
      if (!monitoringResult.success) {
        throw new Error(`Monitoring service failed to start: ${monitoringResult.message}`);
      }

      console.log('Alert System initialized successfully');

      return {
        success: true,
        message: 'Alert system initialized successfully',
        data: {
          schema: schemaResult.data,
          rules: rulesResult.data,
          templates: templatesResult.data,
          monitoring: monitoringResult.data
        }
      };
    } catch (error) {
      console.error('Failed to initialize Alert System:', error);
      return {
        success: false,
        message: 'Failed to initialize alert system',
        errors: [error.message]
      };
    }
  }

  /**
   * 停止告警系統
   */
  public async shutdown(): Promise<AlertResponse> {
    try {
      console.log('Shutting down Alert System...');

      // 停止監控服務
      const result = await this.monitoringService.stop();
      if (!result.success) {
        throw new Error(`Failed to stop monitoring service: ${result.message}`);
      }

      console.log('Alert System shutdown successfully');

      return {
        success: true,
        message: 'Alert system shutdown successfully'
      };
    } catch (error) {
      console.error('Failed to shutdown Alert System:', error);
      return {
        success: false,
        message: 'Failed to shutdown alert system',
        errors: [error.message]
      };
    }
  }

  /**
   * 重置告警系統
   */
  public async reset(): Promise<AlertResponse> {
    try {
      console.log('Resetting Alert System...');

      // 停止系統
      await this.shutdown();

      // 重新初始化
      return await this.initialize();
    } catch (error) {
      console.error('Failed to reset Alert System:', error);
      return {
        success: false,
        message: 'Failed to reset alert system',
        errors: [error.message]
      };
    }
  }

  /**
   * 獲取系統狀態
   */
  public async getSystemStatus(): Promise<any> {
    try {
      const status = await this.monitoringService.getStatus();
      const config = this.configManager.getConfig();
      const templates = await this.configManager.getTemplates();

      return {
        monitoring: status,
        config: config,
        templatesCount: templates.length,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get system status:', error);
      return {
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }
}