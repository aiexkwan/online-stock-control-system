/**
 * Performance Dashboard Usage Examples
 * 性能監控儀表板使用範例
 */

import React from 'react';
import { PerformanceDashboard } from './PerformanceDashboardSimple';

// 基本使用範例
export const BasicUsageExample = () => {
  return (
    <div className="p-6">
      <PerformanceDashboard />
    </div>
  );
};

// 自定義配置範例
export const CustomConfigExample = () => {
  return (
    <div className="p-6">
      <PerformanceDashboard
        className="custom-dashboard"
        autoStart={false}  // 手動開始監控
        refreshInterval={5000}  // 每5秒刷新一次
      />
    </div>
  );
};

// 在 Admin Dashboard 中使用
export const AdminDashboardIntegration = () => {
  return (
    <div className="admin-layout">
      <div className="dashboard-grid">
        {/* 其他 Dashboard 組件 */}
        
        {/* 性能監控區域 */}
        <div className="performance-section">
          <PerformanceDashboard 
            className="h-full"
            autoStart={true}
            refreshInterval={2000}
          />
        </div>
      </div>
    </div>
  );
};

// Card 系統整合範例
export const CardSystemIntegration = () => {
  return (
    <div className="card-grid">
      {/* 作為 Card 使用 */}
      <PerformanceDashboard className="card-container" />
    </div>
  );
};

const Examples = {
  BasicUsageExample,
  CustomConfigExample,
  AdminDashboardIntegration,
  CardSystemIntegration
};

export default Examples;