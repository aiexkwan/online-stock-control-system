/**
 * Alert System Entry Point
 * 告警系統入口 - 統一導出所有告警系統組件
 */

// 核心組件
export { AlertRuleEngine } from './core/AlertRuleEngine';
export { AlertStateManager } from './core/AlertStateManager';

// 通知服務
export { NotificationService } from './notifications/NotificationService';

// 監控服務
export { AlertMonitoringService } from './services/AlertMonitoringService';

// 配置管理
export { AlertConfigManager } from './config/AlertConfigManager';

// 類型定義
export * from './types';

// 工具函數
export { AlertSystemInitializer } from './utils/AlertSystemInitializer';
export { AlertSystemHealthChecker } from './utils/AlertSystemHealthChecker';
